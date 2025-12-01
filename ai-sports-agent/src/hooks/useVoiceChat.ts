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
  const audioChunkCountRef = useRef<number>(0);

  // Initialize VoiceManager
  useEffect(() => {
    voiceManagerRef.current = new VoiceManager({
      sampleRate: 16000,
      channelCount: 1,
      chunkDurationMs: 1000,
      silenceThresholdMs: 10500,  // 1.5 seconds of silence before triggering
      silenceThreshold: 0.5,    // Increased from 0.01 to be less sensitive
    });

    const vm = voiceManagerRef.current;

    // Register callbacks
    vm.on('stateChange', (state) => {
      console.log('VoiceManager state changed to:', state);
      setVoiceState(state);

      // When transitioning to processing, send utterance_end signal (only if we have audio)
      if (state === 'processing' && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('State changed to processing, audio chunks captured:', audioChunkCountRef.current);

        // Only send utterance_end if we have audio chunks
        if (audioChunkCountRef.current === 0) {
          console.warn('No audio chunks captured, skipping utterance_end signal from stateChange');
          return;
        }

        wsRef.current.send(JSON.stringify({
          type: 'utterance_end',
          sessionId,
          athleteId,
        }));
        console.log('utterance_end signal sent from stateChange handler');
      }
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
      console.log('Audio chunk received from VoiceManager, size:', chunk.data.size);
      audioChunkCountRef.current += 1;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendAudioChunk(chunk);
        console.log('Audio chunk sent to backend, total chunks:', audioChunkCountRef.current);
      } else {
        console.warn('WebSocket not open, cannot send audio chunk');
      }
    });

    vm.on('silenceDetected', () => {
      // User stopped speaking - signal backend that utterance is complete
      console.log('Silence detected, audio chunks captured:', audioChunkCountRef.current);

      // Only send utterance_end if we have audio chunks
      if (audioChunkCountRef.current === 0) {
        console.warn('No audio chunks captured, skipping utterance_end signal');
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'utterance_end',
          sessionId,
          athleteId,
        }));
        console.log('utterance_end signal sent to backend');
      } else {
        console.warn('WebSocket not open, cannot send utterance_end');
      }
    });

    return () => {
      vm.destroy();
      wsRef.current?.close();
    };
  }, []); // Empty deps - only run once on mount

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

    console.log('Connecting to WebSocket:', wsUrl);
    console.log('Session ID:', sessionId);
    console.log('Athlete ID:', athleteId);

    // Close existing connection if any
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Voice WebSocket connected');

      // Validate before sending handshake
      if (!sessionId || !athleteId) {
        console.error('Cannot send handshake - missing sessionId or athleteId');
        wsRef.current?.close();
        return;
      }

      // Send initial handshake
      const handshake = {
        type: 'start',
        sessionId,
        athleteId,
      };
      console.log('Sending handshake:', handshake);
      wsRef.current?.send(JSON.stringify(handshake));
    };

    wsRef.current.onmessage = async (event) => {
      try {
        // Handle text messages (transcripts, responses)
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'started':
              // WebSocket session successfully started
              console.log('Voice session started:', data.sessionId);
              break;

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

      // Check microphone permission first
      console.log('Checking microphone permission...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted, tracks:', stream.getTracks().length);
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      } catch (permError) {
        console.error('Microphone permission denied:', permError);
        throw new Error('Microphone access denied. Please grant microphone permission and try again.');
      }

      // Start recording
      console.log('Starting recording with VoiceManager...');
      audioChunkCountRef.current = 0; // Reset chunk counter for new recording
      await voiceManagerRef.current.startRecording();
      console.log('Recording started successfully');
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
