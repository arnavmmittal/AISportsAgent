/**
 * TeamSummaries Component
 * AI-generated weekly and monthly team reports
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

type ReportPeriod = 'week' | 'month' | 'quarter';

interface TeamReport {
  id: string;
  period: ReportPeriod;
  dateRange: string;
  generatedAt: string;
  overallTrend: 'improving' | 'stable' | 'declining';
  keyInsights: string[];
  metrics: {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }[];
  athletesOfConcern: {
    name: string;
    sport: string;
    reason: string;
  }[];
  athletesExcelling: {
    name: string;
    sport: string;
    achievement: string;
  }[];
}

export default function TeamSummaries() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('week');

  // TODO: Replace with AI-generated reports from /api/coach/insights/team-summaries
  const reports: Record<ReportPeriod, TeamReport> = {
    week: {
      id: 'w-2025-12-13',
      period: 'week',
      dateRange: 'Dec 7-13, 2025',
      generatedAt: '2025-12-13T08:00:00Z',
      overallTrend: 'stable',
      keyInsights: [
        'Team readiness has stabilized at 78 (±2 points) this week after previous decline',
        'Stress levels elevated across team - likely due to upcoming finals week',
        'Basketball team showing better cohesion metrics (+12%) compared to last week',
        'Sleep quality decreased 8% team-wide - average 6.2 hours vs 6.8 hours last week',
      ],
      metrics: [
        { label: 'Avg Readiness', value: '78', change: '+0.5', trend: 'up' },
        { label: 'Avg Mood', value: '7.1', change: '-0.2', trend: 'down' },
        { label: 'Avg Stress', value: '5.8', change: '+0.9', trend: 'down' },
        { label: 'Engagement Rate', value: '84%', change: '+3%', trend: 'up' },
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Schedule team recovery day Thursday or Friday',
          rationale: 'Sleep debt accumulating across team - proactive recovery will prevent further readiness decline and potential injuries',
        },
        {
          priority: 'high',
          action: 'Conduct stress management workshops before finals',
          rationale: 'Stress levels 15% above baseline - athletes would benefit from time management and exam anxiety techniques',
        },
        {
          priority: 'medium',
          action: 'Celebrate basketball team\'s improved cohesion',
          rationale: 'Positive trend should be reinforced - consider team-building activity or recognition',
        },
        {
          priority: 'medium',
          action: 'Check in with Mike Chen and Alex Martinez individually',
          rationale: 'Both showing declining readiness patterns for 7+ consecutive days',
        },
      ],
      athletesOfConcern: [
        { name: 'Mike Chen', sport: 'Basketball', reason: '7-day declining readiness trend (63/100)' },
        { name: 'Alex Martinez', sport: 'Soccer', reason: 'Elevated stress (8.2/10) + poor sleep quality' },
        { name: 'Chris Lee', sport: 'Football', reason: 'Assignment non-compliance (0/3 completed this week)' },
      ],
      athletesExcelling: [
        { name: 'Sarah Johnson', sport: 'Basketball', achievement: '28-day meditation streak, highest readiness on team (95)' },
        { name: 'Jordan Smith', sport: 'Soccer', achievement: 'Completed all assignments with excellent quality, improving trend' },
        { name: 'Taylor Brown', sport: 'Basketball', achievement: 'Leadership in team cohesion, positive influence on teammates' },
      ],
    },
    month: {
      id: 'm-2025-12',
      period: 'month',
      dateRange: 'November 13 - December 13, 2025',
      generatedAt: '2025-12-13T08:00:00Z',
      overallTrend: 'improving',
      keyInsights: [
        'Team readiness improved 5 points month-over-month (73 → 78)',
        'Assignment completion rate increased from 68% to 79%',
        'Crisis alerts decreased 40% compared to previous month',
        'Habit formation showing success - 74% of tracked habits maintained 14+ day streaks',
      ],
      metrics: [
        { label: 'Avg Readiness', value: '78', change: '+5', trend: 'up' },
        { label: 'Avg Mood', value: '7.1', change: '+0.4', trend: 'up' },
        { label: 'Avg Stress', value: '5.8', change: '+0.3', trend: 'down' },
        { label: 'Engagement Rate', value: '84%', change: '+11%', trend: 'up' },
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Continue current intervention strategies',
          rationale: 'Month-over-month improvement across all key metrics - don\'t change what\'s working',
        },
        {
          priority: 'medium',
          action: 'Scale successful habit programs team-wide',
          rationale: 'High compliance with breathing protocols and gratitude journaling - expand to more athletes',
        },
        {
          priority: 'low',
          action: 'Review and update assignment library',
          rationale: 'Some assignments have low completion rates - consider revising or replacing',
        },
      ],
      athletesOfConcern: [
        { name: 'Mike Chen', sport: 'Basketball', reason: 'Persistent low readiness for 18 of 30 days this month' },
      ],
      athletesExcelling: [
        { name: 'Sarah Johnson', sport: 'Basketball', achievement: 'Top performer - consistent excellence all month' },
        { name: 'Jordan Smith', sport: 'Soccer', achievement: 'Most improved - readiness up 18 points this month' },
      ],
    },
    quarter: {
      id: 'q-2025-q4',
      period: 'quarter',
      dateRange: 'Q4 2025 (Oct-Dec)',
      generatedAt: '2025-12-13T08:00:00Z',
      overallTrend: 'improving',
      keyInsights: [
        'Quarter-over-quarter team readiness up 8 points (70 → 78)',
        'Coach intervention response time improved 35% (3.5h → 2.3h average)',
        'Athlete engagement with AI chat increased 127% since Q4 start',
        'Zero serious mental health crises this quarter (down from 2 in Q3)',
      ],
      metrics: [
        { label: 'Avg Readiness', value: '78', change: '+8', trend: 'up' },
        { label: 'Avg Mood', value: '7.1', change: '+0.7', trend: 'up' },
        { label: 'Avg Stress', value: '5.8', change: '-0.4', trend: 'up' },
        { label: 'Engagement Rate', value: '84%', change: '+23%', trend: 'up' },
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Document and share best practices with other coaches',
          rationale: 'Exceptional results this quarter - institutional knowledge should be preserved and shared',
        },
        {
          priority: 'medium',
          action: 'Plan for off-season mental skills maintenance',
          rationale: 'Athletes will need structure during break to maintain gains',
        },
      ],
      athletesOfConcern: [],
      athletesExcelling: [
        { name: 'Entire Team', sport: 'All', achievement: 'Outstanding quarter-wide improvement across all metrics' },
      ],
    },
  };

  const currentReport = reports[selectedPeriod];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-3">
        {([
          { id: 'week', label: 'This Week', icon: '📅' },
          { id: 'month', label: 'This Month', icon: '📆' },
          { id: 'quarter', label: 'This Quarter', icon: '📊' },
        ] as const).map(period => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedPeriod === period.id
                ? 'bg-primary border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="mr-2">{period.icon}</span>
            {period.label}
          </button>
        ))}
      </div>

      {/* Report Header */}
      <div className="p-5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Team Summary Report
            </h2>
            <p className="text-sm text-blue-300">
              {currentReport.dateRange} • Generated{' '}
              {new Date(currentReport.generatedAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              currentReport.overallTrend === 'improving'
                ? 'bg-green-900/50 text-green-300'
                : currentReport.overallTrend === 'stable'
                ? 'bg-blue-900/50 text-blue-300'
                : 'bg-red-900/50 text-red-300'
            }`}
          >
            {currentReport.overallTrend === 'improving' && '📈 Improving'}
            {currentReport.overallTrend === 'stable' && '➡️ Stable'}
            {currentReport.overallTrend === 'declining' && '📉 Declining'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          🤖 This report was automatically generated by AI based on aggregated team data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {currentReport.metrics.map((metric, idx) => (
          <StatCard
            key={idx}
            title={metric.label}
            value={metric.value}
            trend={parseFloat(metric.change)}
            trendInverse={metric.label.includes('Stress')}
            subtitle={metric.change}
            variant={
              metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'warning' : 'default'
            }
          />
        ))}
      </div>

      {/* Key Insights */}
      <DashboardSection title="🔍 Key Insights">
        <ul className="space-y-2">
          {currentReport.keyInsights.map((insight, idx) => (
            <li
              key={idx}
              className="p-3 bg-slate-800/50 border-l-4 border-blue-500 rounded"
            >
              <p className="text-sm text-slate-200">{insight}</p>
            </li>
          ))}
        </ul>
      </DashboardSection>

      {/* AI Recommendations */}
      <DashboardSection title="💡 AI-Generated Recommendations">
        <div className="space-y-3">
          {currentReport.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                rec.priority === 'high'
                  ? 'bg-red-900/20 border-red-700'
                  : rec.priority === 'medium'
                  ? 'bg-amber-900/20 border-amber-700'
                  : 'bg-blue-900/20 border-blue-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{rec.action}</h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    rec.priority === 'high'
                      ? 'bg-red-900/50 text-red-300'
                      : rec.priority === 'medium'
                      ? 'bg-amber-900/50 text-amber-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}
                >
                  {rec.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <p className="text-sm text-slate-300">{rec.rationale}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Athletes Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Athletes of Concern */}
        {currentReport.athletesOfConcern.length > 0 && (
          <DashboardSection title="⚠️ Athletes Requiring Attention">
            <div className="space-y-2">
              {currentReport.athletesOfConcern.map((athlete, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-900/20 border border-amber-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-semibold text-white">{athlete.name}</h5>
                    <span className="text-xs text-slate-400">{athlete.sport}</span>
                  </div>
                  <p className="text-xs text-slate-300">{athlete.reason}</p>
                </div>
              ))}
            </div>
          </DashboardSection>
        )}

        {/* Athletes Excelling */}
        {currentReport.athletesExcelling.length > 0 && (
          <DashboardSection title="⭐ Athletes Excelling">
            <div className="space-y-2">
              {currentReport.athletesExcelling.map((athlete, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-green-900/20 border border-green-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-semibold text-white">{athlete.name}</h5>
                    <span className="text-xs text-slate-400">{athlete.sport}</span>
                  </div>
                  <p className="text-xs text-slate-300">{athlete.achievement}</p>
                </div>
              ))}
            </div>
          </DashboardSection>
        )}
      </div>
    </div>
  );
}
