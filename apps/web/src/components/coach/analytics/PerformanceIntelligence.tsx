/**
 * PerformanceIntelligence Component
 * Readiness-performance correlations and predictions
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import { PerformanceTrendChart } from '../charts/LineChart';
import { DailyReadinessHeatMap } from '../charts/HeatMap';
import StatCard from '../ui/StatCard';

export default function PerformanceIntelligence() {
  // Mock data
  const performanceData = Array.from({ length: 20 }, (_, i) => ({
    date: `Game ${i + 1}`,
    performance: 70 + Math.random() * 20,
    readiness: 70 + Math.random() * 20,
  }));

  const dailyReadinessData = [
    {
      athleteName: 'John Smith',
      readiness: [
        { date: '2024-12-07', score: 85 },
        { date: '2024-12-08', score: 78 },
        { date: '2024-12-09', score: 92 },
        { date: '2024-12-10', score: 88 },
        { date: '2024-12-11', score: 75 },
        { date: '2024-12-12', score: 81 },
        { date: '2024-12-13', score: 90 },
      ],
    },
    {
      athleteName: 'Jane Doe',
      readiness: [
        { date: '2024-12-07', score: 92 },
        { date: '2024-12-08', score: 88 },
        { date: '2024-12-09', score: 85 },
        { date: '2024-12-10', score: 90 },
        { date: '2024-12-11', score: 87 },
        { date: '2024-12-12', score: 93 },
        { date: '2024-12-13', score: 95 },
      ],
    },
    {
      athleteName: 'Mike Johnson',
      readiness: [
        { date: '2024-12-07', score: 65 },
        { date: '2024-12-08', score: 70 },
        { date: '2024-12-09', score: 68 },
        { date: '2024-12-10', score: 72 },
        { date: '2024-12-11', score: 75 },
        { date: '2024-12-12', score: 71 },
        { date: '2024-12-13', score: 69 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Readiness-Performance Correlation"
          value="0.72"
          subtitle="Strong positive relationship"
          variant="success"
        />
        <StatCard
          title="Optimal Readiness Zone"
          value="85-95"
          subtitle="Peak performance range"
          variant="default"
        />
        <StatCard
          title="At-Risk Predictions"
          value={3}
          subtitle="Athletes likely to underperform"
          variant="warning"
        />
      </div>

      {/* Performance vs Readiness Trend */}
      <DashboardSection
        title="Performance vs Readiness"
        description="Correlation over last 20 games"
      >
        <PerformanceTrendChart data={performanceData} height={300} />
      </DashboardSection>

      {/* Daily Readiness Heatmap */}
      <DashboardSection
        title="7-Day Readiness Snapshot"
        description="Team-wide readiness visualization"
      >
        <DailyReadinessHeatMap
          data={dailyReadinessData}
          onCellClick={(athlete, date, score) => {
            console.log(`Clicked: ${athlete} on ${date} (score: ${score})`);
          }}
        />
      </DashboardSection>

      {/* Predictions */}
      <DashboardSection
        title="Performance Predictions"
        description="Based on current readiness trends"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              ✅ Likely to Excel (5 athletes)
            </h4>
            <p className="text-sm text-slate-300">
              High readiness scores (90+) maintained for 5+ days
            </p>
          </div>
          <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
            <h4 className="text-sm font-semibold text-amber-400 mb-2">
              ⚠️ Performance Risk (3 athletes)
            </h4>
            <p className="text-sm text-slate-300">
              Declining readiness, may underperform if not addressed
            </p>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
