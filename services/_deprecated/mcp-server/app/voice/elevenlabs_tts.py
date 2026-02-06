"""
ElevenLabs Text-to-Speech Implementation

High-quality, low-latency voice synthesis for sports psychology AI.
Features:
- Turbo model for <500ms latency
- Streaming support for real-time playback
- Voice customization (stability, similarity, style)
- Multiple voice options for different contexts
"""

import asyncio
from typing import AsyncGenerator, Optional, Dict, Any
import aiohttp
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# ElevenLabs API Configuration
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

# Voice profiles for different emotional contexts
VOICE_PROFILES: Dict[str, Dict[str, Any]] = {
    "supportive": {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel - warm, supportive
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
    },
    "calm": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah - calm, soothing
        "stability": 0.7,
        "similarity_boost": 0.7,
        "style": 0.0,
    },
    "encouraging": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam - encouraging, motivational
        "stability": 0.4,
        "similarity_boost": 0.8,
        "style": 0.3,
    },
    "professional": {
        "voice_id": "onwK4e9ZLuTAKqWW03F9",  # Daniel - professional, clear
        "stability": 0.6,
        "similarity_boost": 0.75,
        "style": 0.1,
    },
}

# Default voice for sports psychology (supportive)
DEFAULT_VOICE_ID = settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"


def get_voice_settings(context: str = "supportive") -> Dict[str, Any]:
    """
    Get voice settings based on conversation context.

    Args:
        context: Emotional context (supportive, calm, encouraging, professional)

    Returns:
        Dictionary with voice_id and voice settings
    """
    profile = VOICE_PROFILES.get(context, VOICE_PROFILES["supportive"])
    return {
        "voice_id": profile["voice_id"],
        "voice_settings": {
            "stability": profile["stability"],
            "similarity_boost": profile["similarity_boost"],
            "style": profile["style"],
            "use_speaker_boost": True,
        },
    }


async def synthesize_speech_elevenlabs(
    text: str,
    voice_id: Optional[str] = None,
    context: str = "supportive",
    model_id: Optional[str] = None,
) -> bytes:
    """
    Synthesize speech using ElevenLabs API (non-streaming).

    Args:
        text: Text to convert to speech
        voice_id: ElevenLabs voice ID (optional, uses context-based selection)
        context: Emotional context for voice selection
        model_id: ElevenLabs model ID (default: eleven_turbo_v2_5)

    Returns:
        Audio data as MP3 bytes

    Raises:
        Exception: If synthesis fails or API key not configured
    """
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        raise Exception("ELEVENLABS_API_KEY not configured")

    # Get voice settings based on context
    voice_config = get_voice_settings(context)
    effective_voice_id = voice_id or voice_config["voice_id"]
    effective_model = model_id or settings.ELEVENLABS_MODEL_ID

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            }

            payload = {
                "text": text,
                "model_id": effective_model,
                "voice_settings": voice_config["voice_settings"],
            }

            url = f"{ELEVENLABS_API_URL}/text-to-speech/{effective_voice_id}"

            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"ElevenLabs API error ({response.status}): {error_text}")

                return await response.read()

    except aiohttp.ClientError as e:
        raise Exception(f"ElevenLabs network error: {str(e)}")
    except Exception as e:
        raise Exception(f"ElevenLabs synthesis failed: {str(e)}")


