/**
 * ElevenLabs Text-to-Speech Service
 *
 * Provides high-quality, natural-sounding voice synthesis for AI coach responses
 * Uses ElevenLabs API with Rachel voice (warm, professional female voice)
 *
 * Configuration:
 * - Voice: Rachel (EXAVITQu4vr4xnSDxMaL) - warm, clear, professional
 * - Model: eleven_multilingual_v2 - high quality, natural
 * - Format: MP3 - compatible with mobile playback
 */

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs - see ELEVENLABS_SETUP.md for full list
const VOICES = {
  rachel: 'EXAVITQu4vr4xnSDxMaL', // Default: warm, clear, professional (female)
  domi: 'AZnzlk1XvdvUeBnXmlld', // Energetic, confident (female)
  bella: 'EXAVITQu4vr4xnSDxMaL', // Soft, empathetic (female)
  elli: 'MF3mGyEYCl7XYWbV9V6O', // Calm, soothing (female)
  adam: 'pNInz6obpgDQGcFmaJgB', // Deep, authoritative (male)
  antoni: 'ErXwobaYiN019PkySvjV', // Warm, encouraging (male)
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Energetic, motivational (male)
  arnold: 'VR6AewLTigWG4xSOukaG', // Strong, confident (male)
};

export interface ElevenLabsConfig {
  voiceId?: keyof typeof VOICES | string;
  modelId?: string;
  stability?: number; // 0.0-1.0: higher = more consistent, lower = more expressive
  similarityBoost?: number; // 0.0-1.0: how much to match original voice
  style?: number; // 0.0-1.0: speaking style intensity
  useSpeakerBoost?: boolean; // Enhance clarity (recommended)
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

/**
 * Convert text to speech using ElevenLabs API
 * Returns audio data as ArrayBuffer (MP3 format)
 */
export async function textToSpeech(
  text: string,
  config: ElevenLabsConfig = {}
): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  // Default configuration optimized for coaching
  const voiceId =
    typeof config.voiceId === 'string' && config.voiceId in VOICES
      ? VOICES[config.voiceId as keyof typeof VOICES]
      : config.voiceId || VOICES.rachel;

  const voiceSettings: VoiceSettings = {
    stability: config.stability ?? 0.5, // Balanced
    similarity_boost: config.similarityBoost ?? 0.75,
    style: config.style ?? 0.5,
    use_speaker_boost: config.useSpeakerBoost ?? true,
  };

  const modelId = config.modelId || 'eleven_multilingual_v2';

  try {
    console.log('[ElevenLabs] Generating TTS for text:', text.substring(0, 50) + '...');
    console.log('[ElevenLabs] Voice:', voiceId, 'Model:', modelId);

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const audioData = await response.arrayBuffer();
    console.log('[ElevenLabs] Generated audio:', audioData.byteLength, 'bytes');

    return audioData;
  } catch (error) {
    console.error('[ElevenLabs] TTS error:', error);
    throw error;
  }
}

/**
 * Stream text to speech using ElevenLabs API
 * Returns async generator that yields audio chunks as they're received
 */
export async function* streamTextToSpeech(
  text: string,
  config: ElevenLabsConfig = {}
): AsyncGenerator<Uint8Array, void, unknown> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const voiceId =
    typeof config.voiceId === 'string' && config.voiceId in VOICES
      ? VOICES[config.voiceId as keyof typeof VOICES]
      : config.voiceId || VOICES.rachel;

  const voiceSettings: VoiceSettings = {
    stability: config.stability ?? 0.5,
    similarity_boost: config.similarityBoost ?? 0.75,
    style: config.style ?? 0.5,
    use_speaker_boost: config.useSpeakerBoost ?? true,
  };

  const modelId = config.modelId || 'eleven_multilingual_v2';

  try {
    console.log('[ElevenLabs] Streaming TTS for text:', text.substring(0, 50) + '...');

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }

    console.log('[ElevenLabs] Streaming complete');
  } catch (error) {
    console.error('[ElevenLabs] Streaming TTS error:', error);
    throw error;
  }
}

/**
 * Get list of available voices
 */
export function getAvailableVoices(): typeof VOICES {
  return VOICES;
}

/**
 * Voice presets for different conversation contexts
 */
export const VOICE_PRESETS = {
  // For general coaching conversations
  default: {
    voiceId: 'rachel' as const,
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
  },
  // For crisis/anxiety support - calm, reassuring
  crisis: {
    voiceId: 'elli' as const,
    stability: 0.7, // Very stable, reassuring
    similarityBoost: 0.75,
    style: 0.3, // Less dramatic, more neutral
    useSpeakerBoost: true,
  },
  // For motivation/performance talks - energetic, inspiring
  motivation: {
    voiceId: 'domi' as const,
    stability: 0.3, // More expressive
    similarityBoost: 0.75,
    style: 0.8, // Very expressive
    useSpeakerBoost: true,
  },
  // For instructions/techniques - clear, factual
  instruction: {
    voiceId: 'rachel' as const,
    stability: 0.8, // Very consistent
    similarityBoost: 0.75,
    style: 0.2, // Neutral tone
    useSpeakerBoost: true,
  },
} as const;

export type VoicePreset = keyof typeof VOICE_PRESETS;
