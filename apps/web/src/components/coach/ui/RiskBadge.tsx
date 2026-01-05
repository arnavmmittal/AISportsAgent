/**
 * RiskBadge Component
 * Badge indicating athlete risk level with severity colors
 */

import { RiskLevel } from '@/types/coach-portal';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const RISK_CONFIG = {
  CRITICAL: {
    bg: 'bg-muted-foreground/30',
    border: 'border-muted-foreground',
    text: 'text-chrome',
    icon: '⚠️',
    label: 'CRITICAL',
  },
  HIGH: {
    bg: 'bg-muted-foreground/20',
    border: 'border-muted-foreground',
    text: 'text-chrome',
    icon: '⚠',
    label: 'HIGH',
  },
  MODERATE: {
    bg: 'bg-muted/20',
    border: 'border-muted',
    text: 'text-chrome',
    icon: '!',
    label: 'MODERATE',
  },
  LOW: {
    bg: 'bg-secondary/20',
    border: 'border-secondary',
    text: 'text-accent',
    icon: '✓',
    label: 'LOW',
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-[10px]',
    icon: 'text-xs',
  },
  md: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'text-sm',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'text-base',
  },
};

export default function RiskBadge({
  level,
  score,
  size = 'md',
  showIcon = true,
  className,
}: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-bold tracking-wide',
        config.bg,
        config.border,
        config.text,
        sizeConfig.padding,
        className
      )}
    >
      {showIcon && <span className={sizeConfig.icon}>{config.icon}</span>}
      <span className={cn(sizeConfig.text, 'uppercase')}>{config.label}</span>
      {score !== undefined && (
        <span className={cn(sizeConfig.text, 'ml-1')}>({score})</span>
      )}
    </div>
  );
}
