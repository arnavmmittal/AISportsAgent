'use client';

import { useEffect, useState } from 'react';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { ReadinessRing } from '@/components/shared/viz/ReadinessRing';
import { Sparkline } from '@/components/shared/viz/Sparkline';
import { AnimatedNumber } from '@/components/shared/ui/animated-number';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyPulseData {
  teamReadiness: { current: number; delta: number; weekAgo: number };
  checkInRate: { active: number; total: number; percentage: number };
  topImprover: { athleteId: string; name: string; trend: number[]; delta: number } | null;
  needsAttention: { athleteId: string; name: string; trend: number[]; readiness: number } | null;
  mostConsistent: { athleteId: string; name: string; streak: number } | null;
  pendingInterventions: number;
  inactiveAthletes: number;
  nextGameDate: string | null;
}

interface WeeklyPulseCardProps {
  coachId: string;
  teamId: string;
  className?: string;
}

export function WeeklyPulseCard({ coachId, teamId, className }: WeeklyPulseCardProps) {
  const [data, setData] = useState<WeeklyPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function fetchPulse() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ coachId, teamId });
        const res = await fetch(`/api/coach/weekly-pulse?${params}`);
        if (!res.ok) throw new Error('Failed to fetch weekly pulse');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load pulse');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weekly pulse');
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, [coachId, teamId]);

  if (loading) {
    return (
      <SpotlightCard className={cn('p-6', className)}>
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
            <div className="h-3 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
      </SpotlightCard>
    );
  }

  if (error || !data) return null;

  const DeltaIcon = data.teamReadiness.delta >= 0 ? TrendingUp : TrendingDown;
  const deltaColor = data.teamReadiness.delta >= 0 ? 'text-accent' : 'text-destructive';

  return (
    <SpotlightCard className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 pb-2 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">Weekly Pulse</h3>
          <Badge variant="outline" className="text-xs">
            This Week
          </Badge>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 pt-2">
          {/* Column 1: Team Pulse */}
          <div className="flex flex-col items-center gap-3">
            <ReadinessRing score={data.teamReadiness.current} size="lg" />
            <div className="text-center">
              <div className={cn('flex items-center gap-1 text-sm font-medium', deltaColor)}>
                <DeltaIcon className="w-4 h-4" />
                <span>{data.teamReadiness.delta > 0 ? '+' : ''}{data.teamReadiness.delta} from last week</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <AnimatedNumber value={data.checkInRate.percentage} suffix="%" className="font-medium text-foreground text-xs" /> of team checked in
              </p>
            </div>
          </div>

          {/* Column 2: Movers */}
          <div className="space-y-3">
            {data.topImprover && (
              <div className="flex items-center gap-3 min-h-[40px]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Top Improver</p>
                  <p className="text-sm font-medium text-foreground truncate">{data.topImprover.name}</p>
                </div>
                <div className="flex-shrink-0 w-16">
                  <Sparkline data={data.topImprover.trend} autoColor showDot width={64} height={24} />
                </div>
              </div>
            )}

            {data.needsAttention && (
              <div className="flex items-center gap-3 min-h-[40px]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Needs Attention</p>
                  <p className="text-sm font-medium text-foreground truncate">{data.needsAttention.name}</p>
                </div>
                <div className="flex-shrink-0 w-16">
                  <Sparkline data={data.needsAttention.trend} autoColor showDot width={64} height={24} />
                </div>
              </div>
            )}

            {data.mostConsistent && (
              <div className="flex items-center gap-3 min-h-[40px]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Most Consistent</p>
                  <p className="text-sm font-medium text-foreground truncate">{data.mostConsistent.name}</p>
                </div>
                <div className="flex-shrink-0 w-16 flex justify-end">
                  <Badge variant="outline" className="text-xs tabular-nums">
                    {data.mostConsistent.streak}d streak
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Actions */}
          <div className="space-y-3">
            {data.pendingInterventions > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-foreground">
                    <span className="font-bold">{data.pendingInterventions}</span> pending intervention{data.pendingInterventions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {data.inactiveAthletes > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    <span className="font-bold">{data.inactiveAthletes}</span> inactive &gt;3 days
                  </span>
                </div>
              </div>
            )}

            {data.nextGameDate && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">
                    Next game: {new Date(data.nextGameDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SpotlightCard>
  );
}
