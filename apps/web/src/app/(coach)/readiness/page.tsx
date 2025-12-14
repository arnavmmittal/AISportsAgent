/**
 * Readiness Command - Game-Day Optimization
 * Real-time readiness monitoring, forecasting, and lineup optimization
 */

'use client';

import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import TabNavigation from '@/components/coach/layouts/TabNavigation';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import DailyReadinessOverview from '@/components/coach/readiness/DailyReadinessOverview';
import ReadinessForecast from '@/components/coach/readiness/ReadinessForecast';
import LineupOptimizer from '@/components/coach/readiness/LineupOptimizer';
import RecoveryDashboard from '@/components/coach/readiness/RecoveryDashboard';

export default function ReadinessCommandPage() {
  const tabs = [
    {
      id: 'overview',
      label: 'Daily Overview',
      icon: '📊',
      content: <DailyReadinessOverview />,
    },
    {
      id: 'forecast',
      label: '7-Day Forecast',
      icon: '🔮',
      content: <ReadinessForecast />,
    },
    {
      id: 'lineup',
      label: 'Lineup Optimizer',
      icon: '🎯',
      content: <LineupOptimizer />,
    },
    {
      id: 'recovery',
      label: 'Recovery Tracking',
      icon: '💤',
      content: <RecoveryDashboard />,
    },
  ];

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Readiness Command"
          description="Game-day optimization & performance forecasting"
        >
          <TabNavigation tabs={tabs} variant="default" />
        </DashboardSection>
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
