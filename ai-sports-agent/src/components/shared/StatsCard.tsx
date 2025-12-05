import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';
type ColorVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
    label?: string;
  };
  color?: ColorVariant;
  suffix?: string;
  className?: string;
}

const colorClasses: Record<ColorVariant, { icon: string; trend: string }> = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    trend: 'text-green-600',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    trend: 'text-orange-600',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    trend: 'text-purple-600',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600',
  },
  teal: {
    icon: 'bg-teal-100 text-teal-600',
    trend: 'text-teal-600',
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatsCard({
  label,
  value,
  icon,
  trend,
  color = 'blue',
  suffix = '',
  className,
}: StatsCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;
  const colors = colorClasses[color];

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && (
            <div className={cn('p-2 rounded-lg', colors.icon)}>
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground">
            {value}
            {suffix && <span className="text-2xl ml-1">{suffix}</span>}
          </p>

          {trend && TrendIcon && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('w-4 h-4',
                trend.direction === 'up' ? 'text-green-600' :
                trend.direction === 'down' ? 'text-red-600' :
                'text-gray-600'
              )} />
              <span className={cn('text-sm font-medium',
                trend.direction === 'up' ? 'text-green-600' :
                trend.direction === 'down' ? 'text-red-600' :
                'text-gray-600'
              )}>
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-sm text-muted-foreground ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
