'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { ReadinessGauge, type ReadinessLevel } from '@/components/shared/athlete/ReadinessGauge';

/**
 * Athlete Home Page - Daily landing dashboard
 *
 * Key sections:
 * 1. Personalized greeting with context (game day, time of day)
 * 2. Readiness gauge - primary metric
 * 3. Continue chat CTA - direct access to AI coach
 * 4. Morning check-in prompt
 * 5. Today's focus items
 * 6. Personalized insight from ML
 */

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  estimatedTime: string;
}

interface ReadinessData {
  score: number;
  dimensions: {
    mood: number;
    sleep: number;
    stress: number;
    engagement: number;
  };
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface InsightData {
  text: string;
  type: 'pattern' | 'recommendation' | 'celebration';
  actionUrl?: string;
  actionLabel?: string;
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

export default function StudentHomePage() {
  const [userName] = useState('Sarah'); // Will come from auth context
  const [hasGameTomorrow] = useState(true); // Will come from schedule API

  // Mock data - will be replaced with API calls
  const [readiness] = useState<ReadinessData>({
    score: 78,
    dimensions: {
      mood: 68,
      sleep: 76,
      stress: 45,
      engagement: 62,
    },
    trend: 'up',
    change: 5,
  });

  const [stats] = useState({
    checkInStreak: 5,
    goalsCompleted: 3,
    goalsTotal: 7,
    lastChatTopic: 'pre-game anxiety',
    hasCompletedCheckIn: false,
  });

  const [insight] = useState<InsightData>({
    text: "Your mood tends to dip 2 days before big games. Today's chat can help you prepare mentally.",
    type: 'pattern',
    actionUrl: '/student/ai-coach',
    actionLabel: 'Start session',
  });

  const [todaysFocus] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: '1', title: 'Morning mood check-in', completed: stats.hasCompletedCheckIn },
    { id: '2', title: 'Practice breathing routine', completed: false },
    { id: '3', title: 'Review visualization script', completed: false },
  ]);

  const [upcomingAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Pre-Game Mental Preparation',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      estimatedTime: '10 min',
    },
  ]);

  const getTimeUntilDue = (dueDate: Date): string => {
    const seconds = Math.floor((dueDate.getTime() - Date.now()) / 1000);
    if (seconds < 0) return 'Overdue';
    if (seconds < 86400) return 'Due today';
    if (seconds < 172800) return 'Due tomorrow';
    return `Due in ${Math.floor(seconds / 86400)} days`;
  };

  const getReadinessLevel = (score: number): ReadinessLevel => {
    if (score >= 75) return 'green';
    if (score >= 55) return 'yellow';
    return 'red';
  };

  const getReadinessMessage = (level: ReadinessLevel): string => {
    switch (level) {
      case 'green':
        return "You're in a good place";
      case 'yellow':
        return 'Some areas need attention';
      case 'red':
        return "Let's work on your wellbeing";
    }
  };

  const level = getReadinessLevel(readiness.score);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ─────────────────────────────────────────────────────────────────
            HEADER - Personalized greeting
        ───────────────────────────────────────────────────────────────── */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {getGreeting()}, {userName}
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
                  { label: 'Stress', value: 100 - readiness.dimensions.stress, icon: Activity },
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
                Last topic: {stats.lastChatTopic}...
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
              {todaysFocus.filter((t) => t.completed).length}/{todaysFocus.length} done
            </span>
          </div>

          <ul className="space-y-3">
            {todaysFocus.map((task) => (
              <li key={task.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    task.completed
                      ? 'bg-success border-success'
                      : 'border-border'
                  )}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4.5-4.5a1 1 0 00-1.414-1.414L5.5 7.086 3.707 5.293z" />
                    </svg>
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            INSIGHT CARD - ML-generated
        ───────────────────────────────────────────────────────────────── */}
        <section className="p-5 rounded-lg bg-info-muted border border-info/20 animate-slide-up">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={20} className="text-info" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">Insight</div>
              <p className="text-sm text-muted-foreground">{insight.text}</p>
              {insight.actionUrl && (
                <Link
                  href={insight.actionUrl}
                  className="inline-flex items-center gap-1 text-sm text-info font-medium mt-2 hover:underline"
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
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {assignment.estimatedTime}
                      </span>
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
