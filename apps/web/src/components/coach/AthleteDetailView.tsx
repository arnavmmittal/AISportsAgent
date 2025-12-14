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
      const res = await fetch(`/api/coach/athletes/${athleteId}`);
      if (!res.ok) throw new Error('Failed to fetch athlete data');

      const json = await res.json();
      setAthleteData(json);
      setRelationshipNotes(json.data.relationship.notes || '');
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
          <p className="mt-6 text-gray-700 font-semibold text-lg">Loading athlete data...</p>
        </div>
      </div>
    );
  }

  if (error || !athleteData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="text-red-500 text-7xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Athlete not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { athlete, relationship, statistics, moodLogs, goals, coachNotes, crisisAlerts } = athleteData.data;

  // Prepare mood chart data
  const chartData = moodLogs?.slice(0, 14).reverse().map((log) => {
    const date = new Date(log.createdAt);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      Mood: log.mood,
      Confidence: log.confidence,
      Stress: log.stress,
    };
  }) || [];

  // No consent view
  if (!athleteData.consentGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            ← Back to Athletes
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-yellow-200">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              {athlete.name}
            </h2>
            <p className="text-gray-600 mb-2">{athlete.sport} • {athlete.year}</p>
            <p className="text-gray-600 mb-8">{athlete.teamPosition}</p>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
              <p className="text-yellow-800 font-semibold">
                This athlete has not granted data sharing consent yet.
              </p>
              <p className="text-yellow-700 mt-2 text-sm">
                You can see basic profile information, but detailed metrics, mood logs, and goals are private until consent is granted.
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Relationship Notes</h3>
              <textarea
                value={relationshipNotes}
                onChange={(e) => setRelationshipNotes(e.target.value)}
                placeholder="Add private notes about this athlete..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <button
                onClick={handleUpdateRelationshipNotes}
                disabled={saving}
                className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
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
          className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors"
        >
          ← Back to Athletes
        </button>

        {/* Athlete Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">{athlete.name}</h1>
              <p className="text-xl text-gray-600 mb-3">{athlete.sport} • {athlete.year} • {athlete.teamPosition}</p>
              <p className="text-sm text-gray-500">{athlete.email}</p>
              <div className="mt-4 flex gap-3">
                <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  athlete.riskLevel === 'LOW'
                    ? 'bg-green-100 text-green-800'
                    : athlete.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {athlete.riskLevel} Risk
                </span>
                <span className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-800">
                  Joined {new Date(relationship.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCheckIn(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center gap-2 justify-center"
              >
                📨 Send Check-In
              </button>
              <button
                onClick={() => setShowAddNote(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center gap-2 justify-center"
              >
                📝 Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm font-semibold opacity-90 mb-1">Avg Mood</div>
              <div className="text-4xl font-black">{statistics.avgMood}</div>
              <div className="text-xs mt-2 opacity-75">Last 7 days</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm font-semibold opacity-90 mb-1">Confidence</div>
              <div className="text-4xl font-black">{statistics.avgConfidence}</div>
              <div className="text-xs mt-2 opacity-75">Average</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm font-semibold opacity-90 mb-1">Stress</div>
              <div className="text-4xl font-black">{statistics.avgStress}</div>
              <div className="text-xs mt-2 opacity-75">Average</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-sm font-semibold opacity-90 mb-1">Active Goals</div>
              <div className="text-4xl font-black">{statistics.activeGoals}</div>
              <div className="text-xs mt-2 opacity-75">{statistics.completedGoals} completed</div>
            </div>
          </div>
        )}

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📊</span>
              Mood History (Last 14 Days)
            </h2>
            <div className="h-80">
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
                  <Line type="monotone" dataKey="Mood" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                  <Line type="monotone" dataKey="Confidence" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 5 }} />
                  <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goals */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
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
                        ? 'border-green-300 bg-green-50'
                        : goal.status === 'IN_PROGRESS'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{goal.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        goal.status === 'COMPLETED'
                          ? 'bg-green-200 text-green-800'
                          : goal.status === 'IN_PROGRESS'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>📌 {goal.type}</span>
                      <span>•</span>
                      <span>🗓️ {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No goals yet</p>
              )}
            </div>
          </div>

          {/* Coach Notes */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📝</span>
              Coach Notes
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {coachNotes && coachNotes.length > 0 ? (
                coachNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800 font-bold">
                        {note.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No notes yet</p>
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
                  className="bg-white border-2 border-red-300 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm px-3 py-1 rounded-lg font-bold ${
                      alert.severity === 'HIGH'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-sm text-gray-600">
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black text-gray-900 mb-4">Send Check-In</h3>
            <textarea
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              placeholder="Write your message to the athlete..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              rows={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckIn(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCheckIn}
                disabled={saving || !checkInMessage.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-50 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black text-gray-900 mb-4">Add Coach Note</h3>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 font-semibold"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              rows={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddNote(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
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
