'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Target,
  Calendar,
  Filter,
  Copy,
  Check,
  ChevronRight,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';
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
import { Card, CardMetric, CardHeader, CardTitle, CardContent, AnimatedCounter, Sparkline } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { Skeleton, SkeletonCard, SkeletonStat } from '@/design-system/components/Skeleton';
import { cn } from '@/lib/utils';

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function EnhancedDashboard({ userId }: { userId: string }) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

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
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton width="300px" height="40px" className="mb-2" />
            <Skeleton width="200px" height="20px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Card variant="elevated" className="max-w-md text-center">
          <div className="p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-50 dark:bg-danger-900/20 mb-4">
              <AlertOctagon className="w-8 h-8 text-danger-600 dark:text-danger-400" />
            </div>
            <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-gray-100 mb-2">
              {error || 'No data available'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Unable to load dashboard metrics. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { overview, teamMood, atRiskAthletes, athleteReadiness } = dashboardData;
  const moodTrend = teamMood.avgMood >= 7 ? 'up' : teamMood.avgMood >= 5 ? 'neutral' : 'down';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display font-semibold text-3xl md:text-4xl text-gray-900 dark:text-gray-100 tracking-tight">
                Team Analytics
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-body">
                Monitor mental performance across your roster
              </p>
            </div>
            <Button
              onClick={() => setShowInviteCode(!showInviteCode)}
              variant={showInviteCode ? 'secondary' : 'outline'}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Team Invite Code
            </Button>
          </div>

          {/* Invite Code Card */}
          <AnimatePresence>
            {showInviteCode && inviteCodeData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="elevated" padding="lg" className="mb-6 border-primary-200 dark:border-primary-800">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100">
                          Team Access Code
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Share this code with athletes to join your team roster
                      </p>
                      <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-3 border border-gray-200 dark:border-gray-700">
                        <code className="font-mono font-bold text-2xl text-gray-900 dark:text-gray-100 tracking-wider">
                          {inviteCodeData.inviteCode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyInviteCode}
                          leftIcon={codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        >
                          {codeCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Sport:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{inviteCodeData.sport}</span>
                      </div>
                      <div>
                        <span className="font-medium">Athletes:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{inviteCodeData.athleteCount}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Sport Filter
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}>
              <Card variant="elevated" padding="md">
                <CardMetric
                  label="Total Athletes"
                  value={overview.totalAthletes}
                  icon={<Users className="w-4 h-4" />}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {overview.athletesWithConsent} with data sharing consent
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card variant="elevated" padding="md">
                <CardMetric
                  label="Avg Team Mood"
                  value={teamMood.avgMood.toFixed(1)}
                  trend={moodTrend}
                  trendValue={`${teamMood.totalLogs} logs`}
                  icon={<Activity className="w-4 h-4" />}
                />
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                variant="elevated"
                padding="md"
                className={cn(
                  overview.atRiskCount > 0 && 'border-warning-300 dark:border-warning-700'
                )}
              >
                <CardMetric
                  label="At-Risk Athletes"
                  value={overview.atRiskCount}
                  icon={<AlertTriangle className="w-4 h-4" />}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {overview.atRiskCount > 0 ? 'Requires attention' : 'All athletes stable'}
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                variant="elevated"
                padding="md"
                className={cn(
                  overview.crisisAlertsCount > 0 && 'border-danger-300 dark:border-danger-700'
                )}
              >
                <CardMetric
                  label="Crisis Alerts"
                  value={overview.crisisAlertsCount}
                  icon={<AlertOctagon className="w-4 h-4" />}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {overview.crisisAlertsCount > 0 ? 'Immediate action needed' : 'No active alerts'}
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Mood Trend Chart */}
          {chartData.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card variant="elevated" padding="none">
                <CardHeader className="px-6 pt-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <CardTitle>Performance Trends</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="h-80 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gray-200))" />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--gray-500))"
                          style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          stroke="hsl(var(--gray-500))"
                          style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Mood"
                          stroke="hsl(var(--primary-600))"
                          strokeWidth={2.5}
                          dot={{ fill: 'hsl(var(--primary-600))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Confidence"
                          stroke="hsl(var(--success-600))"
                          strokeWidth={2.5}
                          dot={{ fill: 'hsl(var(--success-600))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Stress"
                          stroke="hsl(var(--warning-600))"
                          strokeWidth={2.5}
                          dot={{ fill: 'hsl(var(--warning-600))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* At-Risk Athletes */}
          {atRiskAthletes.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card variant="elevated" padding="none">
                <CardHeader className="px-6 pt-6 border-b border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                      <CardTitle>Athletes Requiring Attention</CardTitle>
                    </div>
                    <Badge variant="warning" size="sm">
                      {atRiskAthletes.length} at-risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {atRiskAthletes.map((athlete, index) => (
                      <motion.div
                        key={athlete.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.05 }}
                      >
                        <Card
                          variant="flat"
                          padding="md"
                          interactive
                          className="group border-warning-200 dark:border-warning-800 hover:border-warning-400 dark:hover:border-warning-600"
                          onClick={() => router.push(`/coach/athletes/${athlete.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                                {athlete.name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {athlete.sport} • {athlete.year}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          {athlete.recentMood && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Mood</span>
                                <div className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                                  <AnimatedCounter value={athlete.recentMood.mood} decimals={0} suffix="/10" />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                                <div className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                                  <AnimatedCounter value={athlete.recentMood.confidence} decimals={0} suffix="/10" />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Stress</span>
                                <div className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                                  <AnimatedCounter value={athlete.recentMood.stress} decimals={0} suffix="/10" />
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Today's Readiness */}
          {athleteReadiness.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card variant="elevated" padding="none">
                <CardHeader className="px-6 pt-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <CardTitle>Today's Readiness</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {athleteReadiness.map((item, index) => {
                      const statusConfig = {
                        excellent: {
                          badge: 'success',
                          border: 'border-success-200 dark:border-success-800',
                          bg: 'bg-success-50 dark:bg-success-900/10'
                        },
                        good: {
                          badge: 'primary',
                          border: 'border-primary-200 dark:border-primary-800',
                          bg: 'bg-primary-50 dark:bg-primary-900/10'
                        },
                        fair: {
                          badge: 'warning',
                          border: 'border-warning-200 dark:border-warning-800',
                          bg: 'bg-warning-50 dark:bg-warning-900/10'
                        },
                        'at-risk': {
                          badge: 'danger',
                          border: 'border-danger-200 dark:border-danger-800',
                          bg: 'bg-danger-50 dark:bg-danger-900/10'
                        }
                      };

                      const config = statusConfig[item.status];

                      return (
                        <motion.div
                          key={item.athlete.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 + index * 0.04 }}
                        >
                          <Card
                            variant="flat"
                            padding="md"
                            interactive
                            className={cn('group', config.border, config.bg)}
                            onClick={() => router.push(`/coach/athletes/${item.athlete.id}`)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                                  {item.athlete.name}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.athlete.teamPosition}
                                </p>
                              </div>
                              <Badge variant={config.badge as any} size="sm">
                                <AnimatedCounter value={item.readiness} decimals={0} />
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                              {item.status.replace('-', ' ')}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
