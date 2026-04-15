'use client';

import { type ReactNode } from 'react';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  value: string | ReactNode;
  subtitle: string;
  className?: string;
}

export function InsightCard({ icon: Icon, iconColor = 'text-primary', title, value, subtitle, className }: InsightCardProps) {
  return (
    <SpotlightCard className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconColor.replace('text-', 'bg-') + '/10')}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
        </div>
      </div>
    </SpotlightCard>
  );
}
