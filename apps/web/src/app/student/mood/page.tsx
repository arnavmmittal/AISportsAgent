'use client';

/**
 * Student Mood Page - Redesigned
 * Professional athletic minimalist design with rich data visualization
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Zap,
  Brain,
  Moon,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  Card,
  HeatmapCalendar,
  AnimatedCounter,
  ActivityRing,
} from '@/design-system/components';
import { MoodLogger } from '@/components/shared/mood/MoodLogger';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { toast } from 'sonner';

interface MoodLogData {
  id: string;
  date: Date;
  mood: number;
  confidence: number;
  stress: number;
  energy: number;
  sleep: number;
  notes?: string;
}

export default function StudentMoodPage() {
  // Historical data
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load past 30 days logs on mount (for heatmap)
  useEffect(() => {
    loadMoodLogs();
  }, []);

  const loadMoodLogs = async () => {
    try {
      setIsLoading(true);
      // Get current user from Supabase session
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        console.log('No user session found');
        setIsLoading(false);
        return;
      }

      const userId = profileData.data.userId;

      // Fetch mood logs from API (last 30 days)
      const response = await fetch(`/api/mood-logs?athleteId=${userId}&limit=30`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match component structure
        const transformedLogs: MoodLogData[] = data.data.map((log: any) => ({
          id: log.id,
          date: new Date(log.createdAt),
          mood: log.mood,
          confidence: log.confidence,
          stress: log.stress,
          energy: log.energy || 5,
          sleep: log.sleep || 7,
          notes: log.notes,
        }));
        setPastWeekLogs(transformedLogs);
      } else {
        console.error('Failed to load mood logs:', data.error);
        setPastWeekLogs([]);
      }
    } catch (error) {
      console.error('Error loading mood logs:', error);
      setPastWeekLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodIcon = (value: number) => {
    if (value <= 3) return <Frown className="w-8 h-8 text-danger-500" />;
    if (value <= 5) return <Meh className="w-8 h-8 text-warning-500" />;
    if (value <= 7) return <Smile className="w-8 h-8 text-success-500" />;
    return <Heart className="w-8 h-8 text-primary-500" />;
  };

  const calculateAverage = (key: 'mood' | 'stress' | 'sleep' | 'confidence' | 'energy') => {
    if (pastWeekLogs.length === 0) return 0;
    const sum = pastWeekLogs.reduce((acc, entry) => acc + entry[key], 0);
    return Number((sum / pastWeekLogs.length).toFixed(1));
  };

  // Prepare heatmap data
  const heatmapData = pastWeekLogs.map((log) => ({
    date: log.date,
    value: log.mood,
    label: `Mood: ${log.mood}/10`,
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Heart className="w-10 h-10 text-primary-600 dark:text-primary-500" />
                Daily Mood Tracker
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-400 text-base font-body">
                Track your mental state and build self-awareness
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Overview Cards */}
          {!isLoading && pastWeekLogs.length > 0 && (
            <motion.div variants={fadeInUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Average Mood */}
                <Card variant="elevated" padding="lg">
                  <div className="flex flex-col items-center">
                    <div className="mb-3">{getMoodIcon(calculateAverage('mood'))}</div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Average Mood
                    </span>
                    <AnimatedCounter
                      value={calculateAverage('mood')}
                      decimals={1}
                      suffix="/10"
                      className="text-3xl font-display"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Last 30 days
                    </span>
                  </div>
                </Card>

                {/* Check-ins */}
                <Card variant="elevated" padding="lg">
                  <div className="flex flex-col items-center">
                    <Activity className="w-8 h-8 text-success-600 dark:text-success-500 mb-3" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Check-Ins
                    </span>
                    <div className="flex items-baseline">
                      <AnimatedCounter value={pastWeekLogs.length} className="text-3xl font-display" />
                      <span className="text-gray-600 dark:text-gray-400 ml-1">/30 days</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {Math.round((pastWeekLogs.length / 30) * 100)}% consistency
                    </span>
                  </div>
                </Card>

                {/* Average Sleep */}
                <Card variant="elevated" padding="lg">
                  <div className="flex flex-col items-center">
                    <Moon className="w-8 h-8 text-info-600 dark:text-info-500 mb-3" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Average Sleep
                    </span>
                    <AnimatedCounter
                      value={calculateAverage('sleep')}
                      decimals={1}
                      suffix="h"
                      className="text-3xl font-display"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Per night
                    </span>
                  </div>
                </Card>

                {/* Stress Level */}
                <Card variant="elevated" padding="lg">
                  <div className="flex flex-col items-center">
                    <Brain className="w-8 h-8 text-warning-600 dark:text-warning-500 mb-3" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Avg Stress
                    </span>
                    <AnimatedCounter
                      value={calculateAverage('stress')}
                      decimals={1}
                      suffix="/10"
                      className="text-3xl font-display"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Last 30 days
                    </span>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* 30-Day Heatmap Calendar */}
          {!isLoading && pastWeekLogs.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="lg">
                <div className="mb-6">
                  <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    30-Day Mood Pattern
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                    Visualize your emotional trends over time
                  </p>
                </div>
                <HeatmapCalendar
                  data={heatmapData}
                  startDate={thirtyDaysAgo}
                  colorScale="primary"
                  cellSize={18}
                  gap={4}
                  showDayLabels={true}
                  showMonthLabels={true}
                />
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-xs text-gray-500 dark:text-gray-500">Less</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <div className="w-4 h-4 rounded-sm bg-primary-100 dark:bg-primary-950" />
                    <div className="w-4 h-4 rounded-sm bg-primary-200 dark:bg-primary-900" />
                    <div className="w-4 h-4 rounded-sm bg-primary-400 dark:bg-primary-700" />
                    <div className="w-4 h-4 rounded-sm bg-primary-600 dark:bg-primary-500" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">More</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Activity Rings - Multi-metric view */}
          {!isLoading && pastWeekLogs.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" padding="lg">
                <div className="mb-6">
                  <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                    Wellness Rings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">
                    Your overall mental performance metrics
                  </p>
                </div>
                <div className="flex justify-center">
                  <ActivityRing
                    rings={[
                      {
                        value: calculateAverage('mood') * 10,
                        max: 100,
                        color: 'primary',
                        label: 'Mood',
                      },
                      {
                        value: calculateAverage('confidence') * 10,
                        max: 100,
                        color: 'success',
                        label: 'Confidence',
                      },
                      {
                        value: (10 - calculateAverage('stress')) * 10,
                        max: 100,
                        color: 'warning',
                        label: 'Calm',
                      },
                    ]}
                    size="xl"
                    spacing={8}
                    showLabels={true}
                    animated={true}
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Today's Check-In Form */}
          <motion.div variants={fadeInUp}>
            <MoodLogger />
          </motion.div>

          {/* Tips Card */}
          <motion.div variants={fadeInUp}>
            <Card variant="flat" padding="lg">
              <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                Why Track Your Mood?
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400 font-body">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-gray-900 dark:text-gray-100">Self-awareness:</strong>{' '}
                    Recognize patterns in your emotional state
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-gray-900 dark:text-gray-100">Early warning:</strong>{' '}
                    Spot declining trends before they become serious
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-gray-900 dark:text-gray-100">Progress tracking:</strong>{' '}
                    See how interventions and strategies help over time
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-gray-900 dark:text-gray-100">Communication:</strong>{' '}
                    Share accurate data with your coach when you need support
                  </span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
