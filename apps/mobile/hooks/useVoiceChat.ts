/**
 * Voice Chat Hook
 * Manages voice recording, WebSocket communication, VAD, and audio playback
 * Based on web implementation with mobile-specific adaptations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { AudioRecorder, getAudioRecorder } from '../lib/voice/AudioRecorder';
import { AudioPlayer, getAudioPlayer } from '../lib/voice/AudioPlayer';
import {
  VoiceActivityDetector,
  createVAD,
} from '../lib/voice/VoiceActivityDetector';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceChatConfig {
  sessionId: string;
  athleteId: string;
  wsUrl: string; // WebSocket URL (e.g., 'ws://10.0.0.127:3000/api/voice')
}

export interface VoiceChatHook {
  voiceState: VoiceState;
  volume: number; // 0-1 for visualizer
  transcript: string; // Live transcript
  aiResponse: string; // AI text response
  error: Error | null;
  isConnected: boolean;
  startVoice(): Promise<void>;
  stopVoice(): void;
  toggleVoice(): void;
}

export function useVoiceChat(config: VoiceChatConfig): VoiceChatHook {
  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize voice components
   */
  useEffect(() => {
    recorderRef.current = getAudioRecorder();
    playerRef.current = getAudioPlayer();
    vadRef.current = createVAD();

    // VAD utterance end callback
    vadRef.current.onUtteranceEnd(() => {
      console.log('VAD: Utterance end detected, stopping recording');
      handleUtteranceEnd();
    });

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Connect to WebSocket
   */
  const connectWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(config.wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Send start message
          ws.send(
            JSON.stringify({
              type: 'start',
              sessionId: config.sessionId,
              athleteId: config.athleteId,
            })
          );

          resolve();
        };

        ws.onmessage = (event) => {
          handleWebSocketMessage(event.data);
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
          setIsConnected(false);
          reject(new Error('WebSocket connection error'));
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          setIsConnected(false);
          if (voiceState !== 'idle') {
            setVoiceState('idle');
          }
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        reject(err);
      }
    });
  }, [config]);

  /**
   * Handle WebSocket messages
   */
  const handleWebSocketMessage = useCallback((data: any) => {
    // Handle binary audio data (TTS chunks)
    if (data instanceof Blob) {
      data.arrayBuffer().then((arrayBuffer: ArrayBuffer) => {
        if (playerRef.current) {
          playerRef.current.enqueue(arrayBuffer);
          if (voiceState !== 'speaking') {
            setVoiceState('speaking');
          }
        }
      });
      return;
    }

    // Handle ArrayBuffer directly (React Native)
    if (data instanceof ArrayBuffer) {
      if (playerRef.current) {
        playerRef.current.enqueue(data);
        if (voiceState !== 'speaking') {
          setVoiceState('speaking');
        }
      }
      return;
    }

    // Handle text messages
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;

      switch (message.type) {
        case 'started':
          console.log('Voice session started:', message.sessionId);
          break;

        case 'transcript':
          console.log('Transcript:', message.text, 'Final:', message.isFinal);
          setTranscript((prev) =>
            message.isFinal ? message.text : prev + message.text
          );
          break;

        case 'response':
          console.log('AI Response:', message.text);
          setAiResponse(message.text);
          setVoiceState('processing');
          break;

        case 'error':
          console.error('Server error:', message.message);
          setError(new Error(message.message));
          setVoiceState('error');
          stopVoice();
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, [voiceState]);

  /**
   * Start voice recording and streaming
   */
  const startVoice = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setAiResponse('');

      // Connect WebSocket if not connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await connectWebSocket();
      }

      // Start recording
      if (recorderRef.current) {
        await recorderRef.current.startRecording();
        setVoiceState('listening');

        // Start streaming audio chunks
        startAudioStreaming();

        // Start volume monitoring for visualizer
        startVolumeMonitoring();

        console.log('Voice recording started');
      }
    } catch (err) {
      console.error('Failed to start voice:', err);
      setError(err as Error);
      setVoiceState('error');
    }
  }, [connectWebSocket]);

  /**
   * Stop voice recording
   */
  const stopVoice = useCallback(() => {
    try {
      stopAudioStreaming();
      stopVolumeMonitoring();

      if (recorderRef.current && recorderRef.current.getIsRecording()) {
        recorderRef.current
          .stopRecording()
          .then(() => {
            console.log('Voice recording stopped');

            // Send utterance end message
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'utterance_end',
                  sessionId: config.sessionId,
                  athleteId: config.athleteId,
                })
              );
            }

            setVoiceState('processing');
          })
          .catch((err) => {
            console.error('Error stopping recording:', err);
            setVoiceState('idle');
          });
      } else {
        setVoiceState('idle');
      }

      // Reset VAD
      if (vadRef.current) {
        vadRef.current.reset();
      }
    } catch (err) {
      console.error('Error stopping voice:', err);
      setVoiceState('idle');
    }
  }, [config]);

  /**
   * Toggle voice on/off
   */
  const toggleVoice = useCallback(() => {
    if (voiceState === 'idle') {
      startVoice();
    } else if (voiceState === 'listening') {
      stopVoice();
    }
  }, [voiceState, startVoice, stopVoice]);

  /**
   * Start streaming audio chunks to WebSocket
   */
  const startAudioStreaming = useCallback(() => {
    // Send audio chunks every 100ms
    audioChunkIntervalRef.current = setInterval(() => {
      if (
        !recorderRef.current ||
        !recorderRef.current.getIsRecording() ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      // Get current recording status (expo-av doesn't support streaming directly)
      // For now, we'll rely on sending the full recording at the end
      // In a production app, you might use a different approach for true streaming
    }, 100);
  }, []);

  /**
   * Stop streaming audio chunks
   */
  const stopAudioStreaming = useCallback(() => {
    if (audioChunkIntervalRef.current) {
      clearInterval(audioChunkIntervalRef.current);
      audioChunkIntervalRef.current = null;
    }
  }, []);

  /**
   * Start monitoring volume for visualizer and VAD
   */
  const startVolumeMonitoring = useCallback(() => {
    volumeIntervalRef.current = setInterval(() => {
      if (!recorderRef.current || !recorderRef.current.getIsRecording()) {
        return;
      }

      const currentLevel = recorderRef.current.getCurrentLevel();
      setVolume(currentLevel);

      // Run VAD analysis
      if (vadRef.current) {
        const audioLevels = recorderRef.current.getAudioLevels();
        const vadResult = vadRef.current.analyze(audioLevels);

        // VAD will trigger onUtteranceEnd callback when silence detected
      }
    }, 100);
  }, []);

  /**
   * Stop monitoring volume
   */
  const stopVolumeMonitoring = useCallback(() => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    setVolume(0);
  }, []);

  /**
   * Handle utterance end from VAD
   */
  const handleUtteranceEnd = useCallback(() => {
    stopVoice();
  }, [stopVoice]);

  /**
   * Monitor audio player state
   */
  useEffect(() => {
    if (!playerRef.current) return;

    const handlePlaybackStatus = () => {
      const isPlaying = playerRef.current?.getIsPlaying() || false;
      const queueLength = playerRef.current?.getQueueLength() || 0;

      // Transition from speaking to idle when playback finishes
      if (
        voiceState === 'speaking' &&
        !isPlaying &&
        queueLength === 0
      ) {
        setVoiceState('idle');
        console.log('Playback finished, returning to idle');
      }
    };

    // Check playback status periodically
    const interval = setInterval(handlePlaybackStatus, 500);

    return () => clearInterval(interval);
  }, [voiceState]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    stopVolumeMonitoring();
    stopAudioStreaming();

    if (recorderRef.current) {
      recorderRef.current.cleanup();
    }

    if (playerRef.current) {
      playerRef.current.cleanup();
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setVoiceState('idle');
  }, [stopVolumeMonitoring, stopAudioStreaming]);

  return {
    voiceState,
    volume,
    transcript,
    aiResponse,
    error,
    isConnected,
    startVoice,
    stopVoice,
    toggleVoice,
  };
}
