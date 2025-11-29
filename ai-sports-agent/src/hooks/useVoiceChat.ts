import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceManager, VoiceState, AudioChunk } from '@/lib/voice/VoiceManager';

export interface UseVoiceChatOptions {
  sessionId: string;
  athleteId: string;
  backendUrl?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceChatReturn {
  voiceState: VoiceState;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  volume: number;
  transcript: string;
  error: Error | null;
  startVoice: () => Promise<void>;
  stopVoice: () => void;
  toggleVoice: () => Promise<void>;
}

/**
 * React hook for voice chat integration
 *
 * Usage:
 * ```tsx
 * const {
 *   voiceState,
 *   isListening,
 *   volume,
 *   transcript,
 *   startVoice,
 *   stopVoice,
 * } = useVoiceChat({
 *   sessionId: 'session-123',
 *   athleteId: 'athlete-456',
 *   onResponse: (text) => console.log('AI response:', text),
 * });
 * ```
 */
export function useVoiceChat(options: UseVoiceChatOptions): UseVoiceChatReturn {
  const {
    sessionId,
    athleteId,
    backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    onTranscript,
    onResponse,
    onError,
  } = options;

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize VoiceManager
  useEffect(() => {
    voiceManagerRef.current = new VoiceManager({
      sampleRate: 16000,
      channelCount: 1,
      chunkDurationMs: 1000,
      silenceThresholdMs: 2000,
      silenceThreshold: 0.01,
    });

    const vm = voiceManagerRef.current;

    // Register callbacks
    vm.on('stateChange', (state) => {
      setVoiceState(state);
    });

    vm.on('volumeChange', (vol) => {
      setVolume(vol);
    });

    vm.on('transcript', (text, isFinal) => {
      setTranscript(text);
      onTranscript?.(text, isFinal);
    });

    vm.on('error', (err) => {
      setError(err);
      onError?.(err);
    });

    vm.on('audioChunk', (chunk) => {
      // Send audio chunk to backend via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendAudioChunk(chunk);
      }
    });

    vm.on('silenceDetected', () => {
      // User stopped speaking - signal backend that utterance is complete
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'utterance_end',
          sessionId,
          athleteId,
        }));
      }
    });

    return () => {
      vm.destroy();
      wsRef.current?.close();
    };
  }, [sessionId, athleteId, onTranscript, onError]);

  /**
   * Send audio chunk to backend via WebSocket
   */
  const sendAudioChunk = useCallback(async (chunk: AudioChunk) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await chunk.data.arrayBuffer();

      // Send binary data
      wsRef.current.send(arrayBuffer);
    } catch (err) {
      console.error('Failed to send audio chunk:', err);
    }
  }, []);

  /**
   * Connect to WebSocket for bidirectional voice streaming
   */
  const connectWebSocket = useCallback(() => {
    // Convert http(s) to ws(s)
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/api/voice/stream';

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Voice WebSocket connected');

      // Send initial handshake
      wsRef.current?.send(JSON.stringify({
        type: 'start',
        sessionId,
        athleteId,
      }));
    };

    wsRef.current.onmessage = async (event) => {
      try {
        // Handle text messages (transcripts, responses)
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'transcript':
              // Partial transcript from Whisper
              setTranscript(data.text);
              onTranscript?.(data.text, data.isFinal);
              break;

            case 'response':
              // Text response from AI (before TTS)
              onResponse?.(data.text);
              break;

            case 'error':
              setError(new Error(data.message));
              onError?.(new Error(data.message));
              break;
          }
        }
        // Handle binary messages (TTS audio)
        else if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          voiceManagerRef.current?.playAudioStream(arrayBuffer);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError(new Error('WebSocket connection error'));
    };

    wsRef.current.onclose = () => {
      console.log('Voice WebSocket disconnected');
    };
  }, [backendUrl, sessionId, athleteId, onTranscript, onResponse, onError]);

  /**
   * Start voice input
   */
  const startVoice = useCallback(async () => {
    try {
      if (!voiceManagerRef.current) {
        throw new Error('VoiceManager not initialized');
      }

      // Validate sessionId and athleteId
      if (!sessionId || !athleteId) {
        throw new Error('Session ID and Athlete ID are required for voice chat');
      }

      // Connect WebSocket if not already connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
        // Wait for connection to establish
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Check if connection succeeded
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('Failed to establish WebSocket connection');
      }

      // Start recording
      await voiceManagerRef.current.startRecording();
      setTranscript('');
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start voice');
      setError(error);
      onError?.(error);
    }
  }, [connectWebSocket, onError, sessionId, athleteId]);

  /**
   * Stop voice input
   */
  const stopVoice = useCallback(() => {
    voiceManagerRef.current?.stopRecording();
    voiceManagerRef.current?.stopPlayback();
  }, []);

  /**
   * Toggle voice on/off
   */
  const toggleVoice = useCallback(async () => {
    if (voiceState === 'listening') {
      stopVoice();
    } else if (voiceState === 'idle' || voiceState === 'error') {
      await startVoice();
    }
  }, [voiceState, startVoice, stopVoice]);

  return {
    voiceState,
    isListening: voiceState === 'listening',
    isProcessing: voiceState === 'processing',
    isSpeaking: voiceState === 'speaking',
    volume,
    transcript,
    error,
    startVoice,
    stopVoice,
    toggleVoice,
  };
}
