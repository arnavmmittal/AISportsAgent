'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Activity,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardMetric, CardHeader, CardTitle, CardContent } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  estimatedTime: string;
}

// Animation variants for staggered reveals
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
    }
  }
};

export default function StudentHomePage() {
  // Mock data - will be replaced with API call
  const [stats] = useState({
    wellbeingScore: 7.8,
    wellbeingChange: 0.5,
    checkInStreak: 5,
    goalsCompleted: 3,
    goalsTotal: 7,
    assignmentsPending: 2,
  });

  const [upcomingAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Pre-Game Mental Preparation Reflection',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      estimatedTime: '10 min',
    },
    {
      id: '2',
      title: 'Weekly Wellness Check-In',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'pending',
      estimatedTime: '5 min',
    },
  ]);

  const getTimeUntilDue = (dueDate: Date) => {
    const seconds = Math.floor((dueDate.getTime() - Date.now()) / 1000);

    if (seconds < 0) return 'Overdue';
    if (seconds < 86400) return 'Due today';
    if (seconds < 172800) return 'Due tomorrow';
    return `Due in ${Math.floor(seconds / 86400)} days`;
  };

  const wellbeingTrend = stats.wellbeingChange >= 0 ? 'up' : 'down';
  const goalsPercentage = Math.round((stats.goalsCompleted / stats.goalsTotal) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-gray-900 dark:text-gray-100 tracking-tight">
            Performance Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-body">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Stats Grid - Bento Box Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Wellbeing Score - Prominent */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card variant="elevated" padding="lg" className="h-full">
                <CardMetric
                  label="Wellbeing Score"
                  value={stats.wellbeingScore.toFixed(1)}
                  trend={wellbeingTrend}
                  trendValue={`${stats.wellbeingChange >= 0 ? '+' : ''}${stats.wellbeingChange.toFixed(1)} from last week`}
                  icon={<Activity className="w-5 h-5" />}
                />
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span>Low</span>
                    <span>Optimal</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.wellbeingScore / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Check-in Streak */}
            <motion.div variants={itemVariants}>
              <Card variant="default" padding="md" className="h-full">
                <CardMetric
                  label="Daily Streak"
                  value={stats.checkInStreak}
                  icon={<Zap className="w-4 h-4" />}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {stats.checkInStreak > 7 ? 'Outstanding consistency!' : 'Keep building the habit'}
                </p>
              </Card>
            </motion.div>

            {/* Goals Progress */}
            <motion.div variants={itemVariants}>
              <Card variant="default" padding="md" className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Goals
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {stats.goalsCompleted}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400">
                      / {stats.goalsTotal}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      <span>{goalsPercentage}% complete</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalsPercentage}%` }}
                        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                        className="h-full bg-primary-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions - Prominent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <Link href="/student/ai-coach">
                <Card
                  variant="gradient"
                  interactive
                  padding="lg"
                  className="group border-primary-200 dark:border-primary-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                      <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                        AI Performance Coach
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get personalized mental performance support
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/student/progress">
                <Card
                  variant="gradient"
                  interactive
                  padding="lg"
                  className="group border-secondary-200 dark:border-secondary-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/50 transition-colors">
                      <Activity className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                        Daily Check-In
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track mood, energy, and progress
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          </div>

          {/* Upcoming Assignments */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated" padding="none">
              <CardHeader className="px-6 pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Tasks</CardTitle>
                  {upcomingAssignments.length > 0 && (
                    <Badge variant="primary" size="sm">
                      {stats.assignmentsPending} pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {upcomingAssignments.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/20 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      All Caught Up
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No pending assignments at the moment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {upcomingAssignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <Link href={`/student/assignments/${assignment.id}`}>
                          <Card
                            variant="flat"
                            padding="md"
                            interactive
                            className="group hover:border-gray-300 dark:hover:border-gray-700"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 truncate">
                                  {assignment.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{getTimeUntilDue(assignment.dueDate)}</span>
                                  </div>
                                  <span className="text-gray-400">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{assignment.estimatedTime}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:border-primary-300 dark:group-hover:border-primary-700 group-hover:text-primary-700 dark:group-hover:text-primary-300"
                              >
                                Start
                              </Button>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
                {upcomingAssignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Link href="/student/assignments">
                      <Button variant="ghost" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        View all assignments
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Motivational Insight */}
          {stats.checkInStreak >= 3 && (
            <motion.div variants={itemVariants}>
              <Card variant="flat" padding="md" className="bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      Consistency Builds Excellence
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Your {stats.checkInStreak}-day check-in streak demonstrates real commitment to mental performance.
                      Keep building these daily habits for sustained success.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
