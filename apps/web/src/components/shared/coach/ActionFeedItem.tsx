'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  TrendingDown,
  Zap,
  Clock,
  Activity,
  UserX,
  Brain,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { RiskBadge, type RiskLevel } from '../athlete/RiskBadge';

/**
 * ActionFeedItem - Alert card for coach command center
 *
 * Alert types:
 * - STRESS_SPIKE: Sudden stress increase
 * - ENGAGEMENT_DROP: Missed check-ins
 * - SLUMP_PREDICTION: ML prediction triggered
 * - BURNOUT_RISK: Pattern-based warning
 * - MOOD_DECLINE: Downward trend
 * - CRISIS_FLAG: Crisis detection escalation
 *
 * @example
 * <ActionFeedItem
 *   type="STRESS_SPIKE"
 *   athleteName="Sarah M."
 *   description="Stress jumped from 4 → 8 in 24 hours"
 *   timestamp={new Date()}
 *   riskLevel="high"
 *   onRespond={() => handleRespond(id)}
 * />
 */

export type AlertType =
  | 'STRESS_SPIKE'
  | 'ENGAGEMENT_DROP'
  | 'SLUMP_PREDICTION'
  | 'BURNOUT_RISK'
  | 'MOOD_DECLINE'
  | 'CRISIS_FLAG'
  | 'RECOVERY_NEEDED'
  | 'LOW_READINESS';

export interface ActionFeedItemProps {
  /** Alert ID */
  id: string;
  /** Alert type */
  type: AlertType;
  /** Athlete name */
  athleteName: string;
  /** Sport (optional) */
  sport?: string;
  /** Alert description */
  description: string;
  /** When the alert was triggered */
  timestamp: Date;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Has this been acknowledged */
  acknowledged?: boolean;
  /** Respond handler */
  onRespond?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** View athlete profile */
  onViewAthlete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const alertConfig: Record<
  AlertType,
  {
    icon: LucideIcon;
    label: string;
    colorClass: string;
  }
> = {
  STRESS_SPIKE: {
    icon: Zap,
    label: 'Stress Spike',
    colorClass: 'text-risk-high',
  },
  ENGAGEMENT_DROP: {
    icon: UserX,
    label: 'Engagement Drop',
    colorClass: 'text-warning',
  },
  SLUMP_PREDICTION: {
    icon: TrendingDown,
    label: 'Slump Predicted',
    colorClass: 'text-risk-moderate',
  },
  BURNOUT_RISK: {
    icon: Flame,
    label: 'Burnout Risk',
    colorClass: 'text-risk-critical',
  },
  MOOD_DECLINE: {
    icon: TrendingDown,
    label: 'Mood Decline',
    colorClass: 'text-warning',
  },
  CRISIS_FLAG: {
    icon: AlertTriangle,
    label: 'Crisis Flag',
    colorClass: 'text-risk-critical',
  },
  RECOVERY_NEEDED: {
    icon: Activity,
    label: 'Recovery Needed',
    colorClass: 'text-info',
  },
  LOW_READINESS: {
    icon: Brain,
    label: 'Low Readiness',
    colorClass: 'text-risk-moderate',
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActionFeedItem({
  id,
  type,
  athleteName,
  sport,
  description,
  timestamp,
  riskLevel,
  acknowledged = false,
  onRespond,
  onDismiss,
  onViewAthlete,
  className,
}: ActionFeedItemProps) {
  const config = alertConfig[type];
  const Icon = config.icon;
  const isCritical = riskLevel === 'critical' || type === 'CRISIS_FLAG';

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border bg-card transition-all duration-200',
        isCritical && 'border-risk-critical/50 bg-risk-critical-bg',
        !isCritical && 'border-border hover:border-primary/20 hover:shadow-sm',
        acknowledged && 'opacity-60',
        className
      )}
      role="article"
      aria-label={`Alert: ${config.label} for ${athleteName}`}
    >
      {/* Critical pulse indicator */}
      {isCritical && !acknowledged && (
        <span className="absolute top-4 right-4 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-risk-critical" />
        </span>
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            isCritical ? 'bg-risk-critical/10' : 'bg-muted'
          )}
        >
          <Icon size={20} className={config.colorClass} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-medium uppercase tracking-wide', config.colorClass)}>
                {config.label}
              </span>
              <RiskBadge level={riskLevel} size="sm" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} aria-hidden="true" />
              <time dateTime={timestamp.toISOString()}>
                {formatRelativeTime(timestamp)}
              </time>
            </div>
          </div>

          {/* Athlete name */}
          <button
            onClick={onViewAthlete}
            className="font-medium text-foreground hover:text-primary transition-colors text-left"
          >
            {athleteName}
            {sport && (
              <span className="text-muted-foreground font-normal ml-1">
                • {sport}
              </span>
            )}
          </button>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {onRespond && (
              <Button
                size="sm"
                variant={isCritical ? 'default' : 'outline'}
                onClick={onRespond}
                className={cn(isCritical && 'bg-risk-critical hover:bg-risk-critical/90')}
              >
                Respond
              </Button>
            )}
            {onViewAthlete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onViewAthlete}
              >
                View Profile
              </Button>
            )}
            {onDismiss && !isCritical && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ActionFeedSkeleton - Loading state
 */
export function ActionFeedSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-4 w-16 skeleton rounded" />
          </div>
          <div className="h-5 w-32 skeleton rounded" />
          <div className="h-4 w-full skeleton rounded" />
          <div className="flex gap-2 mt-3">
            <div className="h-8 w-20 skeleton rounded" />
            <div className="h-8 w-24 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ActionFeedEmpty - Empty state when no alerts
 */
export function ActionFeedEmpty({ className }: { className?: string }) {
  return (
    <div className={cn('p-8 text-center', className)}>
      <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
        <Activity size={24} className="text-success" />
      </div>
      <h3 className="font-medium text-foreground">All Clear</h3>
      <p className="text-sm text-muted-foreground mt-1">
        No alerts requiring attention right now.
      </p>
    </div>
  );
}

export default ActionFeedItem;
