/**
 * Voice Client
 *
 * Client-side utilities for voice features (TTS and STT).
 * Calls local Next.js API routes:
 * - /api/voice/synthesize - ElevenLabs TTS
 * - /api/voice/transcribe - OpenAI Whisper STT
 * - /api/voice/voices - Available voices and presets
 */

export interface VoiceSynthesizeRequest {
  text: string;
  voice_id?: string;
  emotional_context?: 'supportive' | 'calm' | 'encouraging' | 'professional' | 'motivation';
  preset?: 'default' | 'calm' | 'motivation' | 'instruction' | 'supportive' | 'encouraging';
}

export interface VoiceTranscribeResponse {
  text: string;
  language?: string;
  duration?: number;
  confidence: number;
  emotion?: {
    detected: string;
    confidence: number;
  };
}

export interface VoiceStatusResponse {
  status: string;
  tts: {
    provider: string;
    available: boolean;
    voices: string[];
    presets: string[];
  };
  stt: {
    provider: string;
    available: boolean;
    supported_formats: string[];
  };
}

export interface VoiceInfo {
  voice_id: string;
  key: string;
  name: string;
  description: string;
  gender: string;
}

export interface VoicePresetInfo {
  key: string;
  voice_id: string;
  name: string;
  description: string;
  useCase: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
  };
}

/**
 * Synthesize text to speech
 * Returns audio as Blob (MP3)
 */
export async function synthesizeSpeech(request: VoiceSynthesizeRequest): Promise<Blob> {
  const response = await fetch('/api/voice/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Synthesis failed' }));
    throw new Error(error.error || `Synthesis failed: ${response.status}`);
  }

  return response.blob();
}

/**
 * Transcribe audio to text
 * Accepts audio Blob and returns transcription with optional emotion detection
 */
export async function transcribeAudio(
  audio: Blob,
  options: { detectEmotion?: boolean; language?: string } = {}
): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  formData.append('file', audio, 'audio.webm');

  if (options.detectEmotion) {
    formData.append('detect_emotion', 'true');
  }
  if (options.language) {
    formData.append('language', options.language);
  }

  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(error.error || `Transcription failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get voice service status
 */
export async function getVoiceStatus(): Promise<VoiceStatusResponse> {
  const response = await fetch('/api/voice/status');

  if (!response.ok) {
    throw new Error(`Failed to get voice status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get available voices and presets
 */
export async function getAvailableVoices(): Promise<{
  voices: VoiceInfo[];
  presets: VoicePresetInfo[];
}> {
  const response = await fetch('/api/voice/voices');

  if (!response.ok) {
    throw new Error(`Failed to get voices: ${response.status}`);
  }

  return response.json();
}

/**
 * Play audio blob through the browser
 * Returns a promise that resolves when playback completes
 */
export function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch((e) => {
      URL.revokeObjectURL(url);
      reject(e);
    });
  });
}

/**
 * Convert Blob to ArrayBuffer for use with VoiceManager
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Speak text and return when done
 * Convenience function that synthesizes and plays audio
 */
export async function speakText(
  text: string,
  options: Omit<VoiceSynthesizeRequest, 'text'> = {}
): Promise<void> {
  const audioBlob = await synthesizeSpeech({ text, ...options });
  await playAudioBlob(audioBlob);
}
