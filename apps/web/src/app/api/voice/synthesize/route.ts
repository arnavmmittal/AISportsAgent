import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { textToSpeech, selectVoicePreset, VOICE_PRESETS, type VoicePreset } from '@/lib/voice/elevenlabs';

/**
 * POST /api/voice/synthesize
 *
 * Synthesize text to speech using ElevenLabs
 * Returns audio data as MP3 blob
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) {
      return response;
    }

    const body = await request.json();
    const { text, voice_id, emotional_context, preset } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Determine voice configuration
    let config;
    if (preset && preset in VOICE_PRESETS) {
      config = VOICE_PRESETS[preset as VoicePreset];
    } else if (emotional_context) {
      config = selectVoicePreset(text, emotional_context);
    } else {
      config = selectVoicePreset(text);
    }

    // Override voice_id if provided
    if (voice_id) {
      config = { ...config, voiceId: voice_id };
    }

    console.log('[Voice API] Synthesizing text:', text.substring(0, 50) + '...');

    const audioBuffer = await textToSpeech(text, apiKey, config);

    // Return audio as blob response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[Voice API] Synthesis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Synthesis failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/synthesize
 *
 * Health check for TTS service
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  return NextResponse.json({
    status: apiKey ? 'available' : 'not_configured',
    provider: 'elevenlabs',
    voices: Object.keys(VOICE_PRESETS),
  });
}
