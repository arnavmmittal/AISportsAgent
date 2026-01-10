/**
 * AnimatedCounter Component - AI Sports Agent
 *
 * Numbers that spring into place when values change.
 * Uses Framer Motion's spring physics for natural, athletic animations.
 */

import * as React from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The numeric value to display
   */
  value: number;
  /**
   * Number of decimal places to show
   * @default 0
   */
  decimals?: number;
  /**
   * Animation duration in milliseconds
   * @default 800
   */
  duration?: number;
  /**
   * Prefix text (e.g., "$", "#")
   */
  prefix?: string;
  /**
   * Suffix text (e.g., "%", "/10", "pts")
   */
  suffix?: string;
  /**
   * Animation easing preset
   * @default 'spring'
   */
  ease?: 'spring' | 'linear' | 'easeOut';
  /**
   * Direction hint for color indication
   */
  direction?: 'up' | 'down' | 'neutral';
  /**
   * Spring stiffness (higher = faster/snappier)
   * @default 300
   */
  stiffness?: number;
  /**
   * Spring damping (higher = less bouncy)
   * @default 30
   */
  damping?: number;
}

export const AnimatedCounter = React.forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  (
    {
      className,
      value,
      decimals = 0,
      duration = 800,
      prefix = '',
      suffix = '',
      ease = 'spring',
      direction,
      stiffness = 300,
      damping = 30,
      ...props
    },
    ref
  ) => {
    // Spring configuration based on ease type
    const springConfig =
      ease === 'spring'
        ? { stiffness, damping }
        : ease === 'linear'
        ? { stiffness: 100, damping: 20, duration: duration / 1000 }
        : { stiffness: 200, damping: 35, duration: duration / 1000 };

    // Animated value with spring physics
    const spring = useSpring(value, springConfig);

    // Update spring when value changes
    React.useEffect(() => {
      spring.set(value);
    }, [value, spring]);

    // Transform spring value to formatted display
    const displayValue = useTransform(spring, (latest) => {
      return latest.toFixed(decimals);
    });

    // Direction-based color classes
    const directionColors = {
      up: 'text-success-600 dark:text-success-400',
      down: 'text-danger-600 dark:text-danger-400',
      neutral: 'text-gray-900 dark:text-gray-100',
    };

    const colorClass = direction ? directionColors[direction] : '';

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-baseline font-mono font-bold tabular-nums',
          colorClass,
          className
        )}
        style={{
          fontFeatureSettings: '"tnum"', // Tabular numbers for consistent width
        }}
        {...props}
      >
        {prefix && <span className="mr-0.5">{prefix}</span>}
        <motion.span>{displayValue}</motion.span>
        {suffix && <span className="ml-0.5">{suffix}</span>}
      </span>
    );
  }
);

AnimatedCounter.displayName = 'AnimatedCounter';

/**
 * Utility hook to use animated counter value in custom components
 */
export function useAnimatedNumber(
  value: number,
  options: {
    stiffness?: number;
    damping?: number;
    decimals?: number;
  } = {}
): MotionValue<string> {
  const { stiffness = 300, damping = 30, decimals = 0 } = options;

  const spring = useSpring(value, { stiffness, damping });

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return useTransform(spring, (latest) => latest.toFixed(decimals));
}
