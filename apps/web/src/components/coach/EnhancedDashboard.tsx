'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function EnhancedDashboard({ userId }: { userId: string }) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [showInviteCode, setShowInviteCode] = useState(false);

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
      alert('Invite code copied to clipboard!');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-muted-foreground font-semibold text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
        <div className="text-center bg-card rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="text-red-500 text-7xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {error || 'No data available'}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, teamMood, atRiskAthletes, athleteReadiness, crisisAlerts } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header with Invite Code */}
      <div className="bg-card shadow-lg border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Coach Dashboard
              </h1>
              <p className="mt-3 text-muted-foreground text-lg">
                Monitor your team's mental performance
              </p>
            </div>
            <button
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all shadow-lg flex items-center gap-3 font-bold text-lg hover:scale-105 transform"
            >
              <span className="text-2xl">🔑</span>
              <span>My Invite Code</span>
            </button>
          </div>

          {/* Invite Code Card */}
          {showInviteCode && inviteCodeData && (
            <div className="mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">🎯</span>
                Your Team Invite Code
              </h3>
              <div className="bg-card/20 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/30">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider opacity-90 mb-2 font-semibold">
                      Share this code with your athletes
                    </div>
                    <div className="text-5xl font-mono font-black tracking-widest">
                      {inviteCodeData.inviteCode}
                    </div>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="px-6 py-3 bg-card text-primary rounded-xl hover:bg-blue-50 transition-colors font-bold shadow-lg hover:shadow-xl"
                  >
                    📋 Copy Code
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏀</span>
                  <span className="opacity-90">Sport:</span>{' '}
                  <span className="font-bold text-lg">{inviteCodeData.sport}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span className="opacity-90">Connected Athletes:</span>{' '}
                  <span className="font-bold text-lg">{inviteCodeData.athleteCount}</span>
                </div>
              </div>
              <div className="mt-6 bg-card/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm leading-relaxed">
                  💡 <strong>How it works:</strong> Athletes enter this code in their mobile app to join your team.
                  They control their data sharing consent, giving you access to their mental performance metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="mb-10 flex flex-col md:flex-row gap-6 items-stretch bg-card rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex-1">
            <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="text-lg">📅</span>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-5 py-3 border-2 border-border rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-semibold bg-background hover:bg-card cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="text-lg">🏀</span>
              Sport Filter
            </label>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full px-5 py-3 border-2 border-border rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-semibold bg-background hover:bg-card cursor-pointer"
            >
              <option value="">All Sports</option>
              <option value="Basketball">🏀 Basketball</option>
              <option value="Football">🏈 Football</option>
              <option value="Soccer">⚽ Soccer</option>
              <option value="Volleyball">🏐 Volleyball</option>
              <option value="Baseball">⚾ Baseball</option>
              <option value="Track">🏃 Track & Field</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">
                  Total Athletes
                </div>
                <div className="text-5xl font-black mb-2">
                  {overview.totalAthletes}
                </div>
                <div className="text-sm bg-card/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  {overview.athletesWithConsent} with consent
                </div>
              </div>
              <div className="text-6xl opacity-20">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">
                  Avg Team Mood
                </div>
                <div className="text-5xl font-black mb-2">
                  {teamMood.avgMood.toFixed(1)}
                </div>
                <div className="text-sm bg-card/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  {teamMood.totalLogs} logs
                </div>
              </div>
              <div className="text-6xl opacity-20">😊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">
                  At-Risk Athletes
                </div>
                <div className="text-5xl font-black mb-2">
                  {overview.atRiskCount}
                </div>
                <div className="text-sm bg-card/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  Need attention
                </div>
              </div>
              <div className="text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">
                  Crisis Alerts
                </div>
                <div className="text-5xl font-black mb-2">
                  {overview.crisisAlertsCount}
                </div>
                <div className="text-sm bg-card/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  Unresolved
                </div>
              </div>
              <div className="text-6xl opacity-20">🚨</div>
            </div>
          </div>
        </div>

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-10 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              Team Mental Performance Trends
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis domain={[0, 10]} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Mood"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Confidence"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* At-Risk Athletes */}
        {atRiskAthletes.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-10 border-2 border-red-200">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              At-Risk Athletes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atRiskAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="border-2 border-red-300 rounded-xl p-6 bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-xl transition-all hover:scale-105 transform cursor-pointer"
                  onClick={() => router.push(`/coach/athletes/${athlete.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-lg text-foreground">{athlete.name}</h3>
                      <p className="text-sm text-muted-foreground font-semibold">
                        {athlete.sport} • {athlete.year}
                      </p>
                    </div>
                    <div className="text-3xl">🔴</div>
                  </div>
                  {athlete.recentMood && (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center bg-card/60 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-muted-foreground">Mood:</span>
                        <span className="font-black text-lg">{athlete.recentMood.mood}/10</span>
                      </div>
                      <div className="flex justify-between items-center bg-card/60 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-muted-foreground">Confidence:</span>
                        <span className="font-black text-lg">{athlete.recentMood.confidence}/10</span>
                      </div>
                      <div className="flex justify-between items-center bg-card/60 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-muted-foreground">Stress:</span>
                        <span className="font-black text-lg text-red-600">{athlete.recentMood.stress}/10</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/coach/athletes/${athlete.id}`);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/coach/athletes/${athlete.id}`);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm"
                    >
                      📨 Check-In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Readiness */}
        {athleteReadiness.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-10 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Today's Readiness Scores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {athleteReadiness.map((item) => (
                <div
                  key={item.athlete.id}
                  onClick={() => router.push(`/coach/athletes/${item.athlete.id}`)}
                  className={`border-2 rounded-xl p-6 cursor-pointer ${
                    item.status === 'excellent'
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                      : item.status === 'good'
                      ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50'
                      : item.status === 'fair'
                      ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50'
                      : 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50'
                  } hover:shadow-xl transition-all hover:scale-105 transform`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-lg text-foreground">{item.athlete.name}</h3>
                      <p className="text-sm text-muted-foreground font-semibold">{item.athlete.teamPosition}</p>
                    </div>
                    <div
                      className={`text-3xl font-black ${
                        item.status === 'excellent'
                          ? 'text-green-600'
                          : item.status === 'good'
                          ? 'text-primary'
                          : item.status === 'fair'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {item.readiness}
                    </div>
                  </div>
                  <div className={`text-xs uppercase font-black tracking-wider px-3 py-2 rounded-lg inline-block ${
                    item.status === 'excellent'
                      ? 'bg-green-200 text-green-800'
                      : item.status === 'good'
                      ? 'bg-blue-200 text-blue-800'
                      : item.status === 'fair'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {item.status.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {overview.totalAthletes === 0 && (
          <div className="bg-card rounded-2xl shadow-2xl p-16 text-center border-2 border-dashed border-border">
            <div className="text-8xl mb-6">👋</div>
            <h3 className="text-3xl font-black text-foreground mb-4">
              Welcome to Your Coach Dashboard!
            </h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
              Get started by sharing your invite code with athletes. Once they join and grant consent,
              you'll see their mental performance metrics right here.
            </p>
            <button
              onClick={() => setShowInviteCode(true)}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-black text-lg hover:scale-105 transform"
            >
              🔑 View Invite Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
