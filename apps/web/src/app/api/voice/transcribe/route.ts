import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import OpenAI from 'openai';

/**
 * POST /api/voice/transcribe
 *
 * Transcribe audio to text using OpenAI Whisper
 * Accepts audio file as FormData
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) {
      return response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const detectEmotion = formData.get('detect_emotion') === 'true';
    const language = formData.get('language') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Validate file size (max 25MB per OpenAI limits)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    console.log('[Voice API] Transcribing audio:', file.name, file.size, 'bytes');

    // Convert File to the format OpenAI expects
    // For edge/serverless environments, we need to convert the File to a proper format
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI
    const audioFile = new File([buffer], file.name || 'audio.webm', {
      type: file.type || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined,
      response_format: 'verbose_json',
    });

    console.log('[Voice API] Transcription complete:', transcription.text.substring(0, 50) + '...');

    // Basic emotion detection from transcribed text (can be enhanced)
    let emotion = undefined;
    if (detectEmotion && transcription.text) {
      emotion = detectEmotionFromText(transcription.text);
    }

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
      confidence: 1.0, // Whisper doesn't provide confidence scores
      emotion: emotion,
    });
  } catch (error) {
    console.error('[Voice API] Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}

/**
 * Simple emotion detection from transcribed text
 * This is a basic implementation - can be enhanced with ML models
 */
function detectEmotionFromText(text: string): { detected: string; confidence: number } {
  const textLower = text.toLowerCase();

  // Emotion indicators with associated keywords
  const emotionPatterns: Record<string, string[]> = {
    anxiety: [
      'worried', 'anxious', 'nervous', 'stressed', 'scared',
      'panic', 'overwhelmed', 'afraid', "can't stop thinking"
    ],
    sadness: [
      'sad', 'down', 'depressed', 'hopeless', 'disappointed',
      'hurt', 'lonely', 'empty', 'lost'
    ],
    frustration: [
      'frustrated', 'annoyed', 'angry', 'mad', 'irritated',
      'fed up', 'sick of', "can't believe"
    ],
    excitement: [
      'excited', 'happy', 'thrilled', 'pumped', 'amazing',
      "can't wait", 'awesome', 'great', 'fantastic'
    ],
    confidence: [
      'confident', 'ready', 'prepared', 'focused', 'strong',
      'got this', 'believe', 'determined'
    ],
    fatigue: [
      'tired', 'exhausted', 'drained', 'burned out', 'no energy',
      'worn out', 'fatigued'
    ],
  };

  // Count matches for each emotion
  const scores: Record<string, number> = {};

  for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
    scores[emotion] = keywords.filter(kw => textLower.includes(kw)).length;
  }

  // Find the emotion with highest score
  let maxEmotion = 'neutral';
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }

  // Calculate confidence (0.3 base + 0.1 per keyword match, max 0.9)
  const confidence = maxScore > 0 ? Math.min(0.3 + maxScore * 0.15, 0.9) : 0.3;

  return {
    detected: maxEmotion,
    confidence,
  };
}

/**
 * GET /api/voice/transcribe
 *
 * Health check for STT service
 */
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: apiKey ? 'available' : 'not_configured',
    provider: 'openai-whisper',
    supported_formats: ['webm', 'mp3', 'mp4', 'm4a', 'wav', 'ogg'],
    max_file_size: '25MB',
  });
}
