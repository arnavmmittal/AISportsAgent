/**
 * OpenAI Whisper Speech-to-Text Service
 *
 * Provides accurate speech transcription for voice chat
 * Uses OpenAI Whisper API with optimized settings for real-time conversation
 *
 * Audio Format Requirements:
 * - Format: M4A (AAC codec) or WEBM
 * - Sample Rate: 16kHz (optimized for speech)
 * - Channels: Mono
 * - Bitrate: 128kbps
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1';

export interface WhisperConfig {
  model?: 'whisper-1';
  language?: string; // e.g., 'en' for English
  prompt?: string; // Optional context to guide transcription
  temperature?: number; // 0-1, controls randomness (default: 0)
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface WhisperTranscription {
  text: string;
  duration?: number;
  language?: string;
  segments?: WhisperSegment[];
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Accepts audio data as ArrayBuffer (from AudioRecorder)
 */
export async function transcribeAudio(
  audioData: ArrayBuffer,
  config: WhisperConfig = {}
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    console.log('[Whisper] Transcribing', audioData.byteLength, 'bytes');

    // Create FormData for multipart upload
    const formData = new FormData();

    // Convert ArrayBuffer to Blob
    const audioBlob = new Blob([audioData], { type: 'audio/m4a' });

    // Append as file
    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', config.model || 'whisper-1');

    if (config.language) {
      formData.append('language', config.language);
    }

    if (config.prompt) {
      formData.append('prompt', config.prompt);
    }

    if (config.temperature !== undefined) {
      formData.append('temperature', config.temperature.toString());
    }

    formData.append('response_format', config.response_format || 'json');

    const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const transcript = result.text?.trim() || '';

    console.log('[Whisper] Transcription:', transcript);

    return transcript;
  } catch (error) {
    console.error('[Whisper] Transcription error:', error);
    throw error;
  }
}

/**
 * Transcribe audio with detailed information (segments, timestamps, etc.)
 */
export async function transcribeAudioVerbose(
  audioData: ArrayBuffer,
  config: Omit<WhisperConfig, 'response_format'> = {}
): Promise<WhisperTranscription> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    console.log('[Whisper] Transcribing (verbose)', audioData.byteLength, 'bytes');

    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: 'audio/m4a' });

    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', config.model || 'whisper-1');

    if (config.language) {
      formData.append('language', config.language);
    }

    if (config.prompt) {
      formData.append('prompt', config.prompt);
    }

    if (config.temperature !== undefined) {
      formData.append('temperature', config.temperature.toString());
    }

    formData.append('response_format', 'verbose_json');

    const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error (${response.status}): ${errorText}`);
    }

    const result: WhisperTranscription = await response.json();

    console.log('[Whisper] Transcription (verbose):', result.text);
    console.log('[Whisper] Duration:', result.duration, 'seconds');
    console.log('[Whisper] Segments:', result.segments?.length || 0);

    return result;
  } catch (error) {
    console.error('[Whisper] Verbose transcription error:', error);
    throw error;
  }
}

/**
 * Translate audio to English using Whisper API
 * Useful for multilingual athlete support
 */
export async function translateAudio(
  audioData: ArrayBuffer,
  config: Omit<WhisperConfig, 'language'> = {}
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    console.log('[Whisper] Translating', audioData.byteLength, 'bytes');

    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: 'audio/m4a' });

    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', config.model || 'whisper-1');

    if (config.prompt) {
      formData.append('prompt', config.prompt);
    }

    if (config.temperature !== undefined) {
      formData.append('temperature', config.temperature.toString());
    }

    formData.append('response_format', config.response_format || 'json');

    const response = await fetch(`${OPENAI_API_URL}/audio/translations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const translation = result.text?.trim() || '';

    console.log('[Whisper] Translation:', translation);

    return translation;
  } catch (error) {
    console.error('[Whisper] Translation error:', error);
    throw error;
  }
}

/**
 * Recommended Whisper configuration for sports psychology conversations
 */
export const WHISPER_PRESETS = {
  // Default: balanced accuracy and speed
  default: {
    model: 'whisper-1' as const,
    language: 'en',
    temperature: 0, // Deterministic for consistency
  },
  // High accuracy: for important conversations (goal setting, crisis)
  highAccuracy: {
    model: 'whisper-1' as const,
    language: 'en',
    temperature: 0,
    prompt: 'Sports psychology coaching conversation about mental performance, goals, anxiety, and stress management.',
  },
  // Multilingual: for international athletes
  multilingual: {
    model: 'whisper-1' as const,
    // Don't specify language - let Whisper auto-detect
    temperature: 0,
  },
} as const;

export type WhisperPreset = keyof typeof WHISPER_PRESETS;
