/**
 * VoiceManager - Handles voice input/output for athlete chat interface
 *
 * Features:
 * - Browser MediaRecorder for audio capture
 * - Voice Activity Detection (VAD)
 * - WebSocket streaming to backend
 * - Audio playback from TTS responses
 *
 * Flow:
 * 1. User clicks mic button → startRecording()
 * 2. Audio chunks sent to backend via WebSocket
 * 3. Backend: Whisper transcription → AthleteAgent → Cartesia TTS
 * 4. Audio chunks streamed back → playAudioStream()
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceConfig {
  sampleRate?: number;
  channelCount?: number;
  chunkDurationMs?: number;
  silenceThresholdMs?: number;
  silenceThreshold?: number;
}

export interface AudioChunk {
  data: Blob;
  timestamp: number;
}

export class VoiceManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;

  private state: VoiceState = 'idle';
  private config: Required<VoiceConfig>;

  // Audio playback queue
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;

  // Silence detection
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastSoundTime: number = Date.now();

  // Callbacks
  private onStateChange?: (state: VoiceState) => void;
  private onAudioChunk?: (chunk: AudioChunk) => void;
  private onTranscript?: (text: string, isFinal: boolean) => void;
  private onSilenceDetected?: () => void;
  private onError?: (error: Error) => void;
  private onVolumeChange?: (volume: number) => void;

  constructor(config: VoiceConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate || 16000,
      channelCount: config.channelCount || 1,
      chunkDurationMs: config.chunkDurationMs || 1000, // 1 second chunks
      silenceThresholdMs: config.silenceThresholdMs || 2000, // 2 seconds of silence
      silenceThreshold: config.silenceThreshold || 0.01, // Volume threshold
    };
  }

  /**
   * Initialize audio context and request microphone permission
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context for analysis
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
      this.audioSource = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.audioSource.connect(this.analyser);

      this.setState('idle');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize audio');
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<void> {
    if (!this.stream) {
      await this.initialize();
    }

    if (!this.stream) {
      throw new Error('No audio stream available');
    }

    try {
      // Determine the best MIME type
      const mimeType = this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      // Collect audio chunks
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          const chunk: AudioChunk = {
            data: event.data,
            timestamp: Date.now(),
          };
          this.onAudioChunk?.(chunk);
        }
      };

      this.mediaRecorder.onerror = (event: Event) => {
        this.handleError(new Error('MediaRecorder error'));
      };

      this.mediaRecorder.onstop = () => {
        this.setState('processing');
      };

      // Start recording with time slices for streaming
      this.mediaRecorder.start(this.config.chunkDurationMs);
      this.setState('listening');

      // Start silence detection
      this.startSilenceDetection();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stopSilenceDetection();
    }
  }

  /**
   * Voice Activity Detection - detect when user stops speaking
   */
  private startSilenceDetection(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!this.analyser || this.state !== 'listening') {
        return;
      }

      this.analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Emit volume for visualizations
      this.onVolumeChange?.(rms);

      // Check if speaking
      if (rms > this.config.silenceThreshold) {
        this.lastSoundTime = Date.now();
      }

      // Check for silence
      const silenceDuration = Date.now() - this.lastSoundTime;
      if (silenceDuration > this.config.silenceThresholdMs) {
        this.onSilenceDetected?.();
        this.stopRecording();
        return;
      }

      // Continue checking
      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  private stopSilenceDetection(): void {
    if (this.silenceTimer) {
      clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Play audio stream from TTS response
   */
  async playAudioStream(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.audioQueue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to decode audio');
      this.handleError(err);
    }
  }

  private playNextInQueue(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.setState('idle');
      return;
    }

    if (!this.audioContext) return;

    this.isPlaying = true;
    this.setState('speaking');

    const audioBuffer = this.audioQueue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.playNextInQueue();
    };

    source.start(0);
  }

  /**
   * Stop audio playback
   */
  stopPlayback(): void {
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.audioContext) {
      this.audioContext.suspend();
    }
    this.setState('idle');
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopRecording();
    this.stopPlayback();
    this.stopSilenceDetection();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.audioSource = null;
    this.analyser = null;
  }

  /**
   * State management
   */
  private setState(newState: VoiceState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  getState(): VoiceState {
    return this.state;
  }

  private handleError(error: Error): void {
    this.setState('error');
    this.onError?.(error);
  }

  /**
   * Register callbacks
   */
  on(event: 'stateChange', callback: (state: VoiceState) => void): void;
  on(event: 'audioChunk', callback: (chunk: AudioChunk) => void): void;
  on(event: 'transcript', callback: (text: string, isFinal: boolean) => void): void;
  on(event: 'silenceDetected', callback: () => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'volumeChange', callback: (volume: number) => void): void;
  on(event: string, callback: (...args: any[]) => void): void {
    switch (event) {
      case 'stateChange':
        this.onStateChange = callback;
        break;
      case 'audioChunk':
        this.onAudioChunk = callback;
        break;
      case 'transcript':
        this.onTranscript = callback;
        break;
      case 'silenceDetected':
        this.onSilenceDetected = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
      case 'volumeChange':
        this.onVolumeChange = callback;
        break;
    }
  }
}
