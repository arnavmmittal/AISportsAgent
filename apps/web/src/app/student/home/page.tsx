'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  TrendingUp,
  MessageSquare,
  Activity,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  RadialProgress,
  Sparkline,
  AnimatedCounter,
  MetricCard,
} from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { fadeInUp, staggerContainer, hoverLift } from '@/design-system/motion';

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  estimatedTime: string;
}

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

  // Mock 7-day wellbeing history for sparkline
  const [wellbeingHistory] = useState([7.2, 7.5, 7.1, 7.8, 7.4, 7.9, 7.8]);

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
    <div className="min-h-screen bg-background">
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
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Stats Grid - Enhanced with Data Viz */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Wellbeing Score - Prominent with Sparkline */}
            <motion.div variants={fadeInUp} className="md:col-span-2">
              <MetricCard
                label="Wellbeing Score"
                value={stats.wellbeingScore}
                decimals={1}
                suffix="/10"
                trend={wellbeingTrend}
                trendValue={`${stats.wellbeingChange >= 0 ? '+' : ''}${stats.wellbeingChange.toFixed(1)}`}
                sparkline={wellbeingHistory}
                gradient="primary"
                icon={<Activity className="w-5 h-5" />}
                description="7-day average"
              />
            </motion.div>

            {/* Check-in Streak with AnimatedCounter */}
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="lg" className="h-full" hover>
                <div className="flex flex-col items-center text-center">
                  <Zap className="w-8 h-8 text-warning-600 dark:text-warning-500 mb-3" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Daily Streak
                  </span>
                  <div className="flex items-baseline mb-2">
                    <AnimatedCounter
                      value={stats.checkInStreak}
                      decimals={0}
                      className="text-3xl font-display"
                    />
                    <span className="text-gray-600 dark:text-gray-400 ml-1 text-sm">days</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stats.checkInStreak > 7 ? 'Outstanding!' : 'Keep building'}
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Goals Progress with RadialProgress */}
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="lg" className="h-full" hover>
                <div className="flex flex-col items-center text-center">
                  <RadialProgress
                    value={goalsPercentage}
                    max={100}
                    size="md"
                    color="success"
                    showValue
                    animated
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-3">
                    Goals Complete
                  </span>
                  <div className="flex items-baseline mt-2">
                    <AnimatedCounter
                      value={stats.goalsCompleted}
                      decimals={0}
                      className="text-lg font-display"
                    />
                    <span className="text-gray-600 dark:text-gray-400 mx-1">/</span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      {stats.goalsTotal}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions - Prominent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={fadeInUp}>
              <motion.div whileHover={hoverLift.hover}>
                <Link href="/student/ai-coach">
                  <Card
                    variant="metric"
                    padding="lg"
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
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
                      <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.div whileHover={hoverLift.hover}>
                <Link href="/student/progress">
                  <Card
                    variant="metric"
                    padding="lg"
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0">
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
                      <ArrowRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Upcoming Assignments */}
          <motion.div variants={fadeInUp}>
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
                            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
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
                                className="hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-700 dark:hover:text-primary-300"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
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
            <motion.div variants={fadeInUp}>
              <Card
                variant="flat"
                padding="md"
                className="bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      Consistency Builds Excellence
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-body">
                      Your <AnimatedCounter value={stats.checkInStreak} decimals={0} className="inline font-semibold" />-day check-in streak demonstrates real commitment to mental performance.
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
