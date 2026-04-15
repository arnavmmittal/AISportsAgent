'use client';

import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Sparkline } from '@/components/shared/viz/Sparkline';
import { cn } from '@/lib/utils';

interface TrendInsightCardProps {
  headline: string;
  detail: string;
  trend: number[];
  direction: 'up' | 'down';
  affectedCount?: number;
  correlation?: { metric: string; r: number };
  className?: string;
}

export function TrendInsightCard({
  headline,
  detail,
  trend,
  direction,
  affectedCount,
  correlation,
  className,
}: TrendInsightCardProps) {
  const TrendIcon = direction === 'up' ? TrendingUp : TrendingDown;
  const trendColor = direction === 'up' ? 'text-accent' : 'text-chart-3';
  const borderColor = direction === 'up' ? 'border-accent/30' : 'border-chart-3/30';
  const bgColor = direction === 'up' ? 'bg-accent/5' : 'bg-chart-3/5';

  return (
    <div
      className={cn(
        'rounded-xl border-l-4 border p-4 transition-all',
        borderColor,
        bgColor,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          direction === 'up' ? 'bg-accent/15' : 'bg-chart-3/15'
        )}>
          <TrendIcon className={cn('w-4 h-4', trendColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-1">{headline}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{detail}</p>

          <div className="flex items-center gap-4">
            {/* Sparkline */}
            {trend.length > 1 && (
              <div className="w-24">
                <Sparkline data={trend} autoColor showDot width={96} height={22} />
              </div>
            )}

            {/* Affected athletes */}
            {affectedCount !== undefined && affectedCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{affectedCount} athlete{affectedCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Correlation badge */}
            {correlation && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                r={correlation.r.toFixed(2)} ({correlation.metric})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
