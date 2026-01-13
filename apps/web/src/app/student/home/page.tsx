'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Target,
  Flame,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Moon,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { ReadinessGauge, type ReadinessLevel } from '@/components/shared/athlete/ReadinessGauge';
import { useAuth } from '@/hooks/useAuth';

/**
 * Athlete Home Page - Daily landing dashboard
 *
 * Data fetched from /api/athlete/dashboard:
 * - Readiness score (calculated from mood logs)
 * - Stats (streak, goals progress, last chat topic)
 * - Today's focus items
 * - Personalized insight
 * - Upcoming assignments
 */

interface DashboardData {
  user: {
    name: string;
    sport: string | null;
    year: string | null;
  };
  readiness: {
    score: number;
    dimensions: { mood: number; sleep: number; stress: number; engagement: number };
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  stats: {
    checkInStreak: number;
    goalsCompleted: number;
    goalsTotal: number;
    lastChatTopic: string | null;
    hasCompletedCheckIn: boolean;
  };
  insight: {
    text: string;
    type: 'pattern' | 'recommendation' | 'celebration';
    actionUrl: string;
    actionLabel: string;
  };
  focusItems: {
    id: string;
    title: string;
    completed: boolean;
    type: 'routine' | 'assignment';
  }[];
  hasGameTomorrow: boolean;
  upcomingAssignments: {
    id: string;
    title: string;
    dueDate: string;
    estimatedTime: string | null;
  }[];
}

// Local storage keys for routine completion tracking (resets daily)
const ROUTINE_COMPLETION_KEY = 'athlete_routine_completion';
const ROUTINE_DATE_KEY = 'athlete_routine_date';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function loadRoutineCompletions(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  const savedDate = localStorage.getItem(ROUTINE_DATE_KEY);
  const today = getTodayDateString();

  // Reset if new day
  if (savedDate !== today) {
    localStorage.setItem(ROUTINE_DATE_KEY, today);
    localStorage.removeItem(ROUTINE_COMPLETION_KEY);
    return {};
  }

  const saved = localStorage.getItem(ROUTINE_COMPLETION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }
  return {};
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getContextMessage(hasGameTomorrow: boolean, streak: number): string {
  if (hasGameTomorrow) return 'Game day is tomorrow';
  if (streak >= 7) return `${streak}-day streak! Keep it going`;
  return "Here's your wellness overview";
}

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 75) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
}

function getReadinessMessage(level: ReadinessLevel): string {
  switch (level) {
    case 'green':
      return "You're in a good place";
    case 'yellow':
      return 'Some areas need attention';
    case 'red':
      return "Let's work on your wellbeing";
  }
}

function getTimeUntilDue(dueDate: string): string {
  const seconds = Math.floor((new Date(dueDate).getTime() - Date.now()) / 1000);
  if (seconds < 0) return 'Overdue';
  if (seconds < 86400) return 'Due today';
  if (seconds < 172800) return 'Due tomorrow';
  return `Due in ${Math.floor(seconds / 86400)} days`;
}

