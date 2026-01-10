/**
 * ActivityRing Component - AI Sports Agent
 *
 * iOS-style concentric rings for multi-metric visualization.
 * Perfect for displaying mood, confidence, and stress in one compact view.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const activityRingVariants = cva(['relative inline-flex items-center justify-center'], {
  variants: {
    size: {
      sm: 'w-24 h-24',
      md: 'w-32 h-32',
      lg: 'w-40 h-40',
      xl: 'w-56 h-56',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Size-specific configurations
const sizeConfig = {
  sm: { baseRadius: 40, stroke: 4 },
  md: { baseRadius: 56, stroke: 6 },
  lg: { baseRadius: 72, stroke: 8 },
  xl: { baseRadius: 100, stroke: 10 },
};

// Color mapping
const colorMap = {
  primary: {
    light: 'hsl(var(--primary-600))',
    dark: 'hsl(var(--primary-500))',
  },
  secondary: {
    light: 'hsl(var(--secondary-600))',
    dark: 'hsl(var(--secondary-500))',
  },
  success: {
    light: 'hsl(var(--success-600))',
    dark: 'hsl(var(--success-500))',
  },
  warning: {
    light: 'hsl(var(--warning-600))',
    dark: 'hsl(var(--warning-500))',
  },
  danger: {
    light: 'hsl(var(--danger-600))',
    dark: 'hsl(var(--danger-500))',
  },
  info: {
    light: 'hsl(var(--info-600))',
    dark: 'hsl(var(--info-500))',
  },
};

export interface Ring {
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
   * Color variant for this ring
   */
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  /**
   * Label for this metric
   */
  label: string;
}

export interface ActivityRingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof activityRingVariants> {
  /**
   * Array of rings to display (inner to outer)
   */
  rings: Ring[];
  /**
   * Spacing between rings in pixels
   * @default 4
   */
  spacing?: number;
  /**
   * Show labels below the rings
   * @default false
   */
  showLabels?: boolean;
  /**
   * Enable stagger animation on mount
   * @default true
   */
  animated?: boolean;
}

export const ActivityRing = React.forwardRef<HTMLDivElement, ActivityRingProps>(
  (
    {
      className,
      rings,
      size = 'md',
      spacing = 4,
      showLabels = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const [hoveredRing, setHoveredRing] = React.useState<number | null>(null);
    const [isDark, setIsDark] = React.useState(false);

    // Detect dark mode
    React.useEffect(() => {
      const checkDarkMode = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      checkDarkMode();

      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }, []);

    const config = sizeConfig[size as keyof typeof sizeConfig];
    const strokeWidth = config.stroke;

    // Calculate ring radii from outer to inner
    const ringData = rings.map((ring, index) => {
      const radius = config.baseRadius - index * (strokeWidth + spacing);
      const circumference = 2 * Math.PI * radius;
      const percentage = Math.min(Math.max((ring.value / (ring.max || 100)) * 100, 0), 100);
      const dashOffset = circumference - (percentage / 100) * circumference;

      return {
        ...ring,
        radius,
        circumference,
        dashOffset,
        percentage,
      };
    });

    const svgSize = config.baseRadius * 2 + strokeWidth * 2;
    const center = svgSize / 2;

    return (
      <div
        ref={ref}
        className={cn(activityRingVariants({ size }), className)}
        {...props}
      >
        <div className="relative flex flex-col items-center">
          {/* SVG Rings */}
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="transform -rotate-90"
          >
            {ringData.map((ring, index) => {
              const strokeColor = isDark
                ? colorMap[ring.color].dark
                : colorMap[ring.color].light;

              return (
                <g key={index}>
                  {/* Background track */}
                  <circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={0.15}
                  />

                  {/* Progress ring */}
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={ring.circumference}
                    initial={animated ? { strokeDashoffset: ring.circumference } : undefined}
                    animate={{ strokeDashoffset: ring.dashOffset }}
                    transition={
                      animated
                        ? {
                            type: 'spring',
                            stiffness: 100,
                            damping: 20,
                            delay: index * 0.15, // Stagger animation
                          }
                        : undefined
                    }
                    style={{
                      opacity: hoveredRing === null || hoveredRing === index ? 1 : 0.4,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={() => setHoveredRing(index)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className="cursor-pointer"
                  />
                </g>
              );
            })}
          </svg>

          {/* Labels */}
          {showLabels && (
            <div className="flex gap-4 mt-4 flex-wrap justify-center">
              {ringData.map((ring, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                  onMouseEnter={() => setHoveredRing(index)}
                  onMouseLeave={() => setHoveredRing(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: isDark
                        ? colorMap[ring.color].dark
                        : colorMap[ring.color].light,
                    }}
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {ring.label}: {Math.round(ring.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Hover tooltip */}
          {hoveredRing !== null && !showLabels && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-center">
                <div className="text-xs font-medium mb-0.5">
                  {ringData[hoveredRing].label}
                </div>
                <div className="text-lg font-bold font-mono">
                  {Math.round(ringData[hoveredRing].percentage)}%
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

ActivityRing.displayName = 'ActivityRing';
