'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Calendar, Bell, AlertCircle, ChevronRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Coach Alerts Page - Updated with Design System v2.0
 *
 * Features:
 * - Critical wellness alerts with severity levels
 * - Filter by severity and status
 * - Quick actions for immediate response
 * - Uses semantic risk colors
 */

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

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      athleteId: 'alex-martinez',
      athleteName: 'Alex Martinez',
      severity: 'critical',
      type: 'Crisis Keywords',
      reason: 'Chat message contained self-harm language',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '2',
      athleteId: 'jordan-lee',
      athleteName: 'Jordan Lee',
      severity: 'high',
      type: 'Wellness Decline',
      reason: 'Mood score dropped 3+ points in last 3 days (8.5 → 5.0)',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'monitoring',
    },
    {
      id: '3',
      athleteId: 'morgan-davis',
      athleteName: 'Morgan Davis',
      severity: 'high',
      type: 'Stress Level',
      reason: 'Reported stress 9/10 for 4 consecutive days',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '4',
      athleteId: 'taylor-brown',
      athleteName: 'Taylor Brown',
      severity: 'medium',
      type: 'Sleep Deprivation',
      reason: 'Average 4.2 hours sleep over last week (recommended: 7-9)',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '5',
      athleteId: 'casey-wilson',
      athleteName: 'Casey Wilson',
      severity: 'medium',
      type: 'Check-in Missed',
      reason: 'No check-ins for 7 days (previously consistent)',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  ]);

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          card: 'bg-risk-red-bg border-l-risk-red',
          icon: 'text-risk-red',
          badge: 'bg-risk-red text-white',
        };
      case 'high':
        return {
          card: 'bg-warning/5 border-l-warning',
          icon: 'text-warning',
          badge: 'bg-warning text-white',
        };
      case 'medium':
        return {
          card: 'bg-risk-yellow-bg border-l-risk-yellow',
          icon: 'text-risk-yellow',
          badge: 'bg-risk-yellow text-white',
        };
      default:
        return {
          card: 'bg-muted/50 border-l-border',
          icon: 'text-muted-foreground',
          badge: 'bg-muted text-muted-foreground',
        };
    }
  };

  const getStatusStyles = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return 'bg-risk-red/10 text-risk-red';
      case 'monitoring':
        return 'bg-warning/10 text-warning';
      case 'resolved':
        return 'bg-risk-green/10 text-risk-green';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleMarkResolved = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
    ));
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Monitor critical wellness concerns and take action</p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-risk-red/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-risk-red" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Critical</p>
                <p className="text-2xl font-bold text-risk-red">{criticalCount}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">High</p>
                <p className="text-2xl font-bold text-warning">{highCount}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-risk-yellow/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-risk-yellow" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Medium</p>
                <p className="text-2xl font-bold text-risk-yellow">{mediumCount}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-risk-green/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-risk-green" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Resolved</p>
                <p className="text-2xl font-bold text-risk-green">{resolvedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card-elevated overflow-hidden animate-slide-up">
          <div className="flex items-center gap-2 p-4 border-b border-border overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              All Active ({activeAlerts.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'critical'
                  ? 'bg-risk-red text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'high'
                  ? 'bg-warning text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              High ({highCount})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'medium'
                  ? 'bg-risk-yellow text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Medium ({mediumCount})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'resolved'
                  ? 'bg-risk-green text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Resolved
            </button>
          </div>

          {/* Alerts List */}
          <div className="p-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No alerts found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'resolved'
                    ? 'No resolved alerts to display'
                    : 'All athletes are doing well!'
                  }
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const styles = getSeverityStyles(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-lg border-l-4 p-4 transition-shadow hover:shadow-md',
                      styles.card
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <AlertTriangle className={cn('w-5 h-5', styles.icon)} />
                          <Link
                            href={`/coach/athletes/${alert.athleteId}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {alert.athleteName}
                          </Link>
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles.badge)}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            {alert.type}
                          </span>
                        </div>

                        <p className="text-sm text-foreground mb-3 ml-8">{alert.reason}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{getTimeAgo(alert.timestamp)}</span>
                          </div>
                          <span className={cn('px-2 py-0.5 rounded capitalize', getStatusStyles(alert.status))}>
                            {alert.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {alert.status !== 'resolved' && (
                          <>
                            <Link
                              href={`/coach/athletes/${alert.athleteId}`}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm text-center whitespace-nowrap flex items-center gap-1"
                            >
                              View
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleMarkResolved(alert.id)}
                              className="px-3 py-1.5 bg-risk-green text-white rounded-lg hover:bg-risk-green/90 transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Help */}
        <div className="p-4 rounded-lg bg-info/5 border border-info/10 animate-slide-up">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-info" />
            Alert Response Guidelines
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><span className="font-medium text-risk-red">Critical:</span> Immediate action required - contact athlete within 1 hour</li>
            <li><span className="font-medium text-warning">High:</span> Address within 24 hours - schedule a check-in</li>
            <li><span className="font-medium text-risk-yellow">Medium:</span> Monitor closely - review at next opportunity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
