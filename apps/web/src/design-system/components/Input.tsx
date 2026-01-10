/**
 * Input Component - AI Sports Agent
 *
 * Precision-focused input fields for forms, search, and data entry.
 * Athletic minimalism with clear visual states.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  // Base styles
  [
    'flex w-full rounded-md',
    'font-body text-sm',
    'border border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'placeholder:text-gray-500 dark:placeholder:text-gray-400',
    'transition-all duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
      },
      variant: {
        default: '',
        filled: 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-gray-300 dark:hover:border-gray-700',
        ghost: 'border-transparent hover:border-gray-300 dark:hover:border-gray-700',
      },
      state: {
        default: '',
        error: 'border-danger-500 focus-visible:ring-danger-500 focus-visible:border-danger-500',
        success: 'border-success-500 focus-visible:ring-success-500 focus-visible:border-success-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size = 'md',
      variant = 'default',
      state = 'default',
      leftIcon,
      rightIcon,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const inputState = error ? 'error' : state;
    const hasIcon = leftIcon || rightIcon;

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-400',
              size === 'sm' && 'w-8',
              size === 'md' && 'w-10',
              size === 'lg' && 'w-12'
            )}>
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ size, variant, state: inputState, className }),
              leftIcon && (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12'),
              rightIcon && (size === 'sm' ? 'pr-8' : size === 'md' ? 'pr-10' : 'pr-12')
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-400',
              size === 'sm' && 'w-8',
              size === 'md' && 'w-10',
              size === 'lg' && 'w-12'
            )}>
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={cn(
            'mt-1.5 text-xs font-medium',
            error ? 'text-danger-600 dark:text-danger-400' : 'text-gray-600 dark:text-gray-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
