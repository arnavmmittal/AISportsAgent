'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Moon,
  Heart,
  Zap,
  RefreshCw,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ContributingFactor {
  factor: string;
  impact: number;
  actionable: boolean;
}

interface RecommendedAction {
  action: string;
  expectedImpact: number;
}

interface AthletePrediction {
  athleteId: string;
  athleteName: string;
  sport: string;
  predictedDeviation: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: ContributingFactor[];
  recommendedActions: RecommendedAction[];
  features: {
    moodAvg: number | null;
    confidenceAvg: number | null;
    stressAvg: number | null;
    sleepAvg: number | null;
    hrvAvg: number | null;
    recoveryScore: number | null;
    dataQuality: number;
  };
}

interface PredictionSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgConfidence: number;
}

export default function PredictionsDashboard() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<AthletePrediction[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<AthletePrediction | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const loadPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/predictions');
      if (!response.ok) throw new Error('Failed to load predictions');

      const data = await response.json();
      setPredictions(data.predictions || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const filteredPredictions = predictions.filter((p) => {
    if (filter === 'all') return true;
    return p.riskLevel === filter;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'from-red-500 to-red-600';
      case 'HIGH':
        return 'from-orange-500 to-orange-600';
      case 'MEDIUM':
        return 'from-yellow-500 to-yellow-600';
      case 'LOW':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFactor = (factor: string) => {
    return factor.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getFactorIcon = (factor: string) => {
    if (factor.includes('mood')) return <Activity className="w-4 h-4" />;
    if (factor.includes('confidence')) return <Target className="w-4 h-4" />;
    if (factor.includes('stress')) return <Zap className="w-4 h-4" />;
    if (factor.includes('sleep')) return <Moon className="w-4 h-4" />;
    if (factor.includes('recovery') || factor.includes('hrv')) return <Heart className="w-4 h-4" />;
    if (factor.includes('trend') || factor.includes('momentum')) return <TrendingUp className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Performance Predictions
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              AI-powered forecasts to help you prepare athletes for peak performance
            </p>
          </div>
          <button
            onClick={loadPredictions}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Predictions
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div
              onClick={() => setFilter('all')}
              className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all ${filter === 'all' ? 'ring-4 ring-blue-300' : ''}`}
            >
              <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-black mt-1">{summary.total}</p>
            </div>

            <div
              onClick={() => setFilter('CRITICAL')}
              className={`bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all ${filter === 'CRITICAL' ? 'ring-4 ring-red-300' : ''}`}
            >
              <p className="text-sm font-bold text-red-100 uppercase tracking-wider">Critical</p>
              <p className="text-3xl font-black mt-1">{summary.critical}</p>
            </div>

            <div
              onClick={() => setFilter('HIGH')}
              className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all ${filter === 'HIGH' ? 'ring-4 ring-orange-300' : ''}`}
            >
              <p className="text-sm font-bold text-orange-100 uppercase tracking-wider">High</p>
              <p className="text-3xl font-black mt-1">{summary.high}</p>
            </div>

            <div
              onClick={() => setFilter('MEDIUM')}
              className={`bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all ${filter === 'MEDIUM' ? 'ring-4 ring-yellow-300' : ''}`}
            >
              <p className="text-sm font-bold text-yellow-100 uppercase tracking-wider">Medium</p>
              <p className="text-3xl font-black mt-1">{summary.medium}</p>
            </div>

            <div
              onClick={() => setFilter('LOW')}
              className={`bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all ${filter === 'LOW' ? 'ring-4 ring-green-300' : ''}`}
            >
              <p className="text-sm font-bold text-green-100 uppercase tracking-wider">Low</p>
              <p className="text-3xl font-black mt-1">{summary.low}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
              <p className="text-sm font-bold text-purple-100 uppercase tracking-wider">Avg Confidence</p>
              <p className="text-3xl font-black mt-1">{(summary.avgConfidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {isLoading ? (
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-4 text-muted-foreground">Generating predictions...</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">No predictions available</h3>
            <p className="mt-2 text-muted-foreground">
              Athletes need mood logs and activity data to generate predictions
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPredictions.map((prediction) => (
              <div
                key={prediction.athleteId}
                className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Main Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{prediction.athleteName}</h3>
                        <p className="text-sm text-muted-foreground">{prediction.sport}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getRiskBadgeColor(prediction.riskLevel)}`}>
                        {prediction.riskLevel} RISK
                      </span>
                    </div>

                    {/* Prediction Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Predicted Change</p>
                        <p className={`text-2xl font-black ${prediction.predictedDeviation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {prediction.predictedDeviation >= 0 ? '+' : ''}
                          {(prediction.predictedDeviation * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                        <p className="text-2xl font-black text-blue-500">
                          {(prediction.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data Quality</p>
                        <p className="text-2xl font-black text-purple-500">
                          {(prediction.features.dataQuality * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recent Mood</p>
                        <p className="text-2xl font-black">
                          {prediction.features.moodAvg?.toFixed(1) || '-'}/10
                        </p>
                      </div>
                    </div>

                    {/* Contributing Factors */}
                    {prediction.contributingFactors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-muted-foreground mb-2">Contributing Factors</p>
                        <div className="flex flex-wrap gap-2">
                          {prediction.contributingFactors.slice(0, 4).map((factor, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${factor.impact < 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}
                            >
                              {getFactorIcon(factor.factor)}
                              <span>{formatFactor(factor.factor)}</span>
                              <span className="font-bold">
                                {factor.impact >= 0 ? '+' : ''}
                                {(factor.impact * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedPrediction(prediction)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold text-sm flex items-center gap-1"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/coach/athletes/${prediction.athleteId}`)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-sm flex items-center gap-1"
                      >
                        View Profile
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recommendations Sidebar */}
                  {prediction.recommendedActions.length > 0 && (
                    <div className={`lg:w-80 p-6 bg-gradient-to-br ${getRiskColor(prediction.riskLevel)} text-white`}>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Recommended Actions
                      </h4>
                      <div className="space-y-3">
                        {prediction.recommendedActions.map((action, i) => (
                          <div key={i} className="bg-white/20 rounded-lg p-3">
                            <p className="text-sm">{action.action}</p>
                            <p className="text-xs mt-1 opacity-80">
                              Expected impact: +{(action.expectedImpact * 100).toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 bg-gradient-to-br ${getRiskColor(selectedPrediction.riskLevel)} text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black">{selectedPrediction.athleteName}</h2>
                  <p className="opacity-80">{selectedPrediction.sport}</p>
                </div>
                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-white/20">
                  {selectedPrediction.riskLevel} RISK
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Prediction Summary */}
              <div>
                <h3 className="font-bold mb-3">Prediction Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Change</p>
                    <p className={`text-2xl font-black ${selectedPrediction.predictedDeviation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedPrediction.predictedDeviation >= 0 ? '+' : ''}
                      {(selectedPrediction.predictedDeviation * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-2xl font-black text-blue-500">
                      {(selectedPrediction.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
                    <p className="text-2xl font-black text-purple-500">
                      {(selectedPrediction.features.dataQuality * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div>
                <h3 className="font-bold mb-3">Current State</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mood</p>
                      <p className="font-bold">{selectedPrediction.features.moodAvg?.toFixed(1) || '-'}/10</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Target className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="font-bold">{selectedPrediction.features.confidenceAvg?.toFixed(1) || '-'}/10</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Zap className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stress</p>
                      <p className="font-bold">{selectedPrediction.features.stressAvg?.toFixed(1) || '-'}/10</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Moon className="w-8 h-8 text-indigo-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sleep</p>
                      <p className="font-bold">{selectedPrediction.features.sleepAvg?.toFixed(1) || '-'}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Heart className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">HRV</p>
                      <p className="font-bold">{selectedPrediction.features.hrvAvg?.toFixed(0) || '-'} ms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <Activity className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recovery</p>
                      <p className="font-bold">{selectedPrediction.features.recoveryScore?.toFixed(0) || '-'}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h3 className="font-bold mb-3">All Contributing Factors</h3>
                <div className="space-y-2">
                  {selectedPrediction.contributingFactors.map((factor, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-xl ${factor.impact < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        {getFactorIcon(factor.factor)}
                        <span className="font-medium">{formatFactor(factor.factor)}</span>
                        {factor.actionable && (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                            Actionable
                          </span>
                        )}
                      </div>
                      <span className={`font-bold ${factor.impact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {factor.impact >= 0 ? '+' : ''}
                        {(factor.impact * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {selectedPrediction.recommendedActions.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3">Recommended Actions</h3>
                  <div className="space-y-3">
                    {selectedPrediction.recommendedActions.map((action, i) => (
                      <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">{action.action}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Expected improvement: +{(action.expectedImpact * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => router.push(`/coach/athletes/${selectedPrediction.athleteId}`)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                >
                  View Athlete Profile
                </button>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-foreground rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