export default function StudentHomePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routineCompletions, setRoutineCompletions] = useState<Record<string, boolean>>({});

  // Load routine completions from localStorage
  useEffect(() => {
    setRoutineCompletions(loadRoutineCompletions());
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!authUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/athlete/dashboard');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view your dashboard');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Toggle routine item completion (local only, persisted to localStorage)
  const toggleRoutineCompletion = (itemId: string) => {
    setRoutineCompletions((prev) => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem(ROUTINE_COMPLETION_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchDashboard()}>Try again</Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const { readiness, stats, insight, focusItems, hasGameTomorrow, upcomingAssignments, user } = data;
  const level = getReadinessLevel(readiness.score);

  // Merge focus items with local routine completions
  const mergedFocusItems = focusItems.map((item) => ({
    ...item,
    completed: item.type === 'routine' ? (routineCompletions[item.id] ?? item.completed) : item.completed,
  }));

  const completedCount = mergedFocusItems.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ─────────────────────────────────────────────────────────────────
            HEADER - Personalized greeting
        ───────────────────────────────────────────────────────────────── */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {getGreeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getContextMessage(hasGameTomorrow, stats.checkInStreak)}
          </p>
        </header>

        {/* ─────────────────────────────────────────────────────────────────
            READINESS CARD - Primary metric
        ───────────────────────────────────────────────────────────────── */}
        <section
          className="card-elevated p-6 animate-slide-up"
          aria-labelledby="readiness-heading"
        >
          <h2 id="readiness-heading" className="sr-only">
            Today's Readiness Score
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Gauge */}
            <ReadinessGauge
              score={readiness.score}
              size="lg"
              showLabel
              animated
            />

            {/* Details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="text-lg font-medium text-foreground mb-1">
                Today's Readiness
              </div>
              <p className={cn(
                'text-sm mb-4',
                level === 'green' && 'text-readiness-green',
                level === 'yellow' && 'text-readiness-yellow',
                level === 'red' && 'text-readiness-red'
              )}>
                {getReadinessMessage(level)}
              </p>

              {/* Dimension bars */}
              <div className="space-y-2">
                {[
                  { label: 'Mood', value: readiness.dimensions.mood, icon: Sparkles },
                  { label: 'Sleep', value: readiness.dimensions.sleep, icon: Moon },
                  { label: 'Stress', value: readiness.dimensions.stress, icon: Activity },
                ].map((dim) => (
                  <div key={dim.label} className="flex items-center gap-3">
                    <dim.icon size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground w-12">{dim.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          dim.value >= 70 ? 'bg-success' : dim.value >= 50 ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${dim.value}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-8">
                      {dim.value}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Trend indicator */}
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-4 text-sm">
                {readiness.trend === 'up' ? (
                  <>
                    <TrendingUp size={16} className="text-success" />
                    <span className="text-success">+{readiness.change}% from yesterday</span>
                  </>
                ) : readiness.trend === 'down' ? (
                  <>
                    <TrendingDown size={16} className="text-destructive" />
                    <span className="text-destructive">-{readiness.change}% from yesterday</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Stable from yesterday</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            CONTINUE CHAT CTA
        ───────────────────────────────────────────────────────────────── */}
        <Link href="/student/ai-coach" className="block group">
          <section className="card-interactive p-5 flex items-center gap-4 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">Continue Chat</div>
              <p className="text-sm text-muted-foreground truncate">
                {stats.lastChatTopic ? `Last topic: ${stats.lastChatTopic}...` : 'Start a new conversation'}
              </p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </section>
        </Link>

        {/* ─────────────────────────────────────────────────────────────────
            MORNING CHECK-IN (if not completed)
        ───────────────────────────────────────────────────────────────── */}
        {!stats.hasCompletedCheckIn && (
          <Link href="/student/mood" className="block">
            <section className="p-5 rounded-lg bg-success-muted border border-success/20 flex items-center gap-4 animate-slide-up hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-success" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Morning Check-In</div>
                <p className="text-sm text-muted-foreground">How are you feeling today?</p>
              </div>
              <Button size="sm" variant="default" className="bg-success hover:bg-success/90">
                Log Mood
              </Button>
            </section>
          </Link>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TODAY'S FOCUS
        ───────────────────────────────────────────────────────────────── */}
        <section className="card-elevated p-5 animate-slide-up" aria-labelledby="focus-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="focus-heading" className="font-medium text-foreground flex items-center gap-2">
              <Target size={18} className="text-primary" />
              Today's Focus
            </h2>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{mergedFocusItems.length} done
            </span>
          </div>

          <ul className="space-y-3">
            {mergedFocusItems.map((task) => (
              <li key={task.id} className="flex items-center gap-3">
                <button
                  onClick={() => task.type === 'routine' && toggleRoutineCompletion(task.id)}
                  disabled={task.type === 'assignment'}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    task.type === 'routine' && 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    task.completed
                      ? 'bg-success border-success'
                      : task.type === 'routine'
                        ? 'border-border hover:border-primary cursor-pointer'
                        : 'border-border cursor-default'
                  )}
                  aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4.5-4.5a1 1 0 00-1.414-1.414L5.5 7.086 3.707 5.293z" />
                    </svg>
                  )}
                </button>
                {task.type === 'assignment' ? (
                  <Link
                    href={`/student/assignments/${task.id}`}
                    className="text-sm text-foreground hover:text-primary transition-colors flex-1"
                  >
                    {task.title}
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleRoutineCompletion(task.id)}
                    className={cn(
                      'text-sm text-left flex-1 hover:text-primary transition-colors',
                      task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}
                  >
                    {task.title}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            INSIGHT CARD - ML-generated
        ───────────────────────────────────────────────────────────────── */}
        <section className={cn(
          'p-5 rounded-lg border animate-slide-up',
          insight.type === 'celebration' && 'bg-warning-muted border-warning/20',
          insight.type === 'pattern' && 'bg-info-muted border-info/20',
          insight.type === 'recommendation' && 'bg-primary-muted border-primary/20'
        )}>
          <div className="flex gap-4">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              insight.type === 'celebration' && 'bg-warning/20',
              insight.type === 'pattern' && 'bg-info/20',
              insight.type === 'recommendation' && 'bg-primary/20'
            )}>
              <Lightbulb size={20} className={cn(
                insight.type === 'celebration' && 'text-warning',
                insight.type === 'pattern' && 'text-info',
                insight.type === 'recommendation' && 'text-primary'
              )} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">
                {insight.type === 'celebration' ? 'Congratulations!' : 'Insight'}
              </div>
              <p className="text-sm text-muted-foreground">{insight.text}</p>
              {insight.actionUrl && (
                <Link
                  href={insight.actionUrl}
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium mt-2 hover:underline',
                    insight.type === 'celebration' && 'text-warning',
                    insight.type === 'pattern' && 'text-info',
                    insight.type === 'recommendation' && 'text-primary'
                  )}
                >
                  {insight.actionLabel}
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            QUICK STATS ROW
        ───────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          {/* Streak */}
          <div className="card-elevated p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-2">
              <Flame size={20} className="text-warning" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-foreground">
              {stats.checkInStreak}
            </div>
            <div className="text-xs text-muted-foreground">day streak</div>
          </div>

          {/* Goals */}
          <Link href="/student/goals" className="card-interactive p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Target size={20} className="text-primary" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-foreground">
              {stats.goalsCompleted}/{stats.goalsTotal}
            </div>
            <div className="text-xs text-muted-foreground">goals completed</div>
          </Link>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            UPCOMING ASSIGNMENT (if any)
        ───────────────────────────────────────────────────────────────── */}
        {upcomingAssignments.length > 0 && (
          <section className="card-elevated overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border">
              <h2 className="font-medium text-foreground">Upcoming Assignment</h2>
            </div>
            {upcomingAssignments.slice(0, 1).map((assignment) => (
              <Link
                key={assignment.id}
                href={`/student/assignments/${assignment.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {assignment.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {getTimeUntilDue(assignment.dueDate)}
                      </span>
                      {assignment.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {assignment.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm">Start</Button>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
