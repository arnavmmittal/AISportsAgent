/**
 * Button Component - AI Sports Agent
 *
 * Professional athletic minimalist button with performance-focused micro-interactions.
 * Designed for Whoop/Strava-quality user experience.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles - athletic minimalism foundation
  [
    'inline-flex items-center justify-center gap-2',
    'font-display font-medium tracking-wide',
    'rounded-md transition-all duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50',
    'select-none touch-manipulation',
    'relative overflow-hidden',
    // Performance-focused active state
    'active:scale-[0.98] active:transition-transform active:duration-75',
  ],
  {
    variants: {
      variant: {
        // Primary - Energetic gradient with glow
        primary: [
          'bg-gradient-to-r from-primary-500 to-primary-600',
          'text-white font-semibold',
          'shadow-md shadow-primary-500/20',
          'hover:shadow-lg hover:shadow-primary-500/30',
          'hover:from-primary-600 hover:to-primary-700',
          'border border-primary-600/20',
        ],
        // Secondary - Refined purple accent
        secondary: [
          'bg-gradient-to-r from-secondary-500 to-secondary-600',
          'text-white font-semibold',
          'shadow-md shadow-secondary-500/20',
          'hover:shadow-lg hover:shadow-secondary-500/30',
          'hover:from-secondary-600 hover:to-secondary-700',
          'border border-secondary-600/20',
        ],
        // Outline - Clean and precise
        outline: [
          'border-2 border-gray-300 dark:border-gray-700',
          'bg-transparent',
          'text-gray-700 dark:text-gray-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'hover:border-gray-400 dark:hover:border-gray-600',
          'shadow-sm',
        ],
        // Ghost - Minimal with subtle hover
        ghost: [
          'bg-transparent',
          'text-gray-700 dark:text-gray-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'hover:text-gray-900 dark:hover:text-gray-100',
        ],
        // Danger - Alert state
        danger: [
          'bg-gradient-to-r from-danger-500 to-danger-600',
          'text-white font-semibold',
          'shadow-md shadow-danger-500/20',
          'hover:shadow-lg hover:shadow-danger-500/30',
          'hover:from-danger-600 hover:to-danger-700',
          'border border-danger-600/20',
        ],
        // Success - Achievement state
        success: [
          'bg-gradient-to-r from-success-500 to-success-600',
          'text-white font-semibold',
          'shadow-md shadow-success-500/20',
          'hover:shadow-lg hover:shadow-success-500/30',
          'hover:from-success-600 hover:to-success-700',
          'border border-success-600/20',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
        xl: 'h-14 px-8 text-lg gap-3',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

// Shimmer effect for premium feel on primary buttons
const shimmerVariants = {
  initial: { x: '-100%' },
  hover: {
    x: '100%',
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    }
  },
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      asChild = false,
      loading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      loadingText,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : motion.button;
    const isDisabled = disabled || loading;

    // Show shimmer on primary variants for premium feel
    const showShimmer = variant === 'primary' || variant === 'secondary' || variant === 'success';

    const content = (
      <>
        {/* Shimmer effect overlay */}
        {showShimmer && !loading && !disabled && (
          <motion.div
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial="initial"
            whileHover="hover"
            variants={shimmerVariants}
          />
        )}

        {/* Loading spinner */}
        {loading && (
          <Loader2
            className={cn(
              'animate-spin',
              size === 'sm' && 'h-3 w-3',
              size === 'md' && 'h-4 w-4',
              size === 'lg' && 'h-5 w-5',
              size === 'xl' && 'h-6 w-6'
            )}
          />
        )}

        {/* Left icon */}
        {!loading && leftIcon && (
          <span className={cn(
            'inline-flex shrink-0',
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5',
            size === 'xl' && 'h-6 w-6'
          )}>
            {leftIcon}
          </span>
        )}

        {/* Button text */}
        <span className="relative z-10 truncate">
          {loading && loadingText ? loadingText : children}
        </span>

        {/* Right icon */}
        {!loading && rightIcon && (
          <span className={cn(
            'inline-flex shrink-0',
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5',
            size === 'xl' && 'h-6 w-6'
          )}>
            {rightIcon}
          </span>
        )}
      </>
    );

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        whileHover={{
          scale: isDisabled ? 1 : 1.02,
          transition: { duration: 0.15 }
        }}
        whileTap={{
          scale: isDisabled ? 1 : 0.98,
          transition: { duration: 0.05 }
        }}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
