/**
 * TeamPulse Component
 * Longitudinal trends, cohort comparisons, and correlation analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardSection, TwoColumnLayout } from '../layouts/DashboardGrid';
import { MoodTrendChart, ReadinessTrendChart } from '../charts/LineChart';
import { CohortComparisonChart } from '../charts/BarChart';
import { CorrelationHeatMap } from '../charts/HeatMap';
import StatCard from '../ui/StatCard';
import { SkeletonChart } from '../ui/Skeleton';

export default function TeamPulse() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    // TODO: Fetch team pulse data
    setLoading(false);
  }, [timeRange]);

  // Mock data for now
  const moodTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    mood: 6 + Math.random() * 2,
    confidence: 6 + Math.random() * 2,
  }));

  const readinessTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    score: 70 + Math.random() * 20,
  }));

  const cohortData = [
    { cohort: 'Football', readiness: 75, mood: 7.2, stress: 5.5 },
    { cohort: 'Basketball', readiness: 82, mood: 7.8, stress: 4.8 },
    { cohort: 'Soccer', readiness: 78, mood: 7.5, stress: 5.2 },
  ];

  const correlationVariables = ['Mood', 'Stress', 'Sleep', 'Confidence'];
  const correlationMatrix = [
    [1.0, -0.7, 0.6, 0.8],
    [-0.7, 1.0, -0.5, -0.6],
    [0.6, -0.5, 1.0, 0.7],
    [0.8, -0.6, 0.7, 1.0],
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7', '30', '90'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {range} days
          </button>
        ))}
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Avg Team Mood"
          value={7.2}
          trend={0.3}
          subtitle="Last 30 days"
          variant="success"
        />
        <StatCard
          title="Avg Readiness"
          value={78}
          trend={-2}
          subtitle="0-100 scale"
          variant="default"
        />
        <StatCard
          title="Avg Stress"
          value={5.2}
          trend={-0.5}
          trendInverse={true}
          subtitle="1-10 scale"
          variant="warning"
        />
        <StatCard
          title="Engagement Rate"
          value="84%"
          trend={5}
          subtitle="Daily check-ins"
          variant="success"
        />
      </div>

      {/* Longitudinal Trends */}
      <TwoColumnLayout
        main={
          <DashboardSection title="Mood Trends" description="Team average over time">
            <MoodTrendChart data={moodTrendData} height={300} />
          </DashboardSection>
        }
        sidebar={
          <DashboardSection title="Readiness Trend" description="Team average">
            <ReadinessTrendChart data={readinessTrendData} height={300} />
          </DashboardSection>
        }
      />

      {/* Cohort Comparison */}
      <DashboardSection
        title="Sport Comparisons"
        description="Compare metrics across different sports"
      >
        <CohortComparisonChart data={cohortData} height={300} />
      </DashboardSection>

      {/* Correlation Matrix */}
      <DashboardSection
        title="Correlation Analysis"
        description="Relationships between key metrics"
      >
        <CorrelationHeatMap data={correlationMatrix} variables={correlationVariables} />
      </DashboardSection>
    </div>
  );
}
