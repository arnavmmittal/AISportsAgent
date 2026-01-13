'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Users,
  Target,
  ChevronRight,
  Clock,
  Calendar,
  Bell,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

/**
 * Readiness Page (v2.1 Navigation Consolidation)
 *
 * Combines Team Readiness + Alerts into a unified view:
 * - Readiness tab: Team metrics, intervention queue, heatmap
 * - Alerts tab: Critical wellness alerts with severity levels
 *
 * This consolidation reduces coach portal from 8→6 primary tabs.
 */

interface ReadinessScore {
  athleteId: string;
  athleteName: string;
  sport: string;
  scores: number[];
  trend: 'improving' | 'declining' | 'stable';
  forecast: number[];
}

interface Intervention {
  athleteId: string;
  athleteName: string;
  priority: 1 | 2 | 3;
  readiness: number;
  reason: string;
  recommendation: string;
}

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

export default function ReadinessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'readiness' | 'alerts'>(
    (searchParams.get('tab') as 'readiness' | 'alerts') || 'readiness'
  );

  // Handle tab changes with URL sync
  const handleTabChange = (tab: 'readiness' | 'alerts') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'readiness') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/coach/readiness${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Alert count for badge
  const [alerts] = useState<Alert[]>([
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

  const activeAlertCount = alerts.filter(a => a.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Readiness
          </h1>
          <p className="text-muted-foreground mt-1">Team wellness monitoring and intervention management</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit animate-slide-up">
          <button
            onClick={() => handleTabChange('readiness')}
            className={cn(
              'px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2',
              activeTab === 'readiness'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="w-4 h-4" />
            Team Readiness
          </button>
          <button
            onClick={() => handleTabChange('alerts')}
            className={cn(
              'px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2',
              activeTab === 'alerts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bell className="w-4 h-4" />
            Alerts
            {activeAlertCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-risk-red text-white text-xs font-bold min-w-[20px] text-center">
                {activeAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'readiness' ? <ReadinessTab /> : <AlertsTab alerts={alerts} />}
      </div>
    </div>
  );
}

// ============================================
// READINESS TAB (original Readiness page content)
// ============================================
function ReadinessTab() {
  const [athletes] = useState<ReadinessScore[]>([
    {
      athleteId: '1',
      athleteName: 'Sarah Johnson',
      sport: 'Basketball',
      scores: [85, 87, 82, 88, 90, 89, 91, 88, 85, 82, 78, 75, 72, 70],
      trend: 'declining',
      forecast: [68, 65, 63, 62, 60, 58, 56],
    },
    {
      athleteId: '2',
      athleteName: 'Marcus Davis',
      sport: 'Football',
      scores: [72, 75, 78, 80, 82, 83, 85, 86, 87, 88, 89, 90, 91, 92],
      trend: 'improving',
      forecast: [93, 94, 95, 95, 96, 96, 97],
    },
    {
      athleteId: '3',
      athleteName: 'Alex Martinez',
      sport: 'Soccer',
      scores: [65, 64, 62, 60, 58, 55, 53, 50, 48, 45, 42, 40, 38, 35],
      trend: 'declining',
      forecast: [32, 30, 28, 25, 23, 20, 18],
    },
  ]);

  const [interventions] = useState<Intervention[]>([
    {
      athleteId: '3',
      athleteName: 'Alex Martinez',
      priority: 1,
      readiness: 35,
      reason: 'Readiness dropped 46% over 14 days (65→35). Forecast shows continued decline to 18.',
      recommendation: 'Immediate 1:1 check-in. Sleep avg 4.2hrs. Stress 9/10 for 7 days.',
    },
    {
      athleteId: '1',
      athleteName: 'Sarah Johnson',
      priority: 1,
      readiness: 70,
      reason: 'Star performer declining (-23% in 7 days). Historic r=0.82 correlation with PPG.',
      recommendation: 'Proactive intervention before performance drops. Check workload & finals stress.',
    },
  ]);

  const getReadinessColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-risk-green', text: 'text-risk-green', border: 'border-risk-green' };
    if (score >= 70) return { bg: 'bg-risk-yellow', text: 'text-risk-yellow', border: 'border-risk-yellow' };
    if (score >= 50) return { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' };
    return { bg: 'bg-risk-red', text: 'text-risk-red', border: 'border-risk-red' };
  };

  const teamAvg = Math.round(athletes.reduce((sum, a) => sum + a.scores[13], 0) / athletes.length);
  const highRisk = athletes.filter(a => a.scores[13] < 70).length;
  const declining = athletes.filter(a => a.trend === 'declining').length;

  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="card-elevated p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team Avg</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {teamAvg}<span className="text-lg text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">WHOOP for mental</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Risk</p>
              <p className={cn(
                "text-3xl font-bold mt-1",
                highRisk > 0 ? "text-risk-red" : "text-foreground"
              )}>
                {highRisk}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Need intervention</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              highRisk > 0 ? "bg-risk-red/10" : "bg-muted"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                highRisk > 0 ? "text-risk-red" : "text-muted-foreground"
              )} />
            </div>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Declining</p>
              <p className={cn(
                "text-3xl font-bold mt-1",
                declining > 0 ? "text-risk-yellow" : "text-foreground"
              )}>
                {declining}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Watch closely</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              declining > 0 ? "bg-risk-yellow/10" : "bg-muted"
            )}>
              <TrendingDown className={cn(
                "w-5 h-5",
                declining > 0 ? "text-risk-yellow" : "text-muted-foreground"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Queue */}
      <div className="card-elevated overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-risk-red/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-risk-red" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Intervention Queue</h2>
            <p className="text-sm text-muted-foreground">AI-prioritized based on forecasts</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {interventions.map((int, i) => {
            const colors = getReadinessColor(int.readiness);
            return (
              <div key={i} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold",
                    int.priority === 1 ? "bg-risk-red" : "bg-risk-yellow"
                  )}>
                    P{int.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{int.athleteName}</h3>
                      <span className={cn("font-bold", colors.text)}>
                        {int.readiness}/100
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-risk-red/5 border-l-4 border-risk-red mb-2">
                      <p className="text-sm text-risk-red font-medium">{int.reason}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-info/5 border-l-4 border-info">
                      <p className="text-sm text-info font-medium">{int.recommendation}</p>
                    </div>
                  </div>
                  <Link href={`/coach/athletes/${int.athleteId}`}>
                    <Button size="sm">
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="card-elevated overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">14-Day Readiness Heatmap</h2>
            <p className="text-sm text-muted-foreground">Mental performance trends + 7-day forecast</p>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 pr-4 font-semibold text-foreground">Athlete</th>
                {[...Array(14)].map((_, i) => (
                  <th key={i} className="text-center pb-3 px-1 text-xs font-medium text-muted-foreground">D{i-13}</th>
                ))}
                <th className="text-center pb-3 pl-4 font-semibold text-foreground">Trend</th>
                <th className="text-center pb-3 pl-4 font-semibold text-foreground">7-Day Forecast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {athletes.map((athlete) => {
                const getReadinessColor = (score: number) => {
                  if (score >= 85) return { bg: 'bg-risk-green', text: 'text-risk-green' };
                  if (score >= 70) return { bg: 'bg-risk-yellow', text: 'text-risk-yellow' };
                  if (score >= 50) return { bg: 'bg-warning', text: 'text-warning' };
                  return { bg: 'bg-risk-red', text: 'text-risk-red' };
                };

                return (
                  <tr key={athlete.athleteId} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground">{athlete.athleteName}</div>
                      <div className="text-xs text-muted-foreground">{athlete.sport}</div>
                    </td>
                    {athlete.scores.map((score, idx) => {
                      const colors = getReadinessColor(score);
                      return (
                        <td key={idx} className="py-3 px-1">
                          <div className={cn(
                            "w-10 h-10 rounded-lg text-white font-medium text-xs flex items-center justify-center",
                            colors.bg
                          )}>
                            {score}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 pl-4 text-center">
                      {athlete.trend === 'improving' && (
                        <div className="flex items-center justify-center gap-1 text-risk-green font-medium text-sm">
                          <TrendingUp className="w-4 h-4" />Up
                        </div>
                      )}
                      {athlete.trend === 'declining' && (
                        <div className="flex items-center justify-center gap-1 text-risk-red font-medium text-sm">
                          <TrendingDown className="w-4 h-4" />Down
                        </div>
                      )}
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1 justify-center">
                        {athlete.forecast.map((score, idx) => {
                          const colors = getReadinessColor(score);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "w-7 h-7 rounded text-white font-medium text-xs flex items-center justify-center opacity-75",
                                colors.bg
                              )}
                            >
                              {score}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================
// ALERTS TAB (from Alerts page)
// ============================================
function AlertsTab({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'resolved'>('all');
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

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
    <>
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
    </>
  );
}
