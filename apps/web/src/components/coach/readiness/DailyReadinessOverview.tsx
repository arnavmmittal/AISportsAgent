/**
 * DailyReadinessOverview Component
 * Real-time team readiness snapshot with heatmap and alerts
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import { DailyReadinessHeatMap } from '../charts/HeatMap';
import StatCard from '../ui/StatCard';

export default function DailyReadinessOverview() {
  // TODO: Replace with real API data from /api/coach/readiness/daily
  const todayReadinessData = [
    {
      athleteName: 'Sarah Johnson',
      readiness: [
        { date: '2025-12-07', score: 92 },
        { date: '2025-12-08', score: 88 },
        { date: '2025-12-09', score: 85 },
        { date: '2025-12-10', score: 90 },
        { date: '2025-12-11', score: 87 },
        { date: '2025-12-12', score: 93 },
        { date: '2025-12-13', score: 95 },
      ],
    },
    {
      athleteName: 'Mike Chen',
      readiness: [
        { date: '2025-12-07', score: 78 },
        { date: '2025-12-08', score: 75 },
        { date: '2025-12-09', score: 72 },
        { date: '2025-12-10', score: 70 },
        { date: '2025-12-11', score: 68 },
        { date: '2025-12-12', score: 65 },
        { date: '2025-12-13', score: 63 },
      ],
    },
    {
      athleteName: 'Jordan Smith',
      readiness: [
        { date: '2025-12-07', score: 85 },
        { date: '2025-12-08', score: 88 },
        { date: '2025-12-09', score: 90 },
        { date: '2025-12-10', score: 92 },
        { date: '2025-12-11', score: 89 },
        { date: '2025-12-12', score: 91 },
        { date: '2025-12-13', score: 94 },
      ],
    },
    {
      athleteName: 'Alex Martinez',
      readiness: [
        { date: '2025-12-07', score: 70 },
        { date: '2025-12-08', score: 68 },
        { date: '2025-12-09', score: 72 },
        { date: '2025-12-10', score: 75 },
        { date: '2025-12-11', score: 73 },
        { date: '2025-12-12', score: 71 },
        { date: '2025-12-13', score: 69 },
      ],
    },
    {
      athleteName: 'Taylor Brown',
      readiness: [
        { date: '2025-12-07', score: 88 },
        { date: '2025-12-08', score: 90 },
        { date: '2025-12-09', score: 87 },
        { date: '2025-12-10', score: 85 },
        { date: '2025-12-11', score: 83 },
        { date: '2025-12-12', score: 86 },
        { date: '2025-12-13', score: 89 },
      ],
    },
  ];

  // TODO: Calculate from real data
  const teamStats = {
    avgReadiness: 82.4,
    readinessChange: -1.2,
    optimalCount: 3,
    lowReadinessCount: 2,
    criticalAlerts: 1,
  };

  return (
    <div className="space-y-6">
      {/* Today's Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Team Avg Readiness"
          value={teamStats.avgReadiness}
          trend={teamStats.readinessChange}
          subtitle="Today's average"
          variant={teamStats.avgReadiness >= 80 ? 'success' : 'warning'}
        />
        <StatCard
          title="Optimal Readiness"
          value={teamStats.optimalCount}
          subtitle="90+ score"
          variant="success"
        />
        <StatCard
          title="Low Readiness"
          value={teamStats.lowReadinessCount}
          subtitle="Below 70"
          variant="warning"
        />
        <StatCard
          title="Critical Alerts"
          value={teamStats.criticalAlerts}
          subtitle="Needs attention"
          variant="danger"
        />
      </div>

      {/* 7-Day Readiness Heatmap */}
      <DashboardSection
        title="7-Day Team Readiness Heatmap"
        description="Click any cell to view athlete details"
      >
        <DailyReadinessHeatMap
          data={todayReadinessData}
          onCellClick={(athlete, date, score) => {
            console.log(`Clicked: ${athlete} on ${date} (score: ${score})`);
            // TODO: Open athlete detail modal
          }}
        />
      </DashboardSection>

      {/* Readiness Alerts */}
      <DashboardSection title="Today's Readiness Alerts">
        <div className="space-y-3">
          {[
            {
              athlete: 'Mike Chen',
              sport: 'Basketball',
              readiness: 63,
              trend: 'declining',
              alert: 'Declining readiness for 7 days - suggest rest day',
              priority: 'CRITICAL',
            },
            {
              athlete: 'Alex Martinez',
              sport: 'Soccer',
              readiness: 69,
              trend: 'fluctuating',
              alert: 'Inconsistent readiness - check for stressors',
              priority: 'MONITOR',
            },
          ].map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.priority === 'CRITICAL'
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-amber-900/20 border-amber-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">
                      {alert.athlete}
                    </h4>
                    <span className="text-xs text-slate-400">{alert.sport}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{alert.alert}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span
                      className={
                        alert.priority === 'CRITICAL'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }
                    >
                      Readiness: {alert.readiness}
                    </span>
                    <span className="text-slate-400">
                      Trend: {alert.trend}
                    </span>
                  </div>
                </div>
                <button className="px-3 py-1 bg-primary hover:opacity-90 text-white text-xs rounded-md transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Readiness Distribution */}
      <DashboardSection title="Today's Readiness Distribution">
        <div className="grid grid-cols-5 gap-3">
          {[
            { level: 'OPTIMAL', range: '90-100', count: 3, color: 'bg-green-500' },
            { level: 'GOOD', range: '75-89', count: 8, color: 'bg-blue-500' },
            { level: 'MODERATE', range: '60-74', count: 4, color: 'bg-yellow-500' },
            { level: 'LOW', range: '45-59', count: 2, color: 'bg-orange-500' },
            { level: 'POOR', range: '0-44', count: 0, color: 'bg-red-500' },
          ].map((zone) => (
            <div
              key={zone.level}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center"
            >
              <div
                className={`w-12 h-12 ${zone.color} rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-white`}
              >
                {zone.count}
              </div>
              <h4 className="text-xs font-semibold text-white mb-1">
                {zone.level}
              </h4>
              <p className="text-xs text-slate-400">{zone.range}</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
