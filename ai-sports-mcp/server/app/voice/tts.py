"""
Text-to-Speech using Cartesia.ai

This module handles AI voice generation with:
- Ultra-low latency (<300ms)
- Streaming support for real-time playback
- Emotion control (supportive, encouraging, calm)
- Natural prosody and conversational tone
"""

import asyncio
from typing import AsyncGenerator, Optional
import aiohttp
from app.core.config import settings

# Cartesia.ai API configuration
CARTESIA_API_URL = "https://api.cartesia.ai/v1"
CARTESIA_API_KEY = getattr(settings, "CARTESIA_API_KEY", None)

# Voice IDs (to be configured based on available voices)
# These are placeholders - actual IDs from Cartesia dashboard
VOICE_IDS = {
    "supportive": "voice-id-supportive",  # Warm, encouraging female voice
    "calm": "voice-id-calm",  # Soothing, steady male voice
    "professional": "voice-id-professional",  # Clear, professional neutral voice
}

# Default voice for sports psychology agent
DEFAULT_VOICE_ID = VOICE_IDS["supportive"]


async def synthesize_speech(
    text: str,
    voice_id: str = DEFAULT_VOICE_ID,
    emotion: str = "supportive",
    speed: float = 1.0,
) -> bytes:
    """
    Synthesize speech from text using Cartesia.ai

    Args:
        text: Text to convert to speech
        voice_id: Cartesia voice ID
        emotion: Emotion/tone (supportive, calm, encouraging)
        speed: Speech rate (0.5 to 2.0, default 1.0)

    Returns:
        Audio data as bytes (PCM, WAV, or MP3 depending on Cartesia config)

    Raises:
        Exception: If synthesis fails
    """
    if not CARTESIA_API_KEY:
        raise Exception("CARTESIA_API_KEY not configured")

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {CARTESIA_API_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "text": text,
                "voice_id": voice_id,
                "output_format": "mp3",  # or 'pcm_16000' for raw audio
                "language": "en",
                "speed": speed,
                # Emotion/style parameters (Cartesia-specific)
                "emotion": emotion,
            }

            async with session.post(
                f"{CARTESIA_API_URL}/synthesize",
                headers=headers,
                json=payload,
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Cartesia API error: {error_text}")

                return await response.read()

    except Exception as e:
        raise Exception(f"Speech synthesis failed: {str(e)}")


async def synthesize_speech_stream(
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

    Raises:
        Exception: If synthesis fails
    """
    from openai import AsyncOpenAI
    from app.core.logging import setup_logging

    logger = setup_logging()
    logger.info(f"Synthesizing speech: {len(text)} characters")

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # OpenAI TTS API with streaming
        async with client.audio.speech.with_streaming_response.create(
            model="tts-1",  # or "tts-1-hd" for higher quality
            voice=voice,
            input=text,
            response_format="opus",  # Low latency format (or "mp3")
            speed=speed,
        ) as response:
            # Stream audio chunks as they arrive
            async for chunk in response.iter_bytes(chunk_size=4096):
                if chunk:
                    yield chunk

        logger.info("Speech synthesis complete")

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise Exception(f"Speech synthesis streaming failed: {str(e)}")


def get_voice_for_context(context: str = "general") -> str:
    """
    Select appropriate voice based on conversation context

    Args:
        context: Conversation context (anxiety, confidence, recovery, etc.)

    Returns:
        Voice ID to use
    """
    voice_mapping = {
        "anxiety": VOICE_IDS["calm"],
        "stress": VOICE_IDS["calm"],
        "confidence": VOICE_IDS["supportive"],
        "motivation": VOICE_IDS["supportive"],
        "recovery": VOICE_IDS["calm"],
        "general": VOICE_IDS["supportive"],
    }

    return voice_mapping.get(context, DEFAULT_VOICE_ID)


# Fallback: Use OpenAI TTS if Cartesia is not available
async def synthesize_speech_openai(
    text: str,
    voice: str = "alloy",
    speed: float = 1.0,
) -> bytes:
    """
    Fallback TTS using OpenAI API

    Args:
        text: Text to synthesize
        voice: OpenAI voice (alloy, echo, fable, onyx, nova, shimmer)
        speed: Speech rate (0.25 to 4.0)

    Returns:
        Audio bytes (MP3 format)
    """
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = await client.audio.speech.create(
            model="tts-1",  # or 'tts-1-hd' for higher quality
            voice=voice,
            input=text,
            speed=speed,
        )

        # Return audio bytes
        return response.content

    except Exception as e:
        raise Exception(f"OpenAI TTS failed: {str(e)}")
