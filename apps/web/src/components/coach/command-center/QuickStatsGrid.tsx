/**
 * QuickStatsGrid Component
 * 4-card overview of key team metrics with trends
 */

import StatCard from '../ui/StatCard';
import { StatsGrid } from '../layouts/DashboardGrid';
import { CommandCenterData } from '@/types/coach-portal';

interface QuickStatsGridProps {
  data: CommandCenterData | null;
}

export default function QuickStatsGrid({ data }: QuickStatsGridProps) {
  if (!data) return null;

  const {
    totalAthletes,
    withConsent,
    activeCrisisAlerts,
    assignmentsDueToday,
  } = data.teamStats;

  // Calculate athletes needing attention (priority athletes)
  const athletesNeedingAttention = data.priorityAthletes.length;

  // Calculate team readiness average
  const teamReadinessAvg = 75; // TODO: Calculate from actual data
  const teamReadinessDelta = 0;
  const crisisAlertsDelta = 0;
  const assignmentsDueDelta = 0;
  const athletesNeedingAttentionDelta = 0;

  return (
    <StatsGrid>
      {/* Team Readiness */}
      <StatCard
        title="Team Readiness"
        value={teamReadinessAvg}
        subtitle="Average score across team"
        trend={teamReadinessDelta}
        trendInverse={false}
        icon={<span className="text-2xl">⚡</span>}
        variant={teamReadinessAvg >= 75 ? 'success' : teamReadinessAvg >= 60 ? 'default' : 'warning'}
      />

      {/* Crisis Alerts */}
      <StatCard
        title="Active Alerts"
        value={activeCrisisAlerts}
        subtitle="Athletes flagged for intervention"
        trend={crisisAlertsDelta}
        trendInverse={true} // Down is good for alerts
        icon={<span className="text-2xl">⚠️</span>}
        variant={activeCrisisAlerts === 0 ? 'success' : activeCrisisAlerts <= 2 ? 'warning' : 'danger'}
      />

      {/* Assignments Due */}
      <StatCard
        title="Assignments Due"
        value={assignmentsDueToday}
        subtitle="Pending submissions this week"
        trend={assignmentsDueDelta}
        icon={<span className="text-2xl">📝</span>}
        variant="default"
      />

      {/* Athletes Needing Attention */}
      <StatCard
        title="Need Attention"
        value={athletesNeedingAttention}
        subtitle="Below readiness threshold"
        trend={athletesNeedingAttentionDelta}
        trendInverse={true}
        icon={<span className="text-2xl">👤</span>}
        variant={athletesNeedingAttention <= 3 ? 'success' : athletesNeedingAttention <= 6 ? 'warning' : 'danger'}
      />
    </StatsGrid>
  );
}
