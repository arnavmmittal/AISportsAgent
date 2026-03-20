'use client';

/**
 * Wellness Page - Consolidated Readiness + Check-In (v2.1)
 *
 * This page combines two previously separate features:
 * 1. Readiness - Game-day preparation, readiness gauge, breathing exercises
 * 2. Check-In - Daily mood logging with quick/detailed modes
 *
 * Features preserved from Readiness:
 * - ReadinessGauge as primary metric
 * - Game countdown timer
 * - Pre-game preparation tools (breathing, visualization)
 * - 7-day readiness history with insights
 * - Low readiness warning
 *
 * Features preserved from Mood Log:
 * - Quick/detailed check-in modes
 * - MoodSlider and MoodQuickSelect components
 * - Week overview calendar
 * - Trend indicators
 * - Notes with character limit
 *
 * Uses design system v2.0 semantic tokens
 */

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Target,
  Sparkles,
  Moon,
  Activity,
  Brain,
  Wind,
  Eye,
  PenLine,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Heart,
  Zap,
  Flame,
  Battery,
  Check,
  MessageSquare,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  ReadinessGauge,
  type ReadinessLevel,
} from '@/components/shared/athlete';
import { MoodSlider, MoodQuickSelect } from '@/components/shared/athlete';
import { toast } from 'sonner';
import { isDemoMode, generateDemoAthleteDashboard, generateDemoMoodLogs, type DemoMoodLog } from '@/lib/demo-data';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ReadinessData {
  score: number;
  dimensions: {
    mood: number;
    sleep: number;
    stress: number;
    confidence: number;
  };
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface UpcomingGame {
  id: string;
  opponent: string;
  date: Date;
  location: string;
  isHome: boolean;
}

interface DayHistory {
  date: Date;
  score: number;
  checkedIn: boolean;
}

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

type WellnessTab = 'readiness' | 'checkin';
type CheckInMode = 'quick' | 'detailed';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 75) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
}

function getReadinessMessage(level: ReadinessLevel): { title: string; description: string } {
  switch (level) {
    case 'green':
      return {
        title: "You're Ready",
        description: 'Your mental state is optimal for peak performance. Trust your preparation.',
      };
    case 'yellow':
      return {
        title: 'Room for Improvement',
        description: 'Some factors could use attention. Try a quick preparation exercise.',
      };
    case 'red':
      return {
        title: 'Take Care of Yourself',
        description: 'Your wellbeing comes first. Consider talking to your coach or support staff.',
      };
  }
}

function formatTimeUntil(date: Date): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

function getMoodColor(value: number) {
  if (value <= 3) return 'bg-readiness-red';
  if (value <= 5) return 'bg-readiness-yellow';
  return 'bg-readiness-green';
}

