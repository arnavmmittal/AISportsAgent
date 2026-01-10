'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { Card, AnimatedCounter, Sparkline, Badge } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';

interface DashboardStats {
  totalAthletes: number;
  athletesWithConsent: number;
  athletesWithoutConsent: number;
  teamAvgReadiness: number;
  readinessChange: number;
  atRiskCount: number;
  crisisAlertsCount: number;
  activeGoals: number;
  completedGoals: number;
}

interface AthleteSnapshot {
  id: string;
  name: string;
  sport: string;
  readiness: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  scores7d: number[];
  status: 'excellent' | 'good' | 'fair' | 'at-risk';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

interface InviteCodeData {
  inviteCode: string;
  coachName: string;
  sport: string;
  athleteCount: number;
}

export default function CoachDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [athletes, setAthletes] = useState<AthleteSnapshot[]>([]);
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashboardRes, inviteRes] = await Promise.all([
        fetch('/api/coach/dashboard'),
        fetch('/api/coach/invite-code'),
      ]);

      if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard');

      const dashboardData = await dashboardRes.json();
      setStats(dashboardData.stats);
      setAthletes(dashboardData.athletes || []);

      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        setInviteCodeData(inviteData.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCodeData?.inviteCode) {
      navigator.clipboard.writeText(inviteCodeData.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'team-overview',
      title: 'Team Overview',
      description: 'View live readiness heatmap',
      icon: <Users className="w-5 h-5" />,
      href: '/coach/team-overview',
      color: 'primary',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Deep dive into trends',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/coach/analytics',
      color: 'success',
    },
    {
      id: 'goals',
      title: 'Team Goals',
      description: 'Track progress & milestones',
      icon: <Target className="w-5 h-5" />,
      href: '/coach/goals',
      color: 'warning',
    },
    {
      id: 'calendar',
      title: 'Schedule',
      description: 'Events & check-ins',
      icon: <Calendar className="w-5 h-5" />,
      href: '/coach/schedule',
      color: 'danger',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <Card variant="elevated" padding="lg" className="text-center max-w-md">
          <AlertTriangle className="w-20 h-20 text-danger-600 dark:text-danger-400 mx-auto mb-6" />
          <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">Error Loading Data</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-body font-bold rounded-lg transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* DESKTOP: Command Center Layout */}
      <div className="hidden lg:block">
        <div className="p-8 space-y-8">
          {/* Header with Invite Code */}
          <motion.div initial="hidden" animate="show" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">Command Center</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Your team's mental performance at a glance</p>
              </div>
              <button
                onClick={() => setShowInviteCode(!showInviteCode)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-body font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Team Invite
              </button>
            </motion.div>

            {/* Invite Code Card */}
            {showInviteCode && inviteCodeData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                variants={fadeInUp}
                className="mb-8"
              >
                <Card variant="elevated" padding="lg" className="border-primary-200 dark:border-primary-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">Team Access Code</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-4">
                        Share this code with athletes to join your roster
                      </p>
                      <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-3 border border-gray-200 dark:border-gray-700">
                        <code className="font-mono font-bold text-2xl text-gray-900 dark:text-white tracking-wider">
                          {inviteCodeData.inviteCode}
                        </code>
                        <button
                          onClick={copyInviteCode}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {codeCopied ? <Check className="w-5 h-5 text-success-600" /> : <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sport</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{inviteCodeData.sport}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-3">Athletes</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{inviteCodeData.athleteCount}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Command Metrics Grid */}
            <motion.div variants={fadeInUp} className="grid grid-cols-4 gap-6">
              {/* Total Athletes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  <div className="text-right">
                    <div className="text-5xl font-display font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter value={stats.totalAthletes} decimals={0} />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Total Athletes</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {stats.athletesWithConsent} with consent
                </div>
              </div>

              {/* Team Readiness */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-10 h-10 text-success-600 dark:text-success-400" />
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-5xl font-display font-bold text-gray-900 dark:text-white">
                        <AnimatedCounter value={stats.teamAvgReadiness} decimals={0} />
                      </span>
                      <div className={`flex items-center text-lg font-bold ${stats.readinessChange >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                        {stats.readinessChange >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                        {Math.abs(stats.readinessChange)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Team Readiness</div>
              </div>

              {/* At Risk */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-10 h-10 text-warning-600 dark:text-warning-400" />
                  <div className="text-right">
                    <div className="text-5xl font-display font-bold text-warning-700 dark:text-warning-300">
                      <AnimatedCounter value={stats.atRiskCount} decimals={0} />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">At Risk</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {stats.atRiskCount > 0 ? 'Requires attention' : 'All stable'}
                </div>
              </div>

              {/* Active Goals */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  <div className="text-right">
                    <div className="text-5xl font-display font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter value={stats.activeGoals} decimals={0} />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Active Goals</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {stats.completedGoals} completed
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const colorClasses = {
                  primary: 'border-primary-200 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
                  success: 'border-success-200 dark:border-success-700 hover:border-success-400 dark:hover:border-success-500 hover:bg-success-50 dark:hover:bg-success-900/20',
                  warning: 'border-warning-200 dark:border-warning-700 hover:border-warning-400 dark:hover:border-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20',
                  danger: 'border-danger-200 dark:border-danger-700 hover:border-danger-400 dark:hover:border-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20',
                };

                const iconClasses = {
                  primary: 'text-primary-600 dark:text-primary-400',
                  success: 'text-success-600 dark:text-success-400',
                  warning: 'text-warning-600 dark:text-warning-400',
                  danger: 'text-danger-600 dark:text-danger-400',
                };

                return (
                  <motion.a
                    key={action.id}
                    href={action.href}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`block bg-white dark:bg-gray-800 rounded-xl p-6 border transition-all cursor-pointer ${colorClasses[action.color]}`}
                  >
                    <div className={`mb-4 ${iconClasses[action.color]}`}>
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-body">{action.description}</p>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Key Insights Grid */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">Team Status</h2>
            <div className="grid grid-cols-5 gap-4">
              {athletes.slice(0, 10).map((athlete) => (
                <motion.div
                  key={athlete.id}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all cursor-pointer">
                    {/* Readiness Badge */}
                    <div className="absolute -top-2 -right-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${
                          athlete.readiness >= 80
                            ? 'bg-success-600'
                            : athlete.readiness >= 60
                              ? 'bg-warning-600'
                              : 'bg-danger-600'
                        }`}
                      >
                        {athlete.readiness}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white mb-1 pr-6 truncate">
                      {athlete.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-body mb-3 truncate">{athlete.sport}</p>

                    {/* Sparkline */}
                    <div className="mb-2">
                      <Sparkline
                        data={athlete.scores7d}
                        height={30}
                        color={athlete.readiness >= 80 ? 'success' : athlete.readiness >= 60 ? 'warning' : 'danger'}
                        showDots={false}
                      />
                    </div>

                    {/* Trend */}
                    {athlete.trend === 'up' ? (
                      <Badge variant="success" className="gap-1 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        +{athlete.trendValue}
                      </Badge>
                    ) : athlete.trend === 'down' ? (
                      <Badge variant="danger" className="gap-1 text-xs">
                        <TrendingDown className="w-3 h-3" />
                        -{athlete.trendValue}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Stable</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* MOBILE: Priority-First Layout */}
      <div className="lg:hidden">
        <div className="p-6 space-y-6">
          {/* Mobile Header */}
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-base text-gray-600 dark:text-gray-400 font-body">Team performance overview</p>
          </div>

          {/* Priority Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">
                <AnimatedCounter value={stats.totalAthletes} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Athletes</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter value={stats.teamAvgReadiness} decimals={0} />
                </span>
                <div className={`text-xs font-bold ${stats.readinessChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {stats.readinessChange >= 0 ? '↑' : '↓'}{Math.abs(stats.readinessChange)}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Readiness</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-display font-bold text-warning-700 dark:text-warning-300 mb-1">
                <AnimatedCounter value={stats.atRiskCount} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">At Risk</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-display font-bold text-primary-700 dark:text-primary-300 mb-1">
                <AnimatedCounter value={stats.activeGoals} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Goals</div>
            </div>
          </div>

          {/* Quick Actions - Stacked */}
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const iconClasses = {
                  primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                  success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
                  warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
                  danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
                };

                return (
                  <a
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all"
                  >
                    <div className={`p-3 rounded-lg ${iconClasses[action.color]}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-display font-bold text-gray-900 dark:text-white">{action.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-body">{action.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Team Status - Stacked Cards */}
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">Team Status</h2>
            <div className="space-y-3">
              {athletes.slice(0, 5).map((athlete) => (
                <div key={athlete.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">{athlete.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">{athlete.sport}</p>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        athlete.readiness >= 80 ? 'bg-success-600' : athlete.readiness >= 60 ? 'bg-warning-600' : 'bg-danger-600'
                      }`}
                    >
                      {athlete.readiness}
                    </div>
                  </div>
                  <Sparkline data={athlete.scores7d} height={30} color={athlete.readiness >= 80 ? 'success' : 'warning'} showDots={false} />
                  <div className="flex items-center gap-2 mt-3">
                    {athlete.trend === 'up' ? (
                      <Badge variant="success" className="gap-1 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        +{athlete.trendValue}
                      </Badge>
                    ) : athlete.trend === 'down' ? (
                      <Badge variant="danger" className="gap-1 text-xs">
                        <TrendingDown className="w-3 h-3" />
                        -{athlete.trendValue}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Stable</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
