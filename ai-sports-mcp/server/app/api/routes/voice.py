"""
Voice API Routes - WebSocket endpoint for bidirectional voice streaming

Flow:
1. Client connects to WebSocket
2. Client sends audio chunks (binary)
3. Server transcribes with Whisper (STT)
4. Server processes with AthleteAgent
5. Server synthesizes response with Cartesia (TTS)
6. Server streams audio back to client (binary)
"""

import asyncio
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.core.logging import setup_logging
from app.voice import transcribe_audio, synthesize_speech_stream
from app.agents.athlete_agent import AthleteAgent
from app.agents.knowledge_agent import KnowledgeAgent
from app.agents.governance_agent import GovernanceAgent

logger = setup_logging()
router = APIRouter()

# Active WebSocket connections
active_connections: dict[str, WebSocket] = {}


class VoiceSession:
    """Manages a voice chat session"""

    def __init__(self, session_id: str, athlete_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.athlete_id = athlete_id
        self.websocket = websocket
        self.audio_chunks: list[bytes] = []
        self.conversation_history: list[dict] = []
        self.is_active = True

        # Initialize agents
        self.athlete_agent = AthleteAgent()
        self.knowledge_agent = KnowledgeAgent()
        self.governance_agent = GovernanceAgent()

    async def process_audio_chunk(self, audio_data: bytes):
        """Process incoming audio chunk"""
        self.audio_chunks.append(audio_data)

    async def process_utterance_end(self):
        """Process complete utterance when user stops speaking"""
        if not self.audio_chunks:
            return

        try:
            # Concatenate all audio chunks
            full_audio = b"".join(self.audio_chunks)
            self.audio_chunks = []  # Clear for next utterance

            # Transcribe audio
            logger.info(f"Transcribing audio ({len(full_audio)} bytes)")
            transcript = await transcribe_audio(full_audio)

            if not transcript.strip():
                logger.warning("Empty transcript received")
                return

            logger.info(f"Transcript: {transcript}")

            # Send transcript to client
            await self.websocket.send_json({
                "type": "transcript",
                "text": transcript,
                "isFinal": True,
            })

            # Check for crisis language (governance agent)
            crisis_detected, severity, crisis_info = await self.governance_agent.detect_crisis(
                transcript
            )

            if crisis_detected:
                logger.warning(f"Crisis detected: {severity} - {crisis_info}")
                # Send crisis alert to client
                await self.websocket.send_json({
                    "type": "crisis_alert",
                    "severity": severity,
                    "message": "We've detected you may be going through a difficult time. "
                    "Please consider reaching out to a counselor or trusted adult.",
                })

            # Retrieve relevant knowledge (RAG)
            knowledge_context = await self.knowledge_agent.retrieve_context(transcript)

            # Get AI response from athlete agent
            response_text = await self.athlete_agent.generate_response(
                message=transcript,
                conversation_history=self.conversation_history,
                knowledge_context=knowledge_context,
                session_id=self.session_id,
            )

            logger.info(f"AI Response: {response_text}")

            # Send text response to client (before TTS)
            await self.websocket.send_json({
                "type": "response",
                "text": response_text,
            })

            # Update conversation history
            self.conversation_history.append({"role": "user", "content": transcript})
            self.conversation_history.append({"role": "assistant", "content": response_text})

            # Synthesize speech (TTS) and stream to client
            async for audio_chunk in synthesize_speech_stream(response_text):
                if not self.is_active:
                    break
                # Send binary audio chunk
                await self.websocket.send_bytes(audio_chunk)

            logger.info("Voice response sent successfully")

        except Exception as e:
            logger.error(f"Error processing utterance: {e}", exc_info=True)
            await self.websocket.send_json({
                "type": "error",
                "message": str(e),
            })

    async def close(self):
        """Clean up session"""
        self.is_active = False
        self.audio_chunks = []
        self.conversation_history = []


@router.websocket("/voice/stream")
async def voice_stream(websocket: WebSocket):
    """
    WebSocket endpoint for bidirectional voice streaming

    Protocol:
    - Client sends: JSON handshake, then binary audio chunks
    - Server sends: JSON messages (transcripts, responses) + binary audio (TTS)

    Messages:
    - start: {"type": "start", "sessionId": "...", "athleteId": "..."}
    - utterance_end: {"type": "utterance_end"}
    - Binary data: Audio chunks (webm/opus)
    """
    await websocket.accept()

    session: Optional[VoiceSession] = None
    connection_id: Optional[str] = None

    try:
        logger.info("Voice WebSocket connection established")

        # Wait for initial handshake
        data = await websocket.receive_json()

        if data.get("type") != "start":
            await websocket.send_json({
                "type": "error",
                "message": "Expected 'start' message",
            })
            await websocket.close()
            return

        session_id = data.get("sessionId")
        athlete_id = data.get("athleteId")

        if not session_id or not athlete_id:
            await websocket.send_json({
                "type": "error",
                "message": "Missing sessionId or athleteId",
            })
            await websocket.close()
            return

        # Create session
        session = VoiceSession(session_id, athlete_id, websocket)
        connection_id = f"{athlete_id}:{session_id}"
        active_connections[connection_id] = websocket

        logger.info(f"Voice session started: {connection_id}")

        # Send acknowledgment
        await websocket.send_json({
            "type": "started",
            "sessionId": session_id,
        })

        # Main loop: receive audio chunks or control messages
        while session.is_active:
            try:
                # Check message type
                message = await websocket.receive()

                # Binary data = audio chunk
                if "bytes" in message:
                    audio_data = message["bytes"]
                    await session.process_audio_chunk(audio_data)

                # Text data = control message
                elif "text" in message:
                    data = json.loads(message["text"])

                    if data.get("type") == "utterance_end":
                        # User stopped speaking - process complete utterance
                        await session.process_utterance_end()

                    elif data.get("type") == "stop":
                        # Client requested stop
                        break

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected early: {connection_id}")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}", exc_info=True)
        try:
            if websocket.application_state.value == 1:  # CONNECTED state
                await websocket.send_json({
                    "type": "error",
                    "message": str(e),
                })
        except Exception:
            pass  # Connection already closed

    finally:
        # Cleanup
        if session:
            await session.close()

        if connection_id and connection_id in active_connections:
            del active_connections[connection_id]

        try:
            if websocket.application_state.value == 1:  # CONNECTED state
                await websocket.close()
        except Exception:
            pass  # Connection already closed

        logger.info(f"Voice session ended: {connection_id}")


@router.get("/voice/status")
async def voice_status():
    """Get status of voice service"""
    return {
        "status": "operational",
        "active_connections": len(active_connections),
        "features": {
            "stt": "OpenAI Whisper",
            "tts": "Cartesia.ai + OpenAI fallback",
            "vad": "Client-side",
            "streaming": True,
        },
    }
