'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, MetricCard } from '@/design-system/components';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  MessageSquare,
  Calendar,
  Award,
  Heart,
  Brain,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { PageHeader } from '@/components/shared/page-components';

export default function StudentDashboardPage() {
  const [moodData, setMoodData] = useState([
    { date: 'Mon', mood: 7, confidence: 8, stress: 4 },
    { date: 'Tue', mood: 8, confidence: 7, stress: 5 },
    { date: 'Wed', mood: 6, confidence: 6, stress: 6 },
    { date: 'Thu', mood: 7, confidence: 8, stress: 4 },
    { date: 'Fri', mood: 8, confidence: 9, stress: 3 },
    { date: 'Sat', mood: 9, confidence: 8, stress: 2 },
    { date: 'Sun', mood: 7, confidence: 7, stress: 4 },
  ]);

  const [activeGoals, setActiveGoals] = useState([
    { id: 1, title: 'Complete mindfulness practice 5x this week', progress: 60, category: 'Mental' },
    { id: 2, title: 'Improve free throw percentage to 80%', progress: 75, category: 'Performance' },
    { id: 3, title: 'Study 2 hours before each game', progress: 40, category: 'Academic' },
  ]);

  const [recentAssignments, setRecentAssignments] = useState([
    { id: 1, title: 'Pre-Game Visualization', dueDate: '2 days', status: 'pending' },
    { id: 2, title: 'Thought Record Journal', dueDate: '5 days', status: 'in-progress' },
  ]);

  const [streak, setStreak] = useState(7);

  const avgMood = Math.round(moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length * 10) / 10;
  const moodTrend = moodData[moodData.length - 1].mood - moodData[0].mood;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          {/* Header */}
          <PageHeader
            title="Welcome back! 👋"
            description="Here's your mental performance overview"
          />

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Current Streak"
              value={streak}
              suffix=" days"
              gradient="warning"
              icon={<Zap className="w-5 h-5" />}
            />

            <MetricCard
              label="Avg Mood (7d)"
              value={avgMood}
              decimals={1}
              trend={moodTrend > 0 ? 'up' : moodTrend < 0 ? 'down' : 'neutral'}
              trendValue={`${Math.abs(moodTrend).toFixed(1)}`}
              gradient="primary"
              icon={<Heart className="w-5 h-5" />}
            />

            <MetricCard
              label="Active Goals"
              value={activeGoals.length}
              gradient="success"
              icon={<Target className="w-5 h-5" />}
            />

            <MetricCard
              label="To Complete"
              value={recentAssignments.length}
              gradient="secondary"
              icon={<Award className="w-5 h-5" />}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mood Tracking */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <Card variant="elevated" padding="lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Weekly Mood Trends
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                    Track your emotional patterns over the past week
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Mood"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Confidence"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Stress"
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body">Mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body">Confidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body">Stress</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/student/mood">
                    <Button variant="primary" size="lg" className="w-full">
                      Log Today's Mood
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Quick Actions
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                    Your mental performance tools
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/student/chat">
                    <button className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-left">
                      <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white font-body">Talk to AI Coach</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-body">Get instant mental skills support</div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/student/mood">
                    <button className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-left">
                      <Heart className="w-5 h-5 text-danger-600 dark:text-danger-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white font-body">Log Mood</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-body">Track your emotional state</div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/student/goals">
                    <button className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-left">
                      <Target className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white font-body">Set Goals</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-body">Track mental & performance goals</div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/student/assignments">
                    <button className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-left">
                      <Brain className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white font-body">Practice Exercises</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-body">Build mental skills</div>
                      </div>
                    </button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Goals Progress */}
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Active Goals
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                    Your current mental performance objectives
                  </p>
                </div>
                <Link href="/student/goals">
                  <Button variant="secondary" size="md">View All</Button>
                </Link>
              </div>

              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white font-body mb-2">
                          {goal.title}
                        </h4>
                        <Badge variant="secondary" size="sm">{goal.category}</Badge>
                      </div>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400 font-display ml-4">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Assignments */}
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Upcoming Assignments
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                    Mental skills exercises from your coach
                  </p>
                </div>
                <Link href="/student/assignments">
                  <Button variant="secondary" size="md">View All</Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white font-body">
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                          Due in {assignment.dueDate}
                        </p>
                      </div>
                    </div>
                    <Badge variant={assignment.status === 'pending' ? 'warning' : 'primary'} size="sm">
                      {assignment.status === 'pending' ? 'To Do' : 'In Progress'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
