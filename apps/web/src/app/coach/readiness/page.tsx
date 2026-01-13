'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Target,
  ChevronRight,
  Clock,
  Calendar,
  Bell,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2,
  RefreshCw,
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
 * Data is fetched from APIs - no mock data.
 */

interface HeatmapAthlete {
  athleteId: string;
  athleteName: string;
  sport: string;
  readinessHistory: number[];
  trend: 'improving' | 'declining' | 'stable';
  forecast: number[];
}

interface Intervention {
  id: string;
  athleteId: string;
  athleteName: string;
  priority: number;
  readiness: number;
  reason: string;
  recommendation: string;
  status: string;
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
}

function ReadinessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'readiness' | 'alerts'>(
    (searchParams.get('tab') as 'readiness' | 'alerts') || 'readiness'
  );

  // Data states
  const [heatmapData, setHeatmapData] = useState<HeatmapAthlete[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch heatmap data
        const heatmapRes = await fetch('/api/coach/analytics/team-heatmap');
        if (heatmapRes.ok) {
          const heatmapJson = await heatmapRes.json();
          if (heatmapJson.athletes) {
            setHeatmapData(heatmapJson.athletes);
          }
        }

        // Fetch interventions
        const interventionsRes = await fetch('/api/coach/interventions');
        if (interventionsRes.ok) {
          const interventionsJson = await interventionsRes.json();
          if (interventionsJson.interventions) {
            setInterventions(interventionsJson.interventions.filter((i: Intervention) => i.status === 'pending'));
          }
        }

        // Fetch alerts from dashboard (crisis alerts)
        const dashboardRes = await fetch('/api/coach/dashboard');
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          if (dashboardJson.data?.crisisAlerts) {
            const transformedAlerts = dashboardJson.data.crisisAlerts.map((a: any) => ({
              id: a.id,
              athleteId: a.athleteId,
              athleteName: a.athleteName || 'Unknown',
              severity: a.severity || 'medium',
              type: a.type || 'Alert',
              reason: a.reason || a.message || 'Requires attention',
              timestamp: new Date(a.createdAt || Date.now()),
              status: a.resolved ? 'resolved' : 'active',
            }));
            setAlerts(transformedAlerts);
          }
        }
      } catch (err) {
        console.error('Error fetching readiness data:', err);
        setError('Failed to load readiness data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const activeAlertCount = alerts.filter(a => a.status !== 'resolved').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading readiness data...</p>
        </div>
      </div>
    );
  }

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

        {/* Error State */}
        {error && (
          <div className="card-elevated p-6 border-risk-red/30 bg-risk-red-bg text-center">
            <AlertCircle className="w-8 h-8 text-risk-red mx-auto mb-2" />
            <p className="text-foreground font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {!error && (
          activeTab === 'readiness'
            ? <ReadinessTab athletes={heatmapData} interventions={interventions} />
            : <AlertsTab alerts={alerts} setAlerts={setAlerts} />
        )}
      </div>
    </div>
  );
}

// ============================================
// READINESS TAB
// ============================================
function ReadinessTab({
  athletes,
  interventions
}: {
  athletes: HeatmapAthlete[];
  interventions: Intervention[];
}) {
  const getReadinessColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-risk-green', text: 'text-risk-green', border: 'border-risk-green' };
    if (score >= 70) return { bg: 'bg-risk-yellow', text: 'text-risk-yellow', border: 'border-risk-yellow' };
    if (score >= 50) return { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' };
    return { bg: 'bg-risk-red', text: 'text-risk-red', border: 'border-risk-red' };
  };

  // Calculate metrics from actual data
  const latestScores = athletes.map(a => {
    const history = a.readinessHistory || [];
    return history[history.length - 1] || 0;
  });
  const teamAvg = latestScores.length > 0
    ? Math.round(latestScores.reduce((sum, s) => sum + s, 0) / latestScores.length)
    : 0;
  const highRisk = latestScores.filter(s => s < 70).length;
  const declining = athletes.filter(a => a.trend === 'declining').length;

  // Empty state
  if (athletes.length === 0) {
    return (
      <div className="card-elevated p-12 text-center animate-slide-up">
        <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-2">No Readiness Data Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Readiness data will appear here once athletes complete their wellness check-ins.
          Encourage your athletes to log their daily mood and wellness metrics.
        </p>
      </div>
    );
  }

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
              <p className="text-xs text-muted-foreground mt-1">Mental readiness score</p>
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
      {interventions.length > 0 && (
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
            {interventions.slice(0, 5).map((int) => {
              const colors = getReadinessColor(int.readiness);
              return (
                <div key={int.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold",
                      int.priority === 1 ? "bg-risk-red" : int.priority === 2 ? "bg-warning" : "bg-risk-yellow"
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
      )}

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
                const history = athlete.readinessHistory || [];
                const paddedHistory = [...Array(Math.max(0, 14 - history.length)).fill(null), ...history.slice(-14)];

                return (
                  <tr key={athlete.athleteId} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/coach/athletes/${athlete.athleteId}`} className="hover:text-primary transition-colors">
                        <div className="font-medium text-foreground">{athlete.athleteName}</div>
                        <div className="text-xs text-muted-foreground">{athlete.sport}</div>
                      </Link>
                    </td>
                    {paddedHistory.map((score, idx) => {
                      if (score === null) {
                        return (
                          <td key={idx} className="py-3 px-1">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              -
                            </div>
                          </td>
                        );
                      }
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
                      {athlete.trend === 'stable' && (
                        <div className="text-muted-foreground font-medium text-sm">Stable</div>
                      )}
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1 justify-center">
                        {(athlete.forecast || []).slice(0, 7).map((score, idx) => {
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
// ALERTS TAB
// ============================================
function AlertsTab({
  alerts,
  setAlerts
}: {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
}) {
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'resolved'>('all');

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

  const handleMarkResolved = async (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
    ));
    // TODO: Call API to mark as resolved
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
              <h3 className="font-medium text-foreground mb-1">
                {alerts.length === 0 ? 'No Alerts' : 'No alerts found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {alerts.length === 0
                  ? 'Alerts will appear here when athletes need attention'
                  : filter === 'resolved'
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function ReadinessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReadinessPageContent />
    </Suspense>
  );
}
