/**
 * Cartesia Speech-to-Text (STT) Integration
 *
 * Provides real-time speech transcription using Cartesia's Sonic API
 * with fallback to OpenAI Whisper when needed.
 */

export class CartesiaSTT {
  private apiKey: string;
  private baseUrl = 'https://api.cartesia.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CARTESIA_API_KEY || process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Cartesia API key not found. Transcription will fail.');
    }
  }

  /**
   * Transcribe audio blob to text
   * @param audioBlob - Audio file as Blob
   * @returns Transcribed text
   */
  async transcribe(audioBlob: Blob): Promise<string> {
    try {
      // Convert Blob to FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', 'sonic-english-latest');
      formData.append('language', 'en');

      const response = await fetch(`${this.baseUrl}/stt/transcribe`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cartesia STT failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.text || data.transcript || '';
    } catch (error) {
      console.error('Cartesia STT transcription error:', error);
      throw error;
    }
  }

  /**
   * Stream transcription with partial results (for real-time display)
   * @param audioStream - MediaStream from microphone
   * @returns AsyncGenerator yielding partial transcripts
   */
  async *transcribeStream(audioStream: MediaStream): AsyncGenerator<string> {
    try {
      // Create WebSocket connection for streaming
      const ws = new WebSocket(`wss://api.cartesia.ai/stt/stream`);

      ws.onopen = () => {
        // Send auth
        ws.send(JSON.stringify({
          type: 'auth',
          apiKey: this.apiKey,
        }));

        // Configure transcription
        ws.send(JSON.stringify({
          type: 'config',
          model: 'sonic-english-latest',
          language: 'en',
          partialResults: true,
        }));
      };

      // Set up MediaRecorder to send audio chunks
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          // Convert blob to base64 and send
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            ws.send(JSON.stringify({
              type: 'audio',
              data: base64,
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      // Start recording in chunks
      mediaRecorder.start(250); // Send chunks every 250ms

      // Listen for transcription results
      for await (const message of this.getWebSocketMessages(ws)) {
        const data = JSON.parse(message);

        if (data.type === 'transcript') {
          yield data.text;
        } else if (data.type === 'partial') {
          yield data.text;
        } else if (data.type === 'error') {
          throw new Error(`Streaming error: ${data.message}`);
        }
      }

      // Cleanup
      mediaRecorder.stop();
      ws.close();
    } catch (error) {
      console.error('Cartesia STT streaming error:', error);
      throw error;
    }
  }

  /**
   * Helper to convert WebSocket messages to async generator
   */
  private async *getWebSocketMessages(ws: WebSocket): AsyncGenerator<string> {
    const queue: string[] = [];
    let resolve: ((value: string) => void) | null = null;
    let closed = false;

    ws.onmessage = (event) => {
      if (resolve) {
        resolve(event.data);
        resolve = null;
      } else {
        queue.push(event.data);
      }
    };

    ws.onclose = () => {
      closed = true;
      if (resolve) {
        resolve('');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      closed = true;
      if (resolve) {
        resolve('');
      }
    };

    while (!closed || queue.length > 0) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        const message = await new Promise<string>((res) => {
          resolve = res;
        });
        if (message) {
          yield message;
        }
      }
    }
  }

  /**
   * Check if Cartesia API is configured and available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Cartesia health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const cartesiaSTT = new CartesiaSTT();
