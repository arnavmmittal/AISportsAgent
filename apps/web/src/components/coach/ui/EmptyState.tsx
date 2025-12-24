/**
 * EmptyState Component
 * No data placeholders with optional actions
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-4',
            isCompact ? 'w-12 h-12 text-2xl' : 'w-16 h-16 text-4xl'
          )}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-slate-200 mb-2',
          isCompact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-slate-400 mb-6 max-w-md',
            isCompact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 bg-primary hover:opacity-90 text-white font-medium rounded-md transition-colors',
            isCompact && 'text-sm'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios

export function EmptyAthleteList({ onAddAthlete }: { onAddAthlete?: () => void }) {
  return (
    <EmptyState
      icon="👥"
      title="No athletes found"
      description="Start by adding athletes to your roster or adjust your filters."
      action={
        onAddAthlete
          ? {
              label: 'Add Athlete',
              onClick: onAddAthlete,
            }
          : undefined
      }
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={
        query
          ? `No matches for "${query}". Try adjusting your search terms.`
          : 'Try adjusting your filters or search terms.'
      }
      variant="compact"
    />
  );
}

export function EmptyAssignments({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon="📝"
      title="No assignments yet"
      description="Create your first assignment to start tracking athlete progress."
      action={
        onCreate
          ? {
              label: 'Create Assignment',
              onClick: onCreate,
            }
          : undefined
      }
    />
  );
}

export function EmptyGoals({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon="🎯"
      title="No goals set"
      description="Set goals to help athletes track their progress and stay motivated."
      action={
        onCreate
          ? {
              label: 'Add Goal',
              onClick: onCreate,
            }
          : undefined
      }
    />
  );
}

export function EmptyMoodLogs() {
  return (
    <EmptyState
      icon="📊"
      title="No mood data yet"
      description="Mood logs will appear here once athletes start tracking their wellness."
      variant="compact"
    />
  );
}

export function EmptyInterventions() {
  return (
    <EmptyState
      icon="💬"
      title="No interventions recorded"
      description="Your coach interactions and interventions will be tracked here."
      variant="compact"
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon="✅"
      title="All clear!"
      description="No active alerts or flags. Your team is doing well."
      variant="compact"
    />
  );
}

export function EmptyNotes({ onAddNote }: { onAddNote?: () => void }) {
  return (
    <EmptyState
      icon="📋"
      title="No notes yet"
      description="Add private notes about this athlete to track observations and progress."
      action={
        onAddNote
          ? {
              label: 'Add Note',
              onClick: onAddNote,
            }
          : undefined
      }
      variant="compact"
    />
  );
}

export function EmptyChart({ message }: { message?: string }) {
  return (
    <EmptyState
      icon="📈"
      title="Insufficient data"
      description={message || 'Not enough data points to display this chart yet.'}
      variant="compact"
    />
  );
}

export function NoConsentAccess() {
  return (
    <EmptyState
      icon="🔒"
      title="Access restricted"
      description="This athlete has not granted permission to view their data."
      variant="compact"
    />
  );
}
