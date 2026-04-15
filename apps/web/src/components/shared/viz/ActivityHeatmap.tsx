'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface HeatmapDataPoint {
  date: string;
  count: number;
  mood?: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDataPoint[];
  days?: number;
  colorScheme?: 'ember' | 'accent';
  showMonthLabels?: boolean;
  showDayLabels?: boolean;
  onCellClick?: (date: string) => void;
  className?: string;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function getColorVar(scheme: 'ember' | 'accent'): string {
  return scheme === 'ember' ? 'var(--primary)' : 'var(--accent)';
}

const OPACITY_MAP: Record<number, number> = {
  0: 0.06,
  1: 0.15,
  2: 0.35,
  3: 0.60,
  4: 0.90,
};

export function ActivityHeatmap({
  data,
  days = 365,
  colorScheme = 'ember',
  showMonthLabels = true,
  showDayLabels = true,
  onCellClick,
  className,
}: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: HeatmapDataPoint & { level: number } } | null>(null);

  const { grid, monthPositions, maxCount, stats } = useMemo(() => {
    // Build a lookup map
    const dataMap = new Map<string, HeatmapDataPoint>();
    for (const d of data) {
      dataMap.set(d.date, d);
    }

    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Go back `days` days
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);

    // Align to Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const cells: { date: string; count: number; mood?: number; week: number; day: number; level: number }[] = [];
    const months: { name: string; week: number }[] = [];

    let mc = 0;
    for (const d of data) {
      if (d.count > mc) mc = d.count;
    }

    const current = new Date(startDate);
    let week = 0;
    let lastMonth = -1;
    let activeDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const day = current.getDay();

      if (day === 0 && current > startDate) week++;

      const month = current.getMonth();
      if (month !== lastMonth) {
        months.push({ name: MONTH_NAMES[month], week });
        lastMonth = month;
      }

      const point = dataMap.get(dateStr);
      const count = point?.count || 0;
      const level = getIntensityLevel(count, mc || 1);

      cells.push({
        date: dateStr,
        count,
        mood: point?.mood,
        week,
        day,
        level,
      });

      if (count > 0) {
        activeDays++;
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      current.setDate(current.getDate() + 1);
    }

    // Calculate current streak from today backwards
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].count > 0) currentStreak++;
      else break;
    }

    return {
      grid: cells,
      monthPositions: months,
      maxCount: mc,
      stats: { activeDays, currentStreak, maxStreak, totalDays: cells.length },
    };
  }, [data, days]);

  const colorVar = getColorVar(colorScheme);
  const cellSize = 12;
  const gap = 2;
  const step = cellSize + gap;
  const labelWidth = showDayLabels ? 28 : 0;
  const headerHeight = showMonthLabels ? 16 : 0;
  const totalWeeks = grid.length > 0 ? grid[grid.length - 1].week + 1 : 0;
  const svgWidth = labelWidth + totalWeeks * step;
  const svgHeight = headerHeight + 7 * step;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
          role="img"
          aria-label={`Activity heatmap: ${stats.activeDays} active days`}
        >
          {/* Month labels */}
          {showMonthLabels && monthPositions.map((m, i) => (
            <text
              key={`month-${i}`}
              x={labelWidth + m.week * step}
              y={12}
              className="fill-muted-foreground"
              fontSize={9}
              fontFamily="inherit"
            >
              {m.name}
            </text>
          ))}

          {/* Day labels */}
          {showDayLabels && DAY_LABELS.map((label, i) => (
            label ? (
              <text
                key={`day-${i}`}
                x={0}
                y={headerHeight + i * step + cellSize - 2}
                className="fill-muted-foreground"
                fontSize={9}
                fontFamily="inherit"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {grid.map((cell, i) => (
            <rect
              key={i}
              x={labelWidth + cell.week * step}
              y={headerHeight + cell.day * step}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={`hsl(${colorVar})`}
              fillOpacity={OPACITY_MAP[cell.level]}
              className={onCellClick ? 'cursor-pointer' : ''}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  data: { date: cell.date, count: cell.count, mood: cell.mood, level: cell.level },
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onCellClick?.(cell.date)}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip (rendered as overlay) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-border rounded-md shadow-lg px-3 py-2 text-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-medium text-foreground">{new Date(tooltip.data.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <p className="text-muted-foreground">
            {tooltip.data.count} check-in{tooltip.data.count !== 1 ? 's' : ''}
            {tooltip.data.mood !== undefined && ` • Mood: ${tooltip.data.mood.toFixed(1)}`}
          </p>
        </div>
      )}

      {/* Summary stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><span className="font-medium text-foreground">{stats.activeDays}</span> active days</span>
        <span><span className="font-medium text-foreground">{stats.currentStreak}</span> day streak</span>
        <span><span className="font-medium text-foreground">{stats.maxStreak}</span> best streak</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="rounded-sm"
            style={{
              width: 10,
              height: 10,
              backgroundColor: `hsl(${colorVar})`,
              opacity: OPACITY_MAP[level],
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
