'use client';

/**
 * ActionFeed Component - Enhanced with new design system
 *
 * Real-time algorithmic alerts and notifications for coaches
 * Uses the new ActionFeedItem component with risk levels and accessibility
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ActionFeedItem,
  ActionFeedSkeleton,
  ActionFeedEmpty,
  type AlertType,
} from '@/components/shared/coach';
import { type RiskLevel } from '@/components/shared/athlete';
import { Filter, SortDesc } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

// Legacy type mapping for backwards compatibility
type LegacyActionType =
  | 'BURNOUT_RISK'
  | 'STRESS_SPIKE'
  | 'ENGAGEMENT_DROP'
  | 'PERFORMANCE_DECLINE'
  | 'POSITIVE_MOMENTUM';

interface LegacyActionFeedItem {
  id: string;
  type: LegacyActionType;
  message: string;
  timestamp: Date;
  affectedAthletes?: Array<{ id: string; name: string }>;
}

interface ActionAlert {
  id: string;
  type: AlertType;
  athleteName: string;
  athleteId?: string;
  sport?: string;
  description: string;
  timestamp: Date;
  riskLevel: RiskLevel;
  acknowledged?: boolean;
}

interface ActionFeedProps {
  /** Alert items - supports both legacy and new format */
  items: LegacyActionFeedItem[] | ActionAlert[];
  /** Loading state */
  isLoading?: boolean;
  /** Filter by risk level */
  filterLevel?: RiskLevel | 'all';
  /** Callback when respond button is clicked */
  onRespond?: (alertId: string) => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: (alertId: string) => void;
  /** Callback when view athlete is clicked */
  onViewAthlete?: (alertId: string, athleteId?: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// Map legacy types to new AlertTypes
const legacyTypeMap: Record<LegacyActionType, AlertType> = {
  BURNOUT_RISK: 'BURNOUT_RISK',
  STRESS_SPIKE: 'STRESS_SPIKE',
  ENGAGEMENT_DROP: 'ENGAGEMENT_DROP',
  PERFORMANCE_DECLINE: 'SLUMP_PREDICTION',
  POSITIVE_MOMENTUM: 'RECOVERY_NEEDED',
};

// Map legacy types to risk levels
const legacyRiskMap: Record<LegacyActionType, RiskLevel> = {
  BURNOUT_RISK: 'critical',
  STRESS_SPIKE: 'high',
  ENGAGEMENT_DROP: 'moderate',
  PERFORMANCE_DECLINE: 'moderate',
  POSITIVE_MOMENTUM: 'low',
};

function isLegacyItem(item: any): item is LegacyActionFeedItem {
  return 'message' in item && 'affectedAthletes' in item;
}

function transformLegacyItem(item: LegacyActionFeedItem): ActionAlert {
  const athletes = item.affectedAthletes || [];
  return {
    id: item.id,
    type: legacyTypeMap[item.type] || 'LOW_READINESS',
    athleteName: athletes.length > 0 ? athletes[0].name : 'Team Alert',
    athleteId: athletes.length > 0 ? athletes[0].id : undefined,
    description: item.message,
    timestamp: new Date(item.timestamp),
    riskLevel: legacyRiskMap[item.type] || 'moderate',
    acknowledged: false,
  };
}

export default function ActionFeed({
  items,
  isLoading = false,
  filterLevel = 'all',
  onRespond,
  onDismiss,
  onViewAthlete,
  className,
}: ActionFeedProps) {
  const [sortNewest, setSortNewest] = useState(true);
  const [localFilter, setLocalFilter] = useState<RiskLevel | 'all'>(filterLevel);

  // Transform and normalize items
  const normalizedItems: ActionAlert[] = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.map((item) => {
      if (isLegacyItem(item)) {
        return transformLegacyItem(item);
      }
      return item as ActionAlert;
    });
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...normalizedItems];

    // Filter by risk level
    if (localFilter !== 'all') {
      result = result.filter((item) => item.riskLevel === localFilter);
    }

    // Sort by timestamp
    result.sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortNewest ? diff : -diff;
    });

    return result;
  }, [normalizedItems, localFilter, sortNewest]);

  // Risk level counts for filter badges
  const riskCounts = useMemo(() => {
    const counts: Record<RiskLevel | 'all', number> = {
      all: normalizedItems.length,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    };

    normalizedItems.forEach((item) => {
      counts[item.riskLevel]++;
    });

    return counts;
  }, [normalizedItems]);

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <ActionFeedSkeleton />
        <ActionFeedSkeleton />
        <ActionFeedSkeleton />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <ActionFeedEmpty className={className} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLocalFilter(level)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap',
                localFilter === level
                  ? level === 'critical'
                    ? 'bg-risk-critical text-white'
                    : level === 'high'
                    ? 'bg-risk-high text-white'
                    : level === 'moderate'
                    ? 'bg-risk-moderate text-white'
                    : level === 'low'
                    ? 'bg-risk-low text-white'
                    : 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              <span className="ml-1.5 opacity-70">({riskCounts[level]})</span>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortNewest(!sortNewest)}
          className="flex-shrink-0"
        >
          <SortDesc className={cn('w-4 h-4 mr-1', !sortNewest && 'rotate-180')} />
          {sortNewest ? 'Newest' : 'Oldest'}
        </Button>
      </div>

      {/* Alert Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alerts matching filter
          </div>
        ) : (
          filteredItems.map((item) => (
            <ActionFeedItem
              key={item.id}
              id={item.id}
              type={item.type}
              athleteName={item.athleteName}
              sport={item.sport}
              description={item.description}
              timestamp={item.timestamp}
              riskLevel={item.riskLevel}
              acknowledged={item.acknowledged}
              onRespond={onRespond ? () => onRespond(item.id) : undefined}
              onDismiss={onDismiss ? () => onDismiss(item.id) : undefined}
              onViewAthlete={
                onViewAthlete
                  ? () => onViewAthlete(item.id, item.athleteId)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Summary */}
      {riskCounts.critical > 0 && (
        <div className="p-3 rounded-lg bg-risk-critical/10 border border-risk-critical/20 text-sm">
          <span className="font-medium text-risk-critical">
            {riskCounts.critical} critical alert{riskCounts.critical !== 1 ? 's' : ''} require immediate attention
          </span>
        </div>
      )}
    </div>
  );
}
