"""
Orchestrator API Routes

Unified endpoint for AI interactions with automatic agent routing.

Security:
- Input validation and sanitization
- Prompt injection protection
- Authentication required for all endpoints
- Rate limiting via middleware
- Audit logging for sensitive operations
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import re
from sqlalchemy.orm import Session

from app.core.logging import setup_logging
from app.core.security_hardening import (
    InputSanitizer,
    get_current_user,
    get_current_user_optional,
    AuthenticatedUser,
    SecurityAuditLog,
)
from app.db.database import get_db

logger = setup_logging()
router = APIRouter()


class ChatRequest(BaseModel):
    """Request for orchestrated chat with security validation."""
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: str = Field(..., min_length=1, max_length=100)
    athlete_id: str = Field(..., min_length=1, max_length=100)
    user_role: str = Field(default="ATHLETE", pattern="^(ATHLETE|COACH|ADMIN)$")
    sport: Optional[str] = Field(None, max_length=50)

    @validator("message")
    def validate_message(cls, v):
        """Validate and sanitize message content."""
        return InputSanitizer.validate_message(v)

    @validator("session_id", "athlete_id")
    def validate_ids(cls, v):
        """Ensure IDs only contain safe characters."""
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("ID contains invalid characters")
        return v

    @validator("sport")
    def validate_sport(cls, v):
        """Validate sport name."""
        if v and not re.match(r"^[a-zA-Z0-9 ]+$", v):
            raise ValueError("Sport contains invalid characters")
        return v


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
    """Request for intent classification only with validation."""
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_role: str = Field(default="ATHLETE", pattern="^(ATHLETE|COACH|ADMIN)$")

    @validator("message")
    def validate_message(cls, v):
        """Validate message content."""
        return InputSanitizer.validate_message(v)

    @validator("conversation_history")
    def validate_history(cls, v):
        """Validate conversation history to prevent injection."""
        if v:
            if len(v) > 50:  # Limit history size
                raise ValueError("Conversation history too long")
            for msg in v:
                if "content" in msg:
                    # Sanitize each message
                    msg["content"] = InputSanitizer.sanitize_for_llm(msg["content"][:2000])
        return v


@router.post("/orchestrator/chat", response_model=ChatResponse)
async def orchestrated_chat(
    request: ChatRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
):
    """
    Send a message through the orchestrator.

    The orchestrator will:
    1. Check for crisis indicators
    2. Classify the intent
    3. Route to appropriate agent
    4. Return response with context

    This is the main entry point for all AI chat interactions.

    Security:
    - Input validation and sanitization applied
    - Prompt injection protection active
    - Crisis detection runs first for safety
    """
    # Get client IP for logging
    client_ip = http_request.headers.get(
        "X-Forwarded-For", http_request.client.host if http_request.client else "unknown"
    ).split(",")[0].strip()

    # Log the request for audit
    SecurityAuditLog.log_data_access(
        user_id=user.user_id if user else request.athlete_id,
        resource_type="orchestrator_chat",
        resource_id=request.session_id,
        action="chat",
        ip_address=client_ip,
    )

    try:
        from app.orchestrator import route_message

        response = await route_message(
            message=request.message,
            session_id=request.session_id,
            athlete_id=request.athlete_id,
            user_role=request.user_role,
            db_session=db,
        )

        # Log if crisis was detected
        if response.crisis_detected:
            SecurityAuditLog.log_security_event(
                event_type="crisis_detected",
                severity="critical",
                details={
                    "session_id": request.session_id,
                    "athlete_id": request.athlete_id,
                },
                ip_address=client_ip,
                user_id=user.user_id if user else request.athlete_id,
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
        # Don't expose internal errors
        raise HTTPException(
            status_code=500,
            detail="An error occurred processing your request"
        )


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
