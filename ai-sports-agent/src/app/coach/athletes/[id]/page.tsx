'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient, AthleteSummary } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';

export default function AthleteDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const athleteId = params.id as string;

  const [summary, setSummary] = useState<AthleteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);

  useEffect(() => {
    const fetchAthleteSummary = async () => {
      if (!session?.user?.id || !athleteId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getAthleteSummary(
          session.user.id,
          athleteId,
          timePeriod
        );
        setSummary(data);
      } catch (err) {
        console.error('Error fetching athlete summary:', err);
        setError('Failed to load athlete data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAthleteSummary();
  }, [session, athleteId, timePeriod]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading athlete data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !summary) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || 'Athlete not found'}</p>
            <button
              onClick={() => router.push('/coach/athletes')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Athletes
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/coach/athletes')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Athletes
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {summary.athlete.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {summary.athlete.sport} • {summary.athlete.year}
                {summary.athlete.position && ` • ${summary.athlete.position}`}
              </p>
            </div>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Mood Logs"
            value={summary.mood_logs_count.toString()}
            subtitle={`over ${summary.period_days} days`}
          />
          {summary.recent_averages && (
            <>
              <StatCard
                title="Avg Mood"
                value={summary.recent_averages.mood.toFixed(1)}
                subtitle="out of 10"
                trend={summary.trend?.direction}
              />
              <StatCard
                title="Avg Confidence"
                value={summary.recent_averages.confidence.toFixed(1)}
                subtitle="out of 10"
              />
              <StatCard
                title="Avg Stress"
                value={summary.recent_averages.stress.toFixed(1)}
                subtitle="out of 10"
              />
            </>
          )}
        </div>

        {/* Trend Alert */}
        {summary.trend && summary.trend.direction === 'declining' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-900 flex items-center gap-2">
              <span>⚠️</span>
              Declining Trend Detected
            </h3>
            <p className="text-yellow-800 mt-2">
              {summary.athlete.name}&apos;s mood has decreased by{' '}
              {Math.abs(summary.trend.mood_change).toFixed(1)} points over the past{' '}
              {summary.period_days} days. Consider checking in.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engagement */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Engagement
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Chat Sessions:</span>
                <span className="font-semibold text-gray-900">
                  {summary.engagement.chat_sessions}
                </span>
              </div>
              {summary.engagement.last_session && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Session:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(summary.engagement.last_session).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mood Logs:</span>
                <span className="font-semibold text-gray-900">
                  {summary.mood_logs_count}
                </span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Goals ({summary.goals.active_count} active)
            </h2>
            {summary.goals.goals.length === 0 ? (
              <p className="text-gray-500">No goals set yet</p>
            ) : (
              <div className="space-y-3">
                {summary.goals.goals.slice(0, 5).map((goal) => (
                  <div
                    key={goal.id}
                    className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {goal.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              goal.status === 'COMPLETED'
                                ? 'bg-green-200 text-green-800'
                                : goal.status === 'IN_PROGRESS'
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {goal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {summary.goals.goals.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{summary.goals.goals.length - 5} more goals
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              // TODO: Implement email functionality
              alert('Email functionality coming soon!');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Check-in Email
          </button>
          <button
            onClick={() => {
              // TODO: Implement notes functionality
              alert('Notes functionality coming soon!');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Add Private Note
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'improving' | 'declining';
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      {trend && (
        <div
          className={`mt-2 flex items-center gap-1 text-sm ${
            trend === 'improving' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <span>{trend === 'improving' ? '↑' : '↓'}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
