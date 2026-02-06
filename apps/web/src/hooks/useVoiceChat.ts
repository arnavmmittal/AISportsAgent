import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceManager, VoiceState, AudioChunk } from '@/lib/voice/VoiceManager';

export interface UseVoiceChatOptions {
  sessionId: string;
  athleteId: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
  /** Called when transcription completes - use this to send to chat API */
  onAudioComplete?: (transcript: string) => void;
}

// Type for callback refs
interface CallbackRefs {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
  onAudioComplete?: (transcript: string) => void;
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
  /** Speak text using TTS (call after getting AI response) */
  speakResponse: (text: string, emotionalContext?: string) => Promise<void>;
}

/**
 * React hook for voice chat integration
 *
 * Voice Flow:
 * 1. User presses mic → startVoice() → VoiceManager records
 * 2. User stops speaking → silence detected → audio sent to /api/voice/transcribe
 * 3. Transcript returned → onAudioComplete(transcript) called
 * 4. Parent component sends transcript to chat API, gets response
 * 5. Parent calls speakResponse(aiResponse) → /api/voice/synthesize → audio plays
 *
 * Usage:
 * ```tsx
 * const handleAudioComplete = async (transcript: string) => {
 *   // Send to chat API
 *   const response = await sendMessage(transcript);
 *   // Speak the response
 *   await speakResponse(response);
 * };
 *
 * const { toggleVoice, speakResponse, isListening } = useVoiceChat({
 *   sessionId, athleteId,
 *   onAudioComplete: handleAudioComplete,
 * });
 * ```
 */
export function useVoiceChat(options: UseVoiceChatOptions): UseVoiceChatReturn {
  const {
    sessionId,
    athleteId,
    onTranscript,
    onResponse,
    onError,
    onAudioComplete,
  } = options;

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Use refs for callbacks to avoid stale closure issues
  const callbacksRef = useRef<CallbackRefs>({});

  // Keep refs updated with latest callbacks
  useEffect(() => {
    callbacksRef.current = {
      onTranscript,
      onResponse,
      onError,
      onAudioComplete,
    };
  }, [onTranscript, onResponse, onError, onAudioComplete]);

  // Initialize VoiceManager
  useEffect(() => {
    voiceManagerRef.current = new VoiceManager({
      sampleRate: 16000,
      channelCount: 1,
      chunkDurationMs: 1000,
      silenceThresholdMs: 2000, // 2 seconds of silence before triggering
      silenceThreshold: 0.02, // RMS volume threshold (0.01-0.05 is typical silence)
    });

    const vm = voiceManagerRef.current;

    // Register callbacks
    vm.on('stateChange', (state) => {
      console.log('[VoiceChat] State changed to:', state);
      setVoiceState(state);
    });

    vm.on('volumeChange', (vol) => {
      setVolume(vol);
    });

    vm.on('error', (err) => {
      console.error('[VoiceChat] Error:', err);
      setError(err);
      callbacksRef.current.onError?.(err);
      isProcessingRef.current = false;
    });

    // When recording stops and we have audio, transcribe it
    vm.on('audioChunk', async (chunk) => {
      console.log('[VoiceChat] Audio chunk received, size:', chunk.data.size);

      // Prevent double processing
      if (isProcessingRef.current) {
        console.log('[VoiceChat] Already processing, skipping');
        return;
      }
      isProcessingRef.current = true;

      try {
        // Transcribe audio using local API route
        const transcription = await transcribeAudio(chunk.data);

        console.log('[VoiceChat] Transcription:', transcription.text);
        setTranscript(transcription.text);
        callbacksRef.current.onTranscript?.(transcription.text, true);

        // Notify parent that audio is complete with transcript
        // Parent will call speakResponse() which sets state to 'speaking'
        // If no transcript or parent doesn't call speakResponse, reset to idle
        if (transcription.text && transcription.text.trim()) {
          // Reset to idle - parent's onAudioComplete will handle the rest
          // speakResponse() will set state to 'speaking' when called
          setVoiceState('idle');
          callbacksRef.current.onAudioComplete?.(transcription.text);
        } else {
          // No transcript, reset to idle
          setVoiceState('idle');
        }
      } catch (err) {
        console.error('[VoiceChat] Transcription error:', err);
        const error = err instanceof Error ? err : new Error('Transcription failed');
        setError(error);
        callbacksRef.current.onError?.(error);
        setVoiceState('idle'); // Reset on error too
      } finally {
        isProcessingRef.current = false;
      }
    });

    vm.on('silenceDetected', () => {
      console.log('[VoiceChat] Silence detected');
      // VoiceManager will stop recording and emit audioChunk
    });

    return () => {
      vm.destroy();
    };
  }, []); // Empty deps - only run once on mount

  /**
   * Transcribe audio using local API route
   */
  const transcribeAudio = async (audioBlob: Blob): Promise<{ text: string; emotion?: { detected: string; confidence: number } }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('detect_emotion', 'true');

    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Transcription failed: ${response.status}`);
    }

    return response.json();
  };

  /**
   * Synthesize and play speech using local API route
   */
  const speakResponse = useCallback(async (text: string, emotionalContext?: string): Promise<void> => {
    if (!text || !text.trim()) return;
    if (!voiceManagerRef.current) {
      throw new Error('VoiceManager not initialized');
    }

    console.log('[VoiceChat] Speaking response:', text.substring(0, 50) + '...');
    setVoiceState('speaking');

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          emotional_context: emotionalContext || 'supportive',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Synthesis failed: ${response.status}`);
      }

      // Get audio blob and play it
      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();

      console.log('[VoiceChat] Playing audio, size:', arrayBuffer.byteLength);
      await voiceManagerRef.current.playAudioStream(arrayBuffer);

      onResponse?.(text);
    } catch (err) {
      console.error('[VoiceChat] Speech synthesis error:', err);
      const error = err instanceof Error ? err : new Error('Speech synthesis failed');
      setError(error);
      onError?.(error);
      setVoiceState('idle');
    }
  }, [onResponse, onError]);

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

      // Check microphone permission
      console.log('[VoiceChat] Checking microphone permission...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[VoiceChat] Microphone permission granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('[VoiceChat] Microphone permission denied:', permError);
        throw new Error('Microphone access denied. Please grant microphone permission and try again.');
      }

      // Start recording
      console.log('[VoiceChat] Starting recording...');
      isProcessingRef.current = false;
      await voiceManagerRef.current.startRecording();
      console.log('[VoiceChat] Recording started');
      setTranscript('');
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start voice');
      setError(error);
      onError?.(error);
    }
  }, [sessionId, athleteId, onError]);

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
    speakResponse,
  };
}
