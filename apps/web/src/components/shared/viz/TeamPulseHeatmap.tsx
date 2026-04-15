'use client';

import { useMemo, useState } from 'react';
import { Sparkline } from '@/components/shared/viz/Sparkline';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';

interface DayScore {
  date: string;
  score: number;
  level: 'GREEN' | 'YELLOW' | 'RED';
}

interface HeatmapAthlete {
  id: string;
  name: string;
  dailyScores: DayScore[];
  trend: number[];
}

interface TeamPulseHeatmapProps {
  athletes: HeatmapAthlete[];
  weeks?: number;
  onAthleteClick?: (id: string) => void;
  className?: string;
}

type SortMode = 'worst' | 'best' | 'name';

const LEVEL_COLORS = {
  GREEN: 'bg-accent',
  YELLOW: 'bg-chart-3',
  RED: 'bg-destructive',
};

const LEVEL_OPACITY: Record<string, string> = {
  GREEN: 'opacity-80',
  YELLOW: 'opacity-70',
  RED: 'opacity-90',
};

function getDayLabels(weeks: number): string[] {
  const labels: string[] = [];
  const today = new Date();
  const days = weeks * 7;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(d.toISOString().split('T')[0]!);
  }
  return labels;
}

function getAvgScore(athlete: HeatmapAthlete): number {
  if (athlete.dailyScores.length === 0) return 0;
  return athlete.dailyScores.reduce((s, d) => s + d.score, 0) / athlete.dailyScores.length;
}

export function TeamPulseHeatmap({
  athletes,
  weeks = 2,
  onAthleteClick,
  className,
}: TeamPulseHeatmapProps) {
  const [sortMode, setSortMode] = useState<SortMode>('worst');
  const dayLabels = useMemo(() => getDayLabels(weeks), [weeks]);

  const sorted = useMemo(() => {
    const copy = [...athletes];
    switch (sortMode) {
      case 'worst':
        return copy.sort((a, b) => getAvgScore(a) - getAvgScore(b));
      case 'best':
        return copy.sort((a, b) => getAvgScore(b) - getAvgScore(a));
      case 'name':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [athletes, sortMode]);

  // Build day-of-week headers (only show for first week to avoid clutter)
  const dayHeaders = useMemo(() => {
    return dayLabels.slice(-7).map(dateStr => {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'narrow' });
    });
  }, [dayLabels]);

  if (athletes.length === 0) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-6 text-center', className)}>
        <p className="text-muted-foreground text-sm">No athlete data available for heatmap</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Team Pulse</h3>
        <div className="flex gap-1">
          {(['worst', 'best', 'name'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={cn(
                'text-[10px] px-2 py-1 rounded-md transition-colors',
                sortMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {mode === 'worst' ? 'Needs Attention' : mode === 'best' ? 'Top Performers' : 'A-Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto px-4 pb-4">
        <div className="min-w-[400px]">
          {/* Day-of-week headers */}
          <div className="flex items-center mb-1">
            <div className="w-28 flex-shrink-0" /> {/* Name column */}
            <div className="flex-1 flex">
              {dayLabels.map((date, i) => (
                <div
                  key={date}
                  className="flex-1 text-center text-[8px] text-muted-foreground"
                >
                  {i >= dayLabels.length - 7 ? dayHeaders[i - (dayLabels.length - 7)] : ''}
                </div>
              ))}
            </div>
            <div className="w-20 flex-shrink-0" /> {/* Sparkline column */}
          </div>

          {/* Athlete rows */}
          {sorted.map((athlete) => {
            const scoreMap = new Map(
              athlete.dailyScores.map(d => [d.date, d])
            );

            return (
              <div
                key={athlete.id}
                className={cn(
                  'flex items-center py-1 group',
                  onAthleteClick && 'cursor-pointer hover:bg-muted/30 rounded-md'
                )}
                onClick={() => onAthleteClick?.(athlete.id)}
              >
                {/* Name */}
                <div className="w-28 flex-shrink-0 pr-2">
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {athlete.name}
                  </p>
                </div>

                {/* Heatmap cells */}
                <div className="flex-1 flex gap-px">
                  {dayLabels.map((date) => {
                    const day = scoreMap.get(date);
                    if (!day) {
                      return (
                        <div
                          key={date}
                          className="flex-1 h-5 rounded-sm bg-muted/30"
                          title={`${date}: No data`}
                        />
                      );
                    }
                    return (
                      <div
                        key={date}
                        className={cn(
                          'flex-1 h-5 rounded-sm transition-opacity',
                          LEVEL_COLORS[day.level],
                          LEVEL_OPACITY[day.level],
                        )}
                        title={`${date}: ${day.score} (${day.level})`}
                      />
                    );
                  })}
                </div>

                {/* Trend sparkline */}
                <div className="w-20 flex-shrink-0 pl-2">
                  {athlete.trend.length > 1 ? (
                    <Sparkline data={athlete.trend} autoColor showDot width={72} height={18} />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-3 border-t border-border pt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-accent opacity-80" />
          <span className="text-[10px] text-muted-foreground">Ready</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-chart-3 opacity-70" />
          <span className="text-[10px] text-muted-foreground">Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-destructive opacity-90" />
          <span className="text-[10px] text-muted-foreground">Intervention</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <span className="text-[10px] text-muted-foreground">No data</span>
        </div>
      </div>
    </div>
  );
}
