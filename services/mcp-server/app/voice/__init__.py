"""
Voice Module - Speech-to-Text and Text-to-Speech

Unified voice pipeline with provider abstraction:

TTS Providers (in priority order):
1. ElevenLabs - High quality, emotional expressiveness, voice cloning
2. OpenAI TTS - Reliable fallback, good quality
3. Cartesia.ai - Legacy, ultra-low latency (deprecated)

STT Providers (in priority order):
1. OpenAI Whisper - High accuracy, multi-format
2. Deepgram Nova-2 - Low latency, emotion detection

Features:
- Automatic provider failover
- Context-aware voice selection
- Emotion detection from speech
- Streaming support for real-time playback
"""

# Core STT functions
from .stt import (
    transcribe_audio,
    transcribe_audio_stream,
    transcribe_with_emotion,
    get_stt_status,
)

# Core TTS functions
from .tts import (
    synthesize_speech,
    synthesize_speech_stream,
    get_voice_for_context,
    get_tts_status,
)

# ElevenLabs-specific functions
from .elevenlabs_tts import (
    synthesize_speech_elevenlabs,
    synthesize_speech_stream_elevenlabs,
    get_available_voices,
    get_user_subscription_info,
    select_voice_for_content,
    VOICE_PROFILES,
)

# Deepgram-specific functions
from .deepgram_stt import (
    transcribe_audio_deepgram,
    detect_emotion_from_transcript,
    get_deepgram_status,
)

__all__ = [
    # STT
    "transcribe_audio",
    "transcribe_audio_stream",
    "transcribe_with_emotion",
    "get_stt_status",
    "transcribe_audio_deepgram",
    "detect_emotion_from_transcript",
    "get_deepgram_status",
    # TTS
    "synthesize_speech",
    "synthesize_speech_stream",
    "get_voice_for_context",
    "get_tts_status",
    "synthesize_speech_elevenlabs",
    "synthesize_speech_stream_elevenlabs",
    "get_available_voices",
    "get_user_subscription_info",
    "select_voice_for_content",
    "VOICE_PROFILES",
]
