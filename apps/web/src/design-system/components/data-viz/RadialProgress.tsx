/**
 * RadialProgress Component - AI Sports Agent
 *
 * Professional circular progress indicator for goals, readiness, and completion metrics.
 * Features smooth spring animations and athletic minimalist aesthetics.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

const radialProgressVariants = cva(
  // Base styles
  ['relative inline-flex items-center justify-center'],
  {
    variants: {
      size: {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-48 h-48',
      },
      color: {
        primary: 'text-primary-600 dark:text-primary-500',
        secondary: 'text-secondary-600 dark:text-secondary-500',
        success: 'text-success-600 dark:text-success-500',
        warning: 'text-warning-600 dark:text-warning-500',
        danger: 'text-danger-600 dark:text-danger-500',
        info: 'text-info-600 dark:text-info-500',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

// Size-specific dimensions for SVG elements
const sizeConfig = {
  sm: { radius: 28, stroke: 4, fontSize: 'text-sm' },
  md: { radius: 42, stroke: 6, fontSize: 'text-lg' },
  lg: { radius: 58, stroke: 8, fontSize: 'text-2xl' },
  xl: { radius: 90, stroke: 10, fontSize: 'text-4xl' },
};

export interface RadialProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof radialProgressVariants> {
  /**
   * Current value (0 to max)
   */
  value: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Show percentage value in center
   * @default true
   */
  showValue?: boolean;
  /**
   * Label displayed below the circle
   */
  label?: string;
  /**
   * Enable smooth spring animation
   * @default true
   */
  animated?: boolean;
  /**
   * Stroke width (overrides size-based default)
   */
  thickness?: number;
  /**
   * Show background track
   * @default true
   */
  showTrack?: boolean;
}

const RadialProgress = React.forwardRef<HTMLDivElement, RadialProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 'md',
      color = 'primary',
      showValue = true,
      label,
      animated = true,
      thickness,
      showTrack = true,
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size as keyof typeof sizeConfig];
    const strokeWidth = thickness || config.stroke;
    const radius = config.radius;

    // Calculate SVG dimensions
    const svgSize = (radius + strokeWidth) * 2;
    const center = svgSize / 2;
    const circumference = 2 * Math.PI * radius;

    // Clamp percentage to 0-100
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Animated progress value with spring physics
    const progress = useSpring(0, {
      stiffness: 300,
      damping: 30,
    });

    React.useEffect(() => {
      if (animated) {
        progress.set(percentage);
      }
    }, [percentage, animated, progress]);

    // Transform progress value to stroke dashoffset
    const dashOffset = useTransform(
      progress,
      [0, 100],
      [circumference, 0]
    );

    // For non-animated mode, use direct calculation
    const staticDashOffset = circumference - (percentage / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn(radialProgressVariants({ size, color }), className)}
        {...props}
      >
        <div className="relative flex flex-col items-center">
          {/* SVG Circle */}
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="transform -rotate-90"
          >
            {/* Background track */}
            {showTrack && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-gray-800 opacity-30"
              />
            )}

            {/* Progress circle */}
            {animated ? (
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
                className="transition-colors duration-300"
              />
            ) : (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={staticDashOffset}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>

          {/* Center content - value display */}
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={value}
                initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
                animate={animated ? { scale: 1, opacity: 1 } : undefined}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  'font-mono font-bold tabular-nums',
                  config.fontSize
                )}
              >
                {Math.round(percentage)}
              </motion.span>
              <span className={cn('text-xs font-medium ml-0.5 mt-1', config.fontSize === 'text-sm' ? 'text-[8px]' : '')}>
                %
              </span>
            </div>
          )}

          {/* Label */}
          {label && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 text-center max-w-full px-2">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }
);

RadialProgress.displayName = 'RadialProgress';

export { RadialProgress, radialProgressVariants };
