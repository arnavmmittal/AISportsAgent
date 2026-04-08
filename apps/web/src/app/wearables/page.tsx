/**
 * Wearables Connection Page
 *
 * Athletes can connect and manage their wearable devices
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/shared/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { TrendLineChart } from '@/components/visualizations/TrendLineChart';
import {
  Watch,
  Activity,
  Heart,
  Moon,
  Zap,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

interface WearableData {
  id: string;
  recordedAt: string;
  recoveryScore: number | null;
  hrv: number | null;
  sleepDuration: number | null;
  sleepQuality: number | null;
  strain: number | null;
  restingHR: number | null;
}

interface WearableStatus {
  connected: boolean;
  provider: string | null;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  syncEnabled: boolean;
  summary?: {
    avgRecovery: number | null;
    avgHRV: number | null;
    avgSleep: number | null;
    avgStrain: number | null;
    dataPointCount: number;
  };
  recentData?: WearableData[];
}

const PROVIDERS = [
  {
    id: 'WHOOP',
    name: 'WHOOP',
    description: 'Recovery, strain, and sleep tracking',
    logo: '⚡',
    features: ['Recovery Score', 'HRV', 'Sleep Analysis', 'Strain'],
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'GARMIN',
    name: 'Garmin',
    description: 'GPS and fitness tracking',
    logo: '🌍',
    features: ['Body Battery', 'Sleep', 'Stress', 'Activities'],
    color: 'from-blue-500 to-cyan-500',
    comingSoon: true,
  },
  {
    id: 'OURA',
    name: 'Oura Ring',
    description: 'Sleep and readiness insights',
    logo: '💍',
    features: ['Readiness', 'Sleep Score', 'HRV', 'Activity'],
    color: 'from-purple-500 to-pink-500',
    comingSoon: true,
  },
  {
    id: 'FITBIT',
    name: 'Fitbit',
    description: 'Activity and sleep tracking',
    logo: '💙',
    features: ['Sleep Score', 'Active Minutes', 'Heart Rate', 'Steps'],
    color: 'from-teal-500 to-green-500',
    comingSoon: true,
  },
];

function WearablesContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wearables/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch wearable status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check for URL params from OAuth callback
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const connected = searchParams.get('wearable_connected');

    if (success === 'true' || connected) {
      setMessage({ type: 'success', text: 'Wearable connected successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } else if (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error}` });
      setTimeout(() => setMessage(null), 5000);
    }
  }, [fetchStatus, searchParams]);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    try {
      const res = await fetch(`/api/wearables/connect?provider=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to start connection' });
        setConnecting(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to wearable' });
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your wearable?')) return;

    try {
      const res = await fetch('/api/wearables/status', { method: 'DELETE' });
      if (res.ok) {
        setStatus({ connected: false, provider: null, lastSyncAt: null, syncStatus: null, syncError: null, syncEnabled: false });
        setMessage({ type: 'success', text: 'Wearable disconnected successfully' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect wearable' });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/wearables/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMessage({
          type: 'success',
          text: `Synced ${data.dataPointsCreated} new data points`,
        });
        await fetchStatus();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Sync failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync wearable data' });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSleepDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Prepare chart data
  const chartData = status?.recentData?.slice().reverse().map((d) => ({
    date: d.recordedAt,
    values: {
      recovery: d.recoveryScore,
      hrv: d.hrv,
      sleep: d.sleepDuration ? d.sleepDuration * 10 : null, // Scale to 0-100 range
      strain: d.strain ? d.strain * 5 : null, // Scale to 0-100 range
    },
  })) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading wearable status...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Wearable Devices
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your wearables to track recovery, sleep, and performance
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Connected Device */}
        {status?.connected && (
          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <Watch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {status.provider}
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Connected
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {status.lastSyncAt
                        ? `Last synced: ${formatDate(status.lastSyncAt)}`
                        : 'Never synced'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="border-green-300"
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-600">
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sync Status */}
              {status.syncStatus && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  {status.syncStatus === 'SYNCING' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-blue-600">Syncing...</span>
                    </>
                  )}
                  {status.syncStatus === 'SYNCED' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Sync complete</span>
                    </>
                  )}
                  {status.syncStatus === 'ERROR' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">{status.syncError || 'Sync failed'}</span>
                    </>
                  )}
                </div>
              )}

              {/* Summary Stats */}
              {status.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Activity className="w-4 h-4" />
                      <span>Recovery</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {status.summary.avgRecovery !== null ? `${status.summary.avgRecovery}%` : '--'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Heart className="w-4 h-4" />
                      <span>HRV</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {status.summary.avgHRV !== null ? `${status.summary.avgHRV}ms` : '--'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Moon className="w-4 h-4" />
                      <span>Sleep</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {status.summary.avgSleep !== null
                        ? formatSleepDuration(status.summary.avgSleep)
                        : '--'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Zap className="w-4 h-4" />
                      <span>Strain</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {status.summary.avgStrain !== null ? status.summary.avgStrain.toFixed(1) : '--'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trend Chart */}
        {status?.connected && chartData.length > 1 && (
          <TrendLineChart
            data={chartData}
            metrics={[
              { key: 'recovery', label: 'Recovery', color: '#22c55e' },
              { key: 'hrv', label: 'HRV', color: '#ef4444' },
              { key: 'sleep', label: 'Sleep (scaled)', color: '#3b82f6' },
              { key: 'strain', label: 'Strain (scaled)', color: '#f97316' },
            ]}
            title="7-Day Trends"
            height={250}
          />
        )}

        {/* Recent Data Table */}
        {status?.connected && status.recentData && status.recentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Data</CardTitle>
              <CardDescription>Your latest wearable metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-center py-2 px-3 font-medium">Recovery</th>
                      <th className="text-center py-2 px-3 font-medium">HRV</th>
                      <th className="text-center py-2 px-3 font-medium">Sleep</th>
                      <th className="text-center py-2 px-3 font-medium">Strain</th>
                      <th className="text-center py-2 px-3 font-medium">Resting HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {status.recentData.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/50">
                        <td className="py-3 px-3">
                          {new Date(d.recordedAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="text-center py-3 px-3">
                          {d.recoveryScore !== null ? (
                            <span
                              className={`font-semibold ${
                                d.recoveryScore >= 67
                                  ? 'text-green-600'
                                  : d.recoveryScore >= 34
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {d.recoveryScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3">
                          {d.hrv !== null ? (
                            <span className="font-mono">{Math.round(d.hrv)}ms</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3">
                          {d.sleepDuration !== null ? (
                            <span>{formatSleepDuration(d.sleepDuration)}</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3">
                          {d.strain !== null ? (
                            <span className="font-mono">{d.strain.toFixed(1)}</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3">
                          {d.restingHR !== null ? (
                            <span className="font-mono">{Math.round(d.restingHR)} bpm</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Providers */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {status?.connected ? 'Other Devices' : 'Connect a Device'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDERS.map((provider) => {
              const isConnected = status?.connected && status.provider === provider.id;
              const isConnecting = connecting === provider.id;

              return (
                <Card
                  key={provider.id}
                  className={`relative overflow-hidden ${
                    isConnected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
                  } ${provider.comingSoon ? 'opacity-60' : ''}`}
                >
                  {/* Gradient accent */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${provider.color}`}
                  />

                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-3xl p-2 rounded-lg bg-gradient-to-br ${provider.color} bg-opacity-10`}
                        >
                          {provider.logo}
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {provider.name}
                            {isConnected && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                Connected
                              </Badge>
                            )}
                            {provider.comingSoon && (
                              <Badge variant="secondary" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{provider.description}</p>
                        </div>
                      </div>

                      {!isConnected && !provider.comingSoon && (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(provider.id)}
                          disabled={isConnecting || status?.connected}
                          className={`bg-gradient-to-r ${provider.color} text-white`}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {provider.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Why Connect Your Wearable?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Connecting your wearable device helps us understand your physical readiness and recovery.
                  This data is combined with your mental state tracking to provide more accurate
                  performance predictions and personalized recommendations.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Track recovery and readiness trends
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Get better performance predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Identify patterns between sleep, recovery, and performance
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Wrap in Suspense for useSearchParams
export default function WearablesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    }>
      <WearablesContent />
    </Suspense>
  );
}
