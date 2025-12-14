/**
 * Analytics Hub - Team Intelligence & Insights
 * Deep analytics with cohort comparisons, correlations, and longitudinal trends
 */

'use client';

import { useState } from 'react';
import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import TabNavigation from '@/components/coach/layouts/TabNavigation';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import TeamPulse from '@/components/coach/analytics/TeamPulse';
import PerformanceIntelligence from '@/components/coach/analytics/PerformanceIntelligence';
import InterventionOutcomes from '@/components/coach/analytics/InterventionOutcomes';

export default function AnalyticsPage() {
  const tabs = [
    {
      id: 'team-pulse',
      label: 'Team Pulse',
      icon: '📊',
      content: <TeamPulse />,
    },
    {
      id: 'performance',
      label: 'Performance Intel',
      icon: '🎯',
      content: <PerformanceIntelligence />,
    },
    {
      id: 'interventions',
      label: 'Intervention Outcomes',
      icon: '📈',
      content: <InterventionOutcomes />,
    },
  ];

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Analytics Hub"
          description="Deep intelligence & cohort analysis"
        >
          <TabNavigation tabs={tabs} variant="default" />
        </DashboardSection>
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
