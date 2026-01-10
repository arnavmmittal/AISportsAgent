"""
Agent Router

Routes messages to appropriate agents based on classified intent.
Handles agent selection, context preparation, and response coordination.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Callable, Awaitable
from enum import Enum
from datetime import datetime
from app.core.logging import setup_logging
from .intent_classifier import Intent, ClassificationResult, classify_intent
from .context_manager import (
    ConversationContext,
    ContextManager,
    get_context_manager,
    ConversationPhase,
)

logger = setup_logging()


class AgentType(str, Enum):
    """Available agent types."""
    ATHLETE = "athlete_agent"
    COACH = "coach_agent"
    KNOWLEDGE = "knowledge_agent"
    GOVERNANCE = "governance_agent"
    CRISIS = "crisis_handler"


@dataclass
class AgentResponse:
    """Response from an agent."""
    content: str
    agent: AgentType
    intent: Intent
    phase: ConversationPhase
    metadata: Dict[str, Any] = field(default_factory=dict)
    follow_up_suggested: Optional[str] = None
    intervention_offered: Optional[Dict[str, Any]] = None
    crisis_detected: bool = False
    knowledge_sources: List[Dict[str, Any]] = field(default_factory=list)


class AgentRouter:
    """
    Routes messages to appropriate agents and coordinates responses.

    Routing logic:
    1. Crisis detection (always first via GovernanceAgent)
    2. Intent classification
    3. Agent selection based on intent and user role
    4. Context preparation
    5. Agent invocation
    6. Response post-processing
    """

    # Intent to agent mapping
    INTENT_AGENT_MAP = {
        Intent.CRISIS: AgentType.CRISIS,
        Intent.EMOTIONAL_SUPPORT: AgentType.ATHLETE,
        Intent.CONFIDENCE_BUILDING: AgentType.ATHLETE,
        Intent.PERFORMANCE_DISCUSSION: AgentType.ATHLETE,
        Intent.GOAL_SETTING: AgentType.ATHLETE,
        Intent.TECHNIQUE_QUESTION: AgentType.ATHLETE,
        Intent.KNOWLEDGE_QUERY: AgentType.KNOWLEDGE,
        Intent.FRAMEWORK_REQUEST: AgentType.ATHLETE,
        Intent.TEAM_ANALYTICS: AgentType.COACH,
        Intent.ATHLETE_STATUS: AgentType.COACH,
        Intent.GREETING: AgentType.ATHLETE,
        Intent.CLARIFICATION: AgentType.ATHLETE,
        Intent.OFF_TOPIC: AgentType.ATHLETE,
        Intent.ROUTINE_BUILDING: AgentType.ATHLETE,
        Intent.SCHEDULING: AgentType.ATHLETE,
    }

    def __init__(self, db_session=None):
        """
        Initialize router.

        Args:
            db_session: Database session for agent operations
        """
        self.db = db_session
        self.context_manager = get_context_manager()
        self._agents: Dict[AgentType, Any] = {}

    def _get_agent(self, agent_type: AgentType):
        """Get or create agent instance."""
        if agent_type not in self._agents:
            self._agents[agent_type] = self._create_agent(agent_type)
        return self._agents[agent_type]

    def _create_agent(self, agent_type: AgentType):
        """Create agent instance."""
        try:
            if agent_type == AgentType.ATHLETE:
                from app.agents.athlete_agent import AthleteAgent
                return AthleteAgent(db=self.db, knowledge_agent=None)

            elif agent_type == AgentType.COACH:
                from app.agents.coach_agent import CoachAgent
                return CoachAgent(db=self.db)

            elif agent_type == AgentType.GOVERNANCE:
                from app.agents.governance_agent import GovernanceAgent
                return GovernanceAgent(db=self.db)

            elif agent_type == AgentType.KNOWLEDGE:
                # Use the new knowledge retriever
                return None  # Will use knowledge module directly

            elif agent_type == AgentType.CRISIS:
                from app.agents.governance_agent import GovernanceAgent
                return GovernanceAgent(db=self.db)

        except ImportError as e:
            logger.warning(f"Could not import agent {agent_type}: {e}")
            return None

        return None

    async def route(
        self,
        message: str,
        session_id: str,
        athlete_id: str,
        user_role: str = "ATHLETE",
        sport: Optional[str] = None,
    ) -> AgentResponse:
        """
        Route a message to the appropriate agent.

        Args:
            message: User message
            session_id: Session identifier
            athlete_id: Athlete/user identifier
            user_role: User's role (ATHLETE, COACH, ADMIN)
            sport: Optional sport context

        Returns:
            AgentResponse with generated content
        """
        # Get or create context
        context = self.context_manager.get_context(session_id)
        if not context:
            context = self.context_manager.create_context(
                session_id=session_id,
                athlete_id=athlete_id,
                sport=sport,
            )

        # Add user message to context
        context.add_message("user", message)

        # Step 1: Crisis check (always first)
        crisis_result = await self._check_crisis(message, context)
        if crisis_result:
            return crisis_result

        # Step 2: Classify intent
        classification = await classify_intent(
            message=message,
            conversation_history=context.get_recent_history(),
            user_role=user_role,
        )

        logger.info(
            f"Intent classified: {classification.primary_intent} "
            f"(confidence: {classification.confidence:.2f})"
        )

        # Update context with classification info
        if classification.context_hints.get("emotion"):
            context.update_emotion(
                classification.context_hints["emotion"],
                classification.confidence,
            )
        if classification.context_hints.get("topic"):
            context.add_topic(classification.context_hints["topic"])

        # Step 3: Select agent
        agent_type = self._select_agent(classification, user_role)
        context.active_agent = agent_type.value

        # Step 4: Generate response
        response = await self._invoke_agent(
            agent_type=agent_type,
            message=message,
            context=context,
            classification=classification,
        )

        # Step 5: Post-process and update context
        context.add_message("assistant", response.content)

        # Check for phase advancement
        if context.should_advance_phase():
            context.advance_phase()
            response.phase = context.current_phase

        # Persist context updates
        self.context_manager.update_context(
            session_id,
            current_phase=context.current_phase,
            topics=context.topics,
        )

        return response

    async def _check_crisis(
        self,
        message: str,
        context: ConversationContext,
    ) -> Optional[AgentResponse]:
        """
        Check for crisis indicators.

        Returns AgentResponse if crisis detected, None otherwise.
        """
        governance_agent = self._get_agent(AgentType.GOVERNANCE)
        if not governance_agent:
            return None

        try:
            crisis_detected, severity, crisis_info = await governance_agent.detect_crisis(
                message
            )

            if crisis_detected:
                logger.warning(f"Crisis detected: severity={severity}")
                context.crisis_flags.append(f"{severity}:{datetime.now().isoformat()}")

                # Generate crisis response
                crisis_response = await governance_agent.generate_crisis_response(
                    message, severity
                )

                return AgentResponse(
                    content=crisis_response,
                    agent=AgentType.CRISIS,
                    intent=Intent.CRISIS,
                    phase=context.current_phase,
                    crisis_detected=True,
                    metadata={
                        "severity": severity,
                        "crisis_info": crisis_info,
                    },
                )

        except Exception as e:
            logger.error(f"Crisis check failed: {e}")

        return None

    def _select_agent(
        self,
        classification: ClassificationResult,
        user_role: str,
    ) -> AgentType:
        """Select appropriate agent based on classification and role."""
        intent = classification.primary_intent

        # Role-based overrides
        if user_role == "COACH":
            if intent in [Intent.TEAM_ANALYTICS, Intent.ATHLETE_STATUS]:
                return AgentType.COACH

        # Use mapping
        return self.INTENT_AGENT_MAP.get(intent, AgentType.ATHLETE)

    async def _invoke_agent(
        self,
        agent_type: AgentType,
        message: str,
        context: ConversationContext,
        classification: ClassificationResult,
    ) -> AgentResponse:
        """Invoke the selected agent."""
        # Knowledge queries use the knowledge module directly
        if agent_type == AgentType.KNOWLEDGE:
            return await self._handle_knowledge_query(message, context, classification)

        # Get agent
        agent = self._get_agent(agent_type)
        if not agent:
            return self._generate_fallback_response(message, context, classification)

        try:
            # Prepare knowledge context if needed
            knowledge_context = ""
            knowledge_sources = []

            if classification.primary_intent in [
                Intent.TECHNIQUE_QUESTION,
                Intent.FRAMEWORK_REQUEST,
                Intent.KNOWLEDGE_QUERY,
            ]:
                kb_result = await self._retrieve_knowledge(message)
                knowledge_context = kb_result.get("context", "")
                knowledge_sources = kb_result.get("sources", [])

            # Generate response using agent
            response_text = await agent.generate_response(
                message=message,
                conversation_history=context.conversation_history,
                knowledge_context=knowledge_context,
                session_id=context.session_id,
            )

            return AgentResponse(
                content=response_text,
                agent=agent_type,
                intent=classification.primary_intent,
                phase=context.current_phase,
                knowledge_sources=knowledge_sources,
                metadata={
                    "confidence": classification.confidence,
                    "topics": context.topics,
                },
            )

        except Exception as e:
            logger.error(f"Agent invocation failed: {e}")
            return self._generate_fallback_response(message, context, classification)

    async def _handle_knowledge_query(
        self,
        message: str,
        context: ConversationContext,
        classification: ClassificationResult,
    ) -> AgentResponse:
        """Handle knowledge base queries."""
        try:
            from app.knowledge import retrieve_with_rerank

            result = await retrieve_with_rerank(message, top_k=3)

            if result.get("context"):
                # Format response with knowledge
                response = self._format_knowledge_response(
                    message,
                    result["context"],
                    result.get("sources", []),
                )
            else:
                response = (
                    "I couldn't find specific information about that in my knowledge base. "
                    "Could you rephrase your question or ask about a different aspect "
                    "of sports psychology?"
                )

            return AgentResponse(
                content=response,
                agent=AgentType.KNOWLEDGE,
                intent=classification.primary_intent,
                phase=context.current_phase,
                knowledge_sources=result.get("sources", []),
            )

        except Exception as e:
            logger.error(f"Knowledge query failed: {e}")
            return AgentResponse(
                content=(
                    "I'm having trouble accessing the knowledge base right now. "
                    "Let me try to help based on what I know."
                ),
                agent=AgentType.ATHLETE,
                intent=classification.primary_intent,
                phase=context.current_phase,
            )

    async def _retrieve_knowledge(self, query: str) -> Dict[str, Any]:
        """Retrieve relevant knowledge for a query."""
        try:
            from app.knowledge import retrieve_context
            return await retrieve_context(query, top_k=2)
        except Exception as e:
            logger.warning(f"Knowledge retrieval failed: {e}")
            return {"context": "", "sources": []}

    def _format_knowledge_response(
        self,
        question: str,
        context: str,
        sources: List[Dict[str, Any]],
    ) -> str:
        """Format a response based on retrieved knowledge."""
        response = f"Based on sports psychology research:\n\n{context}"

        if sources:
            source_names = [s.get("title", "Research") for s in sources[:2]]
            response += f"\n\n(Sources: {', '.join(source_names)})"

        return response

    def _generate_fallback_response(
        self,
        message: str,
        context: ConversationContext,
        classification: ClassificationResult,
    ) -> AgentResponse:
        """Generate a fallback response when agent fails."""
        # Simple fallback responses based on intent
        fallbacks = {
            Intent.GREETING: "Hello! How can I help you with your mental performance today?",
            Intent.EMOTIONAL_SUPPORT: (
                "I hear you, and it sounds like you're going through a tough time. "
                "Would you like to tell me more about what's been on your mind?"
            ),
            Intent.TECHNIQUE_QUESTION: (
                "That's a great question about mental techniques. "
                "While I gather more specific information, could you tell me more about "
                "the situation where you'd like to apply this technique?"
            ),
            Intent.OFF_TOPIC: (
                "I'm here to help with mental performance and sports psychology. "
                "Is there anything related to your athletic mindset I can help with?"
            ),
        }

        content = fallbacks.get(
            classification.primary_intent,
            "I'm here to support you. Could you tell me more about what's on your mind?"
        )

        return AgentResponse(
            content=content,
            agent=AgentType.ATHLETE,
            intent=classification.primary_intent,
            phase=context.current_phase,
            metadata={"fallback": True},
        )


# Convenience function
async def route_message(
    message: str,
    session_id: str,
    athlete_id: str,
    user_role: str = "ATHLETE",
    db_session=None,
) -> AgentResponse:
    """
    Route a message to appropriate agent.

    Convenience wrapper around AgentRouter.
    """
    router = AgentRouter(db_session=db_session)
    return await router.route(
        message=message,
        session_id=session_id,
        athlete_id=athlete_id,
        user_role=user_role,
    )
