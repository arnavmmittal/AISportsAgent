"""
Speech-to-Text using OpenAI Whisper API

This module handles audio transcription with:
- Streaming support for real-time transcription
- High accuracy for sports terminology
- Multi-language support
"""

import asyncio
from typing import Optional
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def transcribe_audio(
    audio_data: bytes,
    language: str = "en",
    prompt: Optional[str] = None,
) -> str:
    """
    Transcribe audio using OpenAI Whisper API

    Args:
        audio_data: Audio file bytes (webm, mp3, m4a, etc.)
        language: ISO-639-1 language code (default: English)
        prompt: Optional context to improve accuracy (e.g., sports terms)

    Returns:
        Transcribed text

    Raises:
        Exception: If transcription fails
    """
    try:
        # Whisper prompt for better sports psychology terminology
        default_prompt = (
            "Sports psychology conversation about mental performance, "
            "anxiety, confidence, focus, mindfulness, pre-game preparation, "
            "team dynamics, goal setting, visualization, and recovery."
        )

        # Create temporary file-like object from bytes
        import io
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.webm"  # Required for API

        # Transcribe with Whisper
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language,
            prompt=prompt or default_prompt,
            response_format="json",
        )

        return response.text

    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")


async def transcribe_audio_stream(
    audio_chunks: list[bytes],
    language: str = "en",
) -> str:
    """
    Transcribe audio from multiple chunks (streaming mode)

    Args:
        audio_chunks: List of audio chunk bytes
        language: ISO-639-1 language code

    Returns:
        Complete transcribed text
    """
    # Concatenate chunks
    full_audio = b"".join(audio_chunks)

    # Transcribe full audio
    return await transcribe_audio(full_audio, language=language)


# Voice Activity Detection threshold (in seconds of audio)
MIN_AUDIO_DURATION_FOR_TRANSCRIPTION = 0.5  # 500ms minimum


def should_transcribe(audio_duration_seconds: float) -> bool:
    """
    Determine if audio chunk is long enough to transcribe

    Args:
        audio_duration_seconds: Duration of audio in seconds

    Returns:
        True if audio should be transcribed
    """
    return audio_duration_seconds >= MIN_AUDIO_DURATION_FOR_TRANSCRIPTION
