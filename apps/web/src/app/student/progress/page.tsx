'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Brain, Moon, Zap, Target, Plus, CheckCircle2 } from 'lucide-react';
import {
  Card,
  RadialProgress,
  Sparkline,
  AnimatedCounter,
  MetricCard,
} from '@/design-system/components';
import { fadeInUp, staggerContainer, hoverLift } from '@/design-system/motion';

interface MoodEntry {
  date: Date;
  mood: number;
  stress: number;
  sleep: number;
  confidence: number;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  target: number;
  deadline: Date;
}

export default function StudentProgressPage() {
  const [activeTab, setActiveTab] = useState<'mood' | 'goals'>('mood');

  // Mock data - will be replaced with API call
  const [moodHistory] = useState<MoodEntry[]>([
    {
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      mood: 7.5,
      stress: 4.0,
      sleep: 7.5,
      confidence: 7.0,
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      mood: 8.0,
      stress: 3.5,
      sleep: 8.0,
      confidence: 7.5,
    },
    {
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      mood: 7.0,
      stress: 5.0,
      sleep: 6.5,
      confidence: 6.5,
    },
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      mood: 8.5,
      stress: 3.0,
      sleep: 8.5,
      confidence: 8.0,
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      mood: 7.5,
      stress: 4.5,
      sleep: 7.0,
      confidence: 7.5,
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      mood: 8.0,
      stress: 4.0,
      sleep: 7.5,
      confidence: 8.0,
    },
    {
      date: new Date(),
      mood: 7.8,
      stress: 4.2,
      sleep: 7.2,
      confidence: 7.8,
    },
  ]);

  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Improve free throw accuracy to 85%',
      category: 'Performance',
      progress: 78,
      target: 85,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Practice mindfulness meditation 5x per week',
      category: 'Mental Wellness',
      progress: 12,
      target: 20,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Maintain GPA above 3.5',
      category: 'Academic',
      progress: 3.6,
      target: 3.5,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ]);

  const calculateAverage = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, entry) => acc + entry[key], 0);
    return Number((sum / moodHistory.length).toFixed(1));
  };

  const getTrend = (key: 'mood' | 'stress' | 'sleep' | 'confidence'): 'up' | 'down' | 'neutral' => {
    if (moodHistory.length < 2) return 'neutral';
    const recent = moodHistory.slice(0, Math.ceil(moodHistory.length / 2));
    const older = moodHistory.slice(Math.ceil(moodHistory.length / 2));

    const recentAvg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry[key], 0) / older.length;

    if (key === 'stress') {
      // For stress, lower is better
      return recentAvg < olderAvg - 0.3 ? 'up' : recentAvg > olderAvg + 0.3 ? 'down' : 'neutral';
    } else {
      return recentAvg > olderAvg + 0.3 ? 'up' : recentAvg < olderAvg - 0.3 ? 'down' : 'neutral';
    }
  };

  const getTrendValue = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length < 2) return '';
    const recent = moodHistory.slice(0, Math.ceil(moodHistory.length / 2));
    const older = moodHistory.slice(Math.ceil(moodHistory.length / 2));

    const recentAvg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry[key], 0) / older.length;
    const diff = Math.abs(recentAvg - olderAvg);

    return `${diff.toFixed(1)}`;
  };

  const getCategoryColor = (category: string): 'primary' | 'secondary' | 'warning' => {
    switch (category.toLowerCase()) {
      case 'performance':
        return 'primary';
      case 'mental wellness':
        return 'secondary';
      case 'academic':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* DESKTOP LAYOUT - Big Radial Wheels Dashboard */}
      <div className="hidden lg:block h-screen overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
                  My Progress
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400 font-body">
                  Track wellness and goals
                </p>
              </div>

              {/* Tab Pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('mood')}
                  className={`px-6 py-3 rounded-lg font-display font-semibold transition-all ${
                    activeTab === 'mood'
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>Wellness</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className={`px-6 py-3 rounded-lg font-display font-semibold transition-all ${
                    activeTab === 'goals'
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Goals</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Mood Tracking Tab */}
            {activeTab === 'mood' && (
              <div className="p-8">
                {/* Big Radial Wheels - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card variant="elevated" padding="xl" hover className="h-full">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-4" />
                        <RadialProgress
                          value={calculateAverage('mood') * 10}
                          max={100}
                          size="xl"
                          color="primary"
                          label="Mood"
                          showValue
                          animated
                        />
                        <div className="mt-6 w-full max-w-xs">
                          <Sparkline
                            data={moodHistory.map((e) => e.mood)}
                            height={60}
                            width={280}
                            color="primary"
                            showDots={true}
                            showArea={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-4">
                          7-day average: <AnimatedCounter value={calculateAverage('mood')} decimals={1} className="font-semibold" />/10
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card variant="elevated" padding="xl" hover className="h-full">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Brain className="w-8 h-8 text-warning-600 dark:text-warning-400 mb-4" />
                        <RadialProgress
                          value={calculateAverage('stress') * 10}
                          max={100}
                          size="xl"
                          color="warning"
                          label="Stress"
                          showValue
                          animated
                        />
                        <div className="mt-6 w-full max-w-xs">
                          <Sparkline
                            data={moodHistory.map((e) => e.stress)}
                            height={60}
                            width={280}
                            color="warning"
                            showDots={true}
                            showArea={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-4">
                          7-day average: <AnimatedCounter value={calculateAverage('stress')} decimals={1} className="font-semibold" />/10
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card variant="elevated" padding="xl" hover className="h-full">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Moon className="w-8 h-8 text-info-600 dark:text-info-400 mb-4" />
                        <RadialProgress
                          value={calculateAverage('sleep') * 10}
                          max={100}
                          size="xl"
                          color="info"
                          label="Sleep"
                          showValue
                          animated
                        />
                        <div className="mt-6 w-full max-w-xs">
                          <Sparkline
                            data={moodHistory.map((e) => e.sleep)}
                            height={60}
                            width={280}
                            color="info"
                            showDots={true}
                            showArea={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-4">
                          7-day average: <AnimatedCounter value={calculateAverage('sleep')} decimals={1} className="font-semibold" /> hrs
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Card variant="elevated" padding="xl" hover className="h-full">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Zap className="w-8 h-8 text-success-600 dark:text-success-400 mb-4" />
                        <RadialProgress
                          value={calculateAverage('confidence') * 10}
                          max={100}
                          size="xl"
                          color="success"
                          label="Confidence"
                          showValue
                          animated
                        />
                        <div className="mt-6 w-full max-w-xs">
                          <Sparkline
                            data={moodHistory.map((e) => e.confidence)}
                            height={60}
                            width={280}
                            color="success"
                            showDots={true}
                            showArea={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-4">
                          7-day average: <AnimatedCounter value={calculateAverage('confidence')} decimals={1} className="font-semibold" />/10
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <MetricCard
                    label="Overall Wellbeing"
                    value={(calculateAverage('mood') + (10 - calculateAverage('stress'))) / 2}
                    decimals={1}
                    suffix="/10"
                    trend={getTrend('mood')}
                    trendValue={getTrendValue('mood')}
                    sparkline={moodHistory.map((e) => (e.mood + (10 - e.stress)) / 2)}
                    gradient="primary"
                    icon={<Heart className="w-5 h-5" />}
                  />

                  <motion.div whileHover={{ y: -4 }}>
                    <Card variant="metric" padding="lg" className="cursor-pointer h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">
                            Daily Check-In
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                            Log today's wellness metrics
                          </p>
                        </div>
                        <button className="px-5 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-display font-semibold flex items-center gap-2 shadow-md">
                          <Plus className="w-4 h-4" />
                          Log Now
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Goals Tab - Desktop */}
            {activeTab === 'goals' && (
              <div className="p-8 space-y-6">
                {goals.map((goal) => {
                  const progressPercent = Math.round((goal.progress / goal.target) * 100);
                  const isComplete = goal.progress >= goal.target;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card variant="elevated" padding="lg">
                        <div className="flex items-center gap-6">
                          <RadialProgress
                            value={progressPercent}
                            max={100}
                            size="lg"
                            color={isComplete ? 'success' : getCategoryColor(goal.category)}
                            showValue
                            animated
                          />

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                                {goal.title}
                              </h3>
                              {isComplete && <CheckCircle2 className="w-5 h-5 text-success-600" />}
                            </div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                getCategoryColor(goal.category) === 'primary'
                                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                  : getCategoryColor(goal.category) === 'secondary'
                                  ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300'
                                  : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                              }`}
                            >
                              {goal.category}
                            </span>

                            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-body">Progress: </span>
                                <span className="font-display font-semibold text-gray-900 dark:text-gray-100">
                                  <AnimatedCounter value={goal.progress} decimals={0} /> / {goal.target}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="font-body">
                                  {goal.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button className="px-5 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-display font-semibold">
                              Update
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT - Compact Stack */}
      <div className="lg:hidden min-h-screen bg-background">
        <div className="px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              My Progress
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400 font-body text-sm">
              Track wellness and goals
            </p>
          </div>

          {/* Tab Pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('mood')}
              className={`flex-1 px-4 py-3 rounded-lg font-display font-semibold transition-all ${
                activeTab === 'mood'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="text-sm">Wellness</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex-1 px-4 py-3 rounded-lg font-display font-semibold transition-all ${
                activeTab === 'goals'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Goals</span>
              </div>
            </button>
          </div>

          {/* Mood Tracking Tab - Mobile */}
          {activeTab === 'mood' && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Compact Radial Wheels */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={fadeInUp}>
                  <Card variant="elevated" padding="lg" hover>
                    <div className="flex flex-col items-center">
                      <RadialProgress
                        value={calculateAverage('mood') * 10}
                        max={100}
                        size="md"
                        color="primary"
                        label="Mood"
                        showValue
                        animated
                      />
                      <Sparkline
                        data={moodHistory.map((e) => e.mood)}
                        height={40}
                        width={100}
                        color="primary"
                        showArea={true}
                        className="mt-3"
                      />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card variant="elevated" padding="lg" hover>
                    <div className="flex flex-col items-center">
                      <RadialProgress
                        value={calculateAverage('stress') * 10}
                        max={100}
                        size="md"
                        color="warning"
                        label="Stress"
                        showValue
                        animated
                      />
                      <Sparkline
                        data={moodHistory.map((e) => e.stress)}
                        height={40}
                        width={100}
                        color="warning"
                        showArea={true}
                        className="mt-3"
                      />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card variant="elevated" padding="lg" hover>
                    <div className="flex flex-col items-center">
                      <RadialProgress
                        value={calculateAverage('sleep') * 10}
                        max={100}
                        size="md"
                        color="info"
                        label="Sleep"
                        showValue
                        animated
                      />
                      <Sparkline
                        data={moodHistory.map((e) => e.sleep)}
                        height={40}
                        width={100}
                        color="info"
                        showArea={true}
                        className="mt-3"
                      />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card variant="elevated" padding="lg" hover>
                    <div className="flex flex-col items-center">
                      <RadialProgress
                        value={calculateAverage('confidence') * 10}
                        max={100}
                        size="md"
                        color="success"
                        label="Confidence"
                        showValue
                        animated
                      />
                      <Sparkline
                        data={moodHistory.map((e) => e.confidence)}
                        height={40}
                        width={100}
                        color="success"
                        showArea={true}
                        className="mt-3"
                      />
                    </div>
                  </Card>
                </motion.div>
              </div>

            {/* Metric Cards with Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={fadeInUp}>
                <MetricCard
                  label="Average Wellbeing"
                  value={(calculateAverage('mood') + (10 - calculateAverage('stress'))) / 2}
                  decimals={1}
                  suffix="/10"
                  trend={getTrend('mood')}
                  trendValue={getTrendValue('mood')}
                  sparkline={moodHistory.map((e) => (e.mood + (10 - e.stress)) / 2)}
                  gradient="primary"
                  icon={<Heart className="w-5 h-5" />}
                />
              </motion.div>

              <motion.div variants={fadeInUp}>
                <MetricCard
                  label="Recovery Score"
                  value={calculateAverage('sleep')}
                  decimals={1}
                  suffix=" hrs"
                  trend={getTrend('sleep')}
                  trendValue={getTrendValue('sleep')}
                  sparkline={moodHistory.map((e) => e.sleep)}
                  gradient="info"
                  icon={<Moon className="w-5 h-5" />}
                />
              </motion.div>
            </div>

            {/* Log New Entry Button */}
            <motion.div variants={fadeInUp}>
              <motion.div whileHover={hoverLift.hover}>
                <Card variant="metric" padding="lg" className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                        Daily Check-In
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                        Log your mood, stress, sleep, and confidence
                      </p>
                    </div>
                    <button className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-display font-semibold flex items-center gap-2 shadow-md">
                      <Plus className="w-5 h-5" />
                      Log Today
                    </button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* History */}
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="none">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                    7-Day History
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                    Your wellness metrics over the past week
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {moodHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div
                        key={index}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-display font-semibold text-gray-900 dark:text-gray-100">
                              {entry.date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-1 bg-primary-600 dark:bg-primary-500 text-white rounded-md text-xs font-semibold">
                                TODAY
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                              Mood:
                            </span>
                            <AnimatedCounter
                              value={entry.mood}
                              decimals={1}
                              suffix="/10"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-warning-600 dark:text-warning-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                              Stress:
                            </span>
                            <AnimatedCounter
                              value={entry.stress}
                              decimals={1}
                              suffix="/10"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-info-600 dark:text-info-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                              Sleep:
                            </span>
                            <AnimatedCounter
                              value={entry.sleep}
                              decimals={1}
                              suffix="hrs"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-success-600 dark:text-success-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                              Confidence:
                            </span>
                            <AnimatedCounter
                              value={entry.confidence}
                              decimals={1}
                              suffix="/10"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Add Goal Button */}
            <motion.div variants={fadeInUp}>
              <motion.div whileHover={hoverLift.hover}>
                <Card variant="metric" padding="lg" className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                        Set New Goal
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                        Performance, mental wellness, or academic
                      </p>
                    </div>
                    <button className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-display font-semibold flex items-center gap-2 shadow-md">
                      <Plus className="w-5 h-5" />
                      Create Goal
                    </button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Goals List */}
            <div className="space-y-6">
              {goals.map((goal) => {
                const progressPercent = Math.round((goal.progress / goal.target) * 100);
                const isComplete = goal.progress >= goal.target;

                return (
                  <motion.div key={goal.id} variants={fadeInUp}>
                    <motion.div whileHover={hoverLift.hover}>
                      <Card variant="elevated" padding="lg">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                                {goal.title}
                              </h3>
                              {isComplete && (
                                <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-500" />
                              )}
                            </div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                getCategoryColor(goal.category) === 'primary'
                                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                  : getCategoryColor(goal.category) === 'secondary'
                                  ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300'
                                  : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                              }`}
                            >
                              {goal.category}
                            </span>
                          </div>
                          <RadialProgress
                            value={progressPercent}
                            max={100}
                            size="md"
                            color={isComplete ? 'success' : getCategoryColor(goal.category)}
                            showValue
                            animated
                          />
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-body">
                              Progress
                            </span>
                            <span className="font-display font-semibold text-gray-900 dark:text-gray-100">
                              <AnimatedCounter value={goal.progress} decimals={0} />
                              {' / '}
                              {goal.target}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-body">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Deadline:{' '}
                              {goal.deadline.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button className="flex-1 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-display font-semibold shadow-sm">
                            Update Progress
                          </button>
                          <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-display font-semibold">
                            Details
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {goals.length === 0 && (
              <motion.div variants={fadeInUp}>
                <Card variant="elevated" padding="lg" className="text-center">
                  <div className="py-12">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-display font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No goals yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 font-body">
                      Create your first goal to start tracking progress
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
    </div>
  );
}
