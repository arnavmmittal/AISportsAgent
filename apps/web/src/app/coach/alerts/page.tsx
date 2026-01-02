'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';

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

  // Mock data - will be replaced with API call
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      athleteId: 'alex-martinez',
      athleteName: 'Alex Martinez',
      severity: 'critical',
      type: 'Crisis Keywords',
      reason: 'Chat message contained self-harm language',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'active',
    },
    {
      id: '2',
      athleteId: 'jordan-lee',
      athleteName: 'Jordan Lee',
      severity: 'high',
      type: 'Wellness Decline',
      reason: 'Mood score dropped 3+ points in last 3 days (8.5 → 5.0)',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'monitoring',
    },
    {
      id: '3',
      athleteId: 'morgan-davis',
      athleteName: 'Morgan Davis',
      severity: 'high',
      type: 'Stress Level',
      reason: 'Reported stress 9/10 for 4 consecutive days',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'active',
    },
    {
      id: '4',
      athleteId: 'taylor-brown',
      athleteName: 'Taylor Brown',
      severity: 'medium',
      type: 'Sleep Deprivation',
      reason: 'Average 4.2 hours sleep over last week (recommended: 7-9)',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
    },
    {
      id: '5',
      athleteId: 'casey-wilson',
      athleteName: 'Casey Wilson',
      severity: 'medium',
      type: 'Check-in Missed',
      reason: 'No check-ins for 7 days (previously consistent)',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'active',
    },
  ]);

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border-red-600 dark:border-red-800 text-red-900 dark:text-red-200';
      case 'high':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border-orange-600 dark:border-orange-800 text-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 border-yellow-600 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/30 border-gray-600 dark:border-gray-700 text-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-700';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-2 border-orange-700';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-2 border-yellow-700';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-2 border-gray-700';
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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Alerts
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Monitor critical wellness concerns and take action</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">Critical</div>
                <div className="text-5xl font-black mb-2">{criticalCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Immediate action</div>
              </div>
              <div className="text-6xl opacity-20">🚨</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">High Priority</div>
                <div className="text-5xl font-black mb-2">{highCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">24 hours</div>
              </div>
              <div className="text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-100 text-xs font-bold uppercase tracking-wider mb-2">Medium Priority</div>
                <div className="text-5xl font-black mb-2">{mediumCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Monitor closely</div>
              </div>
              <div className="text-6xl opacity-20">⏰</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Resolved</div>
                <div className="text-5xl font-black mb-2">
                  {alerts.filter(a => a.status === 'resolved').length}
                </div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Last 30 days</div>
              </div>
              <div className="text-6xl opacity-20">✅</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="flex items-center gap-3 p-6 border-b-2 border-gray-100 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transform'
              }`}
            >
              All Active ({activeAlerts.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow ${
                filter === 'critical'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transform'
              }`}
            >
              🚨 Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow ${
                filter === 'high'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transform'
              }`}
            >
              ⚠️ High ({highCount})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow ${
                filter === 'medium'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transform'
              }`}
            >
              ⏰ Medium ({mediumCount})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow ${
                filter === 'resolved'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transform'
              }`}
            >
              ✅ Resolved
            </button>
          </div>

          {/* Alerts List */}
          <div className="p-6 space-y-6">
            {filteredAlerts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-8xl mb-6">✅</div>
                <h3 className="text-3xl font-black text-foreground mb-3">No alerts found</h3>
                <p className="text-lg text-muted-foreground">
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
                  className={`rounded-2xl border-l-8 shadow-xl hover:shadow-2xl transition-all p-8 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-7 h-7 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} />
                          <Link
                            href={`/coach/athletes/${alert.athleteId}`}
                            className="text-2xl font-black text-foreground hover:text-blue-600 transition-colors"
                          >
                            {alert.athleteName}
                          </Link>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-black shadow-lg ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="px-4 py-2 rounded-xl text-sm font-black bg-gray-100 text-gray-800 shadow border-2 border-gray-200">
                          {alert.type}
                        </span>
                      </div>

                      <p className="text-base text-foreground font-semibold mb-4 ml-10 leading-relaxed">{alert.reason}</p>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground ml-10">
                        <div className="flex items-center gap-2 font-bold">
                          <Calendar className="w-4 h-4" />
                          <span>{getTimeAgo(alert.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          <span className={`w-3 h-3 rounded-full shadow ${
                            alert.status === 'active' ? 'bg-red-500' :
                            alert.status === 'monitoring' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <span className="capitalize">{alert.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {alert.status !== 'resolved' && (
                        <>
                          <Link
                            href={`/coach/athletes/${alert.athleteId}`}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold text-center whitespace-nowrap hover:scale-105 transform"
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => handleMarkResolved(alert.id)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-2xl transition-all font-bold whitespace-nowrap hover:scale-105 transform"
                          >
                            ✅ Mark Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
