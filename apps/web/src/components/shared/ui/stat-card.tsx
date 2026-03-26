'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type StatColor = 'primary' | 'success' | 'warning' | 'accent';

interface StatCardProps {
  title: string;
  value: number;
  max?: number;
  suffix?: string;
  trend?: 'improving' | 'declining';
  color?: StatColor;
  /** For metrics where lower is better (e.g., stress) */
  inverse?: boolean;
  className?: string;
}

const barColors: Record<StatColor, string> = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  accent: 'bg-violet-500',
};

export function StatCard({
  title,
  value,
  max = 10,
  suffix = '',
  trend,
  color = 'primary',
  inverse = false,
  className,
}: StatCardProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const isTrendPositive = inverse
    ? trend === 'declining'
    : trend === 'improving';

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-foreground">
            {value.toFixed(1)}
            {suffix}
          </p>
          {trend && (
            <span
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isTrendPositive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {isTrendPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4 w-full bg-muted rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-500', barColors[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface EngagementStatProps {
  value: string | number;
  label: string;
  className?: string;
}

export function EngagementStat({ value, label, className }: EngagementStatProps) {
  return (
    <div className={cn('text-center p-4 bg-muted/50 rounded-lg', className)}>
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
