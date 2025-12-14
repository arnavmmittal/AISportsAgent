/**
 * PriorityAthleteList Component
 * AI-sorted list of athletes by urgency level
 */

import { PriorityAthlete } from '@/types/coach-portal';
import AthleteAvatar from '../ui/AthleteAvatar';
import ReadinessIndicator from '../ui/ReadinessIndicator';
import RiskBadge from '../ui/RiskBadge';
import { EmptyAlerts } from '../ui/EmptyState';
import { cn } from '@/lib/utils';

interface PriorityAthleteListProps {
  athletes: PriorityAthlete[];
  onAthleteClick?: (athleteId: string) => void;
}

const URGENCY_CONFIG = {
  CRITICAL: {
    bg: 'bg-red-900/20',
    border: 'border-red-900',
    badge: 'bg-red-900 text-red-200',
    icon: '🚨',
    label: 'CRITICAL',
  },
  URGENT: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-700',
    badge: 'bg-orange-800 text-orange-200',
    icon: '⚠️',
    label: 'URGENT',
  },
  MONITOR: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-700',
    badge: 'bg-amber-800 text-amber-200',
    icon: '👁️',
    label: 'MONITOR',
  },
  THRIVING: {
    bg: 'bg-green-900/20',
    border: 'border-green-700',
    badge: 'bg-green-800 text-green-200',
    icon: '✅',
    label: 'THRIVING',
  },
};

export default function PriorityAthleteList({
  athletes,
  onAthleteClick,
}: PriorityAthleteListProps) {
  if (!athletes || athletes.length === 0) {
    return <EmptyAlerts />;
  }

  return (
    <div className="space-y-3">
      {athletes.map((item) => {
        const urgencyConfig = URGENCY_CONFIG[item.urgency];

        return (
          <div
            key={item.athlete.id}
            className={cn(
              'rounded-lg border p-4 transition-all duration-200',
              urgencyConfig.bg,
              urgencyConfig.border,
              onAthleteClick && 'cursor-pointer hover:bg-slate-800/50'
            )}
            onClick={() => onAthleteClick?.(item.athlete.id)}
          >
            {/* Header: Avatar + Name + Urgency Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <AthleteAvatar
                  name={item.athlete.name}
                  imageUrl={item.athlete.profileImageUrl}
                  size="md"
                  showStatus={true}
                  readinessLevel={item.readiness.level}
                />
                <div>
                  <h4 className="text-base font-semibold text-white">
                    {item.athlete.name}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {item.athlete.sport} • {item.athlete.year}
                  </p>
                </div>
              </div>

              {/* Urgency Badge */}
              <div
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5',
                  urgencyConfig.badge
                )}
              >
                <span>{urgencyConfig.icon}</span>
                <span>{urgencyConfig.label}</span>
              </div>
            </div>

            {/* Metrics Row: Readiness + Risk */}
            <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Readiness:</span>
                <ReadinessIndicator
                  readiness={item.readiness}
                  size="sm"
                  showLabel={false}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Risk:</span>
                <RiskBadge level={item.risk.riskLevel} size="sm" />
              </div>
            </div>

            {/* Primary Reason */}
            <div className="mb-3">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">Primary concern: </span>
                {item.primaryReason}
              </p>
            </div>

            {/* Suggested Intervention */}
            <div className="bg-slate-900/50 rounded-md p-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
                    Suggested Action
                  </p>
                  <p className="text-sm text-slate-300">{item.suggestedIntervention}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {onAthleteClick && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <button
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAthleteClick(item.athlete.id);
                  }}
                >
                  View Full Profile →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
