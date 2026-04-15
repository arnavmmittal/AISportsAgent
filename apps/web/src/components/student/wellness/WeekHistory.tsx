'use client';

import { cn } from '@/lib/utils';

interface DayScore {
  date: Date;
  score: number;
  checkedIn: boolean;
}

interface WeekHistoryProps {
  history: DayScore[];
  weeklyInsight: string;
}

function getColor(score: number) {
  if (score >= 75) return 'bg-readiness-green';
  if (score >= 55) return 'bg-readiness-yellow';
  return 'bg-readiness-red';
}

export function WeekHistory({ history, weeklyInsight }: WeekHistoryProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">7-Day History</h3>

      <div className="flex justify-between gap-2">
        {days.map((date, i) => {
          const entry = history.find(h => h.date.toDateString() === date.toDateString());
          const isToday = i === 6;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className={cn(
                'w-full aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-transform',
                entry
                  ? cn(getColor(entry.score), 'text-white')
                  : 'bg-muted text-muted-foreground/40',
                isToday && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
              )}>
                {entry ? entry.score : '\u2014'}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5">
                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              {isToday && <span className="text-[10px] text-primary font-medium">Today</span>}
            </div>
          );
        })}
      </div>

      {weeklyInsight && (
        <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border italic">
          {weeklyInsight}
        </p>
      )}
    </div>
  );
}
