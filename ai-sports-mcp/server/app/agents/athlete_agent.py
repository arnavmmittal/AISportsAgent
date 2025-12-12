"""
AthleteAgent - Discovery-First conversational agent for athletes.

Implements the 5-step Discovery-First protocol:
1. Explore - Open-ended questions to understand the situation
2. Clarify - Dive deeper into specific areas
3. Collaborate - Co-create solutions together
4. Experiment - Suggest concrete techniques to try
5. Iterate - Follow up and adjust based on feedback
"""

from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import json

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import setup_logging
from app.agents.knowledge_agent import KnowledgeAgent
from app.db import models
from app.core.session import SessionContext
from app.core.prompts import build_sports_psych_prompt, get_next_phase
from app.core.structured_response import (
    StructuredResponse,
    SportContext,
    SessionStage,
    create_default_structured_response,
    validate_structured_response
)
from app.core.protocol import ProtocolPhaseManager, InterventionSelector
from app.core.session import update_athlete_memory

logger = setup_logging()


class AthleteAgent:
    """
    AI agent for personalized athlete mental performance coaching.

    Uses RAG with the sports psychology knowledge base and follows
    the Discovery-First protocol for effective conversations.
    """

    # Discovery-First protocol phases
    PROTOCOL_PHASES = [
        "explore",      # Understanding the athlete's situation
        "clarify",      # Diving deeper into specific areas
        "collaborate",  # Co-creating solutions
        "experiment",   # Suggesting techniques to try
        "iterate"       # Following up and adjusting
    ]

    # System prompt for the athlete agent
    SYSTEM_PROMPT = """You are an AI sports psychology assistant helping college athletes with mental performance.

Your approach follows the Discovery-First protocol:
1. EXPLORE: Ask open-ended questions to understand their situation, feelings, and challenges
2. CLARIFY: Dive deeper into specific areas they mention - get concrete examples
3. COLLABORATE: Work together to identify what might help - don't just prescribe solutions
4. EXPERIMENT: Suggest specific, actionable techniques they can try (with clear instructions)
5. ITERATE: Follow up on what they tried, adjust based on their feedback

Guidelines:
- Be conversational, empathetic, and authentic (not overly cheerful or robotic)
- Use their sport-specific context and terminology
- Ask follow-up questions before jumping to solutions
- When suggesting techniques, explain WHY they work (evidence-based reasoning)
- Keep responses concise (2-4 sentences typically, longer when teaching a technique)
- Never diagnose mental health conditions - refer to professional help for serious concerns
- Use the knowledge base context provided to inform your responses

Remember: You're a guide, not a prescriber. Help them discover what works for them."""

    def __init__(self, db: Session, knowledge_agent: KnowledgeAgent = None):
        """
        Initialize the AthleteAgent.

        Args:
            db: Database session
            knowledge_agent: Optional KnowledgeAgent instance (creates new if None)
        """
        logger.info("Initializing AthleteAgent")

        self.db = db
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.knowledge_agent = knowledge_agent or KnowledgeAgent()
        self.phase_manager = ProtocolPhaseManager()
        self.intervention_selector = InterventionSelector()

        logger.info("AthleteAgent initialized")

    def _build_conversation_history(
        self,
        messages: List[models.Message],
        max_messages: int = 10
    ) -> List[Dict[str, str]]:
        """
        Build conversation history for OpenAI API.

        Args:
            messages: List of message models from database
            max_messages: Maximum number of messages to include

        Returns:
            List of message dicts for OpenAI API
        """
        # Get recent messages
        recent_messages = messages[-max_messages:] if len(messages) > max_messages else messages

        # Convert to OpenAI format
        history = []
        for msg in recent_messages:
            history.append({
                "role": msg.role.value,
                "content": msg.content
            })

        return history

    def _get_athlete_context(self, athlete_id: str) -> Dict[str, Any]:
        """
        Get athlete context from database (optional - works without database).

        Args:
            athlete_id: Athlete user ID

        Returns:
            Dictionary with athlete context
        """
        try:
            athlete = self.db.query(models.Athlete).filter(
                models.Athlete.userId == athlete_id
            ).first()

            if not athlete:
                return {"name": "Athlete", "sport": "general"}

            user = athlete.user
            school = user.school if user else None

            context = {
                "name": user.name if user else "Athlete",
                "sport": athlete.sport,
                "year": athlete.year,
                "position": athlete.teamPosition,
                "school": school.name if school else None
            }

            return context
        except Exception as e:
            logger.warning(f"Failed to get athlete context from database: {e}")
            return {"name": "Athlete", "sport": "general"}

    def _retrieve_knowledge_context(
        self,
        query: str,
        athlete_sport: str,
        max_chunks: int = 3
    ) -> str:
        """
        Retrieve relevant knowledge base context.

        Args:
            query: User's message
            athlete_sport: Athlete's sport
            max_chunks: Maximum knowledge chunks to retrieve

        Returns:
            Formatted context string
        """
        try:
            context = self.knowledge_agent.get_context_for_athlete(
                query=query,
                athlete_sport=athlete_sport,
                max_chunks=max_chunks
            )
            return context
        except Exception as e:
            logger.error(f"Error retrieving knowledge context: {e}")
            return ""

    def _build_system_message(
        self,
        athlete_context: Dict[str, Any],
        knowledge_context: str
    ) -> str:
        """
        Build the system message with context.

        Args:
            athlete_context: Athlete information
            knowledge_context: Retrieved knowledge base context

        Returns:
            Complete system message
        """
        system_msg = self.SYSTEM_PROMPT

        # Add athlete context
        if athlete_context:
            system_msg += f"\n\nATHLETE CONTEXT:\n"
            system_msg += f"- Name: {athlete_context.get('name', 'Unknown')}\n"
            system_msg += f"- Sport: {athlete_context.get('sport', 'Unknown')}\n"
            system_msg += f"- Year: {athlete_context.get('year', 'Unknown')}\n"
            if athlete_context.get('position'):
                system_msg += f"- Position: {athlete_context['position']}\n"

        # Add knowledge base context
        if knowledge_context:
            system_msg += f"\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n{knowledge_context}"

        return system_msg

    async def chat(
        self,
        session_id: str,
        user_message: str,
        athlete_id: str,
        stream: bool = False
    ) -> str:
        """
        Process a chat message from an athlete.

        Args:
            session_id: Chat session ID
            user_message: The athlete's message
            athlete_id: Athlete user ID
            stream: Whether to stream the response

        Returns:
            Assistant's response message
        """
        logger.info(f"Processing chat for session {session_id}")

        # Get or create session
        session = self.db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id
        ).first()

        if not session:
            # Create new session
            session = models.ChatSession(
                id=session_id,
                athleteId=athlete_id,
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            self.db.add(session)
            self.db.commit()

        # Get existing messages
        messages = self.db.query(models.Message).filter(
            models.Message.sessionId == session_id
        ).order_by(models.Message.createdAt).all()

        # Get athlete context
        athlete_context = self._get_athlete_context(athlete_id)

        # Retrieve knowledge base context
        knowledge_context = self._retrieve_knowledge_context(
            query=user_message,
            athlete_sport=athlete_context.get('sport', 'general'),
            max_chunks=3
        )

        # Build system message
        system_message = self._build_system_message(athlete_context, knowledge_context)

        # Build conversation history
        conversation_history = self._build_conversation_history(messages)

        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": system_message}
        ] + conversation_history + [
            {"role": "user", "content": user_message}
        ]

        # Call OpenAI
        if stream:
            # Streaming not implemented yet
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=openai_messages,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            assistant_message = response.choices[0].message.content
        else:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=openai_messages,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            assistant_message = response.choices[0].message.content

        # Save user message
        user_msg = models.Message(
            id=f"msg_{datetime.utcnow().timestamp()}_{athlete_id}_user",
            sessionId=session_id,
            role=models.MessageRole.user,
            content=user_message,
            createdAt=datetime.utcnow()
        )
        self.db.add(user_msg)

        # Save assistant message
        assistant_msg = models.Message(
            id=f"msg_{datetime.utcnow().timestamp()}_{athlete_id}_assistant",
            sessionId=session_id,
            role=models.MessageRole.assistant,
            content=assistant_message,
            createdAt=datetime.utcnow()
        )
        self.db.add(assistant_msg)

        # Update session
        session.updatedAt = datetime.utcnow()

        self.db.commit()

        logger.info(f"Chat response generated for session {session_id}")
        return assistant_message

    async def chat_stream(
        self,
        session_id: str,
        user_message: str,
        athlete_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat response to an athlete.

        Args:
            session_id: Chat session ID
            user_message: The athlete's message
            athlete_id: Athlete user ID

        Yields:
            Chunks of the assistant's response
        """
        logger.info(f"Processing streaming chat for session {session_id}")

        # Get or create session (optional - works without database)
        messages = []
        try:
            session = self.db.query(models.ChatSession).filter(
                models.ChatSession.id == session_id
            ).first()

            if not session:
                session = models.ChatSession(
                    id=session_id,
                    athleteId=athlete_id,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                self.db.add(session)
                self.db.commit()

            # Get existing messages
            messages = self.db.query(models.Message).filter(
                models.Message.sessionId == session_id
            ).order_by(models.Message.createdAt).all()
        except Exception as e:
            logger.warning(f"Database unavailable, running in stateless mode: {e}")
            messages = []

        # Get athlete context
        athlete_context = self._get_athlete_context(athlete_id)

        # Retrieve knowledge base context
        knowledge_context = self._retrieve_knowledge_context(
            query=user_message,
            athlete_sport=athlete_context.get('sport', 'general'),
            max_chunks=3
        )

        # Build system message
        system_message = self._build_system_message(athlete_context, knowledge_context)

        # Build conversation history
        conversation_history = self._build_conversation_history(messages)

        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": system_message}
        ] + conversation_history + [
            {"role": "user", "content": user_message}
        ]

        # Stream from OpenAI
        stream = self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=openai_messages,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            stream=True
        )

        # Collect full response for saving
        full_response = ""

        # Stream chunks
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content

        # Save messages after streaming completes (optional - works without database)
        try:
            user_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{athlete_id}_user",
                sessionId=session_id,
                role=models.MessageRole.user,
                content=user_message,
                createdAt=datetime.utcnow()
            )
            self.db.add(user_msg)

            assistant_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{athlete_id}_assistant",
                sessionId=session_id,
                role=models.MessageRole.assistant,
                content=full_response,
                createdAt=datetime.utcnow()
            )
            self.db.add(assistant_msg)

            session.updatedAt = datetime.utcnow()
            self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to save messages to database: {e}")

        logger.info(f"Streaming chat complete for session {session_id}")

    async def chat_stream_with_context(
        self,
        user_message: str,
        context: SessionContext
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat response using pre-loaded SessionContext.

        This method is context-aware and uses conversation history, athlete profile,
        memory, mood logs, goals, and upcoming games to generate personalized responses.

        Args:
            user_message: The athlete's message
            context: Pre-loaded SessionContext with full athlete state

        Yields:
            Chunks of the assistant's response
        """
        logger.info(f"Processing context-aware streaming chat for session {context.session_id}")

        # Retrieve knowledge base context
        knowledge_context = self._retrieve_knowledge_context(
            query=user_message,
            athlete_sport=context.sport,
            max_chunks=3
        )

        # Build enhanced system message with full session context
        system_message = self._build_context_aware_system_message(
            context=context,
            knowledge_context=knowledge_context
        )

        # Build conversation history from SessionContext
        conversation_history = []
        for msg in context.message_history:
            conversation_history.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": system_message}
        ] + conversation_history + [
            {"role": "user", "content": user_message}
        ]

        # Stream from OpenAI
        stream = self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=openai_messages,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            stream=True
        )

        # Collect full response for saving
        full_response = ""

        # Stream chunks
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content

        # Save messages after streaming completes
        try:
            user_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{context.athlete_id}_user",
                sessionId=context.session_id,
                role=models.MessageRole.user,
                content=user_message,
                createdAt=datetime.utcnow()
            )
            self.db.add(user_msg)

            assistant_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{context.athlete_id}_assistant",
                sessionId=context.session_id,
                role=models.MessageRole.assistant,
                content=full_response,
                createdAt=datetime.utcnow()
            )
            self.db.add(assistant_msg)

            # Update session
            session = self.db.query(models.ChatSession).filter(
                models.ChatSession.id == context.session_id
            ).first()
            if session:
                session.updatedAt = datetime.utcnow()

            self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to save messages to database: {e}")

        logger.info(f"Context-aware streaming chat complete for session {context.session_id}")

    def _build_context_aware_system_message(
        self,
        context: SessionContext,
        knowledge_context: str
    ) -> str:
        """
        Build enhanced system message with full session context.

        Includes athlete profile, memory, recent mood, active goals, and upcoming games.

        Args:
            context: SessionContext with full athlete state
            knowledge_context: Retrieved knowledge base context

        Returns:
            Complete system message with rich context
        """
        system_msg = self.SYSTEM_PROMPT

        # Add athlete profile
        system_msg += f"\n\nATHLETE PROFILE:\n"
        system_msg += f"- Sport: {context.sport}\n"
        if context.position:
            system_msg += f"- Position: {context.position}\n"
        system_msg += f"- Year: {context.year}\n"
        system_msg += f"- Current Phase: {context.current_phase}\n"

        # Add recent mood data if available
        if context.recent_mood:
            system_msg += f"\n\nRECENT MOOD (Last 3 Days):\n"
            mood = context.recent_mood
            if 'mood_avg' in mood:
                system_msg += f"- Mood: {mood['mood_avg']:.1f}/10 (range: {mood.get('mood_min', 'N/A')}-{mood.get('mood_max', 'N/A')})\n"
            if 'confidence_avg' in mood:
                system_msg += f"- Confidence: {mood['confidence_avg']:.1f}/10\n"
            if 'stress_avg' in mood:
                system_msg += f"- Stress: {mood['stress_avg']:.1f}/10\n"
            if 'energy_avg' in mood:
                system_msg += f"- Energy: {mood['energy_avg']:.1f}/10\n"
            if 'sleep_avg' in mood:
                system_msg += f"- Sleep: {mood['sleep_avg']:.1f} hours/night\n"

        # Add active goals
        if context.active_goals:
            system_msg += f"\n\nACTIVE GOALS ({len(context.active_goals)}):\n"
            for goal in context.active_goals[:3]:  # Max 3 goals
                system_msg += f"- {goal['title']}: {goal.get('description', 'No description')}\n"

        # Add upcoming games
        if context.upcoming_games:
            system_msg += f"\n\nUPCOMING COMPETITIONS:\n"
            for game in context.upcoming_games[:2]:  # Max 2 games
                system_msg += f"- {game.get('gameDate', 'Unknown date')} vs {game.get('opponentName', 'Unknown opponent')}\n"

        # Add athlete memory insights if available
        if context.athlete_memory:
            memory = context.athlete_memory
            if memory.get('effectiveTechniques'):
                system_msg += f"\n\nEFFECTIVE TECHNIQUES (from past sessions):\n"
                for tech in memory['effectiveTechniques'][:3]:
                    system_msg += f"- {tech.get('name', 'Unknown')}: {tech.get('effectiveness', 'N/A')}/10 effectiveness\n"

            if memory.get('commonTriggers'):
                system_msg += f"\n\nCOMMON TRIGGERS:\n"
                for trigger in memory['commonTriggers'][:3]:
                    system_msg += f"- {trigger}\n"

        # Add knowledge base context
        if knowledge_context:
            system_msg += f"\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n{knowledge_context}"

        return system_msg

    async def chat_stream_with_structured_output(
        self,
        user_message: str,
        context: SessionContext
    ) -> AsyncGenerator[tuple[str, Optional[StructuredResponse]], None]:
        """
        Stream chat response with structured metadata using OpenAI function calling.

        Generates both:
        1. Streaming human text (for real-time display)
        2. Structured JSON metadata (session stage, issues, action plans, etc.)

        Args:
            user_message: The athlete's message
            context: Pre-loaded SessionContext with full athlete state

        Yields:
            Tuples of (text_chunk, metadata) where metadata is None until final yield
        """
        logger.info(f"Processing structured streaming chat for session {context.session_id}")

        # Retrieve knowledge base context
        kb_chunks_raw = []
        try:
            kb_context_str = self._retrieve_knowledge_context(
                query=user_message,
                athlete_sport=context.sport,
                max_chunks=3
            )
            if kb_context_str:
                kb_chunks_raw = [kb_context_str]
        except Exception as e:
            logger.warning(f"Failed to retrieve KB context: {e}")
            kb_context_str = ""

        # Calculate turn count in current phase
        # This helps with triage questions and phase transitions
        try:
            session = self.db.query(models.ChatSession).filter(
                models.ChatSession.id == context.session_id
            ).first()

            if session:
                # Count messages since phase started
                # For simplicity, count all messages in session and divide by 2
                total_messages = self.db.query(models.Message).filter(
                    models.Message.sessionId == context.session_id
                ).count()
                turn_count_in_phase = max(0, total_messages // 2)
            else:
                turn_count_in_phase = 0
        except Exception as e:
            logger.warning(f"Failed to calculate turn count: {e}")
            turn_count_in_phase = 0

        # Build elite sports psych system prompt with turn count
        system_message = build_sports_psych_prompt(
            phase=context.current_phase,
            sport=context.sport,
            athlete_memory=context.athlete_memory,
            kb_chunks=kb_chunks_raw,
            mood_context=context.recent_mood,
            goals_context=context.active_goals,
            turn_count_in_phase=turn_count_in_phase
        )

        # Build conversation history from SessionContext
        conversation_history = []
        for msg in context.message_history:
            conversation_history.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": system_message}
        ] + conversation_history + [
            {"role": "user", "content": user_message}
        ]

        # Define function schema for structured output
        structured_response_schema = StructuredResponse.model_json_schema()

        # Call OpenAI with function calling for structured output
        # NOTE: We use a non-streaming call first to get structured data,
        # then stream the human response separately
        try:
            # Get structured response
            structured_completion = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=openai_messages,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "generate_structured_response",
                        "description": "Generate sports psychology response with structured metadata",
                        "parameters": structured_response_schema
                    }
                }],
                tool_choice={"type": "function", "function": {"name": "generate_structured_response"}}
            )

            # Parse structured response
            tool_call = structured_completion.choices[0].message.tool_calls[0]
            structured_data = json.loads(tool_call.function.arguments)
            structured_response = validate_structured_response(structured_data)

            # Stream the human response from structured data
            human_response = structured_response.human_response
            full_response = human_response

            # Yield chunks of human response
            chunk_size = 20  # Characters per chunk for smooth streaming
            for i in range(0, len(human_response), chunk_size):
                chunk = human_response[i:i + chunk_size]
                yield (chunk, None)  # Stream text, no metadata yet

            # Yield final metadata
            yield ("", structured_response)

        except Exception as e:
            logger.error(f"Error generating structured response: {e}")
            # Fallback: use non-structured streaming
            stream = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=openai_messages,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                stream=True
            )

            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield (content, None)

            # Create default structured response
            default_response = create_default_structured_response(
                human_response=full_response,
                session_stage=SessionStage(context.current_phase),
                sport=context.sport,
                setting="unknown"
            )
            yield ("", default_response)

        # Save messages after streaming completes
        try:
            user_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{context.athlete_id}_user",
                sessionId=context.session_id,
                role=models.MessageRole.user,
                content=user_message,
                createdAt=datetime.utcnow()
            )
            self.db.add(user_msg)

            assistant_msg = models.Message(
                id=f"msg_{datetime.utcnow().timestamp()}_{context.athlete_id}_assistant",
                sessionId=context.session_id,
                role=models.MessageRole.assistant,
                content=full_response,
                createdAt=datetime.utcnow()
            )
            self.db.add(assistant_msg)

            # Update session with new phase using phase manager
            session = self.db.query(models.ChatSession).filter(
                models.ChatSession.id == context.session_id
            ).first()
            if session:
                session.updatedAt = datetime.utcnow()

                # Determine turn count in current phase
                # Count messages since phase started (if phaseStartedAt is set)
                if hasattr(session, 'phaseStartedAt') and session.phaseStartedAt:
                    phase_messages = self.db.query(models.Message).filter(
                        models.Message.sessionId == context.session_id,
                        models.Message.createdAt >= session.phaseStartedAt
                    ).count()
                    turn_count_in_phase = max(1, phase_messages // 2)
                else:
                    # Fallback: use total messages
                    total_messages = self.db.query(models.Message).filter(
                        models.Message.sessionId == context.session_id
                    ).count()
                    turn_count_in_phase = max(1, total_messages // 2)

                # Use phase manager to determine next phase
                current_phase = SessionStage(context.current_phase)
                next_phase = self.phase_manager.determine_next_phase(
                    current_phase=current_phase,
                    turn_count_in_phase=turn_count_in_phase,
                    structured_response=structured_response
                )

                # Update session phase
                old_phase = session.discoveryPhase
                session.discoveryPhase = next_phase.value

                # If phase changed, update phaseStartedAt
                if old_phase != next_phase.value:
                    session.phaseStartedAt = datetime.utcnow()
                    logger.info(f"Phase transition: {old_phase} → {next_phase.value}")

            self.db.commit()

            # Update athlete memory after successful save
            try:
                await update_athlete_memory(
                    db=self.db,
                    athlete_id=context.athlete_id,
                    session_id=context.session_id,
                    structured_response=structured_response.dict() if structured_response else {},
                    session_outcome=None  # Could be updated from user feedback later
                )
            except Exception as mem_error:
                logger.warning(f"Failed to update athlete memory: {mem_error}")

        except Exception as e:
            logger.warning(f"Failed to save messages to database: {e}")

        logger.info(f"Structured streaming chat complete for session {context.session_id}")

    async def generate_response(
        self,
        message: str,
        conversation_history: List[Dict],
        knowledge_context: str,
        session_id: str,
    ) -> str:
        """
        Generate a response for voice chat (simplified version of chat).

        Args:
            message: User's message (transcribed from voice)
            conversation_history: List of previous messages
            knowledge_context: RAG context from KnowledgeAgent
            session_id: Chat session ID

        Returns:
            AI response text
        """
        logger.info(f"Generating response for session {session_id}")

        # Get athlete context (if available)
        athlete_id = session_id.split(':')[0] if ':' in session_id else "unknown"
        athlete_context = self._get_athlete_context(athlete_id)

        # Build system message
        system_message = self._build_system_message(athlete_context, knowledge_context)

        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": system_message}
        ] + conversation_history + [
            {"role": "user", "content": message}
        ]

        # Call OpenAI
        response = self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=openai_messages,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )

        assistant_message = response.choices[0].message.content
        logger.info(f"Response generated for session {session_id}")

        return assistant_message
