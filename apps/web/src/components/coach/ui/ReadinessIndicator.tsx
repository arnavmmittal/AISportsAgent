/**
 * ReadinessIndicator Component
 * Visual indicator for athlete readiness with traffic light system
 */

import { ReadinessLevel, ReadinessScore } from '@/types/coach-portal';
import { cn } from '@/lib/utils';

interface ReadinessIndicatorProps {
  readiness: ReadinessScore | number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showScore?: boolean;
  className?: string;
}

const READINESS_CONFIG: Record<ReadinessLevel, {color: string; textColor: string; label: string; icon: string}> = {
  [ReadinessLevel.OPTIMAL]: {
    color: 'bg-secondary',
    textColor: 'text-secondary',
    label: 'Optimal',
    icon: '●',
  },
  [ReadinessLevel.GOOD]: {
    color: 'bg-accent',
    textColor: 'text-accent',
    label: 'Good',
    icon: '●',
  },
  [ReadinessLevel.MODERATE]: {
    color: 'bg-muted',
    textColor: 'text-muted',
    label: 'Moderate',
    icon: '●',
  },
  [ReadinessLevel.LOW]: {
    color: 'bg-muted-foreground',
    textColor: 'text-muted-foreground',
    label: 'Low',
    icon: '●',
  },
  [ReadinessLevel.POOR]: {
    color: 'bg-muted-foreground/70',
    textColor: 'text-muted-foreground',
    label: 'Poor',
    icon: '●',
  },
};

const SIZE_CONFIG = {
  sm: {
    dot: 'w-2 h-2',
    text: 'text-xs',
    score: 'text-sm font-semibold',
  },
  md: {
    dot: 'w-3 h-3',
    text: 'text-sm',
    score: 'text-base font-bold',
  },
  lg: {
    dot: 'w-4 h-4',
    text: 'text-base',
    score: 'text-lg font-bold',
  },
};

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return ReadinessLevel.OPTIMAL;
  if (score >= 75) return ReadinessLevel.GOOD;
  if (score >= 60) return ReadinessLevel.MODERATE;
  if (score >= 45) return ReadinessLevel.LOW;
  return ReadinessLevel.POOR;
}

export default function ReadinessIndicator({
  readiness,
  size = 'md',
  showLabel = true,
  showScore = true,
  className,
}: ReadinessIndicatorProps) {
  const score = typeof readiness === 'number' ? readiness : readiness.score;
  const level = typeof readiness === 'number'
    ? getReadinessLevel(readiness)
    : readiness.level;

  const config = READINESS_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Traffic Light Dot */}
      <div
        className={cn(
          'rounded-full',
          config.color,
          sizeConfig.dot,
          'animate-pulse'
        )}
      />

      {/* Score */}
      {showScore && (
        <span className={cn(config.textColor, sizeConfig.score)}>
          {score}
        </span>
      )}

      {/* Label */}
      {showLabel && (
        <span className={cn('text-slate-300', sizeConfig.text)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact version for table cells
export function ReadinessIndicatorCompact({ score }: { score: number }) {
  const level = getReadinessLevel(score);
  const config = READINESS_CONFIG[level];

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className={cn('text-sm font-semibold', config.textColor)}>
        {score}
      </span>
    </div>
  );
}
