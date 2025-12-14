/**
 * HabitTracker Component
 * Track formation of mental skills habits across team
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

interface Habit {
  id: string;
  name: string;
  category: string;
  targetFrequency: string;
  activeAthletes: number;
  avgCompletionRate: number;
  avgStreakDays: number;
  topPerformers: {
    athleteName: string;
    sport: string;
    currentStreak: number;
    completionRate: number;
  }[];
}

interface AthleteHabitProgress {
  athleteName: string;
  sport: string;
  habits: {
    habitName: string;
    currentStreak: number;
    completionRate: number;
    lastCompleted: string;
    status: 'on-track' | 'at-risk' | 'broken';
  }[];
}

export default function HabitTracker() {
  // TODO: Replace with API data from /api/coach/habits
  const teamHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Pre-Performance Breathing (5 min)',
      category: 'Mindfulness',
      targetFrequency: 'Daily',
      activeAthletes: 23,
      avgCompletionRate: 78,
      avgStreakDays: 12,
      topPerformers: [
        { athleteName: 'Sarah Johnson', sport: 'Basketball', currentStreak: 28, completionRate: 93 },
        { athleteName: 'Jordan Smith', sport: 'Soccer', currentStreak: 21, completionRate: 88 },
      ],
    },
    {
      id: 'h2',
      name: 'Morning Visualization (10 min)',
      category: 'Performance',
      targetFrequency: '3x per week',
      activeAthletes: 15,
      avgCompletionRate: 65,
      avgStreakDays: 8,
      topPerformers: [
        { athleteName: 'Chris Lee', sport: 'Football', currentStreak: 14, completionRate: 85 },
        { athleteName: 'Alex Martinez', sport: 'Soccer', currentStreak: 10, completionRate: 72 },
      ],
    },
    {
      id: 'h3',
      name: 'Evening Gratitude Journal',
      category: 'Mindfulness',
      targetFrequency: 'Daily',
      activeAthletes: 31,
      avgCompletionRate: 82,
      avgStreakDays: 15,
      topPerformers: [
        { athleteName: 'Taylor Brown', sport: 'Basketball', currentStreak: 35, completionRate: 97 },
        { athleteName: 'Mike Chen', sport: 'Basketball', currentStreak: 18, completionRate: 86 },
      ],
    },
    {
      id: 'h4',
      name: 'Sleep Schedule (11 PM - 7 AM)',
      category: 'Recovery',
      targetFrequency: 'Daily',
      activeAthletes: 42,
      avgCompletionRate: 71,
      avgStreakDays: 9,
      topPerformers: [
        { athleteName: 'Jamie Davis', sport: 'Basketball', currentStreak: 22, completionRate: 89 },
        { athleteName: 'Sam Wilson', sport: 'Soccer', currentStreak: 16, completionRate: 84 },
      ],
    },
  ];

  const athleteProgress: AthleteHabitProgress[] = [
    {
      athleteName: 'Sarah Johnson',
      sport: 'Basketball',
      habits: [
        { habitName: 'Pre-Performance Breathing', currentStreak: 28, completionRate: 93, lastCompleted: '2025-12-13', status: 'on-track' },
        { habitName: 'Evening Gratitude Journal', currentStreak: 25, completionRate: 89, lastCompleted: '2025-12-13', status: 'on-track' },
      ],
    },
    {
      athleteName: 'Mike Chen',
      sport: 'Basketball',
      habits: [
        { habitName: 'Pre-Performance Breathing', currentStreak: 3, completionRate: 58, lastCompleted: '2025-12-13', status: 'at-risk' },
        { habitName: 'Sleep Schedule', currentStreak: 0, completionRate: 42, lastCompleted: '2025-12-10', status: 'broken' },
      ],
    },
    {
      athleteName: 'Jordan Smith',
      sport: 'Soccer',
      habits: [
        { habitName: 'Morning Visualization', currentStreak: 21, completionRate: 88, lastCompleted: '2025-12-13', status: 'on-track' },
        { habitName: 'Sleep Schedule', currentStreak: 14, completionRate: 81, lastCompleted: '2025-12-13', status: 'on-track' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Habit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Habits"
          value={teamHabits.length}
          subtitle="Team-wide tracking"
          variant="default"
        />
        <StatCard
          title="Avg Completion Rate"
          value="74%"
          subtitle="Across all habits"
          variant="success"
        />
        <StatCard
          title="Avg Streak"
          value="11 days"
          subtitle="Current streaks"
          variant="default"
        />
        <StatCard
          title="Total Check-ins"
          value={892}
          subtitle="This week"
          variant="success"
        />
      </div>

      {/* Team Habits Overview */}
      <DashboardSection title="Team Habits Overview">
        <div className="space-y-4">
          {teamHabits.map(habit => (
            <div
              key={habit.id}
              className="p-5 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-blue-900/30 text-blue-400">
                      {habit.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    <span>Target: {habit.targetFrequency}</span>
                    <span>•</span>
                    <span>{habit.activeAthletes} athletes tracking</span>
                  </div>

                  {/* Progress Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-slate-900/50 rounded">
                      <div className="text-xs text-slate-400 mb-1">Avg Completion Rate</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              habit.avgCompletionRate >= 80
                                ? 'bg-green-500'
                                : habit.avgCompletionRate >= 60
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${habit.avgCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {habit.avgCompletionRate}%
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded">
                      <div className="text-xs text-slate-400 mb-1">Avg Streak</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {habit.avgStreakDays} <span className="text-sm text-slate-400">days</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                      Top Performers:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {habit.topPerformers.map((performer, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-green-900/20 border border-green-700 rounded-lg"
                        >
                          <div className="text-sm font-semibold text-white">
                            {performer.athleteName}
                          </div>
                          <div className="text-xs text-green-400">
                            🔥 {performer.currentStreak} day streak • {performer.completionRate}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Individual Athlete Progress */}
      <DashboardSection
        title="Individual Athlete Habit Progress"
        description="Monitor habit formation across your athletes"
      >
        <div className="space-y-3">
          {athleteProgress.map((athlete, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-white">{athlete.athleteName}</h4>
                <span className="text-xs text-slate-400">{athlete.sport}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {athlete.habits.map((habit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      habit.status === 'on-track'
                        ? 'bg-green-900/10 border-green-700'
                        : habit.status === 'at-risk'
                        ? 'bg-amber-900/10 border-amber-700'
                        : 'bg-red-900/10 border-red-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-white mb-1">
                          {habit.habitName}
                        </h5>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={
                              habit.status === 'on-track'
                                ? 'text-green-400'
                                : habit.status === 'at-risk'
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }
                          >
                            {habit.status === 'on-track' && '✅ On Track'}
                            {habit.status === 'at-risk' && '⚠️ At Risk'}
                            {habit.status === 'broken' && '❌ Broken Streak'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          🔥 {habit.currentStreak}
                        </div>
                        <div className="text-xs text-slate-400">day streak</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{habit.completionRate}% complete</span>
                      <span>Last: {new Date(habit.lastCompleted).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Habit Formation Tips */}
      <DashboardSection title="Evidence-Based Habit Formation Tips">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              tip: '21-Day Rule',
              description: 'It takes an average of 21-66 days to form a new habit. Encourage athletes to commit for at least 30 days.',
              source: 'Lally et al., 2010',
            },
            {
              tip: 'Implementation Intentions',
              description: 'Have athletes specify when, where, and how they\'ll perform the habit (e.g., "After breakfast, I\'ll meditate for 10 minutes in my room").',
              source: 'Gollwitzer, 1999',
            },
            {
              tip: 'Habit Stacking',
              description: 'Link new habits to existing ones (e.g., "After I brush my teeth, I\'ll do my breathing exercises").',
              source: 'Clear, 2018',
            },
            {
              tip: 'Track & Celebrate',
              description: 'Visual tracking (like streaks) increases adherence. Celebrate milestones at 7, 14, 21, and 30 days.',
              source: 'Fogg, 2019',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <h5 className="text-sm font-semibold text-white mb-2">{item.tip}</h5>
              <p className="text-sm text-slate-300 mb-2">{item.description}</p>
              <p className="text-xs text-blue-400">📚 {item.source}</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
