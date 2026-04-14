/**
 * TeamPulse Component
 * Longitudinal trends, cohort comparisons, and correlation analysis
 * Uses REAL data from /api/coach/analytics/team-pulse
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardSection, TwoColumnLayout } from '../layouts/DashboardGrid';
import { MoodTrendChart, ReadinessTrendChart } from '../charts/LineChart';
import { CohortComparisonChart } from '../charts/BarChart';
import { CorrelationHeatMap } from '../charts/HeatMap';
import StatCard from '../ui/StatCard';
import { SkeletonChart } from '../ui/Skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TeamPulseData {
  stats: {
    avgMood: number;
    moodTrend: number;
    avgReadiness: number;
    readinessTrend: number;
    avgStress: number;
    stressTrend: number;
    engagementRate: number;
    engagementTrend: number;
    totalLogs: number;
    athleteCount: number;
  };
  moodTrend: Array<{ date: string; mood: number; confidence: number }>;
  readinessTrend: Array<{ date: string; score: number }>;
  cohortComparison: Array<{ cohort: string; readiness: number; mood: number; stress: number }>;
  correlationMatrix: {
    variables: string[];
    matrix: number[][];
  };
}

export default function TeamPulse() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [data, setData] = useState<TeamPulseData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/coach/analytics/team-pulse?days=${timeRange}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[TeamPulse] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {['7', '30', '90'].map((r) => (
            <div key={r} className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.stats.totalLogs === 0) {
    return (
      <div className="card-elevated p-8 text-center space-y-2">
        <p className="text-muted-foreground">No check-in data available for the last {timeRange} days.</p>
        <p className="text-sm text-muted-foreground">Athletes need to log mood check-ins for analytics to appear.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.stats.totalLogs} check-ins from {data.stats.athleteCount} athletes
        </p>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Avg Team Mood"
          value={data.stats.avgMood}
          trend={data.stats.moodTrend}
          subtitle={`${timeRange}-day average`}
          variant={data.stats.avgMood >= 7 ? 'success' : data.stats.avgMood >= 5 ? 'default' : 'warning'}
        />
        <StatCard
          title="Avg Readiness"
          value={data.stats.avgReadiness}
          trend={data.stats.readinessTrend}
          subtitle="0-100 scale"
          variant={data.stats.avgReadiness >= 75 ? 'success' : data.stats.avgReadiness >= 60 ? 'default' : 'warning'}
        />
        <StatCard
          title="Avg Stress"
          value={data.stats.avgStress}
          trend={data.stats.stressTrend}
          trendInverse={true}
          subtitle="1-10 scale"
          variant={data.stats.avgStress <= 4 ? 'success' : data.stats.avgStress <= 6 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Engagement Rate"
          value={`${data.stats.engagementRate}%`}
          trend={data.stats.engagementTrend}
          subtitle="Athletes checking in"
          variant={data.stats.engagementRate >= 80 ? 'success' : data.stats.engagementRate >= 50 ? 'default' : 'warning'}
        />
      </div>

      {/* Longitudinal Trends */}
      {data.moodTrend.length > 0 && (
        <TwoColumnLayout
          main={
            <DashboardSection title="Mood & Confidence Trends" description={`Team average over ${timeRange} days`}>
              <MoodTrendChart data={data.moodTrend} height={300} />
            </DashboardSection>
          }
          sidebar={
            <DashboardSection title="Readiness Trend" description="Team average score">
              <ReadinessTrendChart data={data.readinessTrend} height={300} />
            </DashboardSection>
          }
        />
      )}

      {/* Cohort Comparison */}
      {data.cohortComparison.length > 1 && (
        <DashboardSection
          title="Sport Comparisons"
          description="Compare metrics across different sports"
        >
          <CohortComparisonChart data={data.cohortComparison} height={300} />
        </DashboardSection>
      )}

      {/* Correlation Matrix */}
      {data.correlationMatrix.matrix.length > 0 && (
        <DashboardSection
          title="Metric Correlations"
          description="Relationships between mental state variables — stronger colors = stronger relationship"
        >
          <CorrelationHeatMap
            data={data.correlationMatrix.matrix}
            variables={data.correlationMatrix.variables}
          />
        </DashboardSection>
      )}
    </div>
  );
}
