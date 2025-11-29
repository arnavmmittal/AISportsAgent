"""
Voice Module - Speech-to-Text and Text-to-Speech

This module provides:
- STT: OpenAI Whisper API for transcription
- TTS: Cartesia.ai for ultra-low latency voice synthesis
- Fallback: OpenAI TTS when Cartesia unavailable
"""

from .stt import transcribe_audio, transcribe_audio_stream
from .tts import (
    synthesize_speech,
    synthesize_speech_stream,
    synthesize_speech_openai,
    get_voice_for_context,
)

__all__ = [
    "transcribe_audio",
    "transcribe_audio_stream",
    "synthesize_speech",
    "synthesize_speech_stream",
    "synthesize_speech_openai",
    "get_voice_for_context",
]
