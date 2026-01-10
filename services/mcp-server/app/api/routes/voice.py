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
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.logging import setup_logging
from app.db.database import get_db
from app.voice import transcribe_audio, synthesize_speech_stream
from app.agents.athlete_agent import AthleteAgent
# from app.agents.knowledge_agent import KnowledgeAgent  # Disabled for MVP (requires chromadb)
from app.agents.governance_agent import GovernanceAgent

logger = setup_logging()
router = APIRouter()

# Active WebSocket connections
active_connections: dict[str, WebSocket] = {}


class VoiceSession:
    """Manages a voice chat session"""

    def __init__(self, session_id: str, athlete_id: str, websocket: WebSocket, db: Session):
        self.session_id = session_id
        self.athlete_id = athlete_id
        self.websocket = websocket
        self.db = db
        self.audio_chunks: list[bytes] = []
        self.conversation_history: list[dict] = []
        self.is_active = True

        # Initialize agents WITH database session
        self.athlete_agent = AthleteAgent(db=db, knowledge_agent=None)
        # self.knowledge_agent = KnowledgeAgent()  # Disabled for MVP (requires chromadb)
        self.governance_agent = GovernanceAgent(db=db)

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
            # knowledge_context = await self.knowledge_agent.retrieve_context(transcript)  # Disabled for MVP
            knowledge_context = ""  # No RAG for MVP

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
async def voice_stream(websocket: WebSocket, db: Session = Depends(get_db)):
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
        logger.info("Waiting for handshake message...")
        data = await websocket.receive_json()
        logger.info(f"Received handshake data: {data}")

        if data.get("type") != "start":
            logger.error(f"Invalid handshake type: {data.get('type')}")
            await websocket.send_json({
                "type": "error",
                "message": "Expected 'start' message",
            })
            await websocket.close()
            return

        session_id = data.get("sessionId")
        athlete_id = data.get("athleteId")

        logger.info(f"Session ID: {session_id}, Athlete ID: {athlete_id}")

        if not session_id or not athlete_id:
            logger.error("Missing sessionId or athleteId in handshake")
            await websocket.send_json({
                "type": "error",
                "message": "Missing sessionId or athleteId",
            })
            await websocket.close()
            return

        # Create session with database
        session = VoiceSession(session_id, athlete_id, websocket, db)
        connection_id = f"{athlete_id}:{session_id}"
        active_connections[connection_id] = websocket

        logger.info(f"Voice session started: {connection_id}")

        # Send acknowledgment
        logger.info("Sending 'started' acknowledgment to client...")
        try:
            await websocket.send_json({
                "type": "started",
                "sessionId": session_id,
            })
            logger.info("'started' acknowledgment sent successfully")
        except Exception as e:
            logger.error(f"Failed to send 'started' acknowledgment: {e}", exc_info=True)

        # Main loop: receive audio chunks or control messages
        while session.is_active:
            try:
                # Check message type
                logger.info("Waiting for message from client...")
                message = await websocket.receive()
                logger.info(f"Received message type: {list(message.keys())}")

                # Binary data = audio chunk
                if "bytes" in message:
                    audio_data = message["bytes"]
                    logger.info(f"Received audio chunk: {len(audio_data)} bytes")
                    await session.process_audio_chunk(audio_data)
                    logger.info(f"Audio chunk processed. Total chunks: {len(session.audio_chunks)}")

                # Text data = control message
                elif "text" in message:
                    logger.info(f"Received text message: {message['text']}")
                    data = json.loads(message["text"])
                    logger.info(f"Parsed data: {data}")

                    if data.get("type") == "utterance_end":
                        logger.info("Processing utterance_end...")
                        # User stopped speaking - process complete utterance
                        await session.process_utterance_end()
                        logger.info("utterance_end processed")

                    elif data.get("type") == "stop":
                        logger.info("Client requested stop")
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
    """Get comprehensive status of voice service"""
    from app.voice import get_tts_status, get_stt_status

    tts_status = await get_tts_status()
    stt_status = await get_stt_status()

    return {
        "status": "operational",
        "active_connections": len(active_connections),
        "tts": tts_status,
        "stt": stt_status,
        "features": {
            "streaming": True,
            "emotion_detection": True,
            "context_aware_voice": True,
            "vad": "client-side",
        },
    }


@router.get("/voice/voices")
async def list_available_voices():
    """Get list of available TTS voices"""
    from app.voice import get_available_voices, VOICE_PROFILES

    elevenlabs_voices = await get_available_voices()

    return {
        "voice_profiles": VOICE_PROFILES,
        "elevenlabs_voices": elevenlabs_voices[:10] if elevenlabs_voices else [],
        "openai_voices": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    }


@router.post("/voice/synthesize")
async def synthesize_text(
    text: str,
    context: str = "supportive",
):
    """
    Synthesize speech from text (non-streaming).

    Args:
        text: Text to convert to speech
        context: Emotional context (supportive, calm, encouraging, professional)

    Returns:
        Audio file as MP3
    """
    from fastapi.responses import Response
    from app.voice import synthesize_speech

    try:
        audio_data = await synthesize_speech(text, context=context)
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/transcribe")
async def transcribe_audio_endpoint(
    audio_file: bytes,
    detect_emotion: bool = False,
):
    """
    Transcribe audio to text.

    Args:
        audio_file: Audio data bytes
        detect_emotion: Include emotion detection

    Returns:
        Transcription result
    """
    from app.voice import transcribe_audio

    try:
        result = await transcribe_audio(
            audio_file,
            detect_emotion=detect_emotion,
        )

        if isinstance(result, str):
            return {"transcript": result}
        return result
    except Exception as e:
        logger.error(f"STT transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
