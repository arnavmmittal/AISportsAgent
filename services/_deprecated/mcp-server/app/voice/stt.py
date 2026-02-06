"""
Speech-to-Text Pipeline

Unified STT interface with provider selection:
1. OpenAI Whisper (Default) - High accuracy, multi-format support
2. Deepgram Nova-2 (Alternative) - Low latency, emotion detection

Features:
- Automatic provider failover
- Sports psychology terminology optimization
- Emotion detection from speech
- Multi-format audio support
"""

import asyncio
import io
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# OpenAI client for Whisper
_openai_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI client singleton."""
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


# Sports psychology prompt for better terminology recognition
SPORTS_PSYCHOLOGY_PROMPT = (
    "Sports psychology conversation about mental performance, anxiety, confidence, "
    "focus, mindfulness, pre-game preparation, team dynamics, goal setting, "
    "visualization, recovery, slump, pressure, clutch, flow state, and mental toughness."
)


async def transcribe_audio_whisper(
    audio_data: bytes,
    language: str = "en",
    prompt: Optional[str] = None,
) -> str:
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_data: Audio file bytes (webm, mp3, m4a, wav, etc.)
        language: ISO-639-1 language code
        prompt: Optional context prompt for better accuracy

    Returns:
        Transcribed text

    Raises:
        Exception: If transcription fails
    """
    client = get_openai_client()
    effective_prompt = prompt or SPORTS_PSYCHOLOGY_PROMPT

    logger.info(f"Whisper STT: {len(audio_data)} bytes")

    # Try different audio format extensions
    # Whisper determines format from extension
    formats_to_try = ["webm", "ogg", "mp3", "m4a", "wav"]

    last_error = None
    for audio_format in formats_to_try:
        try:
            audio_file = io.BytesIO(audio_data)
            audio_file.name = f"audio.{audio_format}"

            response = await client.audio.transcriptions.create(
                model=settings.WHISPER_MODEL,
                file=audio_file,
                language=language,
                prompt=effective_prompt,
                response_format="json",
            )

            transcript = response.text
            logger.info(f"Whisper transcript: {len(transcript)} chars")
            return transcript

        except Exception as e:
            last_error = e
            continue

    raise Exception(f"Whisper transcription failed with all formats: {str(last_error)}")


async def transcribe_audio(
    audio_data: bytes,
    language: str = "en",
    prompt: Optional[str] = None,
    detect_emotion: bool = False,
) -> Dict[str, Any] | str:
    """
    Unified audio transcription with provider selection.

    Args:
        audio_data: Audio file bytes
        language: Language code
        prompt: Optional context prompt
        detect_emotion: Whether to include emotion detection

    Returns:
        If detect_emotion=False: Transcribed text (str)
        If detect_emotion=True: Dict with transcript, emotion, confidence

    Raises:
        Exception: If all providers fail
    """
    provider = settings.STT_PROVIDER.lower()
    errors = []

    # Try Deepgram if configured as primary
    if provider == "deepgram" and settings.DEEPGRAM_API_KEY:
        try:
            from app.voice.deepgram_stt import (
                transcribe_audio_deepgram,
                detect_emotion_from_transcript,
            )

            result = await transcribe_audio_deepgram(
                audio_data=audio_data,
                language=language,
                detect_sentiment=detect_emotion,
            )

            transcript = result.get("transcript", "")

            if detect_emotion:
                emotion_data = detect_emotion_from_transcript(
                    transcript,
                    sentiment=result.get("sentiment"),
                )
                return {
                    "transcript": transcript,
                    "confidence": result.get("confidence", 0.0),
                    "emotion": emotion_data.get("emotion"),
                    "emotion_confidence": emotion_data.get("confidence"),
                    "provider": "deepgram",
                }

            return transcript

        except Exception as e:
            errors.append(f"Deepgram: {str(e)}")
            logger.warning(f"Deepgram STT failed, trying Whisper: {e}")

    # Try Whisper (default or fallback)
    try:
        transcript = await transcribe_audio_whisper(
            audio_data=audio_data,
            language=language,
            prompt=prompt,
        )

        if detect_emotion:
            # Basic emotion detection from text (without Deepgram's sentiment)
            from app.voice.deepgram_stt import detect_emotion_from_transcript
            emotion_data = detect_emotion_from_transcript(transcript)
            return {
                "transcript": transcript,
                "confidence": 0.9,  # Whisper doesn't provide confidence
                "emotion": emotion_data.get("emotion"),
                "emotion_confidence": emotion_data.get("confidence"),
                "provider": "whisper",
            }

        return transcript

    except Exception as e:
        errors.append(f"Whisper: {str(e)}")
        logger.error(f"All STT providers failed: {errors}")
        raise Exception(f"Transcription failed. Errors: {'; '.join(errors)}")


async def transcribe_audio_stream(
    audio_chunks: list[bytes],
    language: str = "en",
) -> str:
    """
    Transcribe audio from multiple chunks.

    Concatenates chunks and transcribes the complete audio.

    Args:
        audio_chunks: List of audio chunk bytes
        language: Language code

    Returns:
        Complete transcribed text
    """
    full_audio = b"".join(audio_chunks)
    result = await transcribe_audio(full_audio, language=language)

    if isinstance(result, dict):
        return result.get("transcript", "")
    return result


# Voice Activity Detection threshold
MIN_AUDIO_DURATION_FOR_TRANSCRIPTION = 0.5  # 500ms minimum


def should_transcribe(audio_duration_seconds: float) -> bool:
    """
    Determine if audio is long enough to transcribe.

    Args:
        audio_duration_seconds: Duration of audio

    Returns:
        True if audio should be transcribed
    """
    return audio_duration_seconds >= MIN_AUDIO_DURATION_FOR_TRANSCRIPTION


async def get_stt_status() -> Dict[str, Any]:
    """
    Get STT service status and available providers.

    Returns:
        Dictionary with provider status and configuration
    """
    status = {
        "primary_provider": settings.STT_PROVIDER,
        "providers": {},
    }

    # Check Whisper (OpenAI)
    status["providers"]["whisper"] = {
        "configured": bool(settings.OPENAI_API_KEY),
        "model": settings.WHISPER_MODEL,
    }

    # Check Deepgram
    if settings.DEEPGRAM_API_KEY:
        try:
            from app.voice.deepgram_stt import get_deepgram_status
            deepgram_status = await get_deepgram_status()
            status["providers"]["deepgram"] = deepgram_status
        except Exception as e:
            status["providers"]["deepgram"] = {
                "configured": True,
                "status": "error",
                "error": str(e),
            }
    else:
        status["providers"]["deepgram"] = {"configured": False}

    return status


async def transcribe_with_emotion(
    audio_data: bytes,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Transcribe audio with emotion detection.

    Convenience wrapper for transcribe_audio with detect_emotion=True.

    Args:
        audio_data: Audio file bytes
        language: Language code

    Returns:
        Dict with transcript, emotion, confidence
    """
    result = await transcribe_audio(audio_data, language, detect_emotion=True)
    if isinstance(result, str):
        return {
            "transcript": result,
            "emotion": "neutral",
            "emotion_confidence": 0.3,
            "provider": "whisper",
        }
    return result
