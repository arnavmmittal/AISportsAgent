"""
Text-to-Speech Pipeline

Unified TTS interface with intelligent fallback:
1. ElevenLabs (Primary) - High quality, emotional expressiveness
2. OpenAI TTS (Fallback) - Reliable, good quality
3. Cartesia.ai (Legacy) - Ultra-low latency option

Features:
- Automatic provider failover
- Context-aware voice selection
- Streaming support for real-time playback
- Emotion and style control
"""

import asyncio
from typing import AsyncGenerator, Optional
import aiohttp
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# Import provider-specific implementations
from app.voice.elevenlabs_tts import (
    synthesize_speech_elevenlabs,
    synthesize_speech_stream_elevenlabs,
    select_voice_for_content,
    get_voice_settings,
)

# Legacy Cartesia configuration (deprecated)
CARTESIA_API_URL = "https://api.cartesia.ai/v1"


async def synthesize_speech_stream_openai(
    text: str,
    voice: str = "alloy",
    speed: float = 1.0,
) -> AsyncGenerator[bytes, None]:
    """
    Synthesize speech with streaming using OpenAI TTS API.

    Args:
        text: Text to convert to speech
        voice: OpenAI voice (alloy, echo, fable, onyx, nova, shimmer)
        speed: Speech rate (0.25 to 4.0)

    Yields:
        Audio chunks as they're generated
    """
    from openai import AsyncOpenAI

    logger.info(f"OpenAI TTS: {len(text)} chars, voice={voice}")

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        async with client.audio.speech.with_streaming_response.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
            speed=speed,
        ) as response:
            async for chunk in response.iter_bytes(chunk_size=4096):
                if chunk:
                    yield chunk

        logger.info("OpenAI TTS streaming complete")

    except Exception as e:
        logger.error(f"OpenAI TTS error: {e}")
        raise Exception(f"OpenAI TTS failed: {str(e)}")


