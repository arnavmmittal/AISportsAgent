'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { AnimatedCounter } from '@/design-system/components';

type AlertSeverity = 'critical' | 'high' | 'medium';

interface Alert {
  id: string;
  athleteId: string;
  athleteName: string;
  severity: AlertSeverity;
  type: string;
  reason: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'monitoring';
  assignedTo?: string;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'resolved'>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/coach/alerts');
        if (!response.ok) throw new Error('Failed to fetch alerts');

        const data = await response.json();
        setAlerts(data.alerts || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger-50 dark:bg-danger-900/20 border-danger-600 dark:border-danger-500';
      case 'high':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-600 dark:border-warning-500';
      case 'medium':
        return 'bg-info-50 dark:bg-info-900/20 border-info-600 dark:border-info-500';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-600 dark:border-gray-700';
    }
  };

  const getSeverityBadgeColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger-600 dark:bg-danger-500 text-white';
      case 'high':
        return 'bg-warning-600 dark:bg-warning-500 text-white';
      case 'medium':
        return 'bg-info-600 dark:bg-info-500 text-white';
      default:
        return 'bg-gray-500 dark:bg-gray-600 text-white';
    }
  };

  const getSeverityIconColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-danger-600 dark:text-danger-400';
      case 'high':
        return 'text-warning-600 dark:text-warning-400';
      case 'medium':
        return 'text-info-600 dark:text-info-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleMarkResolved = async (alertId: string) => {
    try {
      const response = await fetch(`/api/coach/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resolve alert');

      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      ));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return alert.status !== 'resolved';
    if (filter === 'resolved') return alert.status === 'resolved';
    return alert.severity === filter && alert.status !== 'resolved';
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;
  const mediumCount = activeAlerts.filter(a => a.severity === 'medium').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-body">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md text-center border-danger-200 dark:border-danger-800">
          <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 font-body mb-6">Please try again later</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Alerts
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">Monitor critical wellness concerns and take action</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card variant="elevated" padding="lg" hover className="border-danger-200 dark:border-danger-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-danger-600 dark:text-danger-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Critical</div>
                <div className="text-5xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">
                  <AnimatedCounter value={criticalCount} decimals={0} />
                </div>
                <div className="text-sm text-danger-600 dark:text-danger-400 font-medium font-body">Immediate action</div>
              </div>
              <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-warning-200 dark:border-warning-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-warning-600 dark:text-warning-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">High Priority</div>
                <div className="text-5xl font-display font-bold text-warning-700 dark:text-warning-300 mb-2">
                  <AnimatedCounter value={highCount} decimals={0} />
                </div>
                <div className="text-sm text-warning-600 dark:text-warning-400 font-medium font-body">24 hours</div>
              </div>
              <AlertTriangle className="w-16 h-16 text-warning-600 dark:text-warning-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-info-200 dark:border-info-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-info-600 dark:text-info-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Medium Priority</div>
                <div className="text-5xl font-display font-bold text-info-700 dark:text-info-300 mb-2">
                  <AnimatedCounter value={mediumCount} decimals={0} />
                </div>
                <div className="text-sm text-info-600 dark:text-info-400 font-medium font-body">Monitor closely</div>
              </div>
              <Clock className="w-16 h-16 text-info-600 dark:text-info-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-success-200 dark:border-success-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-success-600 dark:text-success-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Resolved</div>
                <div className="text-5xl font-display font-bold text-success-700 dark:text-success-300 mb-2">
                  <AnimatedCounter value={resolvedCount} decimals={0} />
                </div>
                <div className="text-sm text-success-600 dark:text-success-400 font-medium font-body">Last 30 days</div>
              </div>
              <CheckCircle2 className="w-16 h-16 text-success-600 dark:text-success-400 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card variant="elevated" padding="none" className="mb-8">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="md"
              onClick={() => setFilter('all')}
            >
              All Active ({activeAlerts.length})
            </Button>
            <Button
              variant={filter === 'critical' ? 'danger' : 'outline'}
              size="md"
              onClick={() => setFilter('critical')}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Critical ({criticalCount})
            </Button>
            <Button
              variant={filter === 'high' ? 'warning' : 'outline'}
              size="md"
              onClick={() => setFilter('high')}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              High ({highCount})
            </Button>
            <Button
              variant={filter === 'medium' ? 'secondary' : 'outline'}
              size="md"
              onClick={() => setFilter('medium')}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Medium ({mediumCount})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'success' : 'outline'}
              size="md"
              onClick={() => setFilter('resolved')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Resolved
            </Button>
          </div>

          {/* Alerts List */}
          <div className="p-6 space-y-6">
            {filteredAlerts.length === 0 ? (
              <div className="p-16 text-center">
                <CheckCircle2 className="w-20 h-20 text-success-600 dark:text-success-400 mx-auto mb-6" />
                <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-3">No alerts found</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-body">
                  {filter === 'resolved'
                    ? 'No resolved alerts to display'
                    : 'All athletes are doing well!'
                  }
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border-l-4 p-6 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-6 h-6 ${getSeverityIconColor(alert.severity)}`} />
                          <Link
                            href={`/coach/athletes/${alert.athleteId}`}
                            className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {alert.athleteName}
                          </Link>
                        </div>
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold font-mono ${getSeverityBadgeColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-body">
                          {alert.type}
                        </span>
                      </div>

                      <p className="text-base text-gray-900 dark:text-gray-100 font-semibold mb-4 ml-9 leading-relaxed font-body">{alert.reason}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 ml-9">
                        <div className="flex items-center gap-2 font-body">
                          <Calendar className="w-4 h-4" />
                          <span>{getTimeAgo(alert.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 font-body">
                          <span className={`w-3 h-3 rounded-full ${
                            alert.status === 'active' ? 'bg-danger-600' :
                            alert.status === 'monitoring' ? 'bg-warning-600' :
                            'bg-success-600'
                          }`} />
                          <span className="capitalize">{alert.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {alert.status !== 'resolved' && (
                        <>
                          <Link href={`/coach/athletes/${alert.athleteId}`}>
                            <Button variant="primary" size="md">
                              View Profile
                            </Button>
                          </Link>
                          <Button
                            variant="success"
                            size="md"
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleMarkResolved(alert.id)}
                          >
                            Mark Resolved
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
