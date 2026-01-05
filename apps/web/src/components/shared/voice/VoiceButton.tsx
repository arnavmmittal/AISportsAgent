'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
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

  const getButtonVariant = () => {
    switch (voiceState) {
      case 'listening':
        return 'default';
      case 'processing':
      case 'speaking':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
          className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"
          style={{
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}

      <Button
        onClick={onToggle}
        disabled={disabled || voiceState === 'processing' || voiceState === 'speaking'}
        variant={getButtonVariant()}
        size="lg"
        className={cn(
          'relative gap-2 transition-all',
          voiceState === 'listening' && 'ring-2 ring-primary ring-offset-2',
          className
        )}
        aria-label={getLabel()}
      >
        {getIcon()}
        <span className="hidden sm:inline">{getLabel()}</span>
      </Button>

      {/* Privacy indicator - red dot when recording */}
      {voiceState === 'listening' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
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
    <div className={cn('flex items-center gap-1 h-16', className)}>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            'w-1 bg-primary rounded-full transition-all duration-100',
            !isActive && 'bg-muted'
          )}
          style={{
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  );
}
