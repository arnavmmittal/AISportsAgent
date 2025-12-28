/**
 * AthleteCard Component
 * Compact athlete card for roster grid view
 */

import { Athlete } from '@/types/coach-portal';
import AthleteAvatar from '../ui/AthleteAvatar';
import ReadinessIndicator from '../ui/ReadinessIndicator';
import RiskBadge from '../ui/RiskBadge';
import ArchetypeBadge from '../ui/ArchetypeBadge';
import { cn } from '@/lib/utils';

interface AthleteCardProps {
  athlete: Athlete;
  onClick?: () => void;
  className?: string;
}

export default function AthleteCard({ athlete, onClick, className }: AthleteCardProps) {
  const hasConsent = athlete.consentCoachView;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        hasConsent
          ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 hover:border-slate-600'
          : 'bg-slate-900/30 border-slate-800',
        onClick && hasConsent && 'cursor-pointer',
        className
      )}
      onClick={hasConsent ? onClick : undefined}
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <AthleteAvatar
          name={athlete.name}
          imageUrl={athlete.profileImage}
          size="md"
          showStatus={hasConsent}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-white truncate">
            {athlete.name}
          </h4>
          <p className="text-sm text-slate-400">
            {athlete.sport} • {athlete.year}
          </p>
          {athlete.teamPosition && (
            <p className="text-xs text-slate-500 mt-0.5">{athlete.teamPosition}</p>
          )}
        </div>

        {/* Consent indicator */}
        {!hasConsent && (
          <div className="flex-shrink-0">
            <div className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-md flex items-center gap-1">
              <span>🔒</span>
              <span>No Access</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row (only if consent) */}
      {hasConsent ? (
        <>
          <div className="flex items-center gap-3 mb-3 pb-3 border-slate-700">
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1">Risk</p>
              <RiskBadge level={athlete.riskLevel} size="sm" />
            </div>
          </div>

          {/* Archetype Badge */}
          {athlete.archetype && (
            <div className="flex items-center justify-between">
              <ArchetypeBadge archetype={athlete.archetype} showTooltip={true} />
              {onClick && (
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  View Profile →
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-500">
            Athlete has not granted data access
          </p>
          <button className="text-xs text-blue-500 hover:text-blue-400 mt-2">
            Request Access
          </button>
        </div>
      )}
    </div>
  );
}
