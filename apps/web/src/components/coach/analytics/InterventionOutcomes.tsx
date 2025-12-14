/**
 * InterventionOutcomes Component
 * Track effectiveness of coach interventions
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import { GoalCompletionChart } from '../charts/BarChart';
import StatCard from '../ui/StatCard';

export default function InterventionOutcomes() {
  const goalCompletionData = [
    { category: 'Mental Skills', completed: 45, active: 30, abandoned: 5 },
    { category: 'Performance', completed: 38, active: 25, abandoned: 8 },
    { category: 'Academic', completed: 52, active: 15, abandoned: 3 },
    { category: 'Personal', completed: 28, active: 20, abandoned: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Effectiveness Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Intervention Success Rate"
          value="78%"
          trend={5}
          subtitle="Positive outcomes"
          variant="success"
        />
        <StatCard
          title="Avg Response Time"
          value="2.3h"
          trend={-0.5}
          trendInverse={true}
          subtitle="Alert to action"
          variant="default"
        />
        <StatCard
          title="Follow-up Rate"
          value="92%"
          trend={3}
          subtitle="Interventions tracked"
          variant="success"
        />
        <StatCard
          title="Athlete Satisfaction"
          value="4.6/5"
          trend={0.2}
          subtitle="From surveys"
          variant="success"
        />
      </div>

      {/* Goal Completion Analysis */}
      <DashboardSection
        title="Goal Completion by Category"
        description="Breakdown of goals set through interventions"
      >
        <GoalCompletionChart data={goalCompletionData} height={300} />
      </DashboardSection>

      {/* Intervention Type Effectiveness */}
      <DashboardSection title="Most Effective Intervention Types">
        <div className="space-y-3">
          {[
            { type: 'One-on-One Check-in', success: 85, count: 120 },
            { type: 'Resource Sharing', success: 79, count: 95 },
            { type: 'Goal Setting Session', success: 88, count: 78 },
            { type: 'Referral to Counseling', success: 92, count: 25 },
            { type: 'Skill-Building Assignment', success: 76, count: 150 },
          ].map((intervention, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {intervention.type}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {intervention.count} interventions
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {intervention.success}%
                </div>
                <p className="text-xs text-slate-400">success rate</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Archetype-Specific Insights */}
      <DashboardSection
        title="Archetype-Specific Success Rates"
        description="Which interventions work best for each personality type"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { archetype: 'Overthinker 🤔', best: 'Simplification exercises', rate: 82 },
            { archetype: 'Burnout Risk 🔥', best: 'Recovery protocols', rate: 88 },
            { archetype: 'Perfectionist 🎯', best: 'Self-compassion work', rate: 79 },
            { archetype: 'Resilient Warrior 💪', best: 'Leadership opportunities', rate: 91 },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{item.archetype}</h4>
                <span className="text-lg font-bold text-blue-400">{item.rate}%</span>
              </div>
              <p className="text-xs text-slate-400">
                Most effective: <span className="text-slate-300">{item.best}</span>
              </p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
