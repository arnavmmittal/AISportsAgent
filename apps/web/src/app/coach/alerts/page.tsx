'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Loader2,
  Shield,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { Card, AnimatedCounter, Badge, Button } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { toast } from 'sonner';

type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Alert {
  id: string;
  athleteId: string;
  athleteName: string;
  sport: string;
  severity: AlertSeverity;
  message: string;
  detectedAt: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  escalated: boolean;
  notes?: string;
}

export default function CoachAlertsPage() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'reviewed'>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
      setStats(data.stats || { critical: 0, high: 0, medium: 0, total: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (alertId: string, notes: string = '') => {
    try {
      const response = await fetch(`/api/coach/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      toast.success('Alert resolved successfully');
      setSelectedAlert(null);
      loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast.error('Failed to resolve alert');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return !alert.reviewed;
    if (filter === 'critical') return alert.severity === 'CRITICAL' && !alert.reviewed;
    if (filter === 'high') return alert.severity === 'HIGH' && !alert.reviewed;
    if (filter === 'reviewed') return alert.reviewed;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card variant="elevated" padding="lg" className="text-center max-w-md">
          <AlertTriangle className="w-20 h-20 text-danger-600 dark:text-danger-400 mx-auto mb-6" />
          <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">Error Loading Alerts</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8">{error}</p>
          <Button onClick={loadAlerts} variant="primary" size="lg">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* DESKTOP: Timeline Feed */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Header */}
          <motion.div initial="hidden" animate="show" variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <h1 className="text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">Crisis Alerts</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-body">Real-time mental health monitoring</p>
            </motion.div>

            {/* Stats Bar */}
            <motion.div variants={fadeInUp} className="mt-8 grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-display font-bold text-danger-700 dark:text-danger-300 mb-1">
                  <AnimatedCounter value={stats.critical} decimals={0} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Critical</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-display font-bold text-warning-700 dark:text-warning-300 mb-1">
                  <AnimatedCounter value={stats.high} decimals={0} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">High</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-display font-bold text-info-700 dark:text-info-300 mb-1">
                  <AnimatedCounter value={stats.medium} decimals={0} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Medium</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-1">
                  <AnimatedCounter value={stats.total} decimals={0} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Total</div>
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div variants={fadeInUp} className="mt-6 flex gap-2">
              {[
                { key: 'all', label: 'Active', count: stats.critical + stats.high + stats.medium },
                { key: 'critical', label: 'Critical', count: stats.critical },
                { key: 'high', label: 'High', count: stats.high },
                { key: 'reviewed', label: 'Resolved', count: 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-6 py-3 rounded-lg font-body font-semibold transition-all ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Timeline Feed */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card variant="elevated" padding="lg" className="text-center">
                    <Shield className="w-24 h-24 text-success-600 dark:text-success-400 mx-auto mb-6" />
                    <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                      {filter === 'reviewed' ? 'No resolved alerts yet' : 'All clear!'}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-body">
                      {filter === 'reviewed' ? 'Resolved alerts will appear here' : 'No active crisis alerts to review'}
                    </p>
                  </Card>
                </motion.div>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <div
                      onClick={() => setSelectedAlert(alert)}
                      className={`rounded-xl p-6 border-l-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-600'
                          : alert.severity === 'HIGH'
                            ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-600'
                            : 'bg-info-50 dark:bg-info-900/20 border-info-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-6">
                        {/* Left: Alert Icon */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              alert.severity === 'CRITICAL'
                                ? 'bg-danger-600'
                                : alert.severity === 'HIGH'
                                  ? 'bg-warning-600'
                                  : 'bg-info-600'
                            }`}
                          >
                            <AlertTriangle className="w-8 h-8 text-white" />
                          </div>
                        </div>

                        {/* Middle: Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant={
                                alert.severity === 'CRITICAL'
                                  ? 'danger'
                                  : alert.severity === 'HIGH'
                                    ? 'warning'
                                    : 'secondary'
                              }
                              className="uppercase text-xs"
                            >
                              {alert.severity}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-body">
                              <Clock className="w-4 h-4" />
                              {getTimeAgo(alert.detectedAt)}
                            </div>
                          </div>

                          <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">
                            {alert.athleteName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-3">{alert.sport}</p>

                          <p className="text-base text-gray-800 dark:text-gray-200 font-body leading-relaxed line-clamp-2">
                            {alert.message}
                          </p>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                            }}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Review
                          </Button>
                          {!alert.reviewed && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(alert.id);
                              }}
                              variant="success"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MOBILE: Stacked Cards */}
      <div className="lg:hidden p-6 space-y-6">
        {/* Mobile Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">Crisis Alerts</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 font-body">Real-time monitoring</p>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-display font-bold text-danger-700 dark:text-danger-300">
              <AnimatedCounter value={stats.critical} decimals={0} />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">Critical</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-display font-bold text-warning-700 dark:text-warning-300">
              <AnimatedCounter value={stats.high} decimals={0} />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider">High</div>
          </div>
        </div>

        {/* Mobile Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'critical', 'high', 'reviewed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-lg font-body font-semibold whitespace-nowrap transition-all ${
                filter === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Mobile Alert Cards */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card variant="elevated" padding="lg" className="text-center">
              <Shield className="w-16 h-16 text-success-600 dark:text-success-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400 font-body">All clear!</p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`rounded-xl p-5 border-l-4 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-600'
                    : alert.severity === 'HIGH'
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-600'
                      : 'bg-info-50 dark:bg-info-900/20 border-info-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'HIGH' ? 'warning' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-body">{getTimeAgo(alert.detectedAt)}</div>
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-1">{alert.athleteName}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-body line-clamp-2">{alert.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge
                    variant={
                      selectedAlert.severity === 'CRITICAL'
                        ? 'danger'
                        : selectedAlert.severity === 'HIGH'
                          ? 'warning'
                          : 'secondary'
                    }
                    className="mb-3"
                  >
                    {selectedAlert.severity} ALERT
                  </Badge>
                  <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">
                    {selectedAlert.athleteName}
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">{selectedAlert.sport}</p>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-body font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Detected Message
                  </h3>
                  <p className="text-base text-gray-900 dark:text-white font-body leading-relaxed">
                    {selectedAlert.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-body font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Detected
                    </h3>
                    <p className="text-base text-gray-900 dark:text-white font-body">
                      {new Date(selectedAlert.detectedAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedAlert.reviewed && (
                    <div>
                      <h3 className="text-sm font-body font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Resolved
                      </h3>
                      <p className="text-base text-gray-900 dark:text-white font-body">
                        {selectedAlert.reviewedAt
                          ? new Date(selectedAlert.reviewedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                {!selectedAlert.reviewed && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => setSelectedAlert(null)}
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => handleResolve(selectedAlert.id)}
                      variant="primary"
                      size="lg"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Mark Resolved
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
