/**
 * TrendArrow Component
 * Shows delta direction with arrow and color coding
 */

import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendArrowProps {
  value: number;
  direction?: TrendDirection;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  inverse?: boolean; // true if "down" is good (e.g., stress level)
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    arrow: 'text-xs',
    value: 'text-xs',
  },
  md: {
    arrow: 'text-sm',
    value: 'text-sm',
  },
  lg: {
    arrow: 'text-base',
    value: 'text-base',
  },
};

function getTrendDirection(value: number): TrendDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

function getTrendColor(direction: TrendDirection, inverse: boolean): string {
  if (direction === 'neutral') return 'text-slate-400';

  if (inverse) {
    // For metrics where down is good (stress, risk)
    return direction === 'down' ? 'text-green-500' : 'text-red-500';
  }

  // For metrics where up is good (readiness, performance)
  return direction === 'up' ? 'text-green-500' : 'text-red-500';
}

function getTrendArrow(direction: TrendDirection): string {
  if (direction === 'up') return '↗';
  if (direction === 'down') return '↘';
  return '→';
}

export default function TrendArrow({
  value,
  direction,
  showValue = true,
  size = 'md',
  inverse = false,
  className,
}: TrendArrowProps) {
  const trendDirection = direction || getTrendDirection(value);
  const color = getTrendColor(trendDirection, inverse);
  const arrow = getTrendArrow(trendDirection);
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn(sizeConfig.arrow, color)}>{arrow}</span>
      {showValue && (
        <span className={cn(sizeConfig.value, color, 'font-semibold')}>
          {value > 0 ? '+' : ''}
          {value}
        </span>
      )}
    </div>
  );
}

// Compact variant for tables
export function TrendArrowCompact({ value, inverse }: { value: number; inverse?: boolean }) {
  const direction = getTrendDirection(value);
  const color = getTrendColor(direction, inverse || false);
  const arrow = getTrendArrow(direction);

  return (
    <span className={cn('text-xs font-semibold', color)}>
      {arrow} {value > 0 ? '+' : ''}
      {value}
    </span>
  );
}

// Percentage variant
export function TrendArrowPercent({
  value,
  inverse,
  size = 'md'
}: {
  value: number;
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <TrendArrow
      value={value}
      inverse={inverse}
      size={size}
      showValue={true}
      className="after:content-['%'] after:ml-0.5"
    />
  );
}
