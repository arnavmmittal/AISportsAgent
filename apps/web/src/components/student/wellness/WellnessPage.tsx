'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckInZone } from './CheckInZone';
import { ReadinessDashboard } from './ReadinessDashboard';
import { PersonalizedToolkit } from './PersonalizedToolkit';

// ── Types ──
interface ReadinessData {
  score: number;
  dimensions: { mood: number; sleep: number; stress: number; confidence: number };
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface AthleteInsights {
  mentalPattern: { text: string; type: string };
  coachConnection: { lastInteractionDaysAgo: number | null; text: string };
  growthMetric: { score: number; delta: number; text: string; label: string };
  weeklyInsight: string;
  conversationStarters?: string[];
}

interface MoodLogData {
  id: string;
  date: Date;
  mood: number;
  confidence: number;
  stress: number;
  sleep: number;
  notes?: string;
}

interface DayScore {
  date: Date;
  score: number;
  checkedIn: boolean;
}

// ── Orchestrator ──
export function WellnessPage() {
  const dashboardRef = useRef<HTMLDivElement>(null);

  // State
  const [readiness, setReadiness] = useState<ReadinessData>({
    score: 50,
    dimensions: { mood: 50, sleep: 50, stress: 50, confidence: 50 },
    trend: 'stable',
    change: 0,
  });
  const [insights, setInsights] = useState<AthleteInsights | null>(null);
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);
  const [history, setHistory] = useState<DayScore[]>([]);
  const [upcomingGame, setUpcomingGame] = useState<{ opponent: string; date: Date } | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Compute history from logs
  useEffect(() => {
    if (!pastWeekLogs.length) return;
    const h: DayScore[] = pastWeekLogs.map(log => {
      const s = Math.round(
        (log.mood * 10 * 0.3) +
        (log.confidence * 10 * 0.25) +
        ((10 - log.stress) * 10 * 0.25) +
        ((log.sleep || 7) / 10 * 100 * 0.2)
      );
      return { date: new Date(log.date), score: Math.min(100, Math.max(0, s)), checkedIn: true };
    });
    h.sort((a, b) => a.date.getTime() - b.date.getTime());
    setHistory(h);
  }, [pastWeekLogs]);

  // Data loading
  const loadData = useCallback(async () => {
    try {
      const [dashboardRes, insightsRes, profileRes] = await Promise.all([
        fetch('/api/athlete/dashboard'),
        fetch('/api/athlete/insights'),
        fetch('/api/athlete/profile'),
      ]);

      // Dashboard data
      const dashboardData = await dashboardRes.json();
      if (dashboardData.success && dashboardData.data) {
        const d = dashboardData.data;
        if (d.readiness) {
          setReadiness({
            score: d.readiness.score,
            dimensions: {
              mood: d.readiness.dimensions?.mood || 50,
              sleep: d.readiness.dimensions?.sleep || 50,
              stress: d.readiness.dimensions?.stress || 50,
              confidence: d.readiness.dimensions?.engagement || 50,
            },
            trend: d.readiness.trend || 'stable',
            change: d.readiness.change || 0,
          });
        }
        if (d.hasGameTomorrow) {
          const gi = d.upcomingGame || {};
          const gd = gi.date
            ? new Date(gi.date)
            : (() => { const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(14, 0, 0, 0); return t; })();
          setUpcomingGame({ opponent: gi.opponent || 'Upcoming Game', date: gd });
        }
        if (d.hasCompletedCheckIn) {
          setHasCheckedInToday(true);
        }
      }

      // Insights data
      const insightsData = await insightsRes.json();
      if (insightsData.success && insightsData.data) {
        setInsights(insightsData.data);
      }

      // Mood logs
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.profile?.id) {
        const logsRes = await fetch(`/api/mood-logs?athleteId=${profileData.profile.id}&limit=7`);
        const logsData = await logsRes.json();
        if (logsData.success) {
          const logs: MoodLogData[] = logsData.data.map((l: any) => ({
            id: l.id,
            date: new Date(l.createdAt),
            mood: l.mood,
            confidence: l.confidence,
            stress: l.stress,
            sleep: l.sleep || 7,
            notes: l.notes,
          }));
          setPastWeekLogs(logs);
          // Check if any log is from today
          const today = new Date().toDateString();
          if (logs.some(l => l.date.toDateString() === today)) {
            setHasCheckedInToday(true);
          }
        }
      }
    } catch (e) {
      console.error('Error loading wellness data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check-in success handler
  const handleCheckInSuccess = useCallback(() => {
    setHasCheckedInToday(true);
    loadData();
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Wellness Center</h1>
          <p className="text-muted-foreground mt-1">Check in and track your mental readiness</p>
        </header>

        {/* Zone 1: Check-In */}
        <CheckInZone onSubmitSuccess={handleCheckInSuccess} hasCheckedInToday={hasCheckedInToday} />

        {/* Zone 2: Readiness Dashboard */}
        <div ref={dashboardRef}>
          <ReadinessDashboard
            score={readiness.score}
            dimensions={readiness.dimensions}
            trend={readiness.trend}
            change={readiness.change}
            sparklineData={history.map(h => h.score)}
            history={history}
            insights={insights}
            upcomingGame={upcomingGame}
          />
        </div>

        {/* Zone 3: Personalized Toolkit */}
        <PersonalizedToolkit />
      </div>
    </div>
  );
}
