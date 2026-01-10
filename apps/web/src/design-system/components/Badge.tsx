/**
 * Badge Component - AI Sports Agent
 *
 * Status indicators, tags, and labels for athletic performance data.
 * Precision-focused with clear semantic colors.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { pulse as pulseVariant } from '../motion';

const badgeVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-1',
    'rounded-full font-medium',
    'transition-colors duration-fast',
    'select-none',
  ],
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
        success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
        danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
        info: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
        outline: 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
      dot: {
        true: 'pl-1.5',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      dotColor,
      icon,
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const Component = pulse ? motion.div : 'div';

    return (
      <Component
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot, className }))}
        {...(pulse && {
          variants: pulseVariant,
          initial: 'rest',
          animate: 'animate',
        })}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              dotColor || 'bg-current'
            )}
            style={dotColor ? { backgroundColor: dotColor } : undefined}
          />
        )}
        {icon && (
          <span className="inline-flex items-center">
            {icon}
          </span>
        )}
        {children}
      </Component>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