async def synthesize_speech_stream_cartesia(
    text: str,
    voice_id: str = "voice-id-supportive",
    emotion: str = "supportive",
    speed: float = 1.0,
) -> AsyncGenerator[bytes, None]:
    """
    Legacy Cartesia.ai TTS streaming (deprecated, kept for fallback).

    Args:
        text: Text to convert to speech
        voice_id: Cartesia voice ID
        emotion: Emotion/tone
        speed: Speech rate

    Yields:
        Audio chunks
    """
    cartesia_key = settings.CARTESIA_API_KEY
    if not cartesia_key:
        raise Exception("CARTESIA_API_KEY not configured")

    logger.info(f"Cartesia TTS: {len(text)} chars")

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {cartesia_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "text": text,
                "voice_id": voice_id,
                "output_format": "mp3",
                "language": "en",
                "speed": speed,
                "emotion": emotion,
                "stream": True,
            }

            async with session.post(
                f"{CARTESIA_API_URL}/synthesize/stream",
                headers=headers,
                json=payload,
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Cartesia API error: {error_text}")

                async for chunk in response.content.iter_chunked(4096):
                    if chunk:
                        yield chunk

        logger.info("Cartesia TTS streaming complete")

    except Exception as e:
        logger.error(f"Cartesia TTS error: {e}")
        raise Exception(f"Cartesia TTS failed: {str(e)}")


async def synthesize_speech_stream(
    text: str,
    voice: str = "alloy",
    speed: float = 1.0,
    context: str = "supportive",
    detected_emotion: Optional[str] = None,
) -> AsyncGenerator[bytes, None]:
    """
    Unified TTS streaming with intelligent fallback.

    Provider priority based on configuration:
    1. ElevenLabs (default) - Best quality, emotional expressiveness
    2. OpenAI TTS - Reliable fallback
    3. Cartesia (legacy) - Ultra-low latency option

    Args:
        text: Text to convert to speech
        voice: Voice name (used for OpenAI fallback)
        speed: Speech rate
        context: Emotional context (supportive, calm, encouraging, professional)
        detected_emotion: Optional pre-detected emotion for voice selection

    Yields:
        Audio chunks as they're generated

    Raises:
        Exception: If all providers fail
    """
    provider = settings.TTS_PROVIDER.lower()
    errors = []

    # Try ElevenLabs first (if configured as primary or as fallback)
    if provider == "elevenlabs" or settings.ELEVENLABS_API_KEY:
        try:
            logger.info("Attempting TTS with ElevenLabs...")

            # Intelligently select voice based on content
            voice_id = select_voice_for_content(text, detected_emotion)

            async for chunk in synthesize_speech_stream_elevenlabs(
                text=text,
                voice_id=voice_id,
                context=context,
            ):
                yield chunk

            logger.info("Successfully used ElevenLabs TTS")
            return

        except Exception as e:
            errors.append(f"ElevenLabs: {str(e)}")
            logger.warning(f"ElevenLabs TTS failed: {e}")

    # Try Cartesia (if configured as primary)
    if provider == "cartesia" and settings.CARTESIA_API_KEY:
        try:
            logger.info("Attempting TTS with Cartesia...")

            async for chunk in synthesize_speech_stream_cartesia(
                text=text,
                emotion=context,
                speed=speed,
            ):
                yield chunk

            logger.info("Successfully used Cartesia TTS")
            return

        except Exception as e:
            errors.append(f"Cartesia: {str(e)}")
            logger.warning(f"Cartesia TTS failed: {e}")

    # Fallback to OpenAI TTS
    try:
        logger.info("Using OpenAI TTS (fallback)")

        # Map context to OpenAI voice
        voice_mapping = {
            "supportive": "nova",
            "calm": "shimmer",
            "encouraging": "onyx",
            "professional": "alloy",
        }
        openai_voice = voice_mapping.get(context, voice)

        async for chunk in synthesize_speech_stream_openai(
            text=text,
            voice=openai_voice,
            speed=speed,
        ):
            yield chunk

        logger.info("Successfully used OpenAI TTS")
        return

    except Exception as e:
        errors.append(f"OpenAI: {str(e)}")
        logger.error(f"All TTS providers failed: {errors}")
        raise Exception(f"Speech synthesis failed. Errors: {'; '.join(errors)}")


async def synthesize_speech(
    text: str,
    voice: str = "alloy",
    context: str = "supportive",
) -> bytes:
    """
    Non-streaming TTS synthesis.

    Args:
        text: Text to convert to speech
        voice: Voice name
        context: Emotional context

    Returns:
        Complete audio as bytes
    """
    chunks = []
    async for chunk in synthesize_speech_stream(text, voice=voice, context=context):
        chunks.append(chunk)
    return b"".join(chunks)


def get_voice_for_context(context: str = "general") -> str:
    """
    Select appropriate voice based on conversation context.

    Args:
        context: Conversation context (anxiety, confidence, recovery, etc.)

    Returns:
        Voice identifier appropriate for the current TTS provider
    """
    provider = settings.TTS_PROVIDER.lower()

    context_mapping = {
        "anxiety": "calm",
        "stress": "calm",
        "confidence": "encouraging",
        "motivation": "encouraging",
        "recovery": "calm",
        "pregame": "supportive",
        "postgame": "supportive",
        "general": "supportive",
    }

    emotional_context = context_mapping.get(context, "supportive")

    if provider == "elevenlabs":
        return get_voice_settings(emotional_context)["voice_id"]
    elif provider == "openai":
        openai_mapping = {
            "calm": "shimmer",
            "encouraging": "onyx",
            "supportive": "nova",
        }
        return openai_mapping.get(emotional_context, "nova")
    else:
        return "voice-id-supportive"  # Cartesia default


async def get_tts_status() -> dict:
    """
    Get TTS service status and available providers.

    Returns:
        Dictionary with provider status and configuration
    """
    status = {
        "primary_provider": settings.TTS_PROVIDER,
        "providers": {},
    }

    # Check ElevenLabs
    if settings.ELEVENLABS_API_KEY:
        status["providers"]["elevenlabs"] = {
            "configured": True,
            "model": settings.ELEVENLABS_MODEL_ID,
            "voice_id": settings.ELEVENLABS_VOICE_ID,
        }
    else:
        status["providers"]["elevenlabs"] = {"configured": False}

    # Check OpenAI (always available if OPENAI_API_KEY is set)
    status["providers"]["openai"] = {
        "configured": bool(settings.OPENAI_API_KEY),
        "model": "tts-1",
    }

    # Check Cartesia (legacy)
    status["providers"]["cartesia"] = {
        "configured": bool(settings.CARTESIA_API_KEY),
        "deprecated": True,
    }

    return status
