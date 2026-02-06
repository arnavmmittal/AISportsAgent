'use client';

import { TrendingUp, TrendingDown, Minus, Calendar, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ForecastWidget - 7-day readiness forecast for athlete dashboard
 *
 * Security note: This component only displays data that's already been
 * sanitized by the API (no probability scores shown to athletes).
 */

interface ForecastDay {
  date: string;
  score: number;
  confidence: string;
}

interface ForecastData {
  trend: 'improving' | 'declining' | 'stable';
  currentScore: number;
  next7Days: ForecastDay[];
  lowDays: { date: string; score: number }[];
  recommendation: string;
}

interface ForecastWidgetProps {
  forecast: ForecastData | null;
  className?: string;
}

export function ForecastWidget({ forecast, className }: ForecastWidgetProps) {
  // Don't render if no forecast data available
  if (!forecast) {
    return (
      <section
        className={cn(
          'p-5 rounded-lg bg-muted/50 border border-border animate-slide-up',
          className
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Calendar size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Readiness Forecast</h3>
            <p className="text-sm text-muted-foreground">Unlock with 14+ days of check-ins</p>
          </div>
        </div>
        <div className="h-16 bg-muted rounded flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Keep checking in daily to unlock your forecast</span>
        </div>
      </section>
    );
  }

  const TrendIcon =
    forecast.trend === 'improving'
      ? TrendingUp
      : forecast.trend === 'declining'
        ? TrendingDown
        : Minus;

  const trendColor =
    forecast.trend === 'improving'
      ? 'text-success'
      : forecast.trend === 'declining'
        ? 'text-warning'
        : 'text-muted-foreground';

  const trendLabel =
    forecast.trend === 'improving'
      ? 'Trending up'
      : forecast.trend === 'declining'
        ? 'Trending down'
        : 'Stable';

  // Get day names for display
  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Get color for score bar
  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'bg-success';
    if (score >= 55) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <section
      className={cn(
        'p-5 rounded-lg bg-gradient-to-br from-primary-muted/50 to-background border border-primary/20 animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">7-Day Forecast</h3>
            <div className="flex items-center gap-1 text-sm">
              <TrendIcon size={14} className={trendColor} />
              <span className={trendColor}>{trendLabel}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-foreground">{forecast.currentScore}</div>
          <div className="text-xs text-muted-foreground">Current</div>
        </div>
      </div>

      {/* Forecast bars */}
      <div className="space-y-2 mb-4">
        {forecast.next7Days.slice(0, 7).map((day, idx) => (
          <div key={day.date} className="flex items-center gap-3">
            <span className="w-14 text-xs text-muted-foreground">{getDayName(day.date)}</span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getScoreColor(day.score))}
                style={{ width: `${day.score}%` }}
              />
            </div>
            <span
              className={cn(
                'w-8 text-xs font-medium text-right',
                day.score < 60 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {day.score}
            </span>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
        <Lightbulb size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">{forecast.recommendation}</p>
      </div>
    </section>
  );
}
