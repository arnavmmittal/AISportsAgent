/**
 * AI Insights Dashboard
 *
 * The showcase page for all advanced analytics, ML models, and algorithms.
 * Designed to clearly communicate the value of the platform's intelligence.
 *
 * Demo Mode: Add ?demo=true to URL to see the page with sample data.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  InsightCard,
  FeaturedInsightCard,
  InsightSummaryBar
} from '@/components/coach/insights/InsightCard';
import {
  Brain,
  Sparkles,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronRight,
  FlaskConical,
  MessageSquare,
  Flame,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isDemoMode,
  generateDemoInsights,
  generateDemoTeamSummary,
  generateDemoChatInsights,
  generateDemoTeamForecast,
  type DemoInsight,
  type DemoTeamSummary,
  type DemoChatInsightsResponse,
  type DemoTeamForecast,
} from '@/lib/demo-data';
import { ChatInsightsPanel } from '@/components/coach/insights/ChatInsightsPanel';

interface InsightMetric {
  value: number | string;
  label: string;
  unit?: string;
}

interface Insight {
  id: string;
  category: 'correlation' | 'prediction' | 'effective-technique' | 'pattern' | 'alert' | 'burnout' | 'forecast' | 'intervention';
  priority: 'high' | 'medium' | 'low';
  headline: string;
  detail: string;
  metric?: InsightMetric;
  athleteId?: string;
  athleteName?: string;
  actionable?: string;
  confidence: number;
  evidence: string;
}

interface TeamForecast {
  avgPredictedScore: number;
  trend: 'improving' | 'declining' | 'stable';
  atRiskDays: { date: string; athleteCount: number }[];
  athletesWithDecline: { id: string; name: string; predictedLow: number; dayOfWeek: string }[];
}

interface TeamSummary {
  totalAthletes: number;
  athletesWithData: number;
  avgReadiness: number;
  avgCorrelation: number;
  topCorrelatedFactor: string;
  atRiskCount: number;
  improvingCount: number;
  decliningCount: number;
}

interface ChatInsightsData {
  teamSentiment: {
    current: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
  topThemes: {
    theme: string;
    count: number;
    athletes: string[];
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentHistory: {
    date: string;
    avgSentiment: number;
    sessionCount: number;
  }[];
  disengagedAthletes: {
    id: string;
    name: string;
    sport: string | null;
    daysSinceChat: number;
    lastChatDate: string | null;
  }[];
  concerningAthletes: {
    id: string;
    name: string;
    sport: string | null;
    concerningTopics: string[];
    avgSentiment: number;
    recentSessions: number;
  }[];
  stats: {
    totalSessions: number;
    athletesWithChats: number;
    avgSessionsPerAthlete: number;
    chatEngagementRate: number;
  };
}

function AIInsightsPageContent() {
  const searchParams = useSearchParams();
  const demoMode = isDemoMode(searchParams);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [teamForecast, setTeamForecast] = useState<TeamForecast | null>(null);
  const [chatInsights, setChatInsights] = useState<ChatInsightsData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (demoMode) {
      loadDemoData();
    } else {
      fetchInsights();
    }
  }, [demoMode]);

  function loadDemoData() {
    setLoading(true);
    // Simulate loading delay for realistic feel
    setTimeout(() => {
      const demoInsights = generateDemoInsights();
      const demoSummary = generateDemoTeamSummary();
      const demoChatInsights = generateDemoChatInsights();
      const demoForecast = generateDemoTeamForecast();

      // Map demo insights to the page's Insight type
      setInsights(demoInsights.map(i => ({
        ...i,
        category: i.category as Insight['category'],
      })));
      setTeamSummary(demoSummary);
      setTeamForecast(demoForecast);
      setChatInsights(demoChatInsights);
      setGeneratedAt(new Date().toISOString());
      setLoading(false);
    }, 800);
  }

  async function fetchInsights() {
    setLoading(true);
    setError(null);

    try {
      // Fetch both AI insights and chat insights in parallel
      const [insightsResponse, chatResponse] = await Promise.all([
        fetch('/api/coach/ai-insights'),
        fetch('/api/coach/chat-insights'),
      ]);

      const insightsData = await insightsResponse.json();
      const chatData = await chatResponse.json();

      if (!insightsResponse.ok) {
        throw new Error(insightsData.error || 'Failed to fetch insights');
      }

      setInsights(insightsData.insights || []);
      setTeamSummary(insightsData.teamSummary || null);
      setTeamForecast(insightsData.teamForecast || null);
      setGeneratedAt(insightsData.generatedAt || null);

      // Chat insights are optional - don't fail if they're not available
      if (chatResponse.ok) {
        setChatInsights(chatData);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  // Filter insights by category
  const filteredInsights = activeFilter === 'all'
    ? insights
    : insights.filter(i => i.category === activeFilter);

  // Get the featured insight (highest priority)
  const featuredInsight = insights.find(i => i.priority === 'high');
  const otherInsights = featuredInsight
    ? filteredInsights.filter(i => i.id !== featuredInsight.id)
    : filteredInsights;

  // Count insights by category
  const categoryCounts = {
    all: insights.length,
    conversation: chatInsights?.stats.totalSessions || 0,
    burnout: insights.filter(i => i.category === 'burnout').length,
    forecast: insights.filter(i => i.category === 'forecast').length,
    correlation: insights.filter(i => i.category === 'correlation').length,
    prediction: insights.filter(i => i.category === 'prediction').length,
    'effective-technique': insights.filter(i => i.category === 'effective-technique' || i.category === 'intervention').length,
    pattern: insights.filter(i => i.category === 'pattern').length,
    alert: insights.filter(i => i.category === 'alert').length,
  };

  const filterOptions = [
    { key: 'all', label: 'All Insights', icon: Sparkles },
    { key: 'burnout', label: 'Burnout Risk', icon: Flame },
    { key: 'forecast', label: 'Forecasts', icon: Calendar },
    { key: 'conversation', label: 'Conversations', icon: MessageSquare },
    { key: 'correlation', label: 'Correlations', icon: BarChart3 },
    { key: 'effective-technique', label: 'Techniques', icon: Target },
    { key: 'pattern', label: 'Patterns', icon: TrendingUp },
    { key: 'alert', label: 'Alerts', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-200 font-medium">Demo Mode Active</p>
              <p className="text-amber-300/70 text-sm">
                Viewing sample data. Remove <code className="bg-amber-500/20 px-1 rounded">?demo=true</code> from URL to see real data.
              </p>
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 -mr-48 -mt-48 opacity-10">
            <Brain className="w-full h-full" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Insights</h1>
                <p className="text-slate-400">
                  Machine learning-powered analytics for your team
                </p>
              </div>
            </div>

            {/* What Powers This Section */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Powered by Advanced Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                  <div>
                    <span className="text-white font-medium">Pearson Correlation</span>
                    <p className="text-slate-400 text-xs">Statistical significance testing (p &lt; 0.05)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                  <div>
                    <span className="text-white font-medium">ML Risk Models</span>
                    <p className="text-slate-400 text-xs">Predictive performance & burnout risk</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
                  <div>
                    <span className="text-white font-medium">Intervention Tracking</span>
                    <p className="text-slate-400 text-xs">Per-athlete effectiveness scores</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                  <div>
                    <span className="text-white font-medium">Pattern Detection</span>
                    <p className="text-slate-400 text-xs">Slump detection & trend analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-slate-400">Analyzing your team data...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Insights</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchInsights}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Summary Bar */}
            {teamSummary && (
              <InsightSummaryBar
                correlationsFound={insights.filter(i => i.category === 'correlation').length}
                athletesAnalyzed={teamSummary.athletesWithData}
                atRiskCount={teamSummary.atRiskCount}
                effectiveTechniques={insights.filter(i => i.category === 'effective-technique').length}
              />
            )}

            {/* Team Forecast Overview */}
            {teamForecast && teamForecast.athletesWithDecline.length > 0 && (
              <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">7-Day Team Forecast</h3>
                      <p className="text-sm text-slate-400">Predicted readiness trends</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {teamForecast.trend === 'declining' ? (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : teamForecast.trend === 'improving' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : null}
                    <span className={cn(
                      'text-sm font-medium',
                      teamForecast.trend === 'declining' ? 'text-red-400' :
                      teamForecast.trend === 'improving' ? 'text-green-400' : 'text-slate-400'
                    )}>
                      {teamForecast.trend === 'declining' ? 'Team declining' :
                       teamForecast.trend === 'improving' ? 'Team improving' : 'Stable'}
                    </span>
                  </div>
                </div>

                {/* Athletes with predicted decline */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Athletes with predicted dips this week
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {teamForecast.athletesWithDecline.map((athlete) => (
                      <div
                        key={athlete.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div>
                          <span className="text-sm font-medium text-white">{athlete.name}</span>
                          <p className="text-xs text-slate-400">{athlete.dayOfWeek} low</p>
                        </div>
                        <span className={cn(
                          'text-lg font-bold tabular-nums',
                          athlete.predictedLow < 50 ? 'text-red-400' :
                          athlete.predictedLow < 60 ? 'text-amber-400' : 'text-yellow-400'
                        )}>
                          {athlete.predictedLow}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* At-risk days summary */}
                {teamForecast.atRiskDays.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400">
                      <span className="text-white font-medium">Watch days:</span>{' '}
                      {teamForecast.atRiskDays.map((d, i) => (
                        <span key={d.date}>
                          {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })} ({d.athleteCount} at-risk)
                          {i < teamForecast.atRiskDays.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Featured Insight */}
            {featuredInsight && activeFilter === 'all' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Top Insight
                </h2>
                <FeaturedInsightCard
                  category={featuredInsight.category}
                  headline={featuredInsight.headline}
                  detail={featuredInsight.detail}
                  metric={featuredInsight.metric}
                  confidence={featuredInsight.confidence}
                  evidence={featuredInsight.evidence}
                  actionable={featuredInsight.actionable}
                />
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-4">
              {filterOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeFilter === key
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {categoryCounts[key as keyof typeof categoryCounts] > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs',
                      activeFilter === key ? 'bg-white/20' : 'bg-slate-700'
                    )}>
                      {categoryCounts[key as keyof typeof categoryCounts]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Conversation Insights Panel */}
            {activeFilter === 'conversation' && chatInsights && (
              <ChatInsightsPanel data={chatInsights} />
            )}

            {/* Conversation Empty State */}
            {activeFilter === 'conversation' && !chatInsights && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Conversation Data Yet
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Conversation insights appear when athletes chat with the AI coach.
                  Encourage athletes to use the chat feature for mental performance support.
                </p>
              </div>
            )}

            {/* Insights Grid (for non-conversation filters) */}
            {activeFilter !== 'conversation' && otherInsights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    category={insight.category}
                    priority={insight.priority}
                    headline={insight.headline}
                    detail={insight.detail}
                    metric={insight.metric}
                    athleteName={insight.athleteName}
                    confidence={insight.confidence}
                    evidence={insight.evidence}
                    actionable={insight.actionable}
                  />
                ))}
              </div>
            )}

            {/* Empty State (for non-conversation filters) */}
            {activeFilter !== 'conversation' && otherInsights.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeFilter === 'all'
                    ? 'No Insights Available Yet'
                    : `No ${activeFilter} insights found`}
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  {activeFilter === 'all'
                    ? 'Insights are generated when there\'s enough data. Make sure athletes are logging their moods and you\'ve imported game performance data.'
                    : 'Try selecting a different category or ensure you have enough data for this type of analysis.'}
                </p>
                {activeFilter === 'all' && (
                  <div className="mt-6 flex justify-center gap-4">
                    <a
                      href="/coach/data?tab=import"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      Import Game Data
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Generation Timestamp */}
            {generatedAt && (
              <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
                Last analyzed: {new Date(generatedAt).toLocaleString()}
                <button
                  onClick={fetchInsights}
                  className="ml-2 text-primary hover:underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading AI Insights...</p>
      </div>
    </div>
  );
}

export default function AIInsightsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AIInsightsPageContent />
    </Suspense>
  );
}
