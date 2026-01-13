'use client';

/**
 * AthleteDetailView - Enhanced Coach's Deep Dive into Athlete Data
 *
 * Features:
 * - ReadinessGauge with animated scoring
 * - 14-day heatmap + 7-day forecast
 * - Performance vs readiness correlation charts
 * - Risk-level badges with semantic colors
 * - Intervention tools (check-in, notes)
 *
 * Uses design system v2.0 with semantic tokens
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Mail,
  StickyNote,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
  Moon,
  Activity,
  Brain,
  Dumbbell,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { ReadinessGauge, ReadinessGaugeMini, type ReadinessLevel } from '@/components/shared/athlete';
import { RiskBadge, RiskIndicator, getRiskLevelFromScore, type RiskLevel } from '@/components/shared/athlete';
import WeeklySummaryDrawer from './weekly-summary/WeeklySummaryDrawer';

interface AthleteData {
  consentGranted: boolean;
  data: {
    athlete: {
      id: string;
      name: string;
      email: string;
      sport: string;
      year: string;
      teamPosition: string;
      riskLevel: string;
      createdAt?: string;
    };
    relationship: {
      joinedAt: string;
      notes: string | null;
    };
    statistics?: {
      avgMood: number;
      avgConfidence: number;
      avgStress: number;
      totalMoodLogs: number;
      activeGoals: number;
      completedGoals: number;
      totalGoals: number;
      chatSessions: number;
      crisisAlerts: number;
    };
    moodLogs?: Array<{
      id: string;
      mood: number;
      confidence: number;
      stress: number;
      sleep: number;
      createdAt: string;
    }>;
    goals?: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      targetDate: string;
      createdAt: string;
    }>;
    coachNotes?: Array<{
      id: string;
      content: string;
      category: string;
      createdAt: string;
    }>;
    crisisAlerts?: Array<{
      id: string;
      severity: string;
      detectedAt: string;
      reviewed: boolean;
    }>;
  };
}

// Convert backend risk level to design system RiskLevel
function mapRiskLevel(backendLevel: string): RiskLevel {
  switch (backendLevel?.toUpperCase()) {
    case 'LOW':
      return 'low';
    case 'MEDIUM':
    case 'MODERATE':
      return 'moderate';
    case 'HIGH':
      return 'high';
    case 'CRITICAL':
      return 'critical';
    default:
      return 'moderate';
  }
}

// Convert readiness score to ReadinessLevel
function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 75) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
}

export default function AthleteDetailView({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intervention states
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAthleteData();
  }, [athleteId]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      const [athleteRes, perfRes] = await Promise.all([
        fetch(`/api/coach/athletes/${athleteId}`),
        fetch(`/api/performance/${athleteId}?limit=10`),
      ]);

      if (!athleteRes.ok) throw new Error('Failed to fetch athlete data');

      const athleteJson = await athleteRes.json();
      setAthleteData(athleteJson);
      setRelationshipNotes(athleteJson.data.relationship.notes || '');

      if (perfRes.ok) {
        const perfJson = await perfRes.json();
        setPerformanceMetrics(perfJson.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching athlete data:', err);
      setError('Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCheckIn = async () => {
    if (!checkInMessage.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: checkInMessage,
          type: 'CHECK_IN',
        }),
      });

      if (!res.ok) throw new Error('Failed to send check-in');

      setCheckInMessage('');
      setShowCheckIn(false);
      fetchAthleteData();
    } catch (err) {
      console.error('Error sending check-in:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          category: noteCategory,
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');

      setNewNote('');
      setShowAddNote(false);
      fetchAthleteData();
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRelationshipNotes = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/intervention`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: relationshipNotes }),
      });

      if (!res.ok) throw new Error('Failed to update notes');
      fetchAthleteData();
    } catch (err) {
      console.error('Error updating notes:', err);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading athlete data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !athleteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-elevated max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || 'Athlete not found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load the athlete's data. Please try again.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const { athlete, relationship, statistics, moodLogs, goals, coachNotes, crisisAlerts } =
    athleteData.data;

  // Calculate readiness score from mood dimensions
  const calculateReadinessScore = (
    mood: number,
    confidence: number,
    stress: number,
    sleep: number
  ) => {
    const moodScore = mood * 10;
    const confidenceScore = confidence * 10;
    const stressScore = (10 - stress) * 10;
    const sleepScore = (sleep / 9) * 100;
    return Math.round(
      moodScore * 0.25 + confidenceScore * 0.25 + stressScore * 0.3 + sleepScore * 0.2
    );
  };

  // Prepare readiness data
  const last14Days = moodLogs?.slice(0, 14).reverse() || [];
  const readinessScores = last14Days.map((log) =>
    calculateReadinessScore(log.mood, log.confidence, log.stress, log.sleep)
  );
  const currentReadiness = readinessScores[readinessScores.length - 1] || 0;

  // Calculate 7-day forecast
  const calculateForecast = (scores: number[]): number[] => {
    if (scores.length < 3) return [];
    const recent = scores.slice(-7);
    const avgChange = (recent[recent.length - 1] - recent[0]) / recent.length;
    const forecast: number[] = [];
    let lastScore = recent[recent.length - 1];
    for (let i = 1; i <= 7; i++) {
      lastScore = Math.max(0, Math.min(100, lastScore + avgChange));
      forecast.push(Math.round(lastScore));
    }
    return forecast;
  };

  const forecast = calculateForecast(readinessScores);
  const trendDirection =
    forecast.length > 0
      ? forecast[forecast.length - 1] > currentReadiness + 5
        ? 'up'
        : forecast[forecast.length - 1] < currentReadiness - 5
        ? 'down'
        : 'stable'
      : 'stable';

  // Chart data
  const chartData =
    last14Days.map((log) => {
      const date = new Date(log.createdAt);
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        Readiness: calculateReadinessScore(log.mood, log.confidence, log.stress, log.sleep),
        Mood: log.mood * 10,
        Confidence: log.confidence * 10,
        Stress: (10 - log.stress) * 10,
      };
    }) || [];

  // No consent view
  if (!athleteData.consentGranted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Athletes</span>
          </button>

          <div className="card-elevated p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{athlete.name}</h2>
            <p className="text-muted-foreground mb-1">
              {athlete.sport} • {athlete.year}
            </p>
            <p className="text-sm text-muted-foreground mb-6">{athlete.teamPosition}</p>

            <div className="bg-warning/5 border border-warning/20 rounded-lg p-6 mb-8">
              <p className="text-foreground font-medium mb-1">Consent Not Granted</p>
              <p className="text-sm text-muted-foreground">
                This athlete has not granted data sharing consent. Basic profile information is
                visible, but detailed metrics, mood logs, and goals are private.
              </p>
            </div>

            <div className="text-left">
              <h3 className="font-medium text-foreground mb-3">Private Relationship Notes</h3>
              <textarea
                value={relationshipNotes}
                onChange={(e) => setRelationshipNotes(e.target.value)}
                placeholder="Add private notes about this athlete..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
              />
              <Button
                onClick={handleUpdateRelationshipNotes}
                disabled={saving}
                className="mt-3"
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back to Athletes</span>
        </button>

        {/* ─────────────────────────────────────────────────────────────────
            HEADER - Athlete Profile
        ───────────────────────────────────────────────────────────────── */}
        <header className="card-elevated p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">
                    {athlete.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {athlete.sport} • {athlete.year} • {athlete.teamPosition}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{athlete.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <RiskBadge
                  level={mapRiskLevel(athlete.riskLevel)}
                  showIcon
                  variant="subtle"
                  label={`${athlete.riskLevel} Risk`}
                />
                <span className="px-3 py-1 text-sm bg-muted rounded-full text-muted-foreground">
                  <Calendar size={14} className="inline mr-1.5" />
                  Joined {new Date(relationship.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Readiness Gauge */}
            {currentReadiness > 0 && (
              <div className="flex items-center gap-6">
                <ReadinessGauge score={currentReadiness} size="lg" showLabel showStatus animated />

                {/* Trend Indicator */}
                <div className="text-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                      trendDirection === 'up' && 'bg-success/10',
                      trendDirection === 'down' && 'bg-destructive/10',
                      trendDirection === 'stable' && 'bg-muted'
                    )}
                  >
                    {trendDirection === 'up' && <TrendingUp className="w-6 h-6 text-success" />}
                    {trendDirection === 'down' && (
                      <TrendingDown className="w-6 h-6 text-destructive" />
                    )}
                    {trendDirection === 'stable' && <Minus className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">7-day trend</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-row lg:flex-col gap-3">
              <Button
                onClick={() => setShowCheckIn(true)}
                className="flex-1 lg:flex-none"
                size="sm"
              >
                <Mail size={16} className="mr-2" />
                Send Check-In
              </Button>
              <Button
                onClick={() => setShowAddNote(true)}
                variant="outline"
                className="flex-1 lg:flex-none"
                size="sm"
              >
                <StickyNote size={16} className="mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────
            STATISTICS CARDS
        ───────────────────────────────────────────────────────────────── */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Sparkles}
              label="Avg Mood"
              value={statistics.avgMood.toFixed(1)}
              suffix="/10"
              sublabel="Last 7 days"
              color="primary"
            />
            <StatCard
              icon={Dumbbell}
              label="Confidence"
              value={statistics.avgConfidence.toFixed(1)}
              suffix="/10"
              sublabel="Average"
              color="success"
            />
            <StatCard
              icon={Brain}
              label="Stress Level"
              value={statistics.avgStress.toFixed(1)}
              suffix="/10"
              sublabel="Lower is better"
              color="warning"
            />
            <StatCard
              icon={Target}
              label="Active Goals"
              value={statistics.activeGoals.toString()}
              sublabel={`${statistics.completedGoals} completed`}
              color="info"
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            14-DAY HEATMAP + 7-DAY FORECAST
        ───────────────────────────────────────────────────────────────── */}
        {readinessScores.length > 0 && (
          <section className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              14-Day Readiness Trend + 7-Day Forecast
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Last 14 Days */}
              <div className="flex-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Last 14 Days
                </h3>
                <div className="flex gap-1.5 flex-wrap">
                  {readinessScores.map((score, index) => {
                    const level = getReadinessLevel(score);
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold text-white cursor-pointer transition-transform hover:scale-110',
                            level === 'green' && 'bg-readiness-green',
                            level === 'yellow' && 'bg-readiness-yellow',
                            level === 'red' && 'bg-readiness-red'
                          )}
                          title={`Day ${index - 13}: ${score}/100`}
                        >
                          {score}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          D{index - 13}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7-Day Forecast */}
              {forecast.length > 0 && (
                <div className="md:border-l md:border-border md:pl-6">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    7-Day Forecast
                  </h3>
                  <div className="flex gap-1.5">
                    {forecast.map((score, index) => {
                      const level = getReadinessLevel(score);
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-medium text-white opacity-70',
                              level === 'green' && 'bg-readiness-green',
                              level === 'yellow' && 'bg-readiness-yellow',
                              level === 'red' && 'bg-readiness-red'
                            )}
                            title={`Day +${index + 1}: ${score}/100`}
                          >
                            {score}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            +{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Trend Insight */}
            {forecast.length > 0 && (
              <div
                className={cn(
                  'mt-6 p-4 rounded-lg border-l-4 text-sm',
                  trendDirection === 'down' &&
                    'bg-destructive/5 border-destructive text-destructive',
                  trendDirection === 'up' && 'bg-success/5 border-success text-success',
                  trendDirection === 'stable' && 'bg-info/5 border-info text-info'
                )}
              >
                {trendDirection === 'down' && (
                  <p className="font-medium">
                    Declining trend detected - forecast shows readiness dropping to{' '}
                    {forecast[forecast.length - 1]} in 7 days. Consider proactive intervention.
                  </p>
                )}
                {trendDirection === 'up' && (
                  <p className="font-medium">
                    Improving trend detected - forecast shows readiness rising to{' '}
                    {forecast[forecast.length - 1]} in 7 days. Great progress!
                  </p>
                )}
                {trendDirection === 'stable' && (
                  <p className="font-medium">
                    Stable trend - forecast shows readiness maintaining around{' '}
                    {forecast[forecast.length - 1]} in 7 days.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            READINESS COMPONENTS CHART
        ───────────────────────────────────────────────────────────────── */}
        {chartData.length > 0 && (
          <section className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Readiness Components (Last 14 Days)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Readiness"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    name="Readiness Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="Mood"
                    stroke="hsl(var(--readiness-green))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="Confidence"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress"
                    stroke="hsl(var(--readiness-yellow))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    opacity={0.6}
                    name="Stress (inverted)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Weekly Summaries */}
        <WeeklySummaryDrawer
          athleteId={athleteId}
          athleteName={athlete.name}
          consentGranted={athleteData.consentGranted}
        />

        {/* ─────────────────────────────────────────────────────────────────
            PERFORMANCE METRICS
        ───────────────────────────────────────────────────────────────── */}
        {performanceMetrics.length > 0 && (
          <>
            {/* Performance Summary */}
            <section className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Performance Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="text-3xl font-semibold text-success">
                    {performanceMetrics.filter((m) => m.outcome?.toUpperCase() === 'WIN').length}
                  </div>
                  <div className="text-sm text-success/80 font-medium mt-1">Wins</div>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-3xl font-semibold text-destructive">
                    {performanceMetrics.filter((m) => m.outcome?.toUpperCase() === 'LOSS').length}
                  </div>
                  <div className="text-sm text-destructive/80 font-medium mt-1">Losses</div>
                </div>
                <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                  <div className="text-3xl font-semibold text-info">
                    {(
                      (performanceMetrics.filter((m) => m.outcome?.toUpperCase() === 'WIN').length /
                        performanceMetrics.length) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                  <div className="text-sm text-info/80 font-medium mt-1">Win Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-3xl font-semibold text-primary">
                    {performanceMetrics.filter((m) => m.readinessScore).length > 0
                      ? (
                          performanceMetrics
                            .filter((m) => m.readinessScore)
                            .reduce((sum, m) => sum + m.readinessScore, 0) /
                          performanceMetrics.filter((m) => m.readinessScore).length
                        ).toFixed(0)
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-primary/80 font-medium mt-1">Avg Readiness</div>
                </div>
              </div>
            </section>

            {/* Performance vs Readiness Correlation */}
            {performanceMetrics.filter((m) => m.readinessScore && m.stats?.points).length >= 5 && (
              <section className="card-elevated p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Performance vs Readiness Correlation
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Shows correlation between mental readiness scores and game performance.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceMetrics
                        .slice(0, 10)
                        .reverse()
                        .map((m, idx) => ({
                          game: `Game ${idx + 1}`,
                          points: m.stats?.points || 0,
                          readiness: m.readinessScore || 0,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="game" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="points"
                        stroke="hsl(var(--info))"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Points Scored"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="readiness"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Readiness Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Recent Games */}
            <section className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Games</h2>
              <div className="space-y-3">
                {performanceMetrics.slice(0, 5).map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(metric.gameDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="font-medium text-foreground">vs {metric.opponentName}</div>
                      </div>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          metric.outcome?.toUpperCase() === 'WIN' &&
                            'bg-success/10 text-success border border-success/20',
                          metric.outcome?.toUpperCase() === 'LOSS' &&
                            'bg-destructive/10 text-destructive border border-destructive/20'
                        )}
                      >
                        {metric.outcome?.toUpperCase() || 'N/A'}
                      </span>
                    </div>

                    {metric.stats && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {metric.stats.points !== undefined && (
                          <span className="px-2 py-1 bg-info/10 text-info text-xs font-medium rounded">
                            {metric.stats.points} PTS
                          </span>
                        )}
                        {metric.stats.assists !== undefined && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            {metric.stats.assists} AST
                          </span>
                        )}
                        {metric.stats.rebounds !== undefined && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
                            {metric.stats.rebounds} REB
                          </span>
                        )}
                      </div>
                    )}

                    {metric.readinessScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Mental Readiness:</span>
                        <ReadinessGaugeMini score={metric.readinessScore} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            GOALS & NOTES GRID
        ───────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals */}
          <section className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Goals
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {goals && goals.length > 0 ? (
                goals.slice(0, 10).map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      goal.status === 'COMPLETED' && 'bg-success/5 border-success/20',
                      goal.status === 'IN_PROGRESS' && 'bg-info/5 border-info/20',
                      goal.status === 'NOT_STARTED' && 'bg-muted border-border'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground">{goal.title}</h3>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          goal.status === 'COMPLETED' && 'bg-success/20 text-success',
                          goal.status === 'IN_PROGRESS' && 'bg-info/20 text-info',
                          goal.status === 'NOT_STARTED' && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{goal.type}</span>
                      <span>•</span>
                      <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No goals yet</p>
              )}
            </div>
          </section>

          {/* Coach Notes */}
          <section className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <StickyNote size={20} className="text-primary" />
              Coach Notes
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coachNotes && coachNotes.length > 0 ? (
                coachNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-info/10 text-info font-medium">
                        {note.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No notes yet</p>
              )}
            </div>
          </section>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CRISIS ALERTS
        ───────────────────────────────────────────────────────────────── */}
        {crisisAlerts && crisisAlerts.length > 0 && (
          <section className="p-6 rounded-lg bg-risk-critical/5 border border-risk-critical/20">
            <h2 className="text-lg font-semibold text-risk-critical mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Crisis Alerts
            </h2>
            <div className="space-y-3">
              {crisisAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-card border border-risk-critical/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <RiskBadge
                      level={alert.severity === 'HIGH' ? 'critical' : 'high'}
                      showIcon
                      variant="filled"
                      label={`${alert.severity} Severity`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {alert.reviewed ? (
                      <span className="text-success font-medium">Reviewed</span>
                    ) : (
                      <span className="text-risk-critical font-medium">Needs Review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────────────────── */}

      {/* Check-In Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Send Check-In</h3>
              <button
                onClick={() => setShowCheckIn(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              placeholder="Write your message to the athlete..."
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
              rows={5}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCheckIn(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendCheckIn}
                disabled={saving || !checkInMessage.trim()}
                className="flex-1"
              >
                {saving ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Coach Note</h3>
              <button
                onClick={() => setShowAddNote(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
            >
              <option value="GENERAL">General</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="MENTAL_HEALTH">Mental Health</option>
              <option value="CHECK_IN">Check-In</option>
              <option value="PROGRESS">Progress</option>
            </select>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note..."
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
              rows={5}
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowAddNote(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  sublabel: string;
  color: 'primary' | 'success' | 'warning' | 'info';
}

function StatCard({ icon: Icon, label, value, suffix, sublabel, color }: StatCardProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-info/10 text-info border-info/20',
  };

  return (
    <div className={cn('card-elevated p-4 border', colorStyles[color])}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={18} />
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <div className="text-3xl font-semibold">
        {value}
        {suffix && <span className="text-lg opacity-60">{suffix}</span>}
      </div>
      <div className="text-xs opacity-70 mt-1">{sublabel}</div>
    </div>
  );
}