function getMoodEmoji(value: number) {
  if (value <= 2) return '😢';
  if (value <= 4) return '😔';
  if (value <= 6) return '🙂';
  if (value <= 8) return '😊';
  return '🌟';
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

function WellnessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = isDemoMode(searchParams);
  const [activeTab, setActiveTab] = useState<WellnessTab>(
    (searchParams.get('tab') as WellnessTab) || 'readiness'
  );

  // Handle tab changes with URL sync
  const handleTabChange = (tab: WellnessTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'readiness') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/student/wellness${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // ── Readiness State (fetched from API) ──
  const [readiness, setReadiness] = useState<ReadinessData>({
    score: 50,
    dimensions: {
      mood: 50,
      sleep: 50,
      stress: 50,
      confidence: 50,
    },
    trend: 'stable',
    change: 0,
  });
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(true);

  const [upcomingGame, setUpcomingGame] = useState<UpcomingGame | null>(null);

  const [history, setHistory] = useState<DayHistory[]>([]);

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  // ── Check-In State ──
  const [checkInMode, setCheckInMode] = useState<CheckInMode>('quick');
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // ── Effects ──

  // Load demo data for readiness
  const loadDemoReadinessData = useCallback(() => {
    setIsLoadingReadiness(true);
    setTimeout(() => {
      const demoData = generateDemoAthleteDashboard();
      setReadiness({
        score: demoData.readiness.score,
        dimensions: {
          mood: demoData.readiness.dimensions.mood,
          sleep: demoData.readiness.dimensions.sleep,
          stress: demoData.readiness.dimensions.stress,
          confidence: demoData.readiness.dimensions.engagement,
        },
        trend: demoData.readiness.trend,
        change: demoData.readiness.change,
      });
      if (demoData.hasGameTomorrow) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);
        setUpcomingGame({
          id: 'upcoming',
          opponent: 'State University',
          date: tomorrow,
          location: 'Home Arena',
          isHome: true,
        });
        setCountdown(formatTimeUntil(tomorrow));
      }
      setIsLoadingReadiness(false);
    }, 400);
  }, []);

  // Fetch readiness data from athlete dashboard API
  useEffect(() => {
    if (demoMode) {
      loadDemoReadinessData();
      return;
    }

    const fetchReadinessData = async () => {
      try {
        setIsLoadingReadiness(true);
        const response = await fetch('/api/athlete/dashboard');
        const data = await response.json();

        if (data.success && data.data) {
          // Update readiness from API
          if (data.data.readiness) {
            setReadiness({
              score: data.data.readiness.score,
              dimensions: {
                mood: data.data.readiness.dimensions?.mood || 50,
                sleep: data.data.readiness.dimensions?.sleep || 50,
                stress: data.data.readiness.dimensions?.stress || 50,
                confidence: data.data.readiness.dimensions?.engagement || 50,
              },
              trend: data.data.readiness.trend || 'stable',
              change: data.data.readiness.change || 0,
            });
          }

          // Check for upcoming game
          if (data.data.hasGameTomorrow) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(14, 0, 0, 0); // Default game time
            setUpcomingGame({
              id: 'upcoming',
              opponent: 'Opponent',
              date: tomorrow,
              location: 'Home Arena',
              isHome: true,
            });
            setCountdown(formatTimeUntil(tomorrow));
          }
        }
      } catch (error) {
        console.error('Error fetching readiness data:', error);
      } finally {
        setIsLoadingReadiness(false);
      }
    };

    fetchReadinessData();
  }, [demoMode, loadDemoReadinessData]);

  // Build history from pastWeekLogs when they change
  useEffect(() => {
    if (pastWeekLogs.length > 0) {
      // Calculate readiness score for each day based on mood log data
      const historyData: DayHistory[] = pastWeekLogs.map((log) => {
        // Simple readiness calculation: average of mood and confidence, with stress inverted
        const readinessScore = Math.round(
          (log.mood * 10 * 0.3) +
          (log.confidence * 10 * 0.25) +
          ((10 - log.stress) * 10 * 0.25) +
          ((log.sleep || 7) / 10 * 100 * 0.2)
        );
        return {
          date: new Date(log.date),
          score: Math.min(100, Math.max(0, readinessScore)),
          checkedIn: true,
        };
      });
      // Sort by date ascending
      historyData.sort((a, b) => a.date.getTime() - b.date.getTime());
      setHistory(historyData);
    }
  }, [pastWeekLogs]);

  // Update countdown every minute
  useEffect(() => {
    if (!upcomingGame) return;

    setCountdown(formatTimeUntil(upcomingGame.date));
    const interval = setInterval(() => {
      setCountdown(formatTimeUntil(upcomingGame.date));
    }, 60000);
    return () => clearInterval(interval);
  }, [upcomingGame]);

  // Breathing exercise timer
  useEffect(() => {
    if (!breathingActive) return;

    const phases = [
      { name: 'inhale', duration: 4000 },
      { name: 'hold', duration: 4000 },
      { name: 'exhale', duration: 4000 },
    ] as const;

    let phaseIndex = 0;
    let cycles = 0;

    const runPhase = () => {
      setBreathPhase(phases[phaseIndex].name);

      setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        if (phaseIndex === 0) {
          cycles++;
          setBreathCount(cycles);
          if (cycles >= 4) {
            setBreathingActive(false);
            return;
          }
        }
        runPhase();
      }, phases[phaseIndex].duration);
    };

    runPhase();
  }, [breathingActive]);

  // Load demo mood logs
  const loadDemoMoodLogs = useCallback(() => {
    setIsLoadingHistory(true);
    setTimeout(() => {
      const demoLogs = generateDemoMoodLogs(7);
      const transformedLogs: MoodLogData[] = demoLogs.map((log: DemoMoodLog) => ({
        id: log.id,
        date: log.date,
        mood: log.mood,
        confidence: log.confidence,
        stress: log.stress,
        energy: log.energy,
        sleep: log.sleep,
        notes: log.notes,
      }));
      setPastWeekLogs(transformedLogs);
      setIsLoadingHistory(false);
    }, 300);
  }, []);

  // Load mood logs
  useEffect(() => {
    if (demoMode) {
      loadDemoMoodLogs();
      return;
    }
    loadPastWeekLogs();
  }, [demoMode, loadDemoMoodLogs]);

  const loadPastWeekLogs = async () => {
    try {
      setIsLoadingHistory(true);
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.profile?.id) {
        setIsLoadingHistory(false);
        return;
      }

      const userId = profileData.profile.id;
      const response = await fetch(`/api/mood-logs?athleteId=${userId}&limit=7`);
      const data = await response.json();

      if (data.success) {
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
      }
    } catch (error) {
      console.error('Error loading mood logs:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmitCheckIn = async () => {
    // Demo mode: simulate successful check-in
    if (demoMode) {
      setIsSubmitting(true);
      setTimeout(() => {
        toast.success('Check-in saved! (Demo mode)');
        setMood(5);
        setConfidence(5);
        setStress(5);
        setEnergy(5);
        setSleep(7);
        setNotes('');
        setIsSubmitting(false);
      }, 500);
      return;
    }

    setIsSubmitting(true);
    try {
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.profile?.id) {
        toast.error('Please log in to save mood logs');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: profileData.profile.id,
          mood,
          confidence,
          stress,
          energy,
          sleep,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Check-in saved!');
        setMood(5);
        setConfidence(5);
        setStress(5);
        setEnergy(5);
        setSleep(7);
        setNotes('');
        await loadPastWeekLogs();
      } else {
        toast.error(data.error || 'Failed to save check-in');
      }
    } catch (error) {
      console.error('Error saving mood log:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Computed Values ──

  const level = getReadinessLevel(readiness.score);
  const message = getReadinessMessage(level);
  const isGameDay = countdown ? countdown.days === 0 && countdown.hours < 24 : false;

  // Calculate mood trend
  const getMoodTrend = () => {
    if (pastWeekLogs.length < 2) return null;
    const recent = pastWeekLogs.slice(0, 3);
    const older = pastWeekLogs.slice(3);
    if (older.length === 0) return null;

    const recentAvg = recent.reduce((sum, l) => sum + l.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, l) => sum + l.mood, 0) / older.length;
    const diff = recentAvg - olderAvg;

    if (diff > 0.5) return { direction: 'up' as const, value: diff.toFixed(1) };
    if (diff < -0.5) return { direction: 'down' as const, value: Math.abs(diff).toFixed(1) };
    return { direction: 'stable' as const, value: '0' };
  };

  const moodTrend = getMoodTrend();

  // Get last 7 days for check-in calendar
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const checkInDays = getLast7Days();
  const hasCompletedToday = pastWeekLogs.some(
    (log) => log.date.toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <FlaskConical className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-200 font-medium">Demo Mode Active</p>
              <p className="text-amber-300/70 text-sm">
                Viewing sample wellness data. Remove <code className="bg-amber-500/20 px-1 rounded">?demo=true</code> from URL to see real data.
              </p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────── */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Wellness Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your readiness and daily check-ins
          </p>
        </header>

        {/* ─────────────────────────────────────────────────────────────────
            TAB NAVIGATION
        ───────────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => handleTabChange('readiness')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'readiness'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="w-4 h-4" />
            Readiness
          </button>
          <button
            onClick={() => handleTabChange('checkin')}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'checkin'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className="w-4 h-4" />
            Check-In
            {!hasCompletedToday && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            READINESS TAB CONTENT
        ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'readiness' && (
          <div className="space-y-6 animate-fade-in">
            {/* Upcoming Game Countdown - Only show when there's an upcoming game */}
            {upcomingGame && countdown && (
              <section
                className={cn(
                  'card-elevated p-6',
                  isGameDay && 'border-2 border-primary ring-4 ring-primary/10'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar size={14} />
                      {upcomingGame.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      vs {upcomingGame.opponent}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {upcomingGame.isHome ? 'Home' : 'Away'} • {upcomingGame.location}
                    </p>
                  </div>
                  {isGameDay && (
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full animate-pulse">
                      GAME DAY
                    </span>
                  )}
                </div>

                {/* Countdown */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-semibold tabular-nums text-foreground">
                      {countdown.days}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Days</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-semibold tabular-nums text-foreground">
                      {countdown.hours}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Hours</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-semibold tabular-nums text-foreground">
                      {countdown.minutes}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</div>
                  </div>
                </div>
              </section>
            )}

            {/* Readiness Gauge */}
            <section className="card-elevated p-8" aria-labelledby="readiness-heading">
              <h2 id="readiness-heading" className="sr-only">Current Readiness Score</h2>

              <div className="flex flex-col items-center">
                {/* Responsive gauge: scales down on mobile */}
                <div className="transform scale-75 md:scale-100 origin-center">
                  <ReadinessGauge score={readiness.score} size="xl" showLabel animated />
                </div>

                <div className="mt-6 text-center">
                  <h3
                    className={cn(
                      'text-xl font-semibold',
                      level === 'green' && 'text-readiness-green',
                      level === 'yellow' && 'text-readiness-yellow',
                      level === 'red' && 'text-readiness-red'
                    )}
                  >
                    {message.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    {message.description}
                  </p>
                </div>

                {/* Trend */}
                <div className="flex items-center gap-2 mt-4 text-sm">
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
                    <>
                      <Minus size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Stable from yesterday</span>
                    </>
                  )}
                </div>
              </div>

              {/* Dimension Breakdown */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <DimensionCard
                  icon={Sparkles}
                  label="Mood"
                  value={readiness.dimensions.mood}
                  color="primary"
                />
                <DimensionCard
                  icon={Moon}
                  label="Sleep Quality"
                  value={readiness.dimensions.sleep}
                  color="info"
                />
                <DimensionCard
                  icon={Activity}
                  label="Stress"
                  value={100 - readiness.dimensions.stress}
                  inverted
                  color="warning"
                />
                <DimensionCard
                  icon={Brain}
                  label="Confidence"
                  value={readiness.dimensions.confidence}
                  color="success"
                />
              </div>
            </section>

            {/* Pre-Game Preparation Tools */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target size={20} className="text-primary" />
                Pre-Game Preparation
              </h2>

              {/* Breathing Exercise */}
              <div
                className={cn(
                  'card-elevated p-5',
                  breathingActive && 'border-2 border-primary'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                      <Wind size={20} className="text-info" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Box Breathing</h3>
                      <p className="text-sm text-muted-foreground">4-4-4 calming technique</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={breathingActive ? 'outline' : 'default'}
                    onClick={() => {
                      setBreathingActive(!breathingActive);
                      setBreathCount(0);
                    }}
                  >
                    {breathingActive ? (
                      <>
                        <Pause size={14} className="mr-1" /> Stop
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-1" /> Start
                      </>
                    )}
                  </Button>
                </div>

                {breathingActive && (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <div
                      className={cn(
                        'text-4xl font-semibold mb-2 transition-all duration-500',
                        breathPhase === 'inhale' && 'text-info scale-110',
                        breathPhase === 'hold' && 'text-primary',
                        breathPhase === 'exhale' && 'text-success scale-90'
                      )}
                    >
                      {breathPhase === 'inhale' && 'Breathe In'}
                      {breathPhase === 'hold' && 'Hold'}
                      {breathPhase === 'exhale' && 'Breathe Out'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cycle {breathCount + 1} of 4
                    </p>
                  </div>
                )}
              </div>

              {/* Visualization */}
              <Link href="/student/visualization" className="block group">
                <div className="card-interactive p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Eye size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Visualization Script</h3>
                    <p className="text-sm text-muted-foreground">
                      Mental rehearsal for optimal performance
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              {/* Pre-Game Journal */}
              <Link href="/student/ai-coach?topic=pregame" className="block group">
                <div className="card-interactive p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                    <PenLine size={20} className="text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Pre-Game Journal</h3>
                    <p className="text-sm text-muted-foreground">
                      Process thoughts and set intentions
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-success transition-colors" />
                </div>
              </Link>
            </section>

            {/* 7-Day History */}
            <section className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">7-Day History</h2>

              {history.length > 0 ? (
                <>
                  <div className="flex justify-between gap-2">
                    {history.map((day, index) => {
                      const dayLevel = getReadinessLevel(day.score);
                      const isToday = index === history.length - 1;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className={cn(
                              'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium text-white transition-transform hover:scale-105',
                              dayLevel === 'green' && 'bg-readiness-green',
                              dayLevel === 'yellow' && 'bg-readiness-yellow',
                              dayLevel === 'red' && 'bg-readiness-red',
                              isToday && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                            )}
                          >
                            {day.score}
                          </div>
                          <span className="text-xs text-muted-foreground mt-2">
                            {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          {isToday && (
                            <span className="text-xs text-primary font-medium">Today</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Insight - only show when we have at least 2 days of data */}
                  {history.length >= 2 && (
                    <div className="mt-6 p-4 bg-info/5 border border-info/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-info mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {history[history.length - 1].score >= history[0].score
                              ? 'Consistent improvement this week'
                              : 'Room for improvement'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your readiness has {history[history.length - 1].score >= history[0].score ? 'increased' : 'decreased'} by {Math.abs(history[history.length - 1].score - history[0].score)} points
                            over the past {history.length} days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No check-in data yet this week.</p>
                  <p className="text-sm">Complete your first check-in to see your history.</p>
                </div>
              )}
            </section>

            {/* Low Readiness Warning */}
            {level === 'red' && (
              <section className="p-5 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Your wellbeing matters most</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      It looks like you might be going through a tough time. Consider reaching out to
                      your coach or a trusted support person. Your mental health is more important than
                      any game.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button size="sm" variant="outline">
                        Talk to Coach
                      </Button>
                      <Link href="/student/ai-coach?topic=support">
                        <Button size="sm">Chat with AI Coach</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            CHECK-IN TAB CONTENT
        ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'checkin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Week Overview */}
            <section className="card-elevated p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-foreground">This Week</h2>
                {moodTrend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                      moodTrend.direction === 'up' && 'bg-success/10 text-success',
                      moodTrend.direction === 'down' && 'bg-destructive/10 text-destructive',
                      moodTrend.direction === 'stable' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {moodTrend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                    {moodTrend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                    {moodTrend.direction === 'stable' && <Minus className="w-3 h-3" />}
                    {moodTrend.direction === 'stable' ? 'Stable' : `${moodTrend.value} pts`}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {checkInDays.map((date, index) => {
                  const log = pastWeekLogs.find(
                    (l) => l.date.toDateString() === date.toDateString()
                  );
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex flex-col items-center py-2 rounded-lg transition-all',
                        isToday && 'ring-2 ring-primary ring-offset-2',
                        log ? getMoodColor(log.mood) : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium uppercase',
                          log ? 'text-white/80' : 'text-muted-foreground'
                        )}
                      >
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      <span
                        className={cn(
                          'text-lg font-semibold',
                          log ? 'text-white' : 'text-muted-foreground'
                        )}
                      >
                        {log ? getMoodEmoji(log.mood) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Stats */}
              {pastWeekLogs.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {(pastWeekLogs.reduce((sum, l) => sum + l.mood, 0) / pastWeekLogs.length).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {pastWeekLogs.length}/7
                    </div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {(pastWeekLogs.reduce((sum, l) => sum + l.sleep, 0) / pastWeekLogs.length).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Sleep</div>
                  </div>
                </div>
              )}
            </section>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setCheckInMode('quick')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  checkInMode === 'quick'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="w-4 h-4 inline-block mr-1.5" />
                Quick
              </button>
              <button
                onClick={() => setCheckInMode('detailed')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  checkInMode === 'detailed'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Zap className="w-4 h-4 inline-block mr-1.5" />
                Detailed
              </button>
            </div>

            {/* Check-In Form */}
            <section className="card-elevated p-5 space-y-6">
              {checkInMode === 'quick' ? (
                /* Quick Mode - Emoji Selection */
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      How are you feeling right now?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tap to select your mood
                    </p>
                  </div>
                  <MoodQuickSelect
                    value={mood}
                    onChange={setMood}
                    className="justify-center"
                  />
                </div>
              ) : (
                /* Detailed Mode - Sliders */
                <div className="space-y-6">
                  {/* Mood */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-medium text-foreground">Overall Mood</span>
                    </div>
                    <MoodSlider
                      value={mood}
                      onChange={setMood}
                      showEmoji
                      showValue
                    />
                  </div>

                  {/* Confidence */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">Confidence</span>
                    </div>
                    <MoodSlider
                      value={confidence}
                      onChange={setConfidence}
                      showEmoji={false}
                      showValue
                    />
                  </div>

                  {/* Stress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-foreground">Stress Level</span>
                    </div>
                    <MoodSlider
                      value={stress}
                      onChange={setStress}
                      showEmoji={false}
                      showValue
                    />
                  </div>

                  {/* Energy */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Battery className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-foreground">Energy Level</span>
                    </div>
                    <MoodSlider
                      value={energy}
                      onChange={setEnergy}
                      showEmoji={false}
                      showValue
                    />
                  </div>

                  {/* Sleep */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-foreground">Hours of Sleep</span>
                    </div>
                    <MoodSlider
                      value={sleep}
                      onChange={setSleep}
                      min={0}
                      max={12}
                      showEmoji={false}
                      showValue
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Notes (optional)</span>
                  <span className="text-xs text-muted-foreground font-normal">{notes.length}/200</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value.slice(0, 200))
                  }
                  placeholder="Anything on your mind?"
                  className="min-h-[80px] resize-none"
                  maxLength={200}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitCheckIn}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Check-In
                  </>
                )}
              </Button>
            </section>

            {/* Talk to Coach CTA */}
            <button
              onClick={() => router.push('/student/ai-coach')}
              className="w-full card-interactive p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">Want to talk about it?</div>
                <p className="text-sm text-muted-foreground">Chat with your AI coach</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Tips */}
            <section className="p-4 rounded-lg bg-info/5 border border-info/10">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-info" />
                Why track your mood?
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Build self-awareness of emotional patterns</li>
                <li>• Spot trends before they become problems</li>
                <li>• Share insights with your coach when needed</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface DimensionCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  inverted?: boolean;
  color: 'primary' | 'success' | 'warning' | 'info';
}

function DimensionCard({ icon: Icon, label, value, inverted, color }: DimensionCardProps) {
  const level = getReadinessLevel(value);

  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
        {inverted && (
          <span className="text-xs text-muted-foreground">(inverted)</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mr-3">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              level === 'green' && 'bg-readiness-green',
              level === 'yellow' && 'bg-readiness-yellow',
              level === 'red' && 'bg-readiness-red'
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums text-foreground w-10 text-right">
          {value}%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE EXPORT WITH SUSPENSE
// ─────────────────────────────────────────────────────────────────

export default function WellnessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading wellness...</p>
          </div>
        </div>
      }
    >
      <WellnessPageContent />
    </Suspense>
  );
}
