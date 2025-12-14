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
    bg: 'bg-red-900/20',
    border: 'border-red-900',
    text: 'text-red-400',
    icon: '⚠️',
    label: 'CRITICAL',
  },
  HIGH: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-300',
    icon: '⚠',
    label: 'HIGH',
  },
  MODERATE: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-300',
    icon: '!',
    label: 'MODERATE',
  },
  LOW: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-300',
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
