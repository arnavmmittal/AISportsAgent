/**
 * AI Insights Dashboard
 *
 * The showcase page for all advanced analytics, ML models, and algorithms.
 * Designed to clearly communicate the value of the platform's intelligence.
 *
 * Demo Mode: Add ?demo=true to URL to see the page with sample data.
 */

'use client';

import { useEffect, useState } from 'react';
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
  Zap,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isDemoMode,
  generateDemoInsights,
  generateDemoTeamSummary,
  type DemoInsight,
  type DemoTeamSummary,
} from '@/lib/demo-data';

interface InsightMetric {
  value: number | string;
  label: string;
  unit?: string;
}

interface Insight {
  id: string;
  category: 'correlation' | 'prediction' | 'effective-technique' | 'pattern' | 'alert';
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

export default function AIInsightsPage() {
  const searchParams = useSearchParams();
  const demoMode = isDemoMode(searchParams);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
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

      // Map demo insights to the page's Insight type
      setInsights(demoInsights.map(i => ({
        ...i,
        category: i.category as Insight['category'],
      })));
      setTeamSummary(demoSummary);
      setGeneratedAt(new Date().toISOString());
      setLoading(false);
    }, 800);
  }

  async function fetchInsights() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach/ai-insights');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      setInsights(data.insights || []);
      setTeamSummary(data.teamSummary || null);
      setGeneratedAt(data.generatedAt || null);
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
    correlation: insights.filter(i => i.category === 'correlation').length,
    prediction: insights.filter(i => i.category === 'prediction').length,
    'effective-technique': insights.filter(i => i.category === 'effective-technique').length,
    pattern: insights.filter(i => i.category === 'pattern').length,
    alert: insights.filter(i => i.category === 'alert').length,
  };

  const filterOptions = [
    { key: 'all', label: 'All Insights', icon: Sparkles },
    { key: 'correlation', label: 'Correlations', icon: BarChart3 },
    { key: 'effective-technique', label: 'Effective Techniques', icon: Target },
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
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5" />
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

            {/* Insights Grid */}
            {otherInsights.length > 0 ? (
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
            ) : (
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
