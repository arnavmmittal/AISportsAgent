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
    border: 'border-slate-700',
    bg: 'bg-slate-800/50',
    iconBg: 'bg-secondary/20',
    iconColor: 'text-accent',
  },
  success: {
    border: 'border-secondary',
    bg: 'bg-secondary/10',
    iconBg: 'bg-secondary/20',
    iconColor: 'text-accent',
  },
  warning: {
    border: 'border-muted',
    bg: 'bg-muted/10',
    iconBg: 'bg-muted/20',
    iconColor: 'text-chrome',
  },
  danger: {
    border: 'border-muted-foreground',
    bg: 'bg-muted-foreground/10',
    iconBg: 'bg-muted-foreground/20',
    iconColor: 'text-chrome',
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
        isClickable && 'cursor-pointer hover:bg-slate-800/70 hover:border-slate-600',
        className
      )}
      onClick={onClick}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
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
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend !== undefined && (
          <TrendArrow value={trend} inverse={trendInverse} size="md" />
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-400">{subtitle}</p>
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
      <div className="text-xs font-medium text-slate-400 mb-1">
        {title}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-white">{value}</span>
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
