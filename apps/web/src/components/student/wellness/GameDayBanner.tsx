'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameDayBannerProps {
  opponent: string;
  date: Date;
}

export function GameDayBanner({ opponent, date }: GameDayBannerProps) {
  const now = Date.now();
  const diff = Math.max(0, date.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const isGameDay = days === 0 && hours < 24;

  const timeText = isGameDay
    ? 'TODAY'
    : days === 0
      ? `${hours}h`
      : days === 1
        ? `${days}d ${hours}h`
        : `${days}d`;

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 rounded-xl border bg-card',
      isGameDay && 'border-primary ring-2 ring-primary/10',
    )}>
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">vs {opponent}</span>
        <span className="text-xs text-muted-foreground">
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <span className={cn(
        'text-sm font-semibold tabular-nums',
        isGameDay ? 'text-primary animate-pulse' : 'text-foreground',
      )}>
        {timeText}
      </span>
    </div>
  );
}
