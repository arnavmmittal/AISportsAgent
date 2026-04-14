/**
 * StatCard Component
 * Dashboard metric cards with optional trends and icons
 */

import { cn } from '@/lib/utils';
import TrendArrow from './TrendArrow';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendInverse?: boolean; // true if down is good
  icon?: ReactNode;
  iconBg?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const VARIANT_STYLES = {
  default: {
    border: 'border-border',
    bg: 'bg-card',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    border: 'border-success/30',
    bg: 'bg-success/5',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    border: 'border-warning/30',
    bg: 'bg-warning/5',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  danger: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/5',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendInverse = false,
  icon,
  iconBg,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all duration-200',
        styles.border,
        styles.bg,
        isClickable && 'cursor-pointer hover:bg-muted/50 hover:border-muted-foreground/30',
        className
      )}
      onClick={onClick}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {icon && (
          <div
            className={cn(
              'p-2 rounded-md',
              iconBg || styles.iconBg,
              styles.iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {trend !== undefined && (
          <TrendArrow value={trend} inverse={trendInverse} size="md" />
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

// Compact variant for smaller spaces
export function StatCardCompact({
  title,
  value,
  trend,
  trendInverse,
  variant = 'default',
}: Pick<StatCardProps, 'title' | 'value' | 'trend' | 'trendInverse' | 'variant'>) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        'rounded-md border p-3',
        styles.border,
        styles.bg
      )}
    >
      <div className="text-xs font-medium text-muted-foreground mb-1">
        {title}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {trend !== undefined && (
          <TrendArrow value={trend} inverse={trendInverse} size="sm" />
        )}
      </div>
    </div>
  );
}

// Grid layout helper for stat cards
export function StatCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
