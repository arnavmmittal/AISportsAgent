'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ReadinessGauge - Professional circular progress indicator
 *
 * Displays readiness score (0-100) with traffic light coloring:
 * - GREEN: score >= 75 (Ready to perform)
 * - YELLOW: score 55-74 (Proceed with caution)
 * - RED: score < 55 (Needs attention)
 *
 * @example
 * <ReadinessGauge score={78} size="lg" showLabel />
 */

export type ReadinessLevel = 'green' | 'yellow' | 'red';

export interface ReadinessGaugeProps {
  /** Readiness score from 0-100 */
  score: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show the score label inside the gauge */
  showLabel?: boolean;
  /** Show status text below the gauge */
  showStatus?: boolean;
  /** Custom status text override */
  statusText?: string;
  /** Enable animation on mount */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

const sizeConfig = {
  sm: { size: 64, strokeWidth: 6, fontSize: 'text-lg', statusSize: 'text-xs' },
  md: { size: 96, strokeWidth: 8, fontSize: 'text-2xl', statusSize: 'text-sm' },
  lg: { size: 128, strokeWidth: 10, fontSize: 'text-3xl', statusSize: 'text-base' },
  xl: { size: 160, strokeWidth: 12, fontSize: 'text-4xl', statusSize: 'text-lg' },
};

const getReadinessLevel = (score: number): ReadinessLevel => {
  if (score >= 75) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
};

const getStatusText = (level: ReadinessLevel): string => {
  switch (level) {
    case 'green':
      return 'Ready to perform';
    case 'yellow':
      return 'Proceed with caution';
    case 'red':
      return 'Needs attention';
  }
};

const levelColors = {
  green: {
    strokeVar: '--readiness-green',
    text: 'text-readiness-green',
    bg: 'bg-readiness-green-bg',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--readiness-green)/0.4)]',
  },
  yellow: {
    strokeVar: '--readiness-yellow',
    text: 'text-readiness-yellow',
    bg: 'bg-readiness-yellow-bg',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--readiness-yellow)/0.4)]',
  },
  red: {
    strokeVar: '--readiness-red',
    text: 'text-readiness-red',
    bg: 'bg-readiness-red-bg',
    glow: 'drop-shadow-[0_0_8px_hsl(var(--readiness-red)/0.4)]',
  },
};

export function ReadinessGauge({
  score,
  size = 'md',
  showLabel = true,
  showStatus = false,
  statusText,
  animated = true,
  className,
  'aria-label': ariaLabel,
}: ReadinessGaugeProps) {
  const [displayScore, setDisplayScore] = React.useState(animated ? 0 : score);
  const config = sizeConfig[size];
  const level = getReadinessLevel(score);
  const colors = levelColors[level];

  // Animation: count up to the score
  React.useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000; // 1 second animation
    const startTime = performance.now();
    const startScore = displayScore;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (score - startScore) * easeOut);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  // SVG calculations
  const center = config.size / 2;
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(displayScore, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  const effectiveAriaLabel = ariaLabel || `Readiness score: ${score} out of 100. ${getStatusText(level)}`;

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={effectiveAriaLabel}
    >
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className={cn('transform -rotate-90', animated && colors.glow)}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            style={{ stroke: 'hsl(var(--muted))' }}
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="transition-all duration-300"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              stroke: `hsl(var(${colors.strokeVar}))`,
              transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none',
            }}
          />
        </svg>

        {/* Score label */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                config.fontSize,
                'font-semibold tabular-nums',
                colors.text
              )}
            >
              {displayScore}
            </span>
          </div>
        )}
      </div>

      {/* Status text */}
      {showStatus && (
        <span className={cn(config.statusSize, 'font-medium text-muted-foreground')}>
          {statusText || getStatusText(level)}
        </span>
      )}
    </div>
  );
}

/**
 * ReadinessGaugeMini - Compact inline variant
 *
 * @example
 * <ReadinessGaugeMini score={78} />
 */
export interface ReadinessGaugeMiniProps {
  score: number;
  className?: string;
}

export function ReadinessGaugeMini({ score, className }: ReadinessGaugeMiniProps) {
  const level = getReadinessLevel(score);
  const colors = levelColors[level];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        colors.bg,
        className
      )}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Readiness: ${score}`}
    >
      <span className={cn('w-2 h-2 rounded-full', level === 'green' && 'bg-readiness-green', level === 'yellow' && 'bg-readiness-yellow', level === 'red' && 'bg-readiness-red')} />
      <span className={cn('text-sm font-medium tabular-nums', colors.text)}>
        {score}
      </span>
    </div>
  );
}

export default ReadinessGauge;
