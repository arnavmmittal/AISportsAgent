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
