"""
Orchestrator API Routes

Unified endpoint for AI interactions with automatic agent routing.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.logging import setup_logging
from app.db.database import get_db

logger = setup_logging()
router = APIRouter()


class ChatRequest(BaseModel):
    """Request for orchestrated chat."""
    message: str
    session_id: str
    athlete_id: str
    user_role: str = "ATHLETE"
    sport: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from orchestrated chat."""
    content: str
    agent: str
    intent: str
    phase: str
    crisis_detected: bool = False
    knowledge_sources: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}


class IntentClassificationRequest(BaseModel):
    """Request for intent classification only."""
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_role: str = "ATHLETE"


@router.post("/orchestrator/chat", response_model=ChatResponse)
async def orchestrated_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Send a message through the orchestrator.

    The orchestrator will:
    1. Check for crisis indicators
    2. Classify the intent
    3. Route to appropriate agent
    4. Return response with context

    This is the main entry point for all AI chat interactions.
    """
    try:
        from app.orchestrator import route_message

        response = await route_message(
            message=request.message,
            session_id=request.session_id,
            athlete_id=request.athlete_id,
            user_role=request.user_role,
            db_session=db,
        )

        return ChatResponse(
            content=response.content,
            agent=response.agent.value,
            intent=response.intent.value,
            phase=response.phase.value,
            crisis_detected=response.crisis_detected,
            knowledge_sources=response.knowledge_sources,
            metadata=response.metadata,
        )

    except Exception as e:
        logger.error(f"Orchestrator chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orchestrator/classify")
async def classify_intent_endpoint(request: IntentClassificationRequest):
    """
    Classify message intent without generating a response.

    Useful for debugging or pre-routing logic.
    """
    try:
        from app.orchestrator import classify_intent

        result = await classify_intent(
            message=request.message,
            conversation_history=request.conversation_history,
            user_role=request.user_role,
        )

        return {
            "primary_intent": result.primary_intent.value,
            "confidence": result.confidence,
            "secondary_intents": [
                {"intent": i.value, "confidence": c}
                for i, c in result.secondary_intents
            ],
            "requires_crisis_check": result.requires_crisis_check,
            "context_hints": result.context_hints,
        }

    except Exception as e:
        logger.error(f"Intent classification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orchestrator/context/{session_id}")
async def get_session_context(session_id: str):
    """
    Get the current context for a session.

    Returns conversation state, detected topics, emotional state, etc.
    """
    try:
        from app.orchestrator import get_context

        context = get_context(session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")

        return context.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get context error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/orchestrator/context/{session_id}")
async def clear_session_context(session_id: str):
    """Clear context for a session."""
    try:
        from app.orchestrator.context_manager import get_context_manager

        manager = get_context_manager()
        if session_id in manager._contexts:
            del manager._contexts[session_id]
            return {"success": True, "message": f"Context cleared for session {session_id}"}
        else:
            return {"success": False, "message": "Session not found"}

    except Exception as e:
        logger.error(f"Clear context error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orchestrator/status")
async def orchestrator_status():
    """Get orchestrator service status."""
    try:
        from app.orchestrator.context_manager import get_context_manager
        from app.orchestrator.intent_classifier import Intent

        manager = get_context_manager()

        return {
            "status": "operational",
            "active_sessions": len(manager._contexts),
            "available_intents": [i.value for i in Intent],
            "features": {
                "crisis_detection": True,
                "intent_classification": True,
                "context_management": True,
                "knowledge_integration": True,
                "multi_agent_routing": True,
            },
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


@router.get("/orchestrator/agents")
async def list_agents():
    """List available agents and their capabilities."""
    return {
        "agents": [
            {
                "id": "athlete_agent",
                "name": "Athlete Support Agent",
                "description": "Primary agent for athlete mental performance support",
                "capabilities": [
                    "emotional_support",
                    "confidence_building",
                    "performance_discussion",
                    "goal_setting",
                    "technique_guidance",
                ],
            },
            {
                "id": "coach_agent",
                "name": "Coach Analytics Agent",
                "description": "Analytics and team insights for coaches",
                "capabilities": [
                    "team_analytics",
                    "athlete_status",
                    "aggregate_insights",
                ],
            },
            {
                "id": "knowledge_agent",
                "name": "Knowledge Base Agent",
                "description": "Sports psychology knowledge retrieval",
                "capabilities": [
                    "knowledge_query",
                    "framework_explanation",
                    "research_reference",
                ],
            },
            {
                "id": "governance_agent",
                "name": "Governance & Safety Agent",
                "description": "Crisis detection and safety monitoring",
                "capabilities": [
                    "crisis_detection",
                    "escalation",
                    "resource_provision",
                ],
            },
        ],
    }
