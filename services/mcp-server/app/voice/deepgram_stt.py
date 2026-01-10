"""
Deepgram Speech-to-Text Implementation

High-accuracy, low-latency transcription for sports psychology conversations.
Features:
- Nova-2 model for best accuracy
- Streaming support for real-time transcription
- Emotion and sentiment detection
- Sports terminology optimization
"""

import asyncio
from typing import Optional, Dict, Any, AsyncGenerator
import aiohttp
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# Deepgram API Configuration
DEEPGRAM_API_URL = "https://api.deepgram.com/v1"


async def transcribe_audio_deepgram(
    audio_data: bytes,
    language: str = "en",
    model: Optional[str] = None,
    detect_entities: bool = True,
    detect_sentiment: bool = True,
    smart_format: bool = True,
) -> Dict[str, Any]:
    """
    Transcribe audio using Deepgram's Nova-2 model.

    Args:
        audio_data: Audio file bytes (webm, mp3, m4a, wav, etc.)
        language: Language code (default: en)
        model: Deepgram model (default: nova-2)
        detect_entities: Enable entity detection
        detect_sentiment: Enable sentiment analysis
        smart_format: Enable smart formatting (punctuation, casing)

    Returns:
        Dictionary with transcript, confidence, entities, sentiment

    Raises:
        Exception: If transcription fails
    """
    api_key = settings.DEEPGRAM_API_KEY
    if not api_key:
        raise Exception("DEEPGRAM_API_KEY not configured")

    effective_model = model or settings.DEEPGRAM_MODEL
    effective_language = language or settings.DEEPGRAM_LANGUAGE

    logger.info(f"Deepgram STT: {len(audio_data)} bytes, model={effective_model}")

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Token {api_key}",
                "Content-Type": "audio/webm",  # Adjust based on actual format
            }

            # Build query parameters
            params = {
                "model": effective_model,
                "language": effective_language,
                "smart_format": str(smart_format).lower(),
                "punctuate": "true",
                "diarize": "false",  # Single speaker for athlete conversations
                "utterances": "false",
                "detect_entities": str(detect_entities).lower(),
                "sentiment": str(detect_sentiment).lower(),
                "paragraphs": "true",
                # Custom keywords for sports psychology
                "keywords": "anxiety:2,confidence:2,mindfulness:2,visualization:2,pregame:2,performance:2",
            }

            url = f"{DEEPGRAM_API_URL}/listen"

            async with session.post(
                url,
                headers=headers,
                params=params,
                data=audio_data,
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Deepgram API error ({response.status}): {error_text}")

                result = await response.json()

                # Extract results
                channels = result.get("results", {}).get("channels", [])
                if not channels:
                    return {"transcript": "", "confidence": 0.0}

                alternatives = channels[0].get("alternatives", [])
                if not alternatives:
                    return {"transcript": "", "confidence": 0.0}

                best = alternatives[0]
                transcript = best.get("transcript", "")
                confidence = best.get("confidence", 0.0)

                # Extract entities if available
                entities = []
                if detect_entities:
                    entities = result.get("results", {}).get("entities", [])

                # Extract sentiment if available
                sentiment = None
                if detect_sentiment:
                    sentiment_data = result.get("results", {}).get("sentiments", {})
                    if sentiment_data:
                        # Get overall sentiment
                        segments = sentiment_data.get("segments", [])
                        if segments:
                            sentiments = [s.get("sentiment", "neutral") for s in segments]
                            # Simple majority vote
                            sentiment = max(set(sentiments), key=sentiments.count)

                logger.info(f"Deepgram transcript: {len(transcript)} chars, confidence={confidence:.2f}")

                return {
                    "transcript": transcript,
                    "confidence": confidence,
                    "entities": entities,
                    "sentiment": sentiment,
                    "words": best.get("words", []),
                }

    except aiohttp.ClientError as e:
        raise Exception(f"Deepgram network error: {str(e)}")
    except Exception as e:
        raise Exception(f"Deepgram transcription failed: {str(e)}")


async def transcribe_audio_stream_deepgram(
    audio_stream: AsyncGenerator[bytes, None],
    language: str = "en",
    model: Optional[str] = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream audio to Deepgram for real-time transcription.

    Uses Deepgram's WebSocket API for live streaming.

    Args:
        audio_stream: Async generator of audio chunks
        language: Language code
        model: Deepgram model

    Yields:
        Partial transcription results as they arrive
    """
    api_key = settings.DEEPGRAM_API_KEY
    if not api_key:
        raise Exception("DEEPGRAM_API_KEY not configured")

    effective_model = model or settings.DEEPGRAM_MODEL
    effective_language = language or settings.DEEPGRAM_LANGUAGE

    logger.info(f"Deepgram streaming STT: model={effective_model}")

    import websockets

    try:
        ws_url = (
            f"wss://api.deepgram.com/v1/listen"
            f"?model={effective_model}"
            f"&language={effective_language}"
            f"&smart_format=true"
            f"&punctuate=true"
            f"&interim_results=true"
        )

        headers = {"Authorization": f"Token {api_key}"}

        async with websockets.connect(ws_url, extra_headers=headers) as ws:
            # Task to send audio chunks
            async def send_audio():
                async for chunk in audio_stream:
                    await ws.send(chunk)
                # Send close message
                await ws.send(b"")

            # Task to receive transcripts
            async def receive_transcripts():
                async for message in ws:
                    try:
                        import json
                        result = json.loads(message)

                        if result.get("type") == "Results":
                            channel = result.get("channel", {})
                            alternatives = channel.get("alternatives", [])
                            if alternatives:
                                transcript = alternatives[0].get("transcript", "")
                                is_final = result.get("is_final", False)

                                yield {
                                    "transcript": transcript,
                                    "is_final": is_final,
                                    "confidence": alternatives[0].get("confidence", 0.0),
                                }
                    except Exception as e:
                        logger.warning(f"Error parsing Deepgram message: {e}")

            # Run send task in background
            send_task = asyncio.create_task(send_audio())

            # Yield transcripts as they arrive
            async for result in receive_transcripts():
                yield result

            await send_task

    except Exception as e:
        logger.error(f"Deepgram streaming error: {e}")
        raise Exception(f"Deepgram streaming failed: {str(e)}")


def detect_emotion_from_transcript(
    transcript: str,
    sentiment: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Detect emotional state from transcript content.

    Uses keyword analysis and sentiment to infer emotion.

    Args:
        transcript: The transcribed text
        sentiment: Optional Deepgram sentiment (positive, negative, neutral)

    Returns:
        Dictionary with detected emotion and confidence
    """
    text_lower = transcript.lower()

    # Emotion keywords
    emotion_patterns = {
        "anxiety": ["anxious", "nervous", "worried", "scared", "panic", "stress", "tense"],
        "sadness": ["sad", "down", "depressed", "upset", "disappointed", "failed"],
        "anger": ["angry", "frustrated", "mad", "annoyed", "pissed"],
        "excitement": ["excited", "pumped", "ready", "hyped", "motivated", "confident"],
        "fatigue": ["tired", "exhausted", "drained", "burned out", "worn out"],
        "calm": ["calm", "relaxed", "peaceful", "centered", "focused"],
    }

    # Count matches for each emotion
    emotion_scores = {}
    for emotion, keywords in emotion_patterns.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            emotion_scores[emotion] = score

    # Determine primary emotion
    if emotion_scores:
        primary_emotion = max(emotion_scores, key=emotion_scores.get)
        confidence = min(emotion_scores[primary_emotion] / 3, 1.0)
    else:
        # Use sentiment as fallback
        if sentiment == "positive":
            primary_emotion = "excitement"
            confidence = 0.4
        elif sentiment == "negative":
            primary_emotion = "anxiety"
            confidence = 0.4
        else:
            primary_emotion = "neutral"
            confidence = 0.3

    return {
        "emotion": primary_emotion,
        "confidence": confidence,
        "all_scores": emotion_scores,
        "sentiment": sentiment,
    }


async def get_deepgram_status() -> Dict[str, Any]:
    """
    Check Deepgram API status and configuration.

    Returns:
        Dictionary with status information
    """
    api_key = settings.DEEPGRAM_API_KEY
    if not api_key:
        return {"configured": False, "status": "API key not set"}

    try:
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Token {api_key}"}

            # Check API key validity with a simple request
            async with session.get(
                f"{DEEPGRAM_API_URL}/projects",
                headers=headers,
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "configured": True,
                        "status": "operational",
                        "model": settings.DEEPGRAM_MODEL,
                        "projects": len(data.get("projects", [])),
                    }
                else:
                    return {
                        "configured": True,
                        "status": "error",
                        "error": f"API returned {response.status}",
                    }

    except Exception as e:
        return {"configured": True, "status": "error", "error": str(e)}
