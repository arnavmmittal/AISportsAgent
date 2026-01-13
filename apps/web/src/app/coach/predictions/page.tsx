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
  X,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

/**
 * Predictions Dashboard - Updated with Design System v2.0
 *
 * Features:
 * - AI-powered performance predictions
 * - Risk level filtering
 * - Contributing factors analysis
 * - Recommended actions
 */

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

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return { bg: 'bg-risk-red', text: 'text-risk-red', badge: 'bg-risk-red/10 text-risk-red' };
      case 'HIGH':
        return { bg: 'bg-warning', text: 'text-warning', badge: 'bg-warning/10 text-warning' };
      case 'MEDIUM':
        return { bg: 'bg-risk-yellow', text: 'text-risk-yellow', badge: 'bg-risk-yellow/10 text-risk-yellow' };
      case 'LOW':
        return { bg: 'bg-risk-green', text: 'text-risk-green', badge: 'bg-risk-green/10 text-risk-green' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' };
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
                <Target className="w-7 h-7 text-primary" />
                Performance Predictions
              </h1>
              <p className="mt-1 text-muted-foreground">
                AI-powered forecasts to help you prepare athletes for peak performance
              </p>
            </div>
            <Button onClick={loadPredictions} disabled={isLoading} variant="outline">
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
            {[
              { label: 'Total', value: summary.total, filter: 'all', color: 'primary' },
              { label: 'Critical', value: summary.critical, filter: 'CRITICAL', color: 'risk-red' },
              { label: 'High', value: summary.high, filter: 'HIGH', color: 'warning' },
              { label: 'Medium', value: summary.medium, filter: 'MEDIUM', color: 'risk-yellow' },
              { label: 'Low', value: summary.low, filter: 'LOW', color: 'risk-green' },
              { label: 'Confidence', value: `${(summary.avgConfidence * 100).toFixed(0)}%`, filter: null, color: 'info' },
            ].map((stat, i) => (
              <button
                key={i}
                onClick={() => stat.filter && setFilter(stat.filter)}
                disabled={!stat.filter}
                className={cn(
                  "card-elevated p-4 text-left transition-all",
                  stat.filter && filter === stat.filter && "ring-2 ring-primary",
                  stat.filter && "cursor-pointer hover:shadow-md"
                )}
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={cn("text-2xl font-bold mt-1", `text-${stat.color}`)}>{stat.value}</p>
              </button>
            ))}
          </div>
        )}

        {/* Predictions List */}
        {isLoading ? (
          <div className="card-elevated p-12 text-center animate-slide-up">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Generating predictions...</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="card-elevated p-12 text-center animate-slide-up">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No predictions available</h3>
            <p className="text-muted-foreground">
              Athletes need mood logs and activity data to generate predictions
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {filteredPredictions.map((prediction) => {
              const styles = getRiskStyles(prediction.riskLevel);
              return (
                <div
                  key={prediction.athleteId}
                  className="card-elevated overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Main Info */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{prediction.athleteName}</h3>
                          <p className="text-sm text-muted-foreground">{prediction.sport}</p>
                        </div>
                        <span className={cn("px-3 py-1 rounded-lg text-xs font-semibold", styles.badge)}>
                          {prediction.riskLevel} RISK
                        </span>
                      </div>

                      {/* Prediction Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Predicted Change</p>
                          <p className={cn(
                            "text-xl font-bold",
                            prediction.predictedDeviation >= 0 ? 'text-risk-green' : 'text-risk-red'
                          )}>
                            {prediction.predictedDeviation >= 0 ? '+' : ''}
                            {(prediction.predictedDeviation * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                          <p className="text-xl font-bold text-info">
                            {(prediction.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data Quality</p>
                          <p className="text-xl font-bold text-primary">
                            {(prediction.features.dataQuality * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recent Mood</p>
                          <p className="text-xl font-bold text-foreground">
                            {prediction.features.moodAvg?.toFixed(1) || '-'}/10
                          </p>
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      {prediction.contributingFactors.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contributing Factors</p>
                          <div className="flex flex-wrap gap-2">
                            {prediction.contributingFactors.slice(0, 4).map((factor, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                                  factor.impact < 0 ? 'bg-risk-red/10 text-risk-red' : 'bg-risk-green/10 text-risk-green'
                                )}
                              >
                                {getFactorIcon(factor.factor)}
                                <span>{formatFactor(factor.factor)}</span>
                                <span className="font-semibold">
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
                          className="text-primary hover:underline font-medium text-sm flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/coach/athletes/${prediction.athleteId}`)}
                          className="text-muted-foreground hover:text-foreground font-medium text-sm flex items-center gap-1"
                        >
                          View Profile
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Recommendations Sidebar */}
                    {prediction.recommendedActions.length > 0 && (
                      <div className={cn("lg:w-72 p-5 text-white", styles.bg)}>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Recommended Actions
                        </h4>
                        <div className="space-y-2">
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
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className={cn("p-5 text-white", getRiskStyles(selectedPrediction.riskLevel).bg)}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedPrediction.athleteName}</h2>
                  <p className="opacity-80">{selectedPrediction.sport}</p>
                </div>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Prediction Summary */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Prediction Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Change</p>
                    <p className={cn(
                      "text-xl font-bold",
                      selectedPrediction.predictedDeviation >= 0 ? 'text-risk-green' : 'text-risk-red'
                    )}>
                      {selectedPrediction.predictedDeviation >= 0 ? '+' : ''}
                      {(selectedPrediction.predictedDeviation * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-xl font-bold text-info">
                      {(selectedPrediction.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
                    <p className="text-xl font-bold text-primary">
                      {(selectedPrediction.features.dataQuality * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Current State</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Activity, label: 'Mood', value: selectedPrediction.features.moodAvg?.toFixed(1) || '-', suffix: '/10', color: 'text-primary' },
                    { icon: Target, label: 'Confidence', value: selectedPrediction.features.confidenceAvg?.toFixed(1) || '-', suffix: '/10', color: 'text-risk-green' },
                    { icon: Zap, label: 'Stress', value: selectedPrediction.features.stressAvg?.toFixed(1) || '-', suffix: '/10', color: 'text-risk-yellow' },
                    { icon: Moon, label: 'Sleep', value: selectedPrediction.features.sleepAvg?.toFixed(1) || '-', suffix: 'h', color: 'text-info' },
                    { icon: Heart, label: 'HRV', value: selectedPrediction.features.hrvAvg?.toFixed(0) || '-', suffix: ' ms', color: 'text-risk-red' },
                    { icon: Activity, label: 'Recovery', value: selectedPrediction.features.recoveryScore?.toFixed(0) || '-', suffix: '%', color: 'text-primary' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <item.icon className={cn("w-6 h-6", item.color)} />
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-semibold text-foreground">{item.value}{item.suffix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">All Contributing Factors</h3>
                <div className="space-y-2">
                  {selectedPrediction.contributingFactors.map((factor, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        factor.impact < 0 ? 'bg-risk-red/5' : 'bg-risk-green/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getFactorIcon(factor.factor)}
                        <span className="font-medium text-foreground">{formatFactor(factor.factor)}</span>
                        {factor.actionable && (
                          <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">
                            Actionable
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "font-semibold",
                        factor.impact < 0 ? 'text-risk-red' : 'text-risk-green'
                      )}>
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
                  <h3 className="font-semibold text-foreground mb-3">Recommended Actions</h3>
                  <div className="space-y-2">
                    {selectedPrediction.recommendedActions.map((action, i) => (
                      <div key={i} className="p-3 rounded-lg bg-info/5 border border-info/10">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-info mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">{action.action}</p>
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

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => router.push(`/coach/athletes/${selectedPrediction.athleteId}`)}
                  className="flex-1"
                >
                  View Athlete Profile
                </Button>
                <Button variant="outline" onClick={() => setSelectedPrediction(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
