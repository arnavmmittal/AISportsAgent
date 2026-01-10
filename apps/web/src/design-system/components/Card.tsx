/**
 * Card Component - AI Sports Agent
 *
 * Athletic minimalist card system for data displays, metrics, and content containers.
 * Designed with precision and clarity for performance-focused interfaces.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  // Base styles - precision athletic container
  [
    'rounded-lg',
    'transition-all duration-base',
    'relative',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        // Default - Clean with subtle border
        default: [
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-800',
          'shadow-sm',
        ],
        // Elevated - Prominent with stronger shadow
        elevated: [
          'bg-white dark:bg-gray-900',
          'border border-gray-100 dark:border-gray-800',
          'shadow-md',
        ],
        // Glass - Modern glassmorphism effect
        glass: [
          'bg-white/80 dark:bg-gray-900/80',
          'backdrop-blur-xl',
          'border border-gray-200/50 dark:border-gray-800/50',
          'shadow-lg',
        ],
        // Flat - Minimal, no shadow
        flat: [
          'bg-gray-50 dark:bg-gray-800/50',
          'border-0',
        ],
        // Gradient - Subtle gradient background
        gradient: [
          'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800',
          'border border-gray-200/50 dark:border-gray-700/50',
          'shadow-sm',
        ],
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:shadow-lg',
          'hover:border-primary-300 dark:hover:border-primary-700',
          'active:scale-[0.99]',
        ],
        false: '',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      padding = 'md',
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    const MotionDiv = motion.div;
    const shouldAnimate = interactive || hover;

    return (
      <MotionDiv
        ref={ref}
        className={cn(cardVariants({ variant, interactive, padding, className }))}
        {...(shouldAnimate && {
          whileHover: {
            y: -2,
            transition: { duration: 0.2, ease: 'easeOut' }
          }
        })}
        {...props}
      >
        {children}
      </MotionDiv>
    );
  }
);

Card.displayName = 'Card';

// CardHeader - Top section for titles and actions
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5',
      'border-b border-gray-100 dark:border-gray-800',
      'pb-4 mb-4',
      className
    )}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

// CardTitle - Main heading
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-display font-semibold text-lg tracking-tight',
      'text-gray-900 dark:text-gray-100',
      'leading-tight',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

// CardDescription - Supporting text
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-gray-600 dark:text-gray-400',
      'font-body leading-relaxed',
      className
    )}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

// CardContent - Main content area
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-body', className)}
    {...props}
  />
));

CardContent.displayName = 'CardContent';

// CardFooter - Bottom section for actions
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-2',
      'border-t border-gray-100 dark:border-gray-800',
      'pt-4 mt-4',
      className
    )}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// CardMetric - Specialized component for displaying key metrics
interface CardMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
}

const CardMetric = React.forwardRef<HTMLDivElement, CardMetricProps>(
  ({ className, label, value, trend, trendValue, icon, ...props }, ref) => {
    const trendColors = {
      up: 'text-success-600 dark:text-success-400',
      down: 'text-danger-600 dark:text-danger-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    };

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1', className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-gray-500 dark:text-gray-400">
              {icon}
            </span>
          )}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {value}
          </span>
          {trend && trendValue && (
            <span className={cn('text-sm font-semibold flex items-center gap-0.5', trendColors[trend])}>
              <span>{trendIcons[trend]}</span>
              <span>{trendValue}</span>
            </span>
          )}
        </div>
      </div>
    );
  }
);

CardMetric.displayName = 'CardMetric';

// CardStat - Compact stat display for grids
interface CardStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subValue?: string;
}

const CardStat = React.forwardRef<HTMLDivElement, CardStatProps>(
  ({ className, label, value, subValue, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col', className)}
      {...props}
    >
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </span>
      <span className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
        {value}
      </span>
      {subValue && (
        <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {subValue}
        </span>
      )}
    </div>
  )
);

CardStat.displayName = 'CardStat';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMetric,
  CardStat,
  cardVariants,
};
