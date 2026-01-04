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
import WeeklySummaryDrawer from './weekly-summary/WeeklySummaryDrawer';

interface AthleteData {
  consentGranted: boolean;
  data: {
    athlete: {
      id: string;
      name: string;
      email: string;
      sport: string;
      year: string;
      teamPosition: string;
      riskLevel: string;
      createdAt?: string;
    };
    relationship: {
      joinedAt: string;
      notes: string | null;
    };
    statistics?: {
      avgMood: number;
      avgConfidence: number;
      avgStress: number;
      totalMoodLogs: number;
      activeGoals: number;
      completedGoals: number;
      totalGoals: number;
      chatSessions: number;
      crisisAlerts: number;
    };
    moodLogs?: Array<{
      id: string;
      mood: number;
      confidence: number;
      stress: number;
      sleep: number;
      createdAt: string;
    }>;
    goals?: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      targetDate: string;
      createdAt: string;
    }>;
    coachNotes?: Array<{
      id: string;
      content: string;
      category: string;
      createdAt: string;
    }>;
    crisisAlerts?: Array<{
      id: string;
      severity: string;
      detectedAt: string;
      reviewed: boolean;
    }>;
  };
}

export default function AthleteDetailView({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intervention states
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAthleteData();
  }, [athleteId]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      const [athleteRes, perfRes] = await Promise.all([
        fetch(`/api/coach/athletes/${athleteId}`),
        fetch(`/api/performance/${athleteId}?limit=10`)
      ]);

      if (!athleteRes.ok) throw new Error('Failed to fetch athlete data');

      const athleteJson = await athleteRes.json();
      setAthleteData(athleteJson);
      setRelationshipNotes(athleteJson.data.relationship.notes || '');

      // Performance data is optional
      if (perfRes.ok) {
        const perfJson = await perfRes.json();
        setPerformanceMetrics(perfJson.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching athlete data:', err);
      setError('Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCheckIn = async () => {
    if (!checkInMessage.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: checkInMessage,
          type: 'CHECK_IN',
        }),
      });

      if (!res.ok) throw new Error('Failed to send check-in');

      alert('Check-in sent successfully!');
      setCheckInMessage('');
      setShowCheckIn(false);
      fetchAthleteData();
    } catch (err) {
      console.error('Error sending check-in:', err);
      alert('Failed to send check-in');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          category: noteCategory,
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');

      setNewNote('');
      setShowAddNote(false);
      fetchAthleteData();
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRelationshipNotes = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/coach/athletes/${athleteId}/intervention`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: relationshipNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update notes');

      alert('Notes updated successfully!');
      fetchAthleteData();
    } catch (err) {
      console.error('Error updating notes:', err);
      alert('Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-muted-foreground font-semibold text-lg">Loading athlete data...</p>
        </div>
      </div>
    );
  }

  if (error || !athleteData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
        <div className="text-center bg-card rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="text-red-500 text-7xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {error || 'Athlete not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { athlete, relationship, statistics, moodLogs, goals, coachNotes, crisisAlerts } = athleteData.data;

  // Calculate readiness score (0-100) from mood, confidence, stress, sleep
  const calculateReadinessScore = (mood: number, confidence: number, stress: number, sleep: number) => {
    // Normalize all to 0-100 scale (mood, confidence, sleep are 0-10, stress is inverted)
    const moodScore = mood * 10; // 0-10 -> 0-100
    const confidenceScore = confidence * 10; // 0-10 -> 0-100
    const stressScore = (10 - stress) * 10; // Inverted: low stress = high score
    const sleepScore = (sleep / 9) * 100; // 0-9 hours -> 0-100 (9hrs = 100%)

    // Weighted average: mood 25%, confidence 25%, stress 30%, sleep 20%
    return Math.round((moodScore * 0.25) + (confidenceScore * 0.25) + (stressScore * 0.30) + (sleepScore * 0.20));
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  // Prepare readiness data with last 14 days
  const last14Days = moodLogs?.slice(0, 14).reverse() || [];
  const readinessScores = last14Days.map(log =>
    calculateReadinessScore(log.mood, log.confidence, log.stress, log.sleep)
  );

  const currentReadiness = readinessScores[readinessScores.length - 1] || 0;

  // Calculate 7-day forecast (simple trend-based prediction)
  const calculateForecast = (scores: number[]): number[] => {
    if (scores.length < 3) return [];

    // Calculate trend from last 7 days
    const recent = scores.slice(-7);
    const avgChange = (recent[recent.length - 1] - recent[0]) / recent.length;

    // Project forward 7 days
    let forecast: number[] = [];
    let lastScore = recent[recent.length - 1];
    for (let i = 1; i <= 7; i++) {
      lastScore = Math.max(0, Math.min(100, lastScore + avgChange));
      forecast.push(Math.round(lastScore));
    }
    return forecast;
  };

  const forecast = calculateForecast(readinessScores);

  // Prepare mood chart data
  const chartData = last14Days.map((log) => {
    const date = new Date(log.createdAt);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      Readiness: calculateReadinessScore(log.mood, log.confidence, log.stress, log.sleep),
      Mood: log.mood,
      Confidence: log.confidence,
      Stress: 10 - log.stress, // Invert for visualization
      Sleep: log.sleep,
    };
  }) || [];

  // No consent view
  if (!athleteData.consentGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 text-primary hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            ← Back to Athletes
          </button>

          <div className="bg-card rounded-2xl shadow-xl p-12 text-center border-2 border-yellow-200">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-black text-foreground mb-4">
              {athlete.name}
            </h2>
            <p className="text-muted-foreground mb-2">{athlete.sport} • {athlete.year}</p>
            <p className="text-muted-foreground mb-8">{athlete.teamPosition}</p>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
              <p className="text-yellow-800 font-semibold">
                This athlete has not granted data sharing consent yet.
              </p>
              <p className="text-yellow-700 mt-2 text-sm">
                You can see basic profile information, but detailed metrics, mood logs, and goals are private until consent is granted.
              </p>
            </div>

            <div className="text-left bg-background rounded-xl p-6">
              <h3 className="font-bold text-foreground mb-3">Relationship Notes</h3>
              <textarea
                value={relationshipNotes}
                onChange={(e) => setRelationshipNotes(e.target.value)}
                placeholder="Add private notes about this athlete..."
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <button
                onClick={handleUpdateRelationshipNotes}
                disabled={saving}
                className="mt-3 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-primary hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors"
        >
          ← Back to Athletes
        </button>

        {/* Athlete Profile Header */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{athlete.name}</h1>
                {currentReadiness > 0 && (
                  <div className={`bg-gradient-to-br ${getReadinessColor(currentReadiness)} rounded-2xl px-6 py-4 text-white shadow-lg`}>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-90">Readiness</div>
                    <div className="text-4xl font-black">{currentReadiness}<span className="text-xl opacity-75">/100</span></div>
                  </div>
                )}
              </div>
              <p className="text-xl text-muted-foreground mb-3 font-semibold">{athlete.sport} • {athlete.year} • {athlete.teamPosition}</p>
              <p className="text-sm text-muted-foreground mb-4">{athlete.email}</p>
              <div className="flex gap-3 flex-wrap">
                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow ${
                  athlete.riskLevel === 'LOW'
                    ? 'bg-green-100 text-green-800'
                    : athlete.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {athlete.riskLevel} Risk
                </span>
                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-100 text-blue-800 shadow">
                  Joined {new Date(relationship.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCheckIn(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold flex items-center gap-2 justify-center hover:scale-105 transform"
              >
                📨 Send Check-In
              </button>
              <button
                onClick={() => setShowAddNote(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold flex items-center gap-2 justify-center hover:scale-105 transform"
              >
                📝 Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Readiness Breakdown - Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Avg Mood</div>
                  <div className="text-5xl font-black mb-2">{statistics.avgMood.toFixed(1)}<span className="text-2xl opacity-75">/10</span></div>
                  <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Last 7 days</div>
                </div>
                <div className="text-6xl opacity-20">😊</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Confidence</div>
                  <div className="text-5xl font-black mb-2">{statistics.avgConfidence.toFixed(1)}<span className="text-2xl opacity-75">/10</span></div>
                  <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Average</div>
                </div>
                <div className="text-6xl opacity-20">💪</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Stress Level</div>
                  <div className="text-5xl font-black mb-2">{statistics.avgStress.toFixed(1)}<span className="text-2xl opacity-75">/10</span></div>
                  <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Lower is better</div>
                </div>
                <div className="text-6xl opacity-20">😰</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Active Goals</div>
                  <div className="text-5xl font-black mb-2">{statistics.activeGoals}</div>
                  <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">{statistics.completedGoals} completed</div>
                </div>
                <div className="text-6xl opacity-20">🎯</div>
              </div>
            </div>
          </div>
        )}

        {/* 14-Day Readiness Heatmap + 7-Day Forecast */}
        {readinessScores.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              14-Day Readiness Trend + 7-Day Forecast
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Last 14 Days */}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Last 14 Days</h3>
                <div className="flex gap-2 flex-wrap">
                  {readinessScores.map((score, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getReadinessColor(score)} text-white font-black text-sm flex items-center justify-center shadow-lg hover:scale-110 transform transition-all cursor-pointer`}
                        title={`Day ${index - 13}: ${score}/100`}
                      >
                        {score}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-semibold">
                        D{index - 13}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Forecast */}
              {forecast.length > 0 && (
                <div className="md:border-l-2 md:border-gray-200 md:pl-6">
                  <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">7-Day Forecast</h3>
                  <div className="flex gap-2">
                    {forecast.map((score, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getReadinessColor(score)} text-white font-bold text-xs flex items-center justify-center shadow opacity-75`}
                          title={`Day +${index + 1}: ${score}/100`}
                        >
                          {score}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 font-semibold">
                          +{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trend Insight */}
            {forecast.length > 0 && (
              <div className={`mt-6 p-4 rounded-xl border-l-4 ${
                forecast[forecast.length - 1] < currentReadiness - 10
                  ? 'bg-red-50 border-red-500'
                  : forecast[forecast.length - 1] > currentReadiness + 10
                  ? 'bg-green-50 border-green-500'
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <p className={`font-semibold text-sm ${
                  forecast[forecast.length - 1] < currentReadiness - 10
                    ? 'text-red-900'
                    : forecast[forecast.length - 1] > currentReadiness + 10
                    ? 'text-green-900'
                    : 'text-blue-900'
                }`}>
                  {forecast[forecast.length - 1] < currentReadiness - 10 && '⚠️ Declining trend detected - forecast shows readiness dropping to ' + forecast[forecast.length - 1] + ' in 7 days. Consider proactive intervention.'}
                  {forecast[forecast.length - 1] > currentReadiness + 10 && '✅ Improving trend detected - forecast shows readiness rising to ' + forecast[forecast.length - 1] + ' in 7 days. Great progress!'}
                  {forecast[forecast.length - 1] >= currentReadiness - 10 && forecast[forecast.length - 1] <= currentReadiness + 10 && '→ Stable trend - forecast shows readiness maintaining around ' + forecast[forecast.length - 1] + ' in 7 days.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="text-3xl">📊</span>
              Readiness Components (Last 14 Days)
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} stroke="#6b7280" style={{ fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: 700 }} />
                  <Line type="monotone" dataKey="Readiness" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', r: 6 }} name="Readiness Score (0-100)" />
                  <Line type="monotone" dataKey="Mood" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Mood" opacity={0.6} />
                  <Line type="monotone" dataKey="Confidence" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Confidence" opacity={0.6} />
                  <Line type="monotone" dataKey="Stress" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Stress (Inverted)" opacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly Summaries Section */}
        <div className="mb-8">
          <WeeklySummaryDrawer
            athleteId={athleteId}
            athleteName={athlete.name}
            consentGranted={athleteData.consentGranted}
          />
        </div>

        {/* Performance Metrics Section */}
        {performanceMetrics.length > 0 && (
          <>
            {/* Performance Summary Stats */}
            <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                Performance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="text-4xl font-black text-green-700">
                    {performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'WIN').length}
                  </div>
                  <div className="text-sm font-semibold text-green-600 mt-2">Wins</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                  <div className="text-4xl font-black text-red-700">
                    {performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'LOSS').length}
                  </div>
                  <div className="text-sm font-semibold text-red-600 mt-2">Losses</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-4xl font-black text-blue-700">
                    {((performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'WIN').length / performanceMetrics.length) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm font-semibold text-blue-600 mt-2">Win Rate</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                  <div className="text-4xl font-black text-purple-700">
                    {performanceMetrics.filter(m => m.readinessScore).length > 0
                      ? (performanceMetrics
                          .filter(m => m.readinessScore)
                          .reduce((sum, m) => sum + m.readinessScore, 0) /
                        performanceMetrics.filter(m => m.readinessScore).length).toFixed(0)
                      : 'N/A'}
                  </div>
                  <div className="text-sm font-semibold text-purple-600 mt-2">Avg Readiness</div>
                </div>
              </div>
            </div>

            {/* Performance vs Readiness Correlation */}
            {performanceMetrics.filter(m => m.readinessScore && m.stats?.points).length >= 5 && (
              <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
                  <span className="text-3xl">📈</span>
                  Performance vs Readiness Correlation
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  This chart shows the correlation between mental readiness scores and game performance (points scored).
                  Higher readiness typically correlates with better performance outcomes.
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceMetrics.slice(0, 10).reverse().map((m, idx) => ({
                      game: `Game ${idx + 1}`,
                      points: m.stats?.points || 0,
                      readiness: m.readinessScore || 0,
                      outcome: m.outcome
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="game" stroke="#6b7280" style={{ fontWeight: 600 }} />
                      <YAxis yAxisId="left" stroke="#6b7280" style={{ fontWeight: 600 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" style={{ fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          fontWeight: 600,
                        }}
                      />
                      <Legend wrapperStyle={{ fontWeight: 700 }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="points"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        name="Points Scored"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="readiness"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 5 }}
                        name="Readiness Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Games */}
            <div className="bg-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
                <span className="text-3xl">🎮</span>
                Recent Games
              </h2>
              <div className="space-y-4">
                {performanceMetrics.slice(0, 5).map((metric, idx) => (
                  <div
                    key={idx}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground font-semibold">
                          {new Date(metric.gameDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-lg font-bold text-foreground mt-1">
                          vs {metric.opponentName}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-lg font-black text-sm ${
                        metric.outcome?.toUpperCase() === 'WIN'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : metric.outcome?.toUpperCase() === 'LOSS'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      }`}>
                        {metric.outcome?.toUpperCase() || 'N/A'}
                      </span>
                    </div>

                    {metric.stats && (
                      <div className="flex gap-4 mb-3 flex-wrap">
                        {metric.stats.points !== undefined && (
                          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                            <span className="font-black text-blue-700">{metric.stats.points}</span>
                            <span className="text-xs text-blue-600 font-semibold">PTS</span>
                          </div>
                        )}
                        {metric.stats.assists !== undefined && (
                          <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                            <span className="font-black text-purple-700">{metric.stats.assists}</span>
                            <span className="text-xs text-purple-600 font-semibold">AST</span>
                          </div>
                        )}
                        {metric.stats.rebounds !== undefined && (
                          <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                            <span className="font-black text-orange-700">{metric.stats.rebounds}</span>
                            <span className="text-xs text-orange-600 font-semibold">REB</span>
                          </div>
                        )}
                      </div>
                    )}

                    {metric.readinessScore && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground font-semibold">Mental Readiness:</span>
                        <div className={`px-3 py-1 rounded-lg font-bold ${
                          metric.readinessScore >= 80
                            ? 'bg-green-100 text-green-800'
                            : metric.readinessScore >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {metric.readinessScore}/100
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goals */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="text-3xl">🎯</span>
              Goals
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {goals && goals.length > 0 ? (
                goals.slice(0, 10).map((goal) => (
                  <div
                    key={goal.id}
                    className={`border-2 rounded-xl p-4 ${
                      goal.status === 'COMPLETED'
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                        : goal.status === 'IN_PROGRESS'
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{goal.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        goal.status === 'COMPLETED'
                          ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100'
                          : goal.status === 'IN_PROGRESS'
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                      }`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>📌 {goal.type}</span>
                      <span>•</span>
                      <span>🗓️ {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No goals yet</p>
              )}
            </div>
          </div>

          {/* Coach Notes */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="text-3xl">📝</span>
              Coach Notes
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {coachNotes && coachNotes.length > 0 ? (
                coachNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border-2 border-border rounded-xl p-4 bg-background"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800 font-bold">
                        {note.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Crisis Alerts */}
        {crisisAlerts && crisisAlerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-black text-red-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">🚨</span>
              Crisis Alerts
            </h2>
            <div className="space-y-4">
              {crisisAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-card border-2 border-red-300 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm px-3 py-1 rounded-lg font-bold ${
                      alert.severity === 'HIGH'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className={`font-semibold ${
                      alert.reviewed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {alert.reviewed ? '✓ Reviewed' : '⚠️ Needs Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black text-foreground mb-4">Send Check-In</h3>
            <textarea
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              placeholder="Write your message to the athlete..."
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              rows={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckIn(false)}
                className="flex-1 px-6 py-3 border-2 border-border text-muted-foreground rounded-xl hover:bg-background font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCheckIn}
                disabled={saving || !checkInMessage.trim()}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black text-foreground mb-4">Add Coach Note</h3>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 font-semibold"
            >
              <option value="GENERAL">General</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="MENTAL_HEALTH">Mental Health</option>
              <option value="CHECK_IN">Check-In</option>
              <option value="PROGRESS">Progress</option>
            </select>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note..."
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              rows={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddNote(false)}
                className="flex-1 px-6 py-3 border-2 border-border text-muted-foreground rounded-xl hover:bg-background font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
