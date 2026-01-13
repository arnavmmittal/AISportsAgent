'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * MoodSlider - Accessible mood input with visual feedback
 *
 * Features:
 * - 1-10 scale with emoji feedback
 * - Keyboard accessible (arrow keys, home/end)
 * - Touch-friendly on mobile
 * - Haptic feedback on value change
 * - ARIA compliant
 *
 * @example
 * <MoodSlider
 *   value={7}
 *   onChange={(v) => setMood(v)}
 *   label="How are you feeling today?"
 * />
 */

export interface MoodSliderProps {
  /** Current value (1-10) */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Min value (default: 1) */
  min?: number;
  /** Max value (default: 10) */
  max?: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Show emoji feedback */
  showEmoji?: boolean;
  /** Show numeric value */
  showValue?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for accessibility */
  id?: string;
}

const moodEmojis: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😢', label: 'Very low' },
  2: { emoji: '😞', label: 'Low' },
  3: { emoji: '😔', label: 'Somewhat low' },
  4: { emoji: '😐', label: 'Below average' },
  5: { emoji: '🙂', label: 'Neutral' },
  6: { emoji: '😊', label: 'Slightly positive' },
  7: { emoji: '😄', label: 'Good' },
  8: { emoji: '😁', label: 'Very good' },
  9: { emoji: '🤩', label: 'Great' },
  10: { emoji: '🌟', label: 'Excellent' },
};

const getMoodColor = (value: number): string => {
  if (value <= 3) return 'bg-destructive';
  if (value <= 5) return 'bg-warning';
  if (value <= 7) return 'bg-primary';
  return 'bg-success';
};

const getMoodTrackGradient = (): string => {
  return 'bg-gradient-to-r from-destructive via-warning via-50% to-success';
};

export function MoodSlider({
  value,
  onChange,
  label,
  description,
  min = 1,
  max = 10,
  step = 1,
  showEmoji = true,
  showValue = true,
  disabled = false,
  className,
  id: providedId,
}: MoodSliderProps) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  const sliderId = `${id}-slider`;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const clampValue = (v: number) => Math.min(max, Math.max(min, v));
  const progress = ((value - min) / (max - min)) * 100;

  const moodData = moodEmojis[Math.round(clampValue(value))] || moodEmojis[5];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const newValue = clampValue(steppedValue);

    if (newValue !== value) {
      onChange(newValue);
      // Trigger haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = clampValue(value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = clampValue(value - step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }

    e.preventDefault();
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label and emoji */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {label && (
            <label
              id={labelId}
              htmlFor={sliderId}
              className="block text-sm font-medium text-foreground"
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-muted-foreground mt-0.5"
            >
              {description}
            </p>
          )}
        </div>

        {showEmoji && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-3xl transition-transform duration-200',
                isDragging && 'scale-110'
              )}
              role="img"
              aria-label={moodData.label}
            >
              {moodData.emoji}
            </span>
            {showValue && (
              <span className="text-lg font-semibold tabular-nums text-foreground w-6 text-center">
                {value}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Slider track */}
      <div
        ref={sliderRef}
        id={sliderId}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} - ${moodData.label}`}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-disabled={disabled}
        className={cn(
          'relative h-3 rounded-full cursor-pointer touch-none',
          'bg-muted',
          disabled && 'opacity-50 cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {/* Filled track */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-150',
            getMoodColor(value)
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
            'w-6 h-6 rounded-full bg-background border-2 shadow-md',
            'transition-transform duration-150',
            isDragging ? 'scale-110 shadow-lg' : 'scale-100',
            getMoodColor(value).replace('bg-', 'border-')
          )}
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 px-1">
        <span className="text-xs text-muted-foreground">{min}</span>
        <span className="text-xs text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}

/**
 * MoodQuickSelect - Grid of clickable mood options
 *
 * @example
 * <MoodQuickSelect value={7} onChange={setMood} />
 */
export interface MoodQuickSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function MoodQuickSelect({
  value,
  onChange,
  disabled = false,
  className,
}: MoodQuickSelectProps) {
  const options = [1, 3, 5, 7, 10];

  return (
    <div
      className={cn('flex gap-2', className)}
      role="radiogroup"
      aria-label="Quick mood selection"
    >
      {options.map((option) => {
        const mood = moodEmojis[option];
        const isSelected = value === option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-2xl" role="img" aria-label={mood.label}>
              {mood.emoji}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MoodSlider;
