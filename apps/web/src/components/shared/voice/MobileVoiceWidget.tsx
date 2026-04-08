'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/lib/voice/VoiceManager';

interface MobileVoiceWidgetProps {
  voiceState: VoiceState;
  volume: number;
  transcript?: string;
  isListening: boolean;
  onToggle: () => void;
  onClose?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * MobileVoiceWidget - Full-screen voice UI for mobile devices
 *
 * Features:
 * - Large floating FAB button for easy thumb access
 * - Full-screen overlay when active with visual feedback
 * - Volume visualization with pulsing animation
 * - Clear transcript display
 * - Easy dismiss gesture
 */
export function MobileVoiceWidget({
  voiceState,
  volume,
  transcript,
  isListening,
  onToggle,
  onClose,
  disabled = false,
  className,
}: MobileVoiceWidgetProps) {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open fullscreen when listening starts on mobile
  useEffect(() => {
    if (isMobile && isListening && !showFullScreen) {
      setShowFullScreen(true);
    }
  }, [isListening, isMobile]);

  // Close fullscreen when listening stops
  useEffect(() => {
    if (!isListening && voiceState !== 'processing' && voiceState !== 'speaking') {
      // Small delay before closing to show final transcript
      const timer = setTimeout(() => {
        setShowFullScreen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isListening, voiceState]);

  const handleFabClick = () => {
    if (isMobile && !showFullScreen) {
      setShowFullScreen(true);
    }
    onToggle();
  };

  const handleClose = () => {
    setShowFullScreen(false);
    if (isListening) {
      onToggle(); // Stop listening
    }
    onClose?.();
  };

  // Don't render on desktop - use the regular VoiceButton
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      {!showFullScreen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFabClick}
          disabled={disabled}
          className={cn(
            'fixed bottom-24 right-6 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-colors',
            disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : isListening
              ? 'bg-red-500 animate-pulse'
              : 'bg-primary',
            className
          )}
          aria-label="Voice input"
        >
          <Mic className="w-7 h-7 text-white" />
          {/* Recording indicator dot */}
          {isListening && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full animate-ping" />
          )}
        </motion.button>
      )}

      {/* Full-Screen Voice UI */}
      <AnimatePresence>
        {showFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex flex-col"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4">
              <div className="text-white/70 text-sm font-medium">
                {voiceState === 'listening' && 'Listening...'}
                {voiceState === 'processing' && 'Processing...'}
                {voiceState === 'speaking' && 'AI Speaking...'}
                {voiceState === 'idle' && 'Tap to speak'}
                {voiceState === 'error' && 'Error - Try again'}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Center content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Main voice indicator */}
              <div className="relative mb-8">
                {/* Pulsing rings for volume visualization */}
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/10"
                      animate={{
                        scale: [1, 1.2 + volume * 0.3, 1],
                        opacity: [0.5, 0.2, 0.5],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ width: 200, height: 200, margin: -50 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/5"
                      animate={{
                        scale: [1, 1.4 + volume * 0.4, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.1,
                      }}
                      style={{ width: 200, height: 200, margin: -50 }}
                    />
                  </>
                )}

                {/* Main button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggle}
                  disabled={disabled || voiceState === 'processing' || voiceState === 'speaking'}
                  className={cn(
                    'w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all',
                    voiceState === 'listening'
                      ? 'bg-red-500'
                      : voiceState === 'processing' || voiceState === 'speaking'
                      ? 'bg-primary'
                      : voiceState === 'error'
                      ? 'bg-red-600'
                      : 'bg-white'
                  )}
                >
                  {voiceState === 'processing' ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : voiceState === 'speaking' ? (
                    <Volume2 className="w-12 h-12 text-white animate-pulse" />
                  ) : voiceState === 'error' ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : isListening ? (
                    <Mic className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-primary" />
                  )}
                </motion.button>
              </div>

              {/* Instructions */}
              <p className="text-white/80 text-lg text-center mb-6">
                {voiceState === 'listening'
                  ? 'Speak now...'
                  : voiceState === 'processing'
                  ? 'Processing your voice...'
                  : voiceState === 'speaking'
                  ? 'AI is responding...'
                  : voiceState === 'error'
                  ? 'Something went wrong. Tap to try again.'
                  : 'Tap the microphone to start speaking'}
              </p>

              {/* Transcript display */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md bg-white/10 rounded-2xl p-4"
                >
                  <p className="text-white/60 text-xs mb-1">You said:</p>
                  <p className="text-white text-lg">{transcript}</p>
                </motion.div>
              )}
            </div>

            {/* Bottom hint */}
            <div className="p-6 text-center">
              <p className="text-white/50 text-sm">
                {isListening ? 'Tap to stop recording' : 'Voice powered by ElevenLabs'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * useMediaQuery - Simple hook for responsive behavior
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
