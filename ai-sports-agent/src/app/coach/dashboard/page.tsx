'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient, TeamAnalytics, Recommendation } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function CoachDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const [analyticsData, recsData] = await Promise.all([
          apiClient.getTeamAnalytics(session.user.id, timePeriod),
          apiClient.getRecommendations(session.user.id)
        ]);

        setAnalytics(analyticsData);
        setRecommendations(recsData);
      } catch (err) {
        console.error('Error fetching coach data:', err);
        setError('Failed to load team analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, timePeriod]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor your team&apos;s mental health and performance trends
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

        {/* Team Overview Stats */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Team Size"
                value={analytics.team_size.toString()}
                subtitle={`${analytics.engagement.engagement_rate.toFixed(0)}% engaged`}
                trend={null}
              />
              <StatCard
                title="Average Mood"
                value={analytics.averages.mood.toFixed(1)}
                subtitle="out of 10"
                trend={analytics.trends.mood_trend}
                trendValue={analytics.trends.mood_change}
              />
              <StatCard
                title="Average Stress"
                value={analytics.averages.stress.toFixed(1)}
                subtitle="out of 10"
                trend={analytics.trends.stress_trend === 'decreasing' ? 'improving' : 'declining'}
                trendValue={analytics.trends.stress_change}
              />
              <StatCard
                title="Chat Sessions"
                value={analytics.engagement.total_chat_sessions.toString()}
                subtitle={`${analytics.total_mood_logs} mood logs`}
                trend={null}
              />
            </div>

            {/* At-Risk Athletes */}
            {analytics.at_risk_athletes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  Athletes Needing Attention ({analytics.at_risk_athletes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.at_risk_athletes.map((athlete) => (
                    <div
                      key={athlete.athlete_id}
                      className="bg-white rounded-lg p-4 border border-yellow-300 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/coach/athletes/${athlete.athlete_id}`)}
                    >
                      <h3 className="font-semibold text-gray-900">{athlete.name}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">
                          Avg Mood: <span className="font-medium">{athlete.avg_mood.toFixed(1)}/10</span>
                        </p>
                        <p className="text-gray-600">
                          Avg Stress: <span className="font-medium">{athlete.avg_stress.toFixed(1)}/10</span>
                        </p>
                        <p className="text-gray-500">{athlete.logs_count} logs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  AI Recommendations
                </h2>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-r-lg ${
                        rec.priority === 'high'
                          ? 'border-red-500 bg-red-50'
                          : rec.priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                rec.priority === 'high'
                                  ? 'bg-red-200 text-red-800'
                                  : rec.priority === 'medium'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {rec.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">{rec.category}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                          <p className="text-sm text-gray-700 mt-1">{rec.description}</p>
                          <p className="text-sm text-gray-600 mt-2 italic">{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActionCard
                title="View All Athletes"
                description="See individual athlete profiles and trends"
                icon="👥"
                onClick={() => router.push('/coach/athletes')}
              />
              <ActionCard
                title="Conversation Insights"
                description="Review key themes from athlete conversations"
                icon="💬"
                onClick={() => router.push('/coach/insights')}
              />
              <ActionCard
                title="Export Report"
                description="Generate team wellness report"
                icon="📊"
                onClick={() => {
                  // TODO: Implement export functionality
                  alert('Export functionality coming soon!');
                }}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: 'improving' | 'declining' | null;
  trendValue?: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      {trend && trendValue !== undefined && (
        <div className={`mt-2 flex items-center gap-1 text-sm ${
          trend === 'improving' ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{trend === 'improving' ? '↑' : '↓'}</span>
          <span>{Math.abs(trendValue).toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
