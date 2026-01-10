/**
 * HeatmapCalendar Component - AI Sports Agent
 *
 * 30-day mood/stress pattern visualization with color intensity.
 * GitHub-style contribution graph adapted for athletic performance tracking.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface HeatmapDataPoint {
  /**
   * Date for this data point
   */
  date: Date;
  /**
   * Value (will be mapped to color intensity)
   */
  value: number;
  /**
   * Optional label for tooltip
   */
  label?: string;
}

export interface HeatmapCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of data points
   */
  data: HeatmapDataPoint[];
  /**
   * Start date for the calendar
   */
  startDate: Date;
  /**
   * Color scale to use
   * @default 'primary'
   */
  colorScale?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /**
   * Size of each cell in pixels
   * @default 14
   */
  cellSize?: number;
  /**
   * Gap between cells in pixels
   * @default 3
   */
  gap?: number;
  /**
   * Number of days to display
   * @default 30
   */
  days?: number;
  /**
   * Show day labels
   * @default true
   */
  showDayLabels?: boolean;
  /**
   * Show month labels
   * @default true
   */
  showMonthLabels?: boolean;
}

// Color intensity levels (0-4, where 0 is empty and 4 is max)
const getColorClass = (
  value: number,
  maxValue: number,
  colorScale: string
): string => {
  if (value === 0 || maxValue === 0) {
    return 'bg-gray-100 dark:bg-gray-800';
  }

  const intensity = Math.ceil((value / maxValue) * 4);
  const colorMap: Record<string, string[]> = {
    primary: [
      'bg-primary-100 dark:bg-primary-950',
      'bg-primary-200 dark:bg-primary-900',
      'bg-primary-400 dark:bg-primary-700',
      'bg-primary-600 dark:bg-primary-500',
    ],
    success: [
      'bg-success-100 dark:bg-success-950',
      'bg-success-200 dark:bg-success-900',
      'bg-success-400 dark:bg-success-700',
      'bg-success-600 dark:bg-success-500',
    ],
    warning: [
      'bg-warning-100 dark:bg-warning-950',
      'bg-warning-200 dark:bg-warning-900',
      'bg-warning-400 dark:bg-warning-700',
      'bg-warning-600 dark:bg-warning-500',
    ],
    danger: [
      'bg-danger-100 dark:bg-danger-950',
      'bg-danger-200 dark:bg-danger-900',
      'bg-danger-400 dark:bg-danger-700',
      'bg-danger-600 dark:bg-danger-500',
    ],
    info: [
      'bg-info-100 dark:bg-info-950',
      'bg-info-200 dark:bg-info-900',
      'bg-info-400 dark:bg-info-700',
      'bg-info-600 dark:bg-info-500',
    ],
  };

  return colorMap[colorScale]?.[intensity - 1] || 'bg-gray-300';
};

export const HeatmapCalendar = React.forwardRef<HTMLDivElement, HeatmapCalendarProps>(
  (
    {
      className,
      data,
      startDate,
      colorScale = 'primary',
      cellSize = 14,
      gap = 3,
      days = 30,
      showDayLabels = true,
      showMonthLabels = true,
      ...props
    },
    ref
  ) => {
    const [hoveredCell, setHoveredCell] = React.useState<{
      date: Date;
      value: number;
      label?: string;
    } | null>(null);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

    // Generate calendar grid
    const calendarDays: Array<{
      date: Date;
      dataPoint?: HeatmapDataPoint;
      dayOfWeek: number;
      weekIndex: number;
    }> = [];

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    // Create a map of dates to data points for quick lookup
    const dataMap = new Map<string, HeatmapDataPoint>();
    data.forEach((point) => {
      const dateKey = point.date.toISOString().split('T')[0];
      dataMap.set(dateKey, point);
    });

    // Calculate max value for color scaling
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    // Generate all days from start to end
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dateKey = date.toISOString().split('T')[0];
      const dataPoint = dataMap.get(dateKey);

      calendarDays.push({
        date,
        dataPoint,
        dayOfWeek: date.getDay(),
        weekIndex: Math.floor(i / 7),
      });
    }

    // Group by weeks
    const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, weekIndex) =>
      calendarDays.filter((day) => day.weekIndex === weekIndex)
    );

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handleMouseMove = (e: React.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* Month labels */}
        {showMonthLabels && (
          <div className="flex gap-1 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {weeks.map((week, index) => {
              if (week.length === 0) return null;
              const firstDay = week[0].date;
              const monthName = firstDay.toLocaleDateString('en-US', {
                month: 'short',
              });

              // Only show month label if it's the first week or month changed
              const showLabel =
                index === 0 ||
                (index > 0 &&
                  weeks[index - 1][0]?.date.getMonth() !== firstDay.getMonth());

              return (
                <div
                  key={index}
                  className="flex-shrink-0"
                  style={{ width: cellSize }}
                >
                  {showLabel && monthName}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-1">
          {/* Day labels */}
          {showDayLabels && (
            <div className="flex flex-col gap-0.5 mr-2">
              {[1, 3, 5].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center"
                  style={{ height: cellSize }}
                >
                  {dayLabels[day]}
                </div>
              ))}
            </div>
          )}

          {/* Calendar grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week.find((d) => d.dayOfWeek === dayIndex);

                  if (!day) {
                    return (
                      <div
                        key={dayIndex}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }

                  const value = day.dataPoint?.value || 0;
                  const colorClass = getColorClass(value, maxValue, colorScale);

                  return (
                    <motion.div
                      key={day.date.toISOString()}
                      className={cn(
                        'rounded-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform',
                        colorClass
                      )}
                      style={{ width: cellSize, height: cellSize }}
                      whileHover={{ scale: 1.2 }}
                      onHoverStart={() => {
                        setHoveredCell({
                          date: day.date,
                          value,
                          label: day.dataPoint?.label,
                        });
                      }}
                      onHoverEnd={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: mousePosition.x + 12,
                top: mousePosition.y + 12,
              }}
            >
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm">
                <div className="font-semibold">
                  {hoveredCell.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-xs mt-1">
                  {hoveredCell.label || `Value: ${hoveredCell.value.toFixed(1)}`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

HeatmapCalendar.displayName = 'HeatmapCalendar';
