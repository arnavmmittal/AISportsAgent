/**
 * AI Insights - Automated Intelligence
 * AI-generated summaries, predictions, and recommendations
 */

'use client';

import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import TabNavigation from '@/components/coach/layouts/TabNavigation';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import TeamSummaries from '@/components/coach/insights/TeamSummaries';
import IndividualInsights from '@/components/coach/insights/IndividualInsights';
import PredictionsForecasts from '@/components/coach/insights/PredictionsForecasts';
import PatternDetection from '@/components/coach/insights/PatternDetection';

export default function AIInsightsPage() {
  const tabs = [
    {
      id: 'team-summaries',
      label: 'Team Summaries',
      icon: '📊',
      content: <TeamSummaries />,
    },
    {
      id: 'individual',
      label: 'Individual Insights',
      icon: '👤',
      content: <IndividualInsights />,
    },
    {
      id: 'predictions',
      label: 'Predictions',
      icon: '🔮',
      content: <PredictionsForecasts />,
    },
    {
      id: 'patterns',
      label: 'Pattern Detection',
      icon: '🔍',
      content: <PatternDetection />,
    },
  ];

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="AI Insights"
          description="Automated intelligence, predictions & recommendations"
        >
          <TabNavigation tabs={tabs} variant="default" />
        </DashboardSection>
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
