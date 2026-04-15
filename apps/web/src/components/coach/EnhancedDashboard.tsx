'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, Activity, Key, Copy,
  ChevronRight, Loader2, CheckCircle2, ChevronDown, Brain,
  AlertCircle, BarChart3, Zap, Shield, Target, Heart,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { AnimatedNumber } from '@/components/shared/ui/animated-number';
import { WeeklyPulseCard } from '@/components/coach/dashboard/WeeklyPulseCard';
import { AlertInsightCard } from '@/components/coach/insights/AlertInsightCard';
import { TrendInsightCard } from '@/components/coach/insights/TrendInsightCard';
import { InterventionTracker } from '@/components/coach/insights/InterventionTracker';
import { CorrelationScatter } from '@/components/shared/viz/CorrelationScatter';
import { TeamPulseHeatmap } from '@/components/shared/viz/TeamPulseHeatmap';
import { cn } from '@/lib/utils';

/**
 * EnhancedDashboard — "Obsidian" design
 *
 * SpotlightCards with animated numbers, no gradients.
 * Two-column: Athletes + Readiness | Quick Stats + Actions
 */

interface Nudge {
  type: 'engagement' | 'readiness' | 'crisis' | 'trend';
  priority: 'low' | 'medium' | 'high';
  message: string;
  athleteNames?: string[];
}

interface DashboardData {
  nudges?: Nudge[];
  overview: {
    totalAthletes: number;
    athletesWithConsent: number;
    athletesWithoutConsent: number;
    atRiskCount: number;
    crisisAlertsCount: number;
    timeRange: number;
  };
  teamMood: {
    avgMood: number;
    avgConfidence: number;
    avgStress: number;
    totalLogs: number;
  };
  moodTrend: Array<{
    date: string;
    avgMood: number;
    avgConfidence: number;
    avgStress: number;
    count: number;
  }>;
  crisisAlerts: any[];
  atRiskAthletes: Array<{
    id: string;
    name: string;
    sport: string;
    year: string;
    recentMood: {
      mood: number;
      confidence: number;
      stress: number;
    } | null;
  }>;
  athleteReadiness: Array<{
    athlete: {
      id: string;
      name: string;
      sport: string;
      teamPosition: string;
    };
    mood: number;
    confidence: number;
    stress: number;
    readiness: number;
    status: 'excellent' | 'good' | 'fair' | 'at-risk';
  }>;
}

interface InviteCodeData {
  inviteCode: string;
  coachName: string;
  sport: string;
  athleteCount: number;
}

// ─── Intelligence Section ────────────────────────────────────────
// Shows alerts, correlations, team heatmap ABOVE athlete list

