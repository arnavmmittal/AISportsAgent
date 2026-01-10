'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Brain,
  Heart,
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
      {/* DESKTOP LAYOUT - Command Center Dashboard */}
      <div className="hidden lg:block h-screen overflow-hidden">
        <div className="h-full flex">
          {/* LEFT: Hero Wellbeing Display (60% width) */}
          <div className="w-3/5 border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <h1 className="font-display font-semibold text-4xl text-gray-900 dark:text-gray-100 tracking-tight">
                  Performance Dashboard
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-body">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </motion.div>

              {/* Hero Wellbeing Score - Massive Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-64 h-64 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-8 border-primary-200 dark:border-primary-800 mb-8 relative">
                    <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-pulse"></div>
                    <div className="relative z-10">
                      <AnimatedCounter
                        value={stats.wellbeingScore}
                        decimals={1}
                        className="text-7xl font-display text-primary-700 dark:text-primary-300"
                      />
                      <div className="text-3xl text-gray-600 dark:text-gray-400 mt-2">/10</div>
                    </div>
                  </div>
                  <h2 className="font-display font-semibold text-3xl text-gray-900 dark:text-gray-100 mb-3">
                    Wellbeing Score
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Badge
                      variant={wellbeingTrend === 'up' ? 'success' : 'danger'}
                      size="lg"
                      className="font-mono"
                    >
                      {stats.wellbeingChange >= 0 ? '+' : ''}{stats.wellbeingChange.toFixed(1)} vs last week
                    </Badge>
                  </div>

                  {/* 7-Day Trend Sparkline */}
                  <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                      7-Day Trend
                    </p>
                    <Sparkline
                      data={wellbeingHistory}
                      height={60}
                      width={300}
                      color="primary"
                      showDots
                      showArea
                    />
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions - Bottom of hero section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-2 gap-4"
              >
                <Link href="/student/ai-coach">
                  <motion.div whileHover={{ y: -4 }}>
                    <Card variant="metric" padding="lg" className="cursor-pointer h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                            AI Coach
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Get mental performance support
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                    </Card>
                  </motion.div>
                </Link>

                <Link href="/student/progress">
                  <motion.div whileHover={{ y: -4 }}>
                    <Card variant="metric" padding="lg" className="cursor-pointer h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-7 h-7 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                            Daily Check-In
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Track mood and energy
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* RIGHT: Stats & Tasks Sidebar (40% width) */}
          <div className="w-2/5 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
            <div className="p-8 space-y-6">
              {/* Quick Stats Grid */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {/* Streak */}
                <Card variant="elevated" padding="lg" hover>
                  <div className="text-center">
                    <Zap className="w-10 h-10 text-warning-600 dark:text-warning-500 mx-auto mb-3" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Daily Streak
                    </p>
                    <div className="flex items-baseline justify-center">
                      <AnimatedCounter
                        value={stats.checkInStreak}
                        decimals={0}
                        className="text-4xl font-display"
                      />
                      <span className="text-gray-600 dark:text-gray-400 ml-1 text-sm">days</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {stats.checkInStreak > 7 ? 'Outstanding!' : 'Keep going'}
                    </p>
                  </div>
                </Card>

                {/* Goals */}
                <Card variant="elevated" padding="lg" hover>
                  <div className="text-center">
                    <RadialProgress
                      value={goalsPercentage}
                      max={100}
                      size="md"
                      color="success"
                      showValue
                      animated
                      className="mx-auto"
                    />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-3 mb-2">
                      Goals Complete
                    </p>
                    <div className="flex items-baseline justify-center">
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

              {/* Upcoming Assignments */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card variant="elevated" padding="none">
                  <CardHeader className="px-6 pt-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                      {upcomingAssignments.length > 0 && (
                        <Badge variant="primary" size="sm">
                          {stats.assignmentsPending}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {upcomingAssignments.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-success-600 dark:text-success-400 mx-auto mb-3" />
                        <p className="text-sm font-display font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          All Caught Up
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          No pending tasks
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        <AnimatePresence mode="popLayout">
                          {upcomingAssignments.map((assignment, index) => (
                            <motion.div
                              key={assignment.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.05 }}
                              layout
                            >
                              <Link href={`/student/assignments/${assignment.id}`}>
                                <Card
                                  variant="flat"
                                  padding="md"
                                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                  <h4 className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                                    {assignment.title}
                                  </h4>
                                  <div className="flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{getTimeUntilDue(assignment.dueDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{assignment.estimatedTime}</span>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            </motion.div>
                          ))}
                        </AnimatePresence>
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
                            View all
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Motivational Insight */}
              {stats.checkInStreak >= 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
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
                          Your <AnimatedCounter value={stats.checkInStreak} decimals={0} className="inline font-semibold" />-day streak shows commitment to mental performance.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT - Priority-First Stack */}
      <div className="lg:hidden min-h-screen bg-background">
        <div className="px-4 py-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-display font-semibold text-3xl text-gray-900 dark:text-gray-100 tracking-tight">
              Performance Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-body text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Hero Wellbeing Score */}
            <motion.div variants={fadeInUp}>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-3">
              <motion.div variants={fadeInUp}>
                <Link href="/student/ai-coach">
                  <Card variant="metric" padding="lg" className="cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                          AI Performance Coach
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get mental performance support
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </Card>
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Link href="/student/progress">
                  <Card variant="metric" padding="lg" className="cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                          Daily Check-In
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Track mood and energy
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={fadeInUp}>
                <Card variant="elevated" padding="lg" hover>
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-warning-600 dark:text-warning-500 mx-auto mb-3" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Daily Streak
                    </p>
                    <div className="flex items-baseline justify-center">
                      <AnimatedCounter
                        value={stats.checkInStreak}
                        decimals={0}
                        className="text-3xl font-display"
                      />
                      <span className="text-gray-600 dark:text-gray-400 ml-1 text-sm">days</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card variant="elevated" padding="lg" hover>
                  <div className="text-center">
                    <RadialProgress
                      value={goalsPercentage}
                      max={100}
                      size="md"
                      color="success"
                      showValue
                      animated
                      className="mx-auto"
                    />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-3 mb-2">
                      Goals Complete
                    </p>
                    <div className="flex items-baseline justify-center text-sm">
                      <AnimatedCounter
                        value={stats.goalsCompleted}
                        decimals={0}
                        className="font-display"
                      />
                      <span className="text-gray-600 dark:text-gray-400 mx-1">/</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.goalsTotal}
                      </span>
                    </div>
                  </div>
                </Card>
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
                        {stats.assignmentsPending}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {upcomingAssignments.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="w-16 h-16 text-success-600 dark:text-success-400 mx-auto mb-4" />
                      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                        All Caught Up
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No pending assignments
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
                                  className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
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
                        Your <AnimatedCounter value={stats.checkInStreak} decimals={0} className="inline font-semibold" />-day check-in streak demonstrates commitment to mental performance.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
