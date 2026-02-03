"""
Agent Orchestrator Module

Routes requests to appropriate specialized agents based on intent classification.

Components:
1. IntentClassifier - Classify user intent from message
2. AgentRouter - Route to appropriate agent (Athlete, Coach, Knowledge, etc.)
3. ContextManager - Manage conversation context and state
4. CrisisDetector - First-pass safety check for all messages

The orchestrator acts as the central hub for all AI interactions,
ensuring requests go to the right agent with proper context.
"""

from .intent_classifier import (
    IntentClassifier,
    classify_intent,
    Intent,
    INTENT_DESCRIPTIONS,
)

from .router import (
    AgentRouter,
    route_message,
    AgentResponse,
)

from .context_manager import (
    ContextManager,
    ConversationContext,
    get_context,
    update_context,
)

__all__ = [
    # Intent classification
    "IntentClassifier",
    "classify_intent",
    "Intent",
    "INTENT_DESCRIPTIONS",
    # Routing
    "AgentRouter",
    "route_message",
    "AgentResponse",
    # Context management
    "ContextManager",
    "ConversationContext",
    "get_context",
    "update_context",
]
