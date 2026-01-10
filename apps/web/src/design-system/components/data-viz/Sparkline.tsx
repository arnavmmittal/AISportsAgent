/**
 * Sparkline Component - AI Sports Agent
 *
 * Compact 7-day trend visualization with smooth curves and hover tooltips.
 * Pure SVG implementation with manual Bezier curve math for lightweight performance.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of data values to plot
   */
  data: number[];
  /**
   * Height of the sparkline in pixels
   * @default 40
   */
  height?: number;
  /**
   * Width of the sparkline in pixels
   * @default 120
   */
  width?: number;
  /**
   * Color variant
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  /**
   * Show dots at data points
   * @default false
   */
  showDots?: boolean;
  /**
   * Show filled area under the line
   * @default false
   */
  showArea?: boolean;
  /**
   * Show tooltip on hover
   * @default true
   */
  showTooltip?: boolean;
  /**
   * Format function for tooltip values
   */
  formatValue?: (value: number, index: number) => string;
  /**
   * Smooth curve tension (0 = straight lines, 1 = very curved)
   * @default 0.3
   */
  tension?: number;
}

// Color mapping to CSS variables
const colorMap = {
  primary: 'hsl(var(--primary-600))',
  secondary: 'hsl(var(--secondary-600))',
  success: 'hsl(var(--success-600))',
  warning: 'hsl(var(--warning-600))',
  danger: 'hsl(var(--danger-600))',
  info: 'hsl(var(--info-600))',
};

const colorMapDark = {
  primary: 'hsl(var(--primary-500))',
  secondary: 'hsl(var(--secondary-500))',
  success: 'hsl(var(--success-500))',
  warning: 'hsl(var(--warning-500))',
  danger: 'hsl(var(--danger-500))',
  info: 'hsl(var(--info-500))',
};

/**
 * Generate smooth Bezier curve path through points
 */
function generateSmoothPath(
  points: { x: number; y: number }[],
  tension: number = 0.3
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  const path: string[] = [];
  path.push(`M ${points[0].x},${points[0].y}`);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p_1 = i > 0 ? points[i - 1] : p0;
    const p2 = i < points.length - 2 ? points[i + 2] : p1;

    // Calculate control points for cubic Bezier curve
    const cp1x = p0.x + ((p1.x - p_1.x) * tension);
    const cp1y = p0.y + ((p1.y - p_1.y) * tension);
    const cp2x = p1.x - ((p2.x - p0.x) * tension);
    const cp2y = p1.y - ((p2.y - p0.y) * tension);

    path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`);
  }

  return path.join(' ');
}

export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  (
    {
      className,
      data,
      height = 40,
      width = 120,
      color = 'primary',
      showDots = false,
      showArea = false,
      showTooltip = true,
      formatValue,
      tension = 0.3,
      ...props
    },
    ref
  ) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
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

    if (!data || data.length === 0) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center justify-center text-gray-400 text-xs', className)}
          style={{ height, width }}
        >
          No data
        </div>
      );
    }

    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate min/max for scaling
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Convert data to points
    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1 || 1)) * chartWidth,
      y: padding + chartHeight - ((value - minValue) / valueRange) * chartHeight,
      value,
      index,
    }));

    const linePath = generateSmoothPath(points, tension);

    // Area path (same as line but closed at bottom)
    const areaPath = showArea
      ? `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
      : '';

    const strokeColor = isDark ? colorMapDark[color] : colorMap[color];

    return (
      <div
        ref={ref}
        className={cn('relative inline-block', className)}
        style={{ width, height }}
        {...props}
      >
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Area fill */}
          {showArea && (
            <path
              d={areaPath}
              fill={strokeColor}
              opacity={0.1}
              className="transition-opacity duration-200"
            />
          )}

          {/* Line path */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Data points */}
          {showDots &&
            points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={strokeColor}
                className="transition-all duration-200"
                style={{
                  opacity: hoveredIndex === index ? 1 : 0.6,
                  transform: hoveredIndex === index ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}

          {/* Last point with pulse animation */}
          <motion.circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={3}
            fill={strokeColor}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          />

          {/* Hover target areas */}
          {showTooltip &&
            points.map((point, index) => (
              <rect
                key={`hover-${index}`}
                x={point.x - 8}
                y={0}
                width={16}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                className="cursor-pointer"
              />
            ))}
        </svg>

        {/* Tooltip */}
        {showTooltip && hoveredIndex !== null && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 pointer-events-none"
              style={{
                left: points[hoveredIndex].x,
                top: points[hoveredIndex].y - 30,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-mono font-semibold shadow-lg whitespace-nowrap">
                {formatValue
                  ? formatValue(points[hoveredIndex].value, hoveredIndex)
                  : points[hoveredIndex].value.toFixed(1)}
              </div>
              {/* Tooltip arrow */}
              <div
                className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 transform -translate-x-1/2 rotate-45"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  }
);

Sparkline.displayName = 'Sparkline';
