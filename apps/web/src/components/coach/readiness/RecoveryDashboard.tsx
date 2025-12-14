/**
 * RecoveryDashboard Component
 * Track athlete recovery needs and rest day recommendations
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import { ReadinessTrendChart } from '../charts/LineChart';
import StatCard from '../ui/StatCard';

export default function RecoveryDashboard() {
  // TODO: Replace with real recovery data from /api/coach/recovery
  const recoveryNeeds = [
    {
      name: 'Mike Chen',
      sport: 'Basketball',
      currentReadiness: 63,
      daysLowReadiness: 7,
      lastRestDay: '2025-12-01',
      daysSinceRest: 12,
      sleepQuality: 5.2,
      stressLevel: 7.8,
      recommendation: 'URGENT REST NEEDED',
      priority: 'CRITICAL',
      suggestedRestDays: 2,
    },
    {
      name: 'Alex Martinez',
      sport: 'Soccer',
      currentReadiness: 69,
      daysLowReadiness: 4,
      lastRestDay: '2025-12-05',
      daysSinceRest: 8,
      sleepQuality: 6.1,
      stressLevel: 6.5,
      recommendation: 'Consider light training day',
      priority: 'MODERATE',
      suggestedRestDays: 1,
    },
    {
      name: 'Jamie Davis',
      sport: 'Basketball',
      currentReadiness: 78,
      daysLowReadiness: 2,
      lastRestDay: '2025-12-09',
      daysSinceRest: 4,
      sleepQuality: 6.8,
      stressLevel: 5.5,
      recommendation: 'Monitor - schedule rest after next game',
      priority: 'LOW',
      suggestedRestDays: 1,
    },
  ];

  // Recovery trends over 30 days
  const recoveryTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    score: 70 + Math.random() * 20,
    trainingLoad: 50 + Math.random() * 30,
  }));

  return (
    <div className="space-y-6">
      {/* Recovery Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Athletes Needing Rest"
          value={3}
          subtitle="Below 70 readiness"
          variant="warning"
        />
        <StatCard
          title="Avg Days Since Rest"
          value={8.2}
          subtitle="Team average"
          variant="default"
        />
        <StatCard
          title="Critical Recovery Cases"
          value={1}
          subtitle="Urgent attention"
          variant="error"
        />
        <StatCard
          title="Team Recovery Score"
          value={74}
          trend={-3}
          subtitle="0-100 scale"
          variant="warning"
        />
      </div>

      {/* Athletes Requiring Recovery */}
      <DashboardSection
        title="Athletes Requiring Recovery Attention"
        description="Sorted by priority - act on critical cases immediately"
      >
        <div className="space-y-3">
          {recoveryNeeds.map((athlete, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                athlete.priority === 'CRITICAL'
                  ? 'bg-red-900/20 border-red-700'
                  : athlete.priority === 'MODERATE'
                  ? 'bg-amber-900/20 border-amber-700'
                  : 'bg-blue-900/20 border-blue-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">
                      {athlete.name}
                    </h4>
                    <span className="text-xs text-slate-400">{athlete.sport}</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        athlete.priority === 'CRITICAL'
                          ? 'bg-red-900/50 text-red-300'
                          : athlete.priority === 'MODERATE'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {athlete.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium mb-2">
                    💡 {athlete.recommendation}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      athlete.currentReadiness >= 70
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {athlete.currentReadiness}
                  </div>
                  <div className="text-xs text-slate-400">Readiness</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2 bg-slate-900/50 rounded">
                  <div className="text-xs text-slate-400 mb-1">Days Low Readiness</div>
                  <div className="text-sm font-semibold text-white">
                    {athlete.daysLowReadiness} days
                  </div>
                </div>
                <div className="p-2 bg-slate-900/50 rounded">
                  <div className="text-xs text-slate-400 mb-1">Last Rest Day</div>
                  <div className="text-sm font-semibold text-white">
                    {athlete.daysSinceRest} days ago
                  </div>
                </div>
                <div className="p-2 bg-slate-900/50 rounded">
                  <div className="text-xs text-slate-400 mb-1">Sleep Quality</div>
                  <div className="text-sm font-semibold text-white">
                    {athlete.sleepQuality}/10
                  </div>
                </div>
                <div className="p-2 bg-slate-900/50 rounded">
                  <div className="text-xs text-slate-400 mb-1">Stress Level</div>
                  <div className="text-sm font-semibold text-white">
                    {athlete.stressLevel}/10
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-300">
                  Suggested rest: <strong>{athlete.suggestedRestDays} day(s)</strong>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors">
                  Schedule Rest Day
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Recovery Trend Analysis */}
      <DashboardSection
        title="Team Recovery Trend"
        description="30-day recovery vs training load balance"
      >
        <ReadinessTrendChart data={recoveryTrendData} height={300} />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              metric: 'Optimal Recovery',
              value: '12 athletes',
              description: 'Readiness >80 with adequate rest',
              color: 'green',
            },
            {
              metric: 'Monitoring Required',
              value: '5 athletes',
              description: 'Readiness 60-79, watch closely',
              color: 'yellow',
            },
            {
              metric: 'Recovery Deficit',
              value: '3 athletes',
              description: 'Readiness <60, intervention needed',
              color: 'red',
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                item.color === 'green'
                  ? 'bg-green-900/20 border-green-700'
                  : item.color === 'yellow'
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-red-900/20 border-red-700'
              }`}
            >
              <h4 className="text-sm font-semibold text-white mb-1">
                {item.metric}
              </h4>
              <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Recovery Recommendations */}
      <DashboardSection title="Team-Wide Recovery Recommendations">
        <div className="space-y-3">
          {[
            {
              title: 'Schedule Team Recovery Day',
              description:
                'Consider light practice or rest day this Thursday - team average readiness declining',
              action: 'Schedule',
              priority: 'HIGH',
            },
            {
              title: 'Sleep Education Session',
              description:
                '40% of team reporting <7 hours sleep - schedule sleep hygiene workshop',
              action: 'Schedule',
              priority: 'MODERATE',
            },
            {
              title: 'Stress Management Check-ins',
              description:
                'Finals week approaching - proactive stress management interventions recommended',
              action: 'Implement',
              priority: 'MODERATE',
            },
            {
              title: 'Training Load Adjustment',
              description:
                'Reduce intensity 15-20% for next 3 days to allow recovery',
              action: 'Adjust',
              priority: 'HIGH',
            },
          ].map((rec, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        rec.priority === 'HIGH'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-amber-900/30 text-amber-400'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{rec.description}</p>
                </div>
                <button className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex-shrink-0">
                  {rec.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
