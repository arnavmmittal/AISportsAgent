'use client';

import { AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertInsightCardProps {
  athleteName: string;
  metric: string;
  currentValue: number | string;
  recommendation: string;
  onIntervene?: () => void;
  className?: string;
}

export function AlertInsightCard({
  athleteName,
  metric,
  currentValue,
  recommendation,
  onIntervene,
  className,
}: AlertInsightCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-l-4 border-destructive',
        'bg-destructive/5 border border-destructive/20',
        'p-4 transition-all',
        className,
      )}
    >
      {/* Pulse indicator */}
      <div className="absolute top-3 right-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-destructive" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{athleteName}</p>
            <span className="text-xs text-destructive font-medium">{metric}: {currentValue}</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {recommendation}
          </p>

          {onIntervene && (
            <button
              onClick={(e) => { e.stopPropagation(); onIntervene(); }}
              className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              Take Action
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
