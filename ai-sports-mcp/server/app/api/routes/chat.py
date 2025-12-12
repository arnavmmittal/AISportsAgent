"""
Chat API routes for athlete conversations.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.agents import AthleteAgent, KnowledgeAgent, GovernanceAgent
from app.core.logging import setup_logging
from app.core.session import get_session_context

logger = setup_logging()
router = APIRouter(prefix="/chat", tags=["chat"])


# Request/Response models
class ChatRequest(BaseModel):
    """Chat request from athlete."""
    session_id: str
    message: str
    athlete_id: str
    stream: bool = False


class ChatResponse(BaseModel):
    """Chat response to athlete."""
    session_id: str
    message: str
    timestamp: str
    crisis_check: Optional[dict] = None


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Send a chat message and get AI response.

    Args:
        request: Chat request with message and session info
        db: Database session

    Returns:
        AI assistant's response
    """
    try:
        logger.info(f"Chat request from athlete {request.athlete_id}")

        # Initialize agents
        knowledge_agent = KnowledgeAgent()
        athlete_agent = AthleteAgent(db=db, knowledge_agent=knowledge_agent)
        governance_agent = GovernanceAgent(db=db)

        # Check for crisis indicators
        crisis_check = governance_agent.analyze_message(
            message=request.message,
            athlete_id=request.athlete_id,
            session_id=request.session_id
        )

        # Load full session context (conversation history, athlete profile, memory, mood, goals)
        session_context = await get_session_context(
            db=db,
            session_id=request.session_id,
            athlete_id=request.athlete_id
        )

        # Get AI response
        if request.stream:
            # Return streaming response
            async def generate():
                async for chunk in athlete_agent.chat_stream(
                    session_id=request.session_id,
                    user_message=request.message,
                    athlete_id=request.athlete_id
                ):
                    yield chunk

            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            # Regular response
            response_message = await athlete_agent.chat(
                session_id=request.session_id,
                user_message=request.message,
                athlete_id=request.athlete_id,
                stream=False
            )

            from datetime import datetime
            return ChatResponse(
                session_id=request.session_id,
                message=response_message,
                timestamp=datetime.utcnow().isoformat(),
                crisis_check=crisis_check if crisis_check.get("final_risk_level") != "LOW" else None
            )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Stream a chat response to the athlete.

    Args:
        request: Chat request with message and session info
        db: Database session

    Returns:
        Server-sent events stream
    """
    try:
        logger.info(f"Streaming chat request from athlete {request.athlete_id}")

        # Check for crisis indicators first
        governance_agent = GovernanceAgent(db=db)
        crisis_check = governance_agent.analyze_message(
            message=request.message,
            athlete_id=request.athlete_id,
            session_id=request.session_id
        )

        # Load full session context (conversation history, athlete profile, memory, mood, goals)
        session_context = await get_session_context(
            db=db,
            session_id=request.session_id,
            athlete_id=request.athlete_id
        )

        # Initialize agents
        knowledge_agent = KnowledgeAgent()
        athlete_agent = AthleteAgent(db=db, knowledge_agent=knowledge_agent)

        # Stream response
        async def generate():
            # Send crisis check if relevant
            if crisis_check.get("final_risk_level") != "LOW":
                yield f"data: {json.dumps({'type': 'crisis_check', 'data': crisis_check})}\n\n"

            # Stream AI response with full session context AND structured metadata
            async for text_chunk, metadata in athlete_agent.chat_stream_with_structured_output(
                user_message=request.message,
                context=session_context
            ):
                # Stream text chunks
                if text_chunk:
                    yield f"data: {json.dumps({'type': 'content', 'data': text_chunk})}\n\n"

                # Send metadata block at end
                if metadata:
                    yield f"data: {json.dumps({'type': 'metadata', 'data': metadata.dict()})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in streaming chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


import json