function IntelligenceSection({
  athleteReadiness,
  atRiskAthletes,
  nudges,
  router,
}: {
  athleteReadiness: DashboardData['athleteReadiness'];
  atRiskAthletes: DashboardData['atRiskAthletes'];
  nudges?: Nudge[];
  router: ReturnType<typeof useRouter>;
}) {
  // Build alert cards from at-risk athletes
  const alerts = atRiskAthletes
    .filter(a => a.recentMood && a.recentMood.stress >= 7)
    .slice(0, 3)
    .map(a => ({
      name: a.name,
      metric: 'Stress',
      value: a.recentMood!.stress,
      recommendation: `${a.name}'s stress has been elevated. Consider a check-in conversation or workload adjustment.`,
      id: a.id,
    }));

  // Build trend cards from nudges
  const trends = (nudges || [])
    .filter(n => n.type === 'trend' || n.type === 'readiness')
    .slice(0, 3)
    .map((n, i) => ({
      headline: n.message,
      detail: n.athleteNames?.length
        ? `Affecting: ${n.athleteNames.join(', ')}`
        : 'Team-wide pattern detected',
      direction: (n.priority === 'high' ? 'down' : 'up') as 'up' | 'down',
      affectedCount: n.athleteNames?.length || 0,
    }));

  // Build scatterplot data from athlete readiness (mood vs readiness)
  const scatterPoints = athleteReadiness
    .filter(a => a.mood > 0 && a.readiness > 0)
    .map(a => ({
      x: a.mood,
      y: a.readiness,
      name: a.athlete.name,
      tier: (a.readiness >= 80 ? 'GREEN' : a.readiness >= 50 ? 'YELLOW' : 'RED') as 'GREEN' | 'YELLOW' | 'RED',
    }));

  // Compute Pearson correlation for mood vs readiness
  const correlation = (() => {
    if (scatterPoints.length < 3) return 0;
    const n = scatterPoints.length;
    const sumX = scatterPoints.reduce((s, p) => s + p.x, 0);
    const sumY = scatterPoints.reduce((s, p) => s + p.y, 0);
    const sumXY = scatterPoints.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = scatterPoints.reduce((s, p) => s + p.x * p.x, 0);
    const sumY2 = scatterPoints.reduce((s, p) => s + p.y * p.y, 0);
    const denom = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  })();

  // Build stress vs confidence scatter
  const stressConfPoints = athleteReadiness
    .filter(a => a.stress > 0 && a.confidence > 0)
    .map(a => ({
      x: a.stress,
      y: a.confidence,
      name: a.athlete.name,
      tier: (a.readiness >= 80 ? 'GREEN' : a.readiness >= 50 ? 'YELLOW' : 'RED') as 'GREEN' | 'YELLOW' | 'RED',
    }));

  const stressConfCorr = (() => {
    if (stressConfPoints.length < 3) return 0;
    const n = stressConfPoints.length;
    const sumX = stressConfPoints.reduce((s, p) => s + p.x, 0);
    const sumY = stressConfPoints.reduce((s, p) => s + p.y, 0);
    const sumXY = stressConfPoints.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = stressConfPoints.reduce((s, p) => s + p.x * p.x, 0);
    const sumY2 = stressConfPoints.reduce((s, p) => s + p.y * p.y, 0);
    const denom = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  })();

  // Build heatmap from readiness data (simplified — real version would fetch daily data)
  const heatmapAthletes = athleteReadiness.slice(0, 12).map(a => ({
    id: a.athlete.id,
    name: a.athlete.name,
    dailyScores: [{
      date: new Date().toISOString().split('T')[0]!,
      score: a.readiness,
      level: (a.readiness >= 80 ? 'GREEN' : a.readiness >= 50 ? 'YELLOW' : 'RED') as 'GREEN' | 'YELLOW' | 'RED',
    }],
    trend: [a.mood, a.confidence, 10 - a.stress, a.readiness].filter(v => v > 0),
  }));

  const hasAlerts = alerts.length > 0;
  const hasTrends = trends.length > 0;
  const hasScatter = scatterPoints.length >= 3;
  const hasHeatmap = heatmapAthletes.length > 0;

  if (!hasAlerts && !hasTrends && !hasScatter && !hasHeatmap) return null;

  return (
    <div className="space-y-4">
      {/* Alert Cards — highest priority, needs action today */}
      {hasAlerts && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Needs Attention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alert) => (
              <AlertInsightCard
                key={alert.id}
                athleteName={alert.name}
                metric={alert.metric}
                currentValue={`${alert.value}/10`}
                recommendation={alert.recommendation}
                onIntervene={() => router.push(`/coach/athletes/${alert.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Correlation Spotlight — top correlations as scatterplots */}
      {hasScatter && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Performance Correlations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CorrelationScatter
              xLabel="Mood"
              yLabel="Readiness"
              points={scatterPoints}
              correlation={correlation}
              insight={
                Math.abs(correlation) >= 0.5
                  ? `Mood and readiness show a ${correlation > 0 ? 'positive' : 'negative'} correlation (r=${correlation.toFixed(2)}). ${correlation > 0 ? 'Athletes with higher mood tend to have higher readiness scores.' : 'Higher mood associates with lower readiness — investigate.'}`
                  : undefined
              }
            />
            {stressConfPoints.length >= 3 && (
              <CorrelationScatter
                xLabel="Stress"
                yLabel="Confidence"
                points={stressConfPoints}
                correlation={stressConfCorr}
                insight={
                  Math.abs(stressConfCorr) >= 0.3
                    ? `Stress and confidence show ${stressConfCorr < 0 ? 'an inverse' : 'a positive'} relationship. ${stressConfCorr < 0 ? 'Higher stress correlates with lower confidence — stress management may boost performance.' : ''}`
                    : undefined
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Trend Cards — emerging patterns */}
      {hasTrends && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {trends.map((trend, i) => (
            <TrendInsightCard
              key={i}
              headline={trend.headline}
              detail={trend.detail}
              trend={[5, 6, 4, 5, 3, 4]} // Placeholder — real data would come from analytics API
              direction={trend.direction}
              affectedCount={trend.affectedCount}
            />
          ))}
        </div>
      )}

      {/* Team Pulse Heatmap */}
      {hasHeatmap && (
        <TeamPulseHeatmap
          athletes={heatmapAthletes}
          weeks={1}
          onAthleteClick={(id) => router.push(`/coach/athletes/${id}`)}
        />
      )}
    </div>
  );
}

// --- Helpers ---

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getReadinessColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 65) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getReadinessBarColor(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 65) return 'bg-primary';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'excellent': return { label: 'Excellent', cls: 'bg-success/15 text-success' };
    case 'good': return { label: 'Good', cls: 'bg-primary/15 text-primary' };
    case 'fair': return { label: 'Fair', cls: 'bg-warning/15 text-warning' };
    case 'at-risk': return { label: 'At Risk', cls: 'bg-destructive/15 text-destructive' };
    default: return { label: 'Unknown', cls: 'bg-muted text-muted-foreground' };
  }
}

const TIME_RANGES = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
];

export default function EnhancedDashboard({ userId }: { userId: string }) {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ timeRange });

        const [dashboardRes, inviteRes] = await Promise.all([
          fetch(`/api/coach/dashboard?${params}`),
          fetch('/api/coach/invite-code'),
        ]);

        if (!dashboardRes.ok || !inviteRes.ok) throw new Error('Failed to fetch data');

        const dashboardJson = await dashboardRes.json();
        const inviteJson = await inviteRes.json();

        setDashboardData(dashboardJson.data);
        setInviteCodeData(inviteJson.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const copyInviteCode = () => {
    if (inviteCodeData?.inviteCode) {
      navigator.clipboard.writeText(inviteCodeData.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const chartData = dashboardData?.moodTrend?.map((d) => {
    const date = new Date(d.date);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      Mood: d.avgMood,
      Confidence: d.avgConfidence,
      Stress: d.avgStress,
    };
  }) || [];

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your command center...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-border bg-card p-10 max-w-md text-center shadow-elevated">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">{error || 'No data available'}</h2>
          <p className="text-sm text-muted-foreground mb-4">There was a problem loading your dashboard.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { overview, teamMood, atRiskAthletes, athleteReadiness, nudges, crisisAlerts } = dashboardData;
  const sortedReadiness = [...athleteReadiness].sort((a, b) => a.readiness - b.readiness);

  // --- Empty State ---
  if (overview.totalAthletes === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-border bg-card p-12 max-w-lg text-center shadow-elevated">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Flow Coach</h2>
          <p className="text-muted-foreground mb-6">
            Share your invite code with athletes to get started. Once they join, you'll see their mental performance data here.
          </p>
          <Button onClick={() => setShowInviteCode(true)}>
            <Key className="w-4 h-4 mr-2" />
            View Invite Code
          </Button>
        </div>
      </div>
    );
  }

  // Calculate team averages for rings
  const avgReadiness = sortedReadiness.length > 0
    ? Math.round(sortedReadiness.reduce((s, a) => s + a.readiness, 0) / sortedReadiness.length)
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your team at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-muted/60 rounded-lg">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  timeRange === r.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInviteCode(!showInviteCode)}
          >
            <Key className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>

      {/* Invite Code (collapsible) */}
      {showInviteCode && inviteCodeData && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 animate-scale-in">
          <p className="text-sm text-muted-foreground mb-3">Share this code with your athletes to join your team</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border font-mono text-lg font-bold text-foreground tracking-widest">
              {inviteCodeData.inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              {copiedCode ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {inviteCodeData.sport} · {inviteCodeData.athleteCount} connected
          </p>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
         WEEKLY PULSE — Monday morning team briefing
         ═════════════════════════════════════════════════════════ */}
      <WeeklyPulseCard coachId={userId} teamId="default" />

      {/* ═════════════════════════════════════════════════════════
         INTELLIGENCE LAYER — Alerts, Correlations, Heatmap
         Coaches see actionable insights BEFORE athlete lists
         ═════════════════════════════════════════════════════════ */}
      <IntelligenceSection
        athleteReadiness={athleteReadiness}
        atRiskAthletes={atRiskAthletes}
        nudges={nudges}
        router={router}
      />

      {/* ═════════════════════════════════════════════════════════
         HERO STAT CARDS — SpotlightCard + AnimatedNumber
         ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Team Readiness */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Team Readiness</p>
              <AnimatedNumber
                value={avgReadiness}
                className={cn('text-5xl mt-1', avgReadiness >= 70 ? 'text-foreground' : 'text-destructive')}
              />
              <p className="text-muted-foreground text-xs mt-1">out of 100</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
        </SpotlightCard>

        {/* Total Athletes */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Athletes</p>
              <AnimatedNumber value={overview.totalAthletes} className="text-5xl mt-1 text-foreground" />
              <p className="text-muted-foreground text-xs mt-1">{overview.athletesWithConsent} active</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </SpotlightCard>

        {/* Team Mood */}
        <SpotlightCard className="p-6" spotlightColor="hsl(152 69% 38% / 0.08)">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Avg Mood</p>
              <AnimatedNumber value={teamMood.avgMood} decimals={1} className="text-5xl mt-1 text-foreground" />
              <p className="text-muted-foreground text-xs mt-1">of 10 · {teamMood.totalLogs} logs</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-accent" />
            </div>
          </div>
        </SpotlightCard>

        {/* At Risk / Alerts */}
        <SpotlightCard
          className={cn('p-6', (overview.atRiskCount > 0 || overview.crisisAlertsCount > 0) && 'border-destructive/30')}
          spotlightColor={overview.atRiskCount > 0 ? 'hsl(0 78% 62% / 0.08)' : 'hsl(24 95% 48% / 0.08)'}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Needs Attention</p>
              <AnimatedNumber
                value={overview.atRiskCount + overview.crisisAlertsCount}
                className={cn('text-5xl mt-1', overview.atRiskCount > 0 ? 'text-destructive' : 'text-foreground')}
              />
              <p className="text-muted-foreground text-xs mt-1">
                {overview.crisisAlertsCount > 0 ? `${overview.crisisAlertsCount} alert${overview.crisisAlertsCount !== 1 ? 's' : ''}` : 'all clear'}
              </p>
            </div>
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              overview.atRiskCount > 0 ? 'bg-destructive/10' : 'bg-success/10'
            )}>
              {overview.atRiskCount > 0
                ? <AlertTriangle className="w-6 h-6 text-destructive" />
                : <Shield className="w-6 h-6 text-success" />
              }
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* ═════════════════════════════════════════════════════════
         TWO-COLUMN LAYOUT: Main + Sidebar
         ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6 min-w-0">
          {/* MY ATHLETES */}
          <section className="animate-slide-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground">My Athletes</h2>
              <button
                onClick={() => router.push('/coach/athletes')}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
              >
                All Athletes
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedReadiness.slice(0, 6).map((item, idx) => {
                const badge = getStatusBadge(item.status);
                const isAtRisk = item.status === 'at-risk' || item.status === 'fair';

                return (
                  <div
                    key={item.athlete.id}
                    onClick={() => router.push(`/coach/athletes/${item.athlete.id}`)}
                    className={cn(
                      'group rounded-xl border bg-card p-5 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5',
                      isAtRisk && item.status === 'at-risk' && 'border-destructive/20 hover:border-destructive/40'
                    )}
                    style={{ animationDelay: `${(idx + 5) * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-105',
                        item.status === 'at-risk' ? 'bg-destructive/10 text-destructive'
                          : item.status === 'fair' ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                      )}>
                        {getInitials(item.athlete.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {item.athlete.name}
                          </h3>
                          <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold shrink-0', badge.cls)}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.athlete.sport}
                          {item.athlete.teamPosition ? ` · ${item.athlete.teamPosition}` : ''}
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-700', getReadinessBarColor(item.readiness))}
                              style={{ width: `${item.readiness}%` }}
                            />
                          </div>
                          <span className={cn('stat-value text-sm w-8 text-right', getReadinessColor(item.readiness))}>
                            {item.readiness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedReadiness.length > 6 && (
              <button
                onClick={() => router.push('/coach/athletes')}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                +{sortedReadiness.length - 6} more athletes
              </button>
            )}
          </section>

          {/* READINESS OVERVIEW */}
          <section className="animate-slide-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground">Readiness Overview</h2>
              <button
                onClick={() => router.push('/coach/readiness')}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
              >
                Full Readiness
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {sortedReadiness.slice(0, 8).map((item) => (
                  <div
                    key={item.athlete.id}
                    onClick={() => router.push(`/coach/athletes/${item.athlete.id}`)}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105',
                      item.status === 'at-risk' ? 'bg-destructive/10 text-destructive'
                        : item.status === 'fair' ? 'bg-warning/10 text-warning'
                        : item.status === 'good' ? 'bg-primary/10 text-primary'
                        : 'bg-success/10 text-success'
                    )}>
                      {getInitials(item.athlete.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.athlete.name}</p>
                      <p className="text-xs text-muted-foreground">{item.athlete.sport}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', getReadinessBarColor(item.readiness))}
                          style={{ width: `${item.readiness}%` }}
                        />
                      </div>
                      <span className={cn('stat-value text-sm w-8 text-right', getReadinessColor(item.readiness))}>
                        {item.readiness}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MOOD TRENDS — area chart, more visual */}
          {chartData.length > 0 && (
            <section className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Team Mood Trends</h2>
                  <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Area type="monotone" dataKey="Mood" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="hsl(var(--primary))" fillOpacity={0.08} dot={false} />
                      <Area type="monotone" dataKey="Confidence" stroke="hsl(var(--success))" strokeWidth={2} fill="hsl(var(--success))" fillOpacity={0.05} dot={false} />
                      <Line type="monotone" dataKey="Stress" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-primary" />Mood</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-success" />Confidence</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-destructive opacity-60" />Stress</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="space-y-5">
          {/* Confidence & Stress mini-cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <AnimatedNumber value={teamMood.avgConfidence} decimals={1} className="text-2xl text-foreground" />
              <p className="text-xs text-muted-foreground font-medium mt-1">Confidence</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <AnimatedNumber value={teamMood.avgStress} decimals={1} className="text-2xl text-warning" />
              <p className="text-xs text-muted-foreground font-medium mt-1">Stress</p>
            </div>
          </div>

          {/* Action Items */}
          <div className="rounded-xl border bg-card overflow-hidden animate-slide-up stagger-4">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm">Action Items</h3>
            </div>
            <div className="divide-y divide-border">
              {nudges && nudges.length > 0 ? (
                nudges.slice(0, 5).map((nudge, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <span className={cn(
                      'mt-1.5 w-2 h-2 rounded-full shrink-0',
                      nudge.priority === 'high' ? 'bg-destructive animate-pulse-subtle'
                        : nudge.priority === 'medium' ? 'bg-warning'
                        : 'bg-muted-foreground'
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-snug">{nudge.message}</p>
                      {nudge.athleteNames && nudge.athleteNames.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{nudge.athleteNames.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All clear</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Team is on track</p>
                </div>
              )}
            </div>
          </div>

          {/* Athletes Needing Attention */}
          {atRiskAthletes.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden animate-slide-up stagger-5">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <h3 className="font-bold text-foreground text-sm">Needs Attention</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
                  {atRiskAthletes.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {atRiskAthletes.slice(0, 4).map((athlete) => (
                  <div
                    key={athlete.id}
                    onClick={() => router.push(`/coach/athletes/${athlete.id}`)}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive shrink-0 transition-transform group-hover:scale-105">
                      {getInitials(athlete.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{athlete.name}</p>
                      <p className="text-xs text-muted-foreground">{athlete.sport} · {athlete.year}</p>
                    </div>
                    {athlete.recentMood && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-destructive font-semibold tabular-nums">Stress: {athlete.recentMood.stress}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">Mood: {athlete.recentMood.mood}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={() => router.push('/coach/athletes?filter=critical')}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
                >
                  View all at-risk athletes
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Crisis Alerts */}
          {crisisAlerts && crisisAlerts.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-destructive/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="font-bold text-foreground text-sm">Crisis Alerts</h3>
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
                  {crisisAlerts.length}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {crisisAlerts.length} unresolved alert{crisisAlerts.length !== 1 ? 's' : ''} requiring review
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => router.push('/coach/readiness?tab=alerts')}
                >
                  Review Alerts
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
