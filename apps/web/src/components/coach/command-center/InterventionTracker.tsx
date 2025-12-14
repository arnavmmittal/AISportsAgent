/**
 * InterventionTracker Component
 * Recent coach interventions and actions
 */

import { CoachIntervention, InterventionType } from '@/types/coach-portal';
import { cn } from '@/lib/utils';
import { EmptyInterventions } from '../ui/EmptyState';
import AthleteAvatar from '../ui/AthleteAvatar';

interface InterventionTrackerProps {
  interventions: CoachIntervention[];
}

const INTERVENTION_CONFIG: Record<InterventionType, { icon: string; color: string; label: string }> = {
  CHECK_IN: {
    icon: '💬',
    color: 'text-blue-400',
    label: 'Check-in',
  },
  PHONE_CALL: {
    icon: '📞',
    color: 'text-green-400',
    label: 'Phone Call',
  },
  IN_PERSON_MEETING: {
    icon: '🤝',
    color: 'text-purple-400',
    label: 'In-Person',
  },
  EMAIL_SENT: {
    icon: '📧',
    color: 'text-cyan-400',
    label: 'Email',
  },
  RESOURCE_SHARED: {
    icon: '📚',
    color: 'text-amber-400',
    label: 'Resource Shared',
  },
  REFERRAL: {
    icon: '🏥',
    color: 'text-red-400',
    label: 'Referral',
  },
  ASSIGNMENT_CREATED: {
    icon: '📝',
    color: 'text-indigo-400',
    label: 'Assignment',
  },
  GOAL_SET: {
    icon: '🎯',
    color: 'text-green-400',
    label: 'Goal Set',
  },
  NOTE_ADDED: {
    icon: '📋',
    color: 'text-slate-400',
    label: 'Note',
  },
};

export default function InterventionTracker({ interventions }: InterventionTrackerProps) {
  if (!interventions || interventions.length === 0) {
    return <EmptyInterventions />;
  }

  return (
    <div className="space-y-3">
      {interventions.map((intervention) => {
        const config = INTERVENTION_CONFIG[intervention.type];

        return (
          <div
            key={intervention.id}
            className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              {/* Athlete Avatar */}
              <AthleteAvatar
                name={intervention.athlete.name}
                imageUrl={intervention.athlete.profileImageUrl}
                size="sm"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header: Athlete Name + Intervention Type */}
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-semibold text-white truncate">
                    {intervention.athlete.name}
                  </h5>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded',
                      config.color
                    )}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </div>

                {/* Notes */}
                {intervention.notes && (
                  <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                    {intervention.notes}
                  </p>
                )}

                {/* Footer: Timestamp + Outcome */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatTimestamp(intervention.timestamp)}</span>
                  {intervention.outcome && (
                    <span className="text-green-400">✓ {intervention.outcome}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* View All Link */}
      {interventions.length >= 5 && (
        <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
          View All Interventions →
        </button>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 24 hours ago - show relative time
  if (diffInSeconds < 86400) {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }

  // More than 24 hours - show date
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  return date.toLocaleDateString('en-US', options);
}
