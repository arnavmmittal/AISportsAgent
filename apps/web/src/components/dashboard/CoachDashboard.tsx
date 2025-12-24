'use client';

/**
 * Coach dashboard with team analytics and insights
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient, type TeamAnalytics, type Recommendation } from '@/lib/api-client';

export function CoachDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    if (session?.user?.id && session?.user?.role === 'COACH') {
      loadDashboardData();
    }
  }, [session, selectedPeriod]);

  const loadDashboardData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [analyticsData, recsData] = await Promise.all([
        apiClient.getTeamAnalytics(session.user.id, selectedPeriod),
        apiClient.getRecommendations(session.user.id),
      ]);

      setAnalytics(analyticsData);
      setRecommendations(recsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== 'COACH') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">This dashboard is only available for coaches</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Mental Performance</h1>
          <p className="text-gray-600">{analytics.sport} • {analytics.team_size} athletes</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Mood"
          value={analytics.averages.mood}
          max={10}
          trend={analytics.trends.mood_trend}
          color="blue"
        />
        <MetricCard
          title="Average Confidence"
          value={analytics.averages.confidence}
          max={10}
          color="green"
        />
        <MetricCard
          title="Average Stress"
          value={analytics.averages.stress}
          max={10}
          trend={analytics.trends.stress_trend === 'decreasing' ? 'improving' : 'declining'}
          color="orange"
          inverse
        />
        <MetricCard
          title="Engagement Rate"
          value={analytics.engagement.engagement_rate}
          max={100}
          suffix="%"
          color="purple"
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recommended Actions</h2>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <p className="text-sm text-gray-900 mt-2 font-medium">
                      Action: {rec.action}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At-Risk Athletes */}
      {analytics.at_risk_athletes.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Athletes Needing Support</h2>
          <div className="space-y-3">
            {analytics.at_risk_athletes.map((athlete) => (
              <div
                key={athlete.athlete_id}
                className="p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{athlete.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        Avg Mood: <span className="font-medium">{athlete.avg_mood}/10</span>
                      </span>
                      <span className="text-gray-600">
                        Avg Stress: <span className="font-medium">{athlete.avg_stress}/10</span>
                      </span>
                      <span className="text-gray-600">
                        Logs: <span className="font-medium">{athlete.logs_count}</span>
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Platform Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {analytics.engagement.athletes_using_platform}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Athletes</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {analytics.engagement.engagement_rate}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Engagement Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {analytics.engagement.total_chat_sessions}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  max: number;
  suffix?: string;
  trend?: 'improving' | 'declining';
  color: 'blue' | 'green' | 'orange' | 'purple';
  inverse?: boolean;
}

function MetricCard({ title, value, max, suffix = '', trend, color, inverse }: MetricCardProps) {
  const percentage = (value / max) * 100;

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
  };

  const trendColor = inverse
    ? trend === 'improving'
      ? 'text-green-600'
      : 'text-red-600'
    : trend === 'improving'
    ? 'text-green-600'
    : trend === 'declining'
    ? 'text-red-600'
    : 'text-gray-600';

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">
          {value.toFixed(1)}
          {suffix}
        </p>
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trend === 'improving' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
