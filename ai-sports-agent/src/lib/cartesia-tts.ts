/**
 * Cartesia Text-to-Speech (TTS) Integration
 *
 * Provides high-quality voice synthesis using Cartesia's TTS API
 * with fallback to OpenAI TTS when needed.
 */

import Cartesia from '@cartesia/cartesia-js';

export class CartesiaTTS {
  private client: Cartesia.Client;
  private websocket: Cartesia.WebSocket | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.CARTESIA_API_KEY || process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '';

    if (!key) {
      console.warn('Cartesia API key not found. TTS will fail.');
    }

    this.client = new Cartesia.Client({
      apiKey: key,
    });
  }

  /**
   * Initialize WebSocket connection for streaming
   */
  async initialize() {
    if (this.websocket) {
      return; // Already initialized
    }

    this.websocket = await this.client.tts.websocket({
      container: 'raw',
      encoding: 'pcm_f32le',
      sampleRate: 44100,
    });
  }

  /**
   * Synthesize text to speech (non-streaming)
   * @param text - Text to convert to speech
   * @param voiceId - Voice ID to use (default: warm coach voice)
   * @returns Audio buffer
   */
  async synthesize(text: string, voiceId: string = '79a125e8-cd45-4c13-8a67-188112f4dd22'): Promise<ArrayBuffer> {
    try {
      if (!this.websocket) {
        await this.initialize();
      }

      const response = await this.websocket!.send({
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 44100,
        },
      });

      const audioChunks: Uint8Array[] = [];

      // Collect all audio chunks
      for await (const chunk of response.events('chunk')) {
        audioChunks.push(chunk.data);
      }

      // Concatenate all chunks into single buffer
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioBuffer = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of audioChunks) {
        audioBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      return audioBuffer.buffer;
    } catch (error) {
      console.error('Cartesia TTS synthesis error:', error);
      throw error;
    }
  }

  /**
   * Synthesize text to speech with streaming (for real-time playback)
   * @param text - Text to convert to speech
   * @param voiceId - Voice ID to use
   * @returns AsyncGenerator yielding audio chunks
   */
  async *synthesizeStream(text: string, voiceId: string = '79a125e8-cd45-4c13-8a67-188112f4dd22'): AsyncGenerator<Uint8Array> {
    try {
      if (!this.websocket) {
        await this.initialize();
      }

      const response = await this.websocket!.send({
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 44100,
        },
      });

      // Yield chunks as they arrive
      for await (const chunk of response.events('chunk')) {
        yield chunk.data;
      }
    } catch (error) {
      console.error('Cartesia TTS streaming error:', error);
      throw error;
    }
  }

  /**
   * Convert PCM Float32 to WAV format
   * @param pcmData - PCM audio data
   * @param sampleRate - Sample rate (default: 44100)
   * @returns WAV file as ArrayBuffer
   */
  convertToWav(pcmData: ArrayBuffer, sampleRate: number = 44100): ArrayBuffer {
    const pcmView = new Float32Array(pcmData);
    const numChannels = 1; // Mono
    const bitsPerSample = 16;

    // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
    const int16Data = new Int16Array(pcmView.length);
    for (let i = 0; i < pcmView.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmView[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Create WAV file
    const dataSize = int16Data.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const int16View = new Int16Array(buffer, 44);
    int16View.set(int16Data);

    return buffer;
  }

  /**
   * Close WebSocket connection
   */
  close() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    try {
      const voices = await this.client.voices.list();
      return voices;
    } catch (error) {
      console.error('Failed to list voices:', error);
      return [];
    }
  }
}

// Singleton instance
export const cartesiaTTS = new CartesiaTTS();

// Default voice IDs for different use cases
export const VOICE_IDS = {
  WARM_COACH: '79a125e8-cd45-4c13-8a67-188112f4dd22', // Friendly, supportive
  PROFESSIONAL: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Clear, professional
  CALM_FEMALE: '2ee87190-8f84-4925-97da-e52547f9462c', // Soothing, calming
  ENERGETIC: '71a7ad14-091c-4e8e-a314-022ece01c121', // Motivational, upbeat
};
