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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, Activity, Key, Copy, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

/**
 * EnhancedDashboard - Updated with Design System v2.0
 *
 * Features:
 * - Overview stats with semantic color tokens
 * - Mood trend chart
 * - At-risk athlete cards
 * - Today's readiness scores
 * - Team invite code management
 */

interface DashboardData {
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

export default function EnhancedDashboard({ userId }: { userId: string }) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ timeRange });
        if (sportFilter) params.append('sport', sportFilter);

        const [dashboardRes, inviteRes] = await Promise.all([
          fetch(`/api/coach/dashboard?${params}`),
          fetch('/api/coach/invite-code'),
        ]);

        if (!dashboardRes.ok || !inviteRes.ok) {
          throw new Error('Failed to fetch data');
        }

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
  }, [timeRange, sportFilter]);

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (inviteCodeData?.inviteCode) {
      navigator.clipboard.writeText(inviteCodeData.inviteCode);
    }
  };

  // Prepare chart data
  const chartData = dashboardData?.moodTrend?.map((d) => {
    const date = new Date(d.date);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      Mood: d.avgMood,
      Confidence: d.avgConfidence,
      Stress: d.avgStress,
    };
  }) || [];

  // Get status color based on readiness
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'excellent':
        return {
          border: 'border-risk-green/30',
          bg: 'bg-risk-green/5',
          badge: 'bg-risk-green/20 text-risk-green',
          text: 'text-risk-green',
        };
      case 'good':
        return {
          border: 'border-info/30',
          bg: 'bg-info/5',
          badge: 'bg-info/20 text-info',
          text: 'text-info',
        };
      case 'fair':
        return {
          border: 'border-risk-yellow/30',
          bg: 'bg-risk-yellow/5',
          badge: 'bg-risk-yellow/20 text-risk-yellow',
          text: 'text-risk-yellow',
        };
      case 'at-risk':
        return {
          border: 'border-risk-red/30',
          bg: 'bg-risk-red/5',
          badge: 'bg-risk-red/20 text-risk-red',
          text: 'text-risk-red',
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-muted/50',
          badge: 'bg-muted text-muted-foreground',
          text: 'text-muted-foreground',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="card-elevated p-12 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-risk-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || 'No data available'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            There was a problem loading your dashboard data.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { overview, teamMood, atRiskAthletes, athleteReadiness } = dashboardData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Coach Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">
                Monitor your team's mental performance
              </p>
            </div>
            <Button
              onClick={() => setShowInviteCode(!showInviteCode)}
              variant={showInviteCode ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              My Invite Code
            </Button>
          </div>

          {/* Invite Code Card */}
          {showInviteCode && inviteCodeData && (
            <div className="mt-6 card-elevated p-6 border-primary/20 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Your Team Invite Code</h3>
                  <p className="text-sm text-muted-foreground">Share this code with your athletes</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <code className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border font-mono text-xl font-bold text-foreground tracking-wider">
                  {inviteCodeData.inviteCode}
                </code>
                <Button variant="outline" onClick={copyInviteCode} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span>Sport: <strong className="text-foreground">{inviteCodeData.sport}</strong></span>
                <span>Connected: <strong className="text-foreground">{inviteCodeData.athleteCount} athletes</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Filters */}
        <div className="card-elevated p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Sport Filter
            </label>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="">All Sports</option>
              <option value="Basketball">Basketball</option>
              <option value="Football">Football</option>
              <option value="Soccer">Soccer</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Baseball">Baseball</option>
              <option value="Track">Track & Field</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Athletes */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Athletes</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overview.totalAthletes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.athletesWithConsent} with consent
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Avg Team Mood */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Team Mood</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {teamMood.avgMood.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {teamMood.totalLogs} logs
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-risk-green/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-risk-green" />
              </div>
            </div>
          </div>

          {/* At-Risk Athletes */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">At-Risk Athletes</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  overview.atRiskCount > 0 ? "text-risk-yellow" : "text-foreground"
                )}>
                  {overview.atRiskCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-risk-yellow/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-risk-yellow" />
              </div>
            </div>
          </div>

          {/* Crisis Alerts */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crisis Alerts</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  overview.crisisAlertsCount > 0 ? "text-risk-red" : "text-foreground"
                )}>
                  {overview.crisisAlertsCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Unresolved</p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                overview.crisisAlertsCount > 0 ? "bg-risk-red/10" : "bg-muted"
              )}>
                <Activity className={cn(
                  "w-5 h-5",
                  overview.crisisAlertsCount > 0 ? "text-risk-red" : "text-muted-foreground"
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Team Mental Performance Trends
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} className="text-muted-foreground" tick={{ fontSize: 12 }} />
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
                    dataKey="Mood"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Confidence"
                    stroke="hsl(var(--risk-green))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--risk-green))', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress"
                    stroke="hsl(var(--risk-red))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--risk-red))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* At-Risk Athletes */}
        {atRiskAthletes.length > 0 && (
          <div className="card-elevated p-6 border-risk-yellow/20">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-risk-yellow" />
              At-Risk Athletes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atRiskAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="card-interactive p-4 border-risk-red/20"
                  onClick={() => router.push(`/coach/athletes/${athlete.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{athlete.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {athlete.sport} • {athlete.year}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-risk-red/10 text-risk-red text-xs font-medium">
                      At Risk
                    </span>
                  </div>
                  {athlete.recentMood && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Mood</span>
                        <span className="font-medium text-foreground">{athlete.recentMood.mood}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium text-foreground">{athlete.recentMood.confidence}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Stress</span>
                        <span className="font-medium text-risk-red">{athlete.recentMood.stress}/10</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/coach/athletes/${athlete.id}`);
                      }}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-risk-red hover:bg-risk-red/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/coach/athletes/${athlete.id}`);
                      }}
                    >
                      Check-In
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Readiness */}
        {athleteReadiness.length > 0 && (
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Today's Readiness Scores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {athleteReadiness.map((item) => {
                const styles = getStatusStyles(item.status);
                return (
                  <div
                    key={item.athlete.id}
                    onClick={() => router.push(`/coach/athletes/${item.athlete.id}`)}
                    className={cn(
                      "card-interactive p-4",
                      styles.border,
                      styles.bg
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.athlete.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.athlete.teamPosition}</p>
                      </div>
                      <span className={cn("text-2xl font-bold", styles.text)}>
                        {item.readiness}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs uppercase font-medium px-2 py-1 rounded inline-block",
                      styles.badge
                    )}>
                      {item.status.replace('-', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground float-right mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {overview.totalAthletes === 0 && (
          <div className="card-elevated p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Welcome to Your Coach Dashboard!
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by sharing your invite code with athletes. Once they join and grant consent,
              you'll see their mental performance metrics right here.
            </p>
            <Button onClick={() => setShowInviteCode(true)}>
              <Key className="w-4 h-4 mr-2" />
              View Invite Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
