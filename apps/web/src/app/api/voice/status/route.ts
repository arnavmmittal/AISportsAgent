import { NextResponse } from 'next/server';
import { VOICES, VOICE_PRESETS } from '@/lib/voice/elevenlabs';

/**
 * GET /api/voice/status
 *
 * Get voice service status and configuration
 */
export async function GET() {
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: elevenlabsKey && openaiKey ? 'healthy' : 'partial',
    tts: {
      provider: 'elevenlabs',
      available: !!elevenlabsKey,
      voices: Object.keys(VOICES),
      presets: Object.keys(VOICE_PRESETS),
    },
    stt: {
      provider: 'openai-whisper',
      available: !!openaiKey,
      supported_formats: ['webm', 'mp3', 'mp4', 'm4a', 'wav', 'ogg'],
    },
  });
}
