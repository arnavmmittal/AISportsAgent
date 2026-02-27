/**
 * ElevenLabs Text-to-Speech Service
 *
 * Provides high-quality, natural-sounding voice synthesis for AI coach responses.
 * Called via /api/voice/synthesize endpoint.
 *
 * Configuration:
 * - Voice: Rachel (EXAVITQu4vr4xnSDxMaL) - warm, clear, professional
 * - Model: eleven_multilingual_v2 - high quality, natural
 * - Format: MP3 - compatible with web playback
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs - see https://elevenlabs.io/docs/voices for full list
export const VOICES = {
  rachel: 'EXAVITQu4vr4xnSDxMaL', // Default: warm, clear, professional (female)
  domi: 'AZnzlk1XvdvUeBnXmlld', // Energetic, confident (female)
  bella: 'EXAVITQu4vr4xnSDxMaL', // Soft, empathetic (female)
  elli: 'MF3mGyEYCl7XYWbV9V6O', // Calm, soothing (female)
  adam: 'pNInz6obpgDQGcFmaJgB', // Deep, authoritative (male)
  antoni: 'ErXwobaYiN019PkySvjV', // Warm, encouraging (male)
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Energetic, motivational (male)
  arnold: 'VR6AewLTigWG4xSOukaG', // Strong, confident (male)
} as const;

export type VoiceId = keyof typeof VOICES;

export interface ElevenLabsConfig {
  voiceId?: VoiceId | string;
  modelId?: string;
  stability?: number; // 0.0-1.0: higher = more consistent, lower = more expressive
  similarityBoost?: number; // 0.0-1.0: how much to match original voice
  style?: number; // 0.0-1.0: speaking style intensity
  useSpeakerBoost?: boolean; // Enhance clarity (recommended)
  speed?: number; // 0.25-4.0: speaking speed (1.0 = normal, 1.2 = 20% faster)
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
 *
 * NOTE: This is called from server-side API routes, not client-side
 */
export async function textToSpeech(
  text: string,
  apiKey: string,
  config: ElevenLabsConfig = {}
): Promise<ArrayBuffer> {
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not provided');
  }

  // Default configuration optimized for coaching
  const voiceId =
    typeof config.voiceId === 'string' && config.voiceId in VOICES
      ? VOICES[config.voiceId as VoiceId]
      : config.voiceId || VOICES.rachel;

  const voiceSettings: VoiceSettings = {
    stability: config.stability ?? 0.35, // Lower = more natural/casual
    similarity_boost: config.similarityBoost ?? 0.7,
    style: config.style ?? 0.4, // Lower = more conversational
    use_speaker_boost: config.useSpeakerBoost ?? true,
  };

  // Use turbo model for faster generation (2-3x faster than multilingual)
  const modelId = config.modelId || 'eleven_turbo_v2_5';

  // Speed: 1.15 = 15% faster, sounds more natural/energetic
  const speed = config.speed ?? 1.15;

  try {
    console.log('[ElevenLabs] Generating TTS for text:', text.substring(0, 50) + '...');
    console.log('[ElevenLabs] Voice:', voiceId, 'Model:', modelId);

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
        speed, // 1.15 = slightly faster, more natural
      }),
    });

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
  apiKey: string,
  config: ElevenLabsConfig = {}
): AsyncGenerator<Uint8Array, void, unknown> {
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not provided');
  }

  const voiceId =
    typeof config.voiceId === 'string' && config.voiceId in VOICES
      ? VOICES[config.voiceId as VoiceId]
      : config.voiceId || VOICES.rachel;

  const voiceSettings: VoiceSettings = {
    stability: config.stability ?? 0.35,
    similarity_boost: config.similarityBoost ?? 0.7,
    style: config.style ?? 0.4,
    use_speaker_boost: config.useSpeakerBoost ?? true,
  };

  const modelId = config.modelId || 'eleven_turbo_v2_5';
  const speed = config.speed ?? 1.15;

  try {
    console.log('[ElevenLabs] Streaming TTS for text:', text.substring(0, 50) + '...');

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
        speed,
      }),
    });

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
  // For general coaching conversations - casual, friendly
  default: {
    voiceId: 'rachel' as VoiceId,
    stability: 0.35, // Lower = more natural variation
    similarityBoost: 0.7,
    style: 0.4, // Conversational
    useSpeakerBoost: true,
    speed: 1.15, // Slightly faster = more natural
  },
  // For crisis/anxiety support - calm, reassuring
  calm: {
    voiceId: 'elli' as VoiceId,
    stability: 0.5, // Stable but not robotic
    similarityBoost: 0.7,
    style: 0.25,
    useSpeakerBoost: true,
    speed: 1.0, // Normal speed for calm delivery
  },
  // For motivation/performance talks - energetic, inspiring
  motivation: {
    voiceId: 'domi' as VoiceId,
    stability: 0.25, // Very expressive
    similarityBoost: 0.7,
    style: 0.7,
    useSpeakerBoost: true,
    speed: 1.2, // Faster = more energetic
  },
  // For instructions/techniques - clear, casual
  instruction: {
    voiceId: 'rachel' as VoiceId,
    stability: 0.5,
    similarityBoost: 0.7,
    style: 0.3,
    useSpeakerBoost: true,
    speed: 1.1,
  },
  // Supportive/empathetic tone - warm, casual
  supportive: {
    voiceId: 'rachel' as VoiceId,
    stability: 0.35,
    similarityBoost: 0.7,
    style: 0.35,
    useSpeakerBoost: true,
    speed: 1.1,
  },
  // Encouraging tone - upbeat, friendly
  encouraging: {
    voiceId: 'antoni' as VoiceId,
    stability: 0.3,
    similarityBoost: 0.75,
    style: 0.55,
    useSpeakerBoost: true,
    speed: 1.15,
  },
} as const;

export type VoicePreset = keyof typeof VOICE_PRESETS;

/**
 * Select appropriate voice preset based on content/emotion
 */
export function selectVoicePreset(
  text: string,
  detectedEmotion?: string
): ElevenLabsConfig {
  // Keywords that suggest different emotional contexts
  const anxietyKeywords = ['anxious', 'nervous', 'worried', 'scared', 'panic', 'stress'];
  const motivationKeywords = [
    'excited',
    'motivated',
    'confident',
    'ready',
    'pumped',
    "let's go",
  ];
  const recoveryKeywords = ['tired', 'rest', 'recover', 'sleep', 'injury', 'pain'];

  const textLower = text.toLowerCase();

  // Use detected emotion if provided
  if (detectedEmotion) {
    const emotionMapping: Record<string, VoicePreset> = {
      anxiety: 'calm',
      sadness: 'supportive',
      excitement: 'encouraging',
      neutral: 'default',
    };
    const preset = emotionMapping[detectedEmotion] || 'default';
    return VOICE_PRESETS[preset];
  }

  // Keyword-based selection
  if (anxietyKeywords.some((kw) => textLower.includes(kw))) {
    return VOICE_PRESETS.calm;
  }
  if (motivationKeywords.some((kw) => textLower.includes(kw))) {
    return VOICE_PRESETS.motivation;
  }
  if (recoveryKeywords.some((kw) => textLower.includes(kw))) {
    return VOICE_PRESETS.calm;
  }

  // Default to supportive
  return VOICE_PRESETS.supportive;
}
