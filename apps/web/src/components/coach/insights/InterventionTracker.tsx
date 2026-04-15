'use client';

import { Sparkline } from '@/components/shared/viz/Sparkline';
import { CheckCircle, Edit3, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Intervention {
  id: string;
  athleteName: string;
  type: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  percentChange: number;
  trend: 'improving' | 'stable' | 'declining';
  weeksActive: number;
  dataPoints: number[];
}

interface InterventionTrackerProps {
  interventions: Intervention[];
  onAction?: (id: string, action: 'continue' | 'modify' | 'stop') => void;
  className?: string;
}

function getTrendLabel(trend: string): { text: string; color: string } {
  switch (trend) {
    case 'improving': return { text: 'Effective', color: 'text-accent' };
    case 'stable': return { text: 'Stable', color: 'text-muted-foreground' };
    case 'declining': return { text: 'Not working', color: 'text-destructive' };
    default: return { text: trend, color: 'text-muted-foreground' };
  }
}

export function InterventionTracker({
  interventions,
  onAction,
  className,
}: InterventionTrackerProps) {
  if (interventions.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-foreground">Active Interventions</h3>

      {interventions.map((item) => {
        const trendInfo = getTrendLabel(item.trend);
        const isPositive = item.percentChange > 0;
        const progressPct = Math.min(100, Math.max(0,
          ((item.currentValue - item.baselineValue) / (10 - item.baselineValue)) * 100
        ));

        return (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  &ldquo;{item.type}&rdquo; for {item.athleteName}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Tracking: {item.metric} | Week {item.weeksActive}
                </p>
              </div>
              <span className={cn('text-xs font-medium', trendInfo.color)}>
                {trendInfo.text}
              </span>
            </div>

            {/* Progress bar + delta */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    item.trend === 'improving' ? 'bg-accent' :
                    item.trend === 'declining' ? 'bg-destructive' : 'bg-muted-foreground'
                  )}
                  style={{ width: `${Math.max(5, progressPct)}%` }}
                />
              </div>
              <span className={cn(
                'text-xs font-semibold tabular-nums min-w-[50px] text-right',
                isPositive ? 'text-accent' : 'text-destructive'
              )}>
                {isPositive ? '+' : ''}{item.percentChange.toFixed(0)}%
              </span>
            </div>

            {/* Sparkline + actions row */}
            <div className="flex items-center justify-between">
              <div className="w-24">
                {item.dataPoints.length > 1 && (
                  <Sparkline data={item.dataPoints} autoColor showDot width={96} height={20} />
                )}
              </div>

              {onAction && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAction(item.id, 'continue')}
                    className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 px-2 py-1 rounded hover:bg-accent/10 transition-colors"
                    title="Continue intervention"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Continue
                  </button>
                  <button
                    onClick={() => onAction(item.id, 'modify')}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                    title="Modify intervention"
                  >
                    <Edit3 className="w-3 h-3" />
                    Modify
                  </button>
                  <button
                    onClick={() => onAction(item.id, 'stop')}
                    className="inline-flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                    title="Stop intervention"
                  >
                    <XCircle className="w-3 h-3" />
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
