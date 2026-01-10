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
  Clock,
} from 'lucide-react';
import { Card, AnimatedCounter, RadialProgress, Sparkline, Badge } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';

interface TeamStats {
  totalAthletes: number;
  teamAvgReadiness: number;
  readinessChange: number;
  highRisk: number;
  criticalAlerts: number;
  decliningTrends: number;
}

interface AthleteReadiness {
  id: string;
  name: string;
  sport: string;
  currentReadiness: number;
  scores14d: number[];
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  forecast7d: number[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface Intervention {
  id: string;
  name: string;
  sport: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  readiness: number;
  reason: string;
  lastContact: string | null;
}

export default function CoachTeamOverviewPage() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [athletes, setAthletes] = useState<AthleteReadiness[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamOverview();
  }, []);

  const loadTeamOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/coach/team-overview');
      if (!response.ok) throw new Error('Failed to fetch team overview');

      const data = await response.json();
      setStats(data.stats);
      setAthletes(data.athletes || []);
      setInterventions(data.interventions || []);
    } catch (err) {
      console.error('Error loading team overview:', err);
      setError('Failed to load team overview');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card variant="elevated" padding="xl" className="text-center max-w-md">
          <AlertTriangle className="w-20 h-20 text-danger-600 dark:text-danger-400 mx-auto mb-6" />
          <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">Error Loading Data</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8">{error}</p>
          <button
            onClick={loadTeamOverview}
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
      {/* DESKTOP: Split-Screen Layout */}
      <div className="hidden lg:flex h-screen">
        {/* LEFT: Live Readiness Heatmap */}
        <div className="w-2/3 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Header */}
            <motion.div initial="hidden" animate="show" variants={staggerContainer}>
              <motion.div variants={fadeInUp}>
                <h1 className="text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">Team Overview</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Real-time mental readiness monitoring</p>
              </motion.div>

              {/* Quick Stats Bar */}
              <motion.div variants={fadeInUp} className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    <div className="text-right">
                      <div className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                        <AnimatedCounter value={stats.totalAthletes} decimals={0} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Athletes</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Activity className="w-8 h-8 text-success-600 dark:text-success-400" />
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                          <AnimatedCounter value={stats.teamAvgReadiness} decimals={0} />
                        </span>
                        <div className={`flex items-center text-sm font-bold ${stats.readinessChange >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                          {stats.readinessChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                          {Math.abs(stats.readinessChange)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Avg Readiness</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
                    <div className="text-right">
                      <div className="text-4xl font-display font-bold text-danger-700 dark:text-danger-300">
                        <AnimatedCounter value={stats.criticalAlerts} decimals={0} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Critical Alerts</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Readiness Heatmap Grid */}
            <motion.div variants={fadeInUp} className="space-y-4">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Team Readiness Heatmap</h2>
              <div className="grid grid-cols-4 gap-4">
                {athletes.map((athlete) => (
                  <motion.div
                    key={athlete.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="group relative"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all cursor-pointer">
                      {/* Readiness Indicator */}
                      <div className="absolute -top-2 -right-2">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                            athlete.currentReadiness >= 80
                              ? 'bg-success-600'
                              : athlete.currentReadiness >= 60
                                ? 'bg-warning-600'
                                : 'bg-danger-600'
                          }`}
                        >
                          {athlete.currentReadiness}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-1 pr-8 truncate">
                        {athlete.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-4">{athlete.sport}</p>

                      {/* Trend Sparkline */}
                      <div className="mb-3">
                        <Sparkline data={athlete.scores14d} height={40} width="100%" color={athlete.currentReadiness >= 80 ? 'success' : athlete.currentReadiness >= 60 ? 'warning' : 'danger'} showDots={false} />
                      </div>

                      {/* Trend Badge */}
                      <div className="flex items-center gap-2">
                        {athlete.trend === 'up' ? (
                          <Badge variant="success" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{athlete.trendValue}
                          </Badge>
                        ) : athlete.trend === 'down' ? (
                          <Badge variant="danger" className="gap-1">
                            <TrendingDown className="w-3 h-3" />
                            -{athlete.trendValue}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Stable</Badge>
                        )}

                        {athlete.riskLevel !== 'LOW' && (
                          <Badge variant={athlete.riskLevel === 'CRITICAL' ? 'danger' : athlete.riskLevel === 'HIGH' ? 'warning' : 'secondary'}>
                            {athlete.riskLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: Priority Intervention Queue */}
        <div className="w-1/3 bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 overflow-y-auto">
          <div className="p-8 space-y-6 sticky top-0">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Priority Queue</h2>
              <p className="text-base text-gray-600 dark:text-gray-400 font-body">Athletes requiring immediate attention</p>
            </div>

            {interventions.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400 font-body">No urgent interventions</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 font-body mt-2">All athletes are doing well!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((intervention, index) => (
                  <motion.div
                    key={intervention.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-xl p-6 border-l-4 cursor-pointer transition-all hover:scale-[1.02] ${
                      intervention.priority === 'critical'
                        ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-600 dark:border-danger-400'
                        : intervention.priority === 'high'
                          ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-600 dark:border-warning-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600'
                    }`}
                  >
                    {/* Priority Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant={
                          intervention.priority === 'critical'
                            ? 'danger'
                            : intervention.priority === 'high'
                              ? 'warning'
                              : 'secondary'
                        }
                        className="uppercase text-xs"
                      >
                        {intervention.priority}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                          {intervention.readiness}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-body">Readiness</div>
                      </div>
                    </div>

                    {/* Athlete Info */}
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">
                      {intervention.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-3">{intervention.sport}</p>

                    {/* Reason */}
                    <div className="flex items-start gap-2 mb-3">
                      <Target className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-body text-gray-700 dark:text-gray-300">{intervention.reason}</p>
                    </div>

                    {/* Last Contact */}
                    {intervention.lastContact && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 font-body">
                        <Clock className="w-3 h-3" />
                        Last contact: {new Date(intervention.lastContact).toLocaleDateString()}
                      </div>
                    )}

                    {/* Action Button */}
                    <button className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-body font-bold rounded-lg transition-colors text-sm">
                      Contact Athlete
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: Stacked Layout */}
      <div className="lg:hidden">
        <div className="p-6 space-y-6">
          {/* Mobile Header */}
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">Team Overview</h1>
            <p className="text-base text-gray-600 dark:text-gray-400 font-body">Mental readiness monitoring</p>
          </div>

          {/* Mobile Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                <AnimatedCounter value={stats.totalAthletes} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Athletes</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
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
              <div className="text-3xl font-display font-bold text-danger-700 dark:text-danger-300">
                <AnimatedCounter value={stats.highRisk} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">High Risk</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-display font-bold text-warning-700 dark:text-warning-300">
                <AnimatedCounter value={stats.decliningTrends} decimals={0} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Declining</div>
            </div>
          </div>

          {/* Priority Queue First on Mobile */}
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">Priority Queue</h2>
            <div className="space-y-3">
              {interventions.slice(0, 3).map((intervention) => (
                <div
                  key={intervention.id}
                  className={`rounded-xl p-5 border-l-4 ${
                    intervention.priority === 'critical'
                      ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-600'
                      : intervention.priority === 'high'
                        ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-600'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={intervention.priority === 'critical' ? 'danger' : intervention.priority === 'high' ? 'warning' : 'secondary'} className="text-xs">
                      {intervention.priority}
                    </Badge>
                    <div className="text-2xl font-display font-bold text-gray-900 dark:text-white">{intervention.readiness}</div>
                  </div>
                  <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">{intervention.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-2">{intervention.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Athlete List */}
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">All Athletes</h2>
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <div key={athlete.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">{athlete.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">{athlete.sport}</p>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        athlete.currentReadiness >= 80 ? 'bg-success-600' : athlete.currentReadiness >= 60 ? 'bg-warning-600' : 'bg-danger-600'
                      }`}
                    >
                      {athlete.currentReadiness}
                    </div>
                  </div>
                  <Sparkline data={athlete.scores14d} height={30} width="100%" color={athlete.currentReadiness >= 80 ? 'success' : 'warning'} showDots={false} />
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
