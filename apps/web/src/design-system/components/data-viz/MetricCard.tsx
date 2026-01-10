/**
 * MetricCard Component - AI Sports Agent
 *
 * Enhanced Card variant with gradient backgrounds for data emphasis.
 * Integrates Sparkline and AnimatedCounter for rich metric visualization.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '../Card';
import { Sparkline } from './Sparkline';
import { AnimatedCounter } from './AnimatedCounter';

const metricCardVariants = cva([], {
  variants: {
    gradient: {
      primary: [
        'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900',
        'border-primary-200 dark:border-primary-800',
      ],
      secondary: [
        'bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-950 dark:to-secondary-900',
        'border-secondary-200 dark:border-secondary-800',
      ],
      success: [
        'bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950 dark:to-success-900',
        'border-success-200 dark:border-success-800',
      ],
      warning: [
        'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950 dark:to-warning-900',
        'border-warning-200 dark:border-warning-800',
      ],
      danger: [
        'bg-gradient-to-br from-danger-50 to-danger-100 dark:from-danger-950 dark:to-danger-900',
        'border-danger-200 dark:border-danger-800',
      ],
      neutral: [
        'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
        'border-gray-200 dark:border-gray-700',
      ],
    },
  },
  defaultVariants: {
    gradient: 'neutral',
  },
});

export interface MetricCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof metricCardVariants> {
  /**
   * Metric label
   */
  label: string;
  /**
   * Current metric value
   */
  value: number;
  /**
   * Number of decimal places
   * @default 0
   */
  decimals?: number;
  /**
   * Value prefix (e.g., "$", "#")
   */
  prefix?: string;
  /**
   * Value suffix (e.g., "%", "pts")
   */
  suffix?: string;
  /**
   * Trend direction
   */
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Trend value to display
   */
  trendValue?: string;
  /**
   * Optional sparkline data
   */
  sparkline?: number[];
  /**
   * Optional icon element
   */
  icon?: React.ReactNode;
  /**
   * Additional description
   */
  description?: string;
  /**
   * Show sparkline
   * @default true if sparkline data provided
   */
  showSparkline?: boolean;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      label,
      value,
      decimals = 0,
      prefix,
      suffix,
      trend,
      trendValue,
      sparkline,
      icon,
      description,
      gradient = 'neutral',
      showSparkline = !!sparkline,
      ...props
    },
    ref
  ) => {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    const trendColors = {
      up: 'text-success-600 dark:text-success-400',
      down: 'text-danger-600 dark:text-danger-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    };

    return (
      <Card
        ref={ref}
        variant="elevated"
        padding="lg"
        className={cn(metricCardVariants({ gradient }), className)}
        {...props}
      >
        <div className="flex flex-col gap-4">
          {/* Header: Label and Icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="text-gray-600 dark:text-gray-400">
                  {icon}
                </div>
              )}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {label}
              </span>
            </div>

            {/* Trend indicator */}
            {trend && trendValue && (
              <div className={cn('flex items-center gap-1 text-sm font-semibold', trendColors[trend])}>
                <TrendIcon className="w-4 h-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>

          {/* Value Display */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <AnimatedCounter
                value={value}
                decimals={decimals}
                prefix={prefix}
                suffix={suffix}
                className="text-3xl md:text-4xl"
              />
              {description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>

            {/* Sparkline */}
            {showSparkline && sparkline && sparkline.length > 0 && (
              <div className="flex-shrink-0">
                <Sparkline
                  data={sparkline}
                  height={50}
                  width={120}
                  color={gradient === 'neutral' ? 'primary' : (gradient as any)}
                  showDots={false}
                  showArea={true}
                  showTooltip={false}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';
