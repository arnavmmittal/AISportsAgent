'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Brain,
  Moon,
  Activity,
  Target,
  Plus,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { toast } from 'sonner';

/**
 * Student Progress Page - Updated with Design System v2.0
 *
 * Features:
 * - Mood tracking overview with semantic colors
 * - Goal progress tracking
 * - Weekly history visualization
 * - Trend indicators
 */

interface MoodEntry {
  id: string;
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'mood' | 'goals'>('mood');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        setIsLoading(false);
        return;
      }

      const userId = profileData.data.userId;

      // Load mood logs
      const moodResponse = await fetch(`/api/mood-logs?athleteId=${userId}&limit=7`);
      const moodData = await moodResponse.json();

      if (moodData.success) {
        const transformedLogs: MoodEntry[] = moodData.data.map((log: any) => ({
          id: log.id,
          date: new Date(log.createdAt),
          mood: log.mood,
          stress: log.stress,
          sleep: log.sleep || 7,
          confidence: log.confidence,
        }));
        setMoodHistory(transformedLogs);
      }

      // Load goals
      const goalsResponse = await fetch(`/api/goals?athleteId=${userId}`);
      const goalsData = await goalsResponse.json();

      if (goalsData.success) {
        const transformedGoals: Goal[] = goalsData.data.map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          progress: goal.progress,
          target: 100,
          deadline: goal.targetDate ? new Date(goal.targetDate) : new Date(),
        }));
        setGoals(transformedGoals);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverage = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, entry) => acc + entry[key], 0);
    return (sum / moodHistory.length).toFixed(1);
  };

  const getTrend = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length < 2) return 'stable';
    const recent = moodHistory.slice(0, Math.ceil(moodHistory.length / 2));
    const older = moodHistory.slice(Math.ceil(moodHistory.length / 2));

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry[key], 0) / older.length;

    if (key === 'stress') {
      // For stress, lower is better
      return recentAvg < olderAvg - 0.3 ? 'improving' : recentAvg > olderAvg + 0.3 ? 'declining' : 'stable';
    } else {
      return recentAvg > olderAvg + 0.3 ? 'improving' : recentAvg < olderAvg - 0.3 ? 'declining' : 'stable';
    }
  };

  const getReadinessColor = (value: number) => {
    if (value <= 3) return 'bg-readiness-red';
    if (value <= 6) return 'bg-readiness-yellow';
    return 'bg-readiness-green';
  };

  const getCategoryConfig = (category: string) => {
    switch (category.toUpperCase()) {
      case 'PERFORMANCE':
        return { color: 'bg-primary/10 text-primary border-primary/20', icon: Target };
      case 'MENTAL':
        return { color: 'bg-pink-500/10 text-pink-600 border-pink-500/20', icon: Brain };
      case 'ACADEMIC':
        return { color: 'bg-success/10 text-success border-success/20', icon: Sparkles };
      case 'PERSONAL':
        return { color: 'bg-warning/10 text-warning border-warning/20', icon: Heart };
      default:
        return { color: 'bg-muted text-muted-foreground border-border', icon: Target };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            My Progress
          </h1>
          <p className="text-muted-foreground mt-1">Track your wellness and achieve your goals</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('mood')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'mood'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className="w-4 h-4" />
            Wellness
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'goals'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Target className="w-4 h-4" />
            Goals
          </button>
        </div>

        {/* Mood Tracking Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6 animate-slide-up">
            {/* Average Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Mood */}
              <div className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  {getTrend('mood') === 'improving' && <TrendingUp className="w-4 h-4 text-success" />}
                  {getTrend('mood') === 'declining' && <TrendingDown className="w-4 h-4 text-destructive" />}
                  {getTrend('mood') === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {calculateAverage('mood')}<span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Mood</div>
              </div>

              {/* Stress */}
              <div className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <Brain className="w-5 h-5 text-orange-500" />
                  {getTrend('stress') === 'improving' && <TrendingDown className="w-4 h-4 text-success" />}
                  {getTrend('stress') === 'declining' && <TrendingUp className="w-4 h-4 text-destructive" />}
                  {getTrend('stress') === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {calculateAverage('stress')}<span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Stress</div>
              </div>

              {/* Sleep */}
              <div className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  {getTrend('sleep') === 'improving' && <TrendingUp className="w-4 h-4 text-success" />}
                  {getTrend('sleep') === 'declining' && <TrendingDown className="w-4 h-4 text-destructive" />}
                  {getTrend('sleep') === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {calculateAverage('sleep')}<span className="text-sm font-normal text-muted-foreground">hrs</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Sleep</div>
              </div>

              {/* Confidence */}
              <div className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-success" />
                  {getTrend('confidence') === 'improving' && <TrendingUp className="w-4 h-4 text-success" />}
                  {getTrend('confidence') === 'declining' && <TrendingDown className="w-4 h-4 text-destructive" />}
                  {getTrend('confidence') === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {calculateAverage('confidence')}<span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Confidence</div>
              </div>
            </div>

            {/* Quick Action - Log Mood */}
            <button
              onClick={() => router.push('/student/mood')}
              className="w-full card-interactive p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">Daily Check-In</div>
                <p className="text-sm text-muted-foreground">Log your mood, stress, sleep, and confidence</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* 7-Day History */}
            <section className="card-elevated overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-medium text-foreground">7-Day History</h2>
                <p className="text-sm text-muted-foreground">Your wellness metrics over the past week</p>
              </div>

              {moodHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No check-ins yet</p>
                  <Button
                    onClick={() => router.push('/student/mood')}
                    className="mt-4"
                    size="sm"
                  >
                    Log Your First Check-In
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {moodHistory.map((entry, index) => {
                    const isToday = entry.date.toDateString() === new Date().toDateString();
                    return (
                      <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                          <div className={cn('w-3 h-3 rounded-full', getReadinessColor(entry.mood))} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-muted-foreground">Mood:</span>
                            <span className="font-medium text-foreground">{entry.mood}/10</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-orange-500" />
                            <span className="text-muted-foreground">Stress:</span>
                            <span className="font-medium text-foreground">{entry.stress}/10</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-500" />
                            <span className="text-muted-foreground">Sleep:</span>
                            <span className="font-medium text-foreground">{entry.sleep}hrs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="font-medium text-foreground">{entry.confidence}/10</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-slide-up">
            {/* Quick Action - Create Goal */}
            <button
              onClick={() => router.push('/student/goals')}
              className="w-full card-interactive p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">Set New Goal</div>
                <p className="text-sm text-muted-foreground">Performance, mental, academic, or personal</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Goals List */}
            {goals.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-medium text-foreground mb-1">No goals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first goal to start tracking progress</p>
                <Button onClick={() => router.push('/student/goals')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progressPercent = Math.round((goal.progress / goal.target) * 100);
                  const isComplete = goal.progress >= goal.target;
                  const config = getCategoryConfig(goal.category);
                  const Icon = config.icon;

                  return (
                    <div
                      key={goal.id}
                      onClick={() => router.push('/student/goals')}
                      className="card-interactive p-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">{goal.title}</h3>
                            {isComplete && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', config.color)}>
                              {goal.category}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {goal.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  isComplete ? 'bg-success' : 'bg-primary'
                                )}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View All Goals Link */}
            {goals.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/student/goals')}
              >
                View All Goals
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Tips Section */}
        <section className="p-4 rounded-lg bg-info/5 border border-info/10 animate-slide-up">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-info" />
            Progress Tips
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Consistent check-ins help you spot patterns</li>
            <li>• Small daily progress adds up over time</li>
            <li>• Celebrate every milestone, no matter how small</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
