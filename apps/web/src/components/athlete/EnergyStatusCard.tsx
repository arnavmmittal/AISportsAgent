'use client';

import { Zap, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * EnergyStatusCard - Displays burnout stage with athlete-safe messaging
 *
 * Security note: This component intentionally hides probability/daysUntilRisk
 * to avoid causing anxiety. Only stage, message, and strategies are shown.
 */

interface BurnoutData {
  stage: 'healthy' | 'early-warning' | 'developing' | 'advanced' | 'critical';
  message: string;
  strategies: string[];
}

interface EnergyStatusCardProps {
  burnout: BurnoutData | null;
  className?: string;
}

const stageConfig = {
  healthy: {
    icon: CheckCircle,
    label: 'Balanced',
    colorClass: 'text-success',
    bgClass: 'bg-success-muted border-success/20',
    iconBgClass: 'bg-success/20',
  },
  'early-warning': {
    icon: Info,
    label: 'Watch Zone',
    colorClass: 'text-info',
    bgClass: 'bg-info-muted border-info/20',
    iconBgClass: 'bg-info/20',
  },
  developing: {
    icon: AlertCircle,
    label: 'Elevated Stress',
    colorClass: 'text-warning',
    bgClass: 'bg-warning-muted border-warning/20',
    iconBgClass: 'bg-warning/20',
  },
  advanced: {
    icon: AlertCircle,
    label: 'Needs Rest',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/30',
    iconBgClass: 'bg-orange-500/20',
  },
  critical: {
    icon: AlertCircle,
    label: 'Priority Rest',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive-muted border-destructive/20',
    iconBgClass: 'bg-destructive/20',
  },
};

export function EnergyStatusCard({ burnout, className }: EnergyStatusCardProps) {
  // Don't render if no burnout data
  if (!burnout) {
    return null;
  }

  // Don't show card if athlete is healthy (reduce noise)
  if (burnout.stage === 'healthy') {
    return null;
  }

  const config = stageConfig[burnout.stage];
  const Icon = config.icon;

  return (
    <section
      className={cn('p-5 rounded-lg border animate-slide-up', config.bgClass, className)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            config.iconBgClass
          )}
        >
          <Zap size={20} className={config.colorClass} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground">Energy Status</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                config.colorClass,
                config.iconBgClass
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground mb-3">{burnout.message}</p>

          {/* Strategies */}
          {burnout.strategies.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recommended
              </span>
              <ul className="space-y-1.5">
                {burnout.strategies.slice(0, 3).map((strategy, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full', config.colorClass.replace('text-', 'bg-'))} />
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action for elevated stages */}
          {(burnout.stage === 'developing' ||
            burnout.stage === 'advanced' ||
            burnout.stage === 'critical') && (
            <Link
              href="/student/ai-coach"
              className={cn(
                'inline-flex items-center gap-1 text-sm font-medium mt-3 hover:underline',
                config.colorClass
              )}
            >
              Talk to AI Coach
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