async def synthesize_speech_stream_elevenlabs(
    text: str,
    voice_id: Optional[str] = None,
    context: str = "supportive",
    model_id: Optional[str] = None,
    optimize_streaming_latency: int = 3,
    output_format: str = "mp3_44100_128",
) -> AsyncGenerator[bytes, None]:
    """
    Synthesize speech with streaming using ElevenLabs API.

    Uses the streaming endpoint for lowest latency (<500ms to first byte).

    Args:
        text: Text to convert to speech
        voice_id: ElevenLabs voice ID (optional)
        context: Emotional context for voice selection
        model_id: ElevenLabs model ID
        optimize_streaming_latency: 0-4, higher = lower latency but lower quality
        output_format: Audio format (mp3_44100_128, pcm_16000, etc.)

    Yields:
        Audio chunks as they're generated

    Raises:
        Exception: If synthesis fails
    """
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        raise Exception("ELEVENLABS_API_KEY not configured")

    # Get voice settings based on context
    voice_config = get_voice_settings(context)
    effective_voice_id = voice_id or voice_config["voice_id"]
    effective_model = model_id or settings.ELEVENLABS_MODEL_ID

    logger.info(f"ElevenLabs TTS: {len(text)} chars, voice={effective_voice_id[:8]}..., model={effective_model}")

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            }

            payload = {
                "text": text,
                "model_id": effective_model,
                "voice_settings": voice_config["voice_settings"],
            }

            # Use streaming endpoint with latency optimization
            url = (
                f"{ELEVENLABS_API_URL}/text-to-speech/{effective_voice_id}/stream"
                f"?optimize_streaming_latency={optimize_streaming_latency}"
                f"&output_format={output_format}"
            )

            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"ElevenLabs API error ({response.status}): {error_text}")

                # Stream audio chunks as they arrive
                first_chunk = True
                async for chunk in response.content.iter_chunked(4096):
                    if chunk:
                        if first_chunk:
                            logger.info("ElevenLabs: First audio chunk received")
                            first_chunk = False
                        yield chunk

        logger.info("ElevenLabs TTS streaming complete")

    except aiohttp.ClientError as e:
        logger.error(f"ElevenLabs network error: {e}")
        raise Exception(f"ElevenLabs network error: {str(e)}")
    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        raise Exception(f"ElevenLabs synthesis failed: {str(e)}")


async def get_available_voices() -> list[Dict[str, Any]]:
    """
    Get list of available ElevenLabs voices.

    Returns:
        List of voice dictionaries with id, name, labels
    """
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        return []

    try:
        async with aiohttp.ClientSession() as session:
            headers = {"xi-api-key": api_key}

            async with session.get(f"{ELEVENLABS_API_URL}/voices", headers=headers) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch ElevenLabs voices: {response.status}")
                    return []

                data = await response.json()
                voices = data.get("voices", [])

                return [
                    {
                        "voice_id": v["voice_id"],
                        "name": v["name"],
                        "category": v.get("category", "unknown"),
                        "labels": v.get("labels", {}),
                        "preview_url": v.get("preview_url"),
                    }
                    for v in voices
                ]

    except Exception as e:
        logger.error(f"Error fetching ElevenLabs voices: {e}")
        return []


async def get_user_subscription_info() -> Dict[str, Any]:
    """
    Get ElevenLabs subscription information for monitoring usage.

    Returns:
        Dictionary with character_count, character_limit, etc.
    """
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        return {"error": "API key not configured"}

    try:
        async with aiohttp.ClientSession() as session:
            headers = {"xi-api-key": api_key}

            async with session.get(f"{ELEVENLABS_API_URL}/user/subscription", headers=headers) as response:
                if response.status != 200:
                    return {"error": f"API error: {response.status}"}

                return await response.json()

    except Exception as e:
        logger.error(f"Error fetching ElevenLabs subscription: {e}")
        return {"error": str(e)}


def select_voice_for_content(text: str, detected_emotion: Optional[str] = None) -> str:
    """
    Intelligently select voice based on content and detected emotion.

    Args:
        text: The text being synthesized
        detected_emotion: Optional pre-detected emotion

    Returns:
        Voice ID to use
    """
    # Keywords that suggest different emotional contexts
    anxiety_keywords = ["anxious", "nervous", "worried", "scared", "panic", "stress"]
    motivation_keywords = ["excited", "motivated", "confident", "ready", "pumped", "let's go"]
    recovery_keywords = ["tired", "rest", "recover", "sleep", "injury", "pain"]

    text_lower = text.lower()

    # Use detected emotion if provided
    if detected_emotion:
        emotion_mapping = {
            "anxiety": "calm",
            "sadness": "supportive",
            "excitement": "encouraging",
            "neutral": "professional",
        }
        context = emotion_mapping.get(detected_emotion, "supportive")
        return get_voice_settings(context)["voice_id"]

    # Keyword-based selection
    if any(kw in text_lower for kw in anxiety_keywords):
        return get_voice_settings("calm")["voice_id"]
    elif any(kw in text_lower for kw in motivation_keywords):
        return get_voice_settings("encouraging")["voice_id"]
    elif any(kw in text_lower for kw in recovery_keywords):
        return get_voice_settings("calm")["voice_id"]

    # Default to supportive
    return get_voice_settings("supportive")["voice_id"]
