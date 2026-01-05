/**
 * HeatMap Component
 * Daily readiness snapshot, team-wide visualization, calendar heatmaps
 */

'use client';

import { cn } from '@/lib/utils';
import { EmptyChart } from '../ui/EmptyState';
import { ReadinessLevel } from '@/types/coach-portal';

interface HeatMapCell {
  label: string;
  value: number;
  level?: ReadinessLevel;
  metadata?: Record<string, any>;
}

interface HeatMapProps {
  data: HeatMapCell[][];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  cellSize?: number;
  showValues?: boolean;
  onCellClick?: (cell: HeatMapCell, x: number, y: number) => void;
  emptyMessage?: string;
  className?: string;
}

const READINESS_COLORS: Record<ReadinessLevel, string> = {
  [ReadinessLevel.OPTIMAL]: 'bg-secondary',
  [ReadinessLevel.GOOD]: 'bg-accent',
  [ReadinessLevel.MODERATE]: 'bg-muted',
  [ReadinessLevel.LOW]: 'bg-muted-foreground',
  [ReadinessLevel.POOR]: 'bg-muted-foreground/70',
};

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return ReadinessLevel.OPTIMAL;
  if (score >= 75) return ReadinessLevel.GOOD;
  if (score >= 60) return ReadinessLevel.MODERATE;
  if (score >= 45) return ReadinessLevel.LOW;
  return ReadinessLevel.POOR;
}

function getColorByValue(value: number, max: number = 100): string {
  const percentage = (value / max) * 100;
  if (percentage >= 90) return 'bg-secondary';
  if (percentage >= 75) return 'bg-accent';
  if (percentage >= 60) return 'bg-muted';
  if (percentage >= 45) return 'bg-muted-foreground';
  return 'bg-muted-foreground/70';
}

export default function HeatMap({
  data,
  xLabels,
  yLabels,
  title,
  cellSize = 40,
  showValues = false,
  onCellClick,
  emptyMessage,
  className,
}: HeatMapProps) {
  if (!data || data.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {title && (
        <h4 className="text-sm font-medium text-slate-300 mb-4">{title}</h4>
      )}

      <div className="inline-block min-w-full">
        {/* Header row with x-axis labels */}
        <div className="flex">
          <div style={{ width: cellSize * 2 }} /> {/* Spacer for y-labels */}
          {xLabels.map((label, index) => (
            <div
              key={index}
              className="text-xs text-slate-400 text-center font-medium"
              style={{ width: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center mt-1">
            {/* Y-axis label */}
            <div
              className="text-xs text-slate-400 text-right pr-2 font-medium"
              style={{ width: cellSize * 2 }}
            >
              {yLabels[rowIndex]}
            </div>

            {/* Cells */}
            {row.map((cell, cellIndex) => {
              const level = cell.level || getReadinessLevel(cell.value);
              const color = READINESS_COLORS[level];
              const isClickable = !!onCellClick;

              return (
                <div
                  key={cellIndex}
                  className={cn(
                    'rounded-sm flex items-center justify-center text-xs font-semibold text-white mr-1 transition-all',
                    color,
                    isClickable && 'cursor-pointer hover:ring-2 hover:ring-white/50 hover:scale-105'
                  )}
                  style={{ width: cellSize, height: cellSize }}
                  onClick={() => onCellClick?.(cell, cellIndex, rowIndex)}
                  title={`${cell.label}: ${cell.value}`}
                >
                  {showValues && cell.value}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="text-slate-400">Readiness:</span>
          <div className="flex items-center gap-2">
            <div className="bg-secondary w-4 h-4 rounded-sm" />
            <span className="text-slate-300">Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-accent w-4 h-4 rounded-sm" />
            <span className="text-slate-300">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted w-4 h-4 rounded-sm" />
            <span className="text-slate-300">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted-foreground w-4 h-4 rounded-sm" />
            <span className="text-slate-300">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted-foreground/70 w-4 h-4 rounded-sm" />
            <span className="text-slate-300">Poor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Daily team readiness snapshot (athletes x days)
export function DailyReadinessHeatMap({
  data,
  onCellClick,
}: {
  data: Array<{
    athleteName: string;
    readiness: Array<{ date: string; score: number }>;
  }>;
  onCellClick?: (athleteName: string, date: string, score: number) => void;
}) {
  if (!data || data.length === 0) {
    return <EmptyChart message="No readiness data available." />;
  }

  // Extract unique dates
  const dates = Array.from(
    new Set(data.flatMap((athlete) => athlete.readiness.map((r) => r.date)))
  ).sort();

  // Build grid
  const gridData: HeatMapCell[][] = data.map((athlete) => {
    return dates.map((date) => {
      const reading = athlete.readiness.find((r) => r.date === date);
      return {
        label: `${athlete.athleteName} - ${date}`,
        value: reading?.score || 0,
        metadata: { athleteName: athlete.athleteName, date },
      };
    });
  });

  const athleteNames = data.map((a) => a.athleteName);
  const dateLabels = dates.map((d) => {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  return (
    <HeatMap
      data={gridData}
      xLabels={dateLabels}
      yLabels={athleteNames}
      title="Team Readiness (7-Day Snapshot)"
      cellSize={50}
      showValues={true}
      onCellClick={
        onCellClick
          ? (cell) => {
              const { athleteName, date } = cell.metadata || {};
              onCellClick(athleteName, date, cell.value);
            }
          : undefined
      }
      emptyMessage="No readiness data available."
    />
  );
}

// GitHub-style contribution calendar
export function CalendarHeatMap({
  data,
  year = new Date().getFullYear(),
}: {
  data: Array<{ date: string; value: number }>;
  year?: number;
}) {
  // Generate all weeks in the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const weeks: HeatMapCell[][] = [];
  let currentWeek: HeatMapCell[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayData = data.find((item) => item.date === dateStr);

    currentWeek.push({
      label: dateStr,
      value: dayData?.value || 0,
    });

    if (d.getDay() === 6) {
      // Saturday - end of week
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block">
        <div className="flex mb-2">
          {monthLabels.map((month, i) => (
            <div key={i} className="text-xs text-slate-400 mr-12">
              {month}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const color = getColorByValue(day.value, 10); // Assuming max value is 10
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'w-3 h-3 rounded-sm',
                      day.value > 0 ? color : 'bg-slate-800'
                    )}
                    title={`${day.label}: ${day.value}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Correlation matrix heatmap
export function CorrelationHeatMap({
  data,
  variables,
}: {
  data: number[][];
  variables: string[];
}) {
  const gridData: HeatMapCell[][] = data.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      label: `${variables[rowIndex]} vs ${variables[colIndex]}`,
      value: Math.round(value * 100), // Convert -1 to 1 correlation to 0-100
    }))
  );

  return (
    <HeatMap
      data={gridData}
      xLabels={variables}
      yLabels={variables}
      title="Correlation Matrix"
      cellSize={60}
      showValues={true}
      emptyMessage="No correlation data available."
    />
  );
}
