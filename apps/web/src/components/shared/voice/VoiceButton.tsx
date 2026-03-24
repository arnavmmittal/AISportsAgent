'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/lib/voice/VoiceManager';

export interface VoiceButtonProps {
  voiceState: VoiceState;
  volume: number;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * VoiceButton - Mic button with visual state indicators
 *
 * States:
 * - idle: Mic icon, clickable
 * - listening: Pulsing mic icon with volume visualization
 * - processing: Loading spinner
 * - speaking: AI speaking indicator
 * - error: Red mic icon
 */
export function VoiceButton({
  voiceState,
  volume,
  onToggle,
  className,
  disabled = false,
}: VoiceButtonProps) {
  const [pulseScale, setPulseScale] = useState(1);

  // Animate pulse based on volume when listening
  useEffect(() => {
    if (voiceState === 'listening') {
      const scale = 1 + volume * 0.5; // Scale from 1 to 1.5 based on volume
      setPulseScale(scale);
    } else {
      setPulseScale(1);
    }
  }, [voiceState, volume]);

  const getIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic className="h-5 w-5" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'speaking':
        return <Mic className="h-5 w-5 opacity-70" />;
      case 'error':
        return <MicOff className="h-5 w-5" />;
      default:
        return <Mic className="h-5 w-5" />;
    }
  };

  const getLabel = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'AI Speaking...';
      case 'error':
        return 'Error - Retry';
      default:
        return 'Voice';
    }
  };

  return (
    <div className="relative">
      {/* Volume visualization - pulsing ring when listening */}
      {voiceState === 'listening' && (
        <div
          className="absolute inset-0 rounded-lg bg-accent/20"
          style={{
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}

      <button
        onClick={onToggle}
        disabled={disabled || voiceState === 'processing' || voiceState === 'speaking'}
        className={cn(
          'input-button relative transition-all',
          voiceState === 'listening' && 'input-button-voice active ring-2 ring-accent ring-offset-2 ring-offset-background',
          voiceState === 'idle' && 'input-button-voice',
          voiceState === 'processing' && 'bg-muted text-muted-foreground',
          voiceState === 'speaking' && 'bg-accent/50 text-accent-foreground',
          voiceState === 'error' && 'bg-destructive text-destructive-foreground',
          className
        )}
        aria-label={getLabel()}
      >
        {getIcon()}
      </button>

      {/* Privacy indicator - red dot when recording */}
      {voiceState === 'listening' && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse-subtle" />
      )}
    </div>
  );
}

/**
 * AudioVisualizer - Waveform visualization for voice input/output
 */
export interface AudioVisualizerProps {
  volume: number;
  isActive: boolean;
  bars?: number;
  className?: string;
}

export function AudioVisualizer({
  volume,
  isActive,
  bars = 12,
  className,
}: AudioVisualizerProps) {
  const heights = Array.from({ length: bars }, (_, i) => {
    // Generate pseudo-random heights based on volume and bar index
    const baseHeight = isActive ? volume * 100 : 5;
    const variation = Math.sin((i + Date.now() / 100) * 0.5) * 10;
    return Math.max(5, Math.min(100, baseHeight + variation));
  });

  return (
    <div className={cn('flex items-center justify-center gap-0.5 h-12', className)}>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-100',
            isActive ? 'bg-accent' : 'bg-muted'
          )}
          style={{
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  );
}
