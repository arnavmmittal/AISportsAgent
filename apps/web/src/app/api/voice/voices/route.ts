import { NextResponse } from 'next/server';
import { VOICES, VOICE_PRESETS } from '@/lib/voice/elevenlabs';

/**
 * GET /api/voice/voices
 *
 * Get available voices and presets
 */
export async function GET() {
  // Voice descriptions for the UI
  const voiceDescriptions: Record<string, { name: string; description: string; gender: string }> = {
    rachel: { name: 'Rachel', description: 'Warm, clear, professional', gender: 'female' },
    domi: { name: 'Domi', description: 'Energetic, confident', gender: 'female' },
    bella: { name: 'Bella', description: 'Soft, empathetic', gender: 'female' },
    elli: { name: 'Elli', description: 'Calm, soothing', gender: 'female' },
    adam: { name: 'Adam', description: 'Deep, authoritative', gender: 'male' },
    antoni: { name: 'Antoni', description: 'Warm, encouraging', gender: 'male' },
    josh: { name: 'Josh', description: 'Energetic, motivational', gender: 'male' },
    arnold: { name: 'Arnold', description: 'Strong, confident', gender: 'male' },
  };

  // Preset descriptions for the UI
  const presetDescriptions: Record<string, { name: string; description: string; useCase: string }> = {
    default: {
      name: 'Default',
      description: 'Balanced tone for general coaching',
      useCase: 'Daily check-ins, general conversations',
    },
    calm: {
      name: 'Calm',
      description: 'Stable, reassuring voice',
      useCase: 'Anxiety support, crisis moments',
    },
    motivation: {
      name: 'Motivation',
      description: 'Energetic, inspiring delivery',
      useCase: 'Pre-game talks, performance boosts',
    },
    instruction: {
      name: 'Instruction',
      description: 'Clear, factual tone',
      useCase: 'Teaching techniques, explaining concepts',
    },
    supportive: {
      name: 'Supportive',
      description: 'Empathetic, understanding',
      useCase: 'Processing setbacks, emotional support',
    },
    encouraging: {
      name: 'Encouraging',
      description: 'Uplifting, positive energy',
      useCase: 'Building confidence, celebrating wins',
    },
  };

  return NextResponse.json({
    voices: Object.entries(VOICES).map(([key, id]) => ({
      voice_id: id,
      key,
      ...voiceDescriptions[key],
    })),
    presets: Object.entries(VOICE_PRESETS).map(([key, config]) => ({
      key,
      voice_id: VOICES[config.voiceId as keyof typeof VOICES],
      ...presetDescriptions[key],
      settings: {
        stability: config.stability,
        similarity_boost: config.similarityBoost,
        style: config.style,
      },
    })),
  });
}
