'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

/**
 * RiskBadge - Semantic risk level indicator
 *
 * Four-tier system matching GovernanceAgent risk levels:
 * - LOW: Green - No immediate concerns
 * - MODERATE: Yellow - Attention recommended
 * - HIGH: Orange - Intervention needed
 * - CRITICAL: Red - Immediate action required
 *
 * @example
 * <RiskBadge level="high" />
 * <RiskBadge level="critical" showIcon />
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskBadgeProps {
  /** Risk level */
  level: RiskLevel;
  /** Show icon alongside text */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Use filled background style vs outline */
  variant?: 'filled' | 'outline' | 'subtle';
  /** Custom label override */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

const riskConfig: Record<
  RiskLevel,
  {
    label: string;
    icon: LucideIcon;
    filled: string;
    outline: string;
    subtle: string;
    text: string;
  }
> = {
  low: {
    label: 'Low',
    icon: CheckCircle2,
    filled: 'bg-risk-low text-white',
    outline: 'border-risk-low text-risk-low bg-transparent',
    subtle: 'bg-risk-low-bg text-risk-low',
    text: 'text-risk-low',
  },
  moderate: {
    label: 'Moderate',
    icon: AlertCircle,
    filled: 'bg-risk-moderate text-black',
    outline: 'border-risk-moderate text-risk-moderate bg-transparent',
    subtle: 'bg-risk-moderate-bg text-risk-moderate',
    text: 'text-risk-moderate',
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    filled: 'bg-risk-high text-white',
    outline: 'border-risk-high text-risk-high bg-transparent',
    subtle: 'bg-risk-high-bg text-risk-high',
    text: 'text-risk-high',
  },
  critical: {
    label: 'Critical',
    icon: XCircle,
    filled: 'bg-risk-critical text-white',
    outline: 'border-risk-critical text-risk-critical bg-transparent',
    subtle: 'bg-risk-critical-bg text-risk-critical',
    text: 'text-risk-critical',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    iconSize: 12,
    gap: 'gap-1',
  },
  md: {
    padding: 'px-2 py-1',
    text: 'text-sm',
    iconSize: 14,
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    iconSize: 16,
    gap: 'gap-2',
  },
};

export function RiskBadge({
  level,
  showIcon = false,
  size = 'md',
  variant = 'subtle',
  label,
  className,
}: RiskBadgeProps) {
  const config = riskConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const variantStyles = {
    filled: config.filled,
    outline: cn(config.outline, 'border'),
    subtle: config.subtle,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeStyles.padding,
        sizeStyles.text,
        sizeStyles.gap,
        variantStyles[variant],
        className
      )}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      {showIcon && <Icon size={sizeStyles.iconSize} aria-hidden="true" />}
      <span>{label || config.label}</span>
    </span>
  );
}

/**
 * RiskIndicator - Minimal dot indicator for compact spaces
 *
 * @example
 * <RiskIndicator level="high" />
 */
export interface RiskIndicatorProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function RiskIndicator({
  level,
  size = 'md',
  pulse = false,
  className,
}: RiskIndicatorProps) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const bgColors: Record<RiskLevel, string> = {
    low: 'bg-risk-low',
    moderate: 'bg-risk-moderate',
    high: 'bg-risk-high',
    critical: 'bg-risk-critical',
  };

  return (
    <span
      className={cn(
        'relative inline-flex',
        className
      )}
      role="status"
      aria-label={`Risk: ${level}`}
    >
      <span
        className={cn(
          'rounded-full',
          dotSizes[size],
          bgColors[level]
        )}
      />
      {pulse && (level === 'high' || level === 'critical') && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-75',
            bgColors[level]
          )}
        />
      )}
    </span>
  );
}

/**
 * getRiskLevel - Utility function to determine risk level from score
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'low';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'high';
  return 'critical';
}

export default RiskBadge;
