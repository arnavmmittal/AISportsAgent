/**
 * ActionFeed Component
 * Real-time algorithmic flags and notifications
 */

import { ActionFeedItem, ActionType } from '@/types/coach-portal';
import { cn } from '@/lib/utils';
import { EmptyAlerts } from '../ui/EmptyState';

interface ActionFeedProps {
  items: ActionFeedItem[];
}

const ACTION_CONFIG: Record<ActionType, { icon: string; color: string; label: string }> = {
  BURNOUT_RISK: {
    icon: '🔥',
    color: 'text-red-400',
    label: 'Burnout Risk',
  },
  STRESS_SPIKE: {
    icon: '📈',
    color: 'text-orange-400',
    label: 'Stress Spike',
  },
  ENGAGEMENT_DROP: {
    icon: '📉',
    color: 'text-amber-400',
    label: 'Engagement Drop',
  },
  PERFORMANCE_DECLINE: {
    icon: '⚠️',
    color: 'text-yellow-400',
    label: 'Performance Decline',
  },
  POSITIVE_MOMENTUM: {
    icon: '✨',
    color: 'text-green-400',
    label: 'Positive Momentum',
  },
};

export default function ActionFeed({ items }: ActionFeedProps) {
  if (!items || items.length === 0) {
    return <EmptyAlerts />;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const config = ACTION_CONFIG[item.type];
        const isUrgent = ['BURNOUT_RISK_DETECTED', 'CRISIS_LANGUAGE_DETECTED', 'STRESS_SPIKE'].includes(item.type);

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-lg p-3 border transition-all duration-200 hover:bg-slate-800/50',
              isUrgent
                ? 'bg-red-900/20 border-red-900'
                : 'bg-slate-800/30 border-slate-700'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-xl">{config.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Type Label + Time */}
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-semibold', config.color)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>

                {/* Message */}
                <p className="text-sm text-slate-300 mb-2">{item.message}</p>

                {/* Affected Athletes */}
                {item.affectedAthletes && item.affectedAthletes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.affectedAthletes.slice(0, 3).map((athlete) => (
                      <span
                        key={athlete.id}
                        className="text-xs px-2 py-1 bg-slate-700/50 rounded-md text-slate-300"
                      >
                        {athlete.name}
                      </span>
                    ))}
                    {item.affectedAthletes.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{item.affectedAthletes.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
