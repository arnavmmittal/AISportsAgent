'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';

interface ConversationInsight {
  id: string;
  athleteId: string;
  sessionId: string;
  themes: string[];
  sentiment: number;
  emotions?: Record<string, number>;
  discoveryPhase?: string;
  interventionUsed?: string;
  keyTopics: string[];
  actionItems: string[];
  extractedAt: string;
}

export default function CoachInsightsPage() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  useEffect(() => {
    const fetchInsights = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getConversationInsights(
          session.user.id,
          timePeriod
        );
        setInsights(data);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load conversation insights. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [session, timePeriod]);

  const filteredInsights = insights.filter((insight) => {
    if (filterTheme !== 'all' && !insight.themes.includes(filterTheme)) {
      return false;
    }
    if (filterSentiment === 'positive' && insight.sentiment < 0.3) {
      return false;
    }
    if (filterSentiment === 'neutral' && (insight.sentiment < -0.3 || insight.sentiment > 0.3)) {
      return false;
    }
    if (filterSentiment === 'negative' && insight.sentiment > -0.3) {
      return false;
    }
    return true;
  });

  const allThemes = Array.from(
    new Set(insights.flatMap((insight) => insight.themes))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversation insights...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Conversation Insights</h1>
            <p className="text-gray-600 mt-1">
              AI-extracted themes and patterns from athlete conversations
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Theme
              </label>
              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Themes</option>
                {allThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Sentiment
              </label>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Insights</h3>
            <p className="text-3xl font-bold text-gray-900">{insights.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Unique Themes</h3>
            <p className="text-3xl font-bold text-gray-900">{allThemes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Sentiment</h3>
            <p className="text-3xl font-bold text-gray-900">
              {insights.length > 0
                ? (insights.reduce((sum, i) => sum + i.sentiment, 0) / insights.length).toFixed(2)
                : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Action Items</h3>
            <p className="text-3xl font-bold text-gray-900">
              {insights.reduce((sum, i) => sum + i.actionItems.length, 0)}
            </p>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-6">
          {filteredInsights.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600">No insights found matching your filters.</p>
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function InsightCard({ insight }: { insight: ConversationInsight }) {
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'bg-green-100 text-green-800';
    if (sentiment < -0.3) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getSentimentColor(
              insight.sentiment
            )}`}
          >
            {getSentimentLabel(insight.sentiment)}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(insight.extractedAt).toLocaleDateString()}
          </span>
        </div>
        {insight.discoveryPhase && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {insight.discoveryPhase}
          </span>
        )}
      </div>

      {/* Themes */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Themes</h4>
        <div className="flex flex-wrap gap-2">
          {insight.themes.map((theme, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Key Topics */}
      {insight.keyTopics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Topics</h4>
          <ul className="list-disc list-inside space-y-1">
            {insight.keyTopics.map((topic, index) => (
              <li key={index} className="text-sm text-gray-600">
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emotions */}
      {insight.emotions && Object.keys(insight.emotions).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Emotions</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(insight.emotions).map(([emotion, score]) => (
              <span
                key={emotion}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {emotion}: {(score * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {insight.actionItems.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Actions</h4>
          <ul className="space-y-2">
            {insight.actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intervention Used */}
      {insight.interventionUsed && (
        <div className="border-t pt-4">
          <span className="text-xs text-gray-500">
            Intervention: <span className="font-medium">{insight.interventionUsed}</span>
          </span>
        </div>
      )}
    </div>
  );
}
