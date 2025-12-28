'use client';

/**
 * Readiness Breakdown Component
 *
 * Displays detailed signal breakdown for athlete readiness score
 * - Shows individual metric contributions
 * - Indicates data sources (daily vs weekly)
 * - Displays risk penalties
 * - Confidence indicator
 */

import { ReadinessOutput, ReadinessLevel, getReadinessColorClass } from '@/lib/readiness-score';

interface ReadinessBreakdownProps {
  readiness: ReadinessOutput;
  expanded?: boolean;
}

export default function ReadinessBreakdown({
  readiness,
  expanded = false,
}: ReadinessBreakdownProps) {
  const { score, level, confidence, signals } = readiness;

  const getSourceIcon = (source: 'daily' | 'weekly' | 'activity' | 'blended') => {
    switch (source) {
      case 'daily':
        return '📅'; // Daily snapshot
      case 'weekly':
        return '📊'; // Weekly trend
      case 'blended':
        return '🔀'; // Blended data
      case 'activity':
        return '💬'; // Activity metrics
    }
  };

  const getSourceLabel = (source: 'daily' | 'weekly' | 'activity' | 'blended') => {
    switch (source) {
      case 'daily':
        return 'Daily Log';
      case 'weekly':
        return 'Weekly Trend';
      case 'blended':
        return 'Blended (70% daily + 30% weekly)';
      case 'activity':
        return 'Platform Activity';
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 8) return 'text-green-600';
    if (value >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const confidencePercentage = Math.round(confidence * 100);

  if (!expanded) {
    // Compact view
    return (
      <div className="flex items-center space-x-3">
        <div className={`px-3 py-1 rounded-lg font-bold text-lg ${getReadinessColorClass(level)}`}>
          {score}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">{level}</div>
          <div className="text-xs text-muted-foreground">
            Confidence: {confidencePercentage}% • Source: {getSourceIcon(signals.mood.source)}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      {/* Header */}
      <div className={`p-4 border-b border-border ${getReadinessColorClass(level)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Readiness Score: {score}</h3>
            <p className="text-sm opacity-80">{level}</p>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">Data Confidence</div>
            <div className="text-xl font-bold">{confidencePercentage}%</div>
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Signal Breakdown:</h4>

        {/* Mood */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">😊</span>
            <span className="text-sm font-medium text-muted-foreground">Mood</span>
            <span className="text-xs text-muted-foreground">({Math.round(signals.mood.weight * 100)}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getScoreColor(signals.mood.value)}`}>
              {signals.mood.value.toFixed(1)}/10
            </span>
            <span className="text-xs" title={getSourceLabel(signals.mood.source)}>
              {getSourceIcon(signals.mood.source)}
            </span>
          </div>
        </div>

        {/* Stress (inverted) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">😰</span>
            <span className="text-sm font-medium text-muted-foreground">Stress</span>
            <span className="text-xs text-muted-foreground">({Math.round(signals.stress.weight * 100)}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getScoreColor(10 - signals.stress.value)}`}>
              {signals.stress.value.toFixed(1)}/10
            </span>
            <span className="text-xs" title={getSourceLabel(signals.stress.source)}>
              {getSourceIcon(signals.stress.source)}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">💪</span>
            <span className="text-sm font-medium text-muted-foreground">Confidence</span>
            <span className="text-xs text-muted-foreground">({Math.round(signals.confidence.weight * 100)}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getScoreColor(signals.confidence.value)}`}>
              {signals.confidence.value.toFixed(1)}/10
            </span>
            <span className="text-xs" title={getSourceLabel(signals.confidence.source)}>
              {getSourceIcon(signals.confidence.source)}
            </span>
          </div>
        </div>

        {/* Sleep */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">😴</span>
            <span className="text-sm font-medium text-muted-foreground">Sleep</span>
            <span className="text-xs text-muted-foreground">({Math.round(signals.sleep.weight * 100)}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getScoreColor(signals.sleep.value)}`}>
              {signals.sleep.value.toFixed(1)}/10
            </span>
            <span className="text-xs" title={getSourceLabel(signals.sleep.source)}>
              {getSourceIcon(signals.sleep.source)}
            </span>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎯</span>
            <span className="text-sm font-medium text-muted-foreground">Engagement</span>
            <span className="text-xs text-muted-foreground">({Math.round(signals.engagement.weight * 100)}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getScoreColor(signals.engagement.value)}`}>
              {signals.engagement.value.toFixed(1)}/10
            </span>
            <span className="text-xs" title={getSourceLabel(signals.engagement.source)}>
              {getSourceIcon(signals.engagement.source)}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Penalties */}
      {signals.riskPenalty > 0 && (
        <div className="border-t border-border bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-semibold text-red-800">Risk Flags Detected</span>
            </div>
            <span className="text-sm font-bold text-red-800">-{signals.riskPenalty} pts</span>
          </div>
        </div>
      )}

      {/* Calculation Summary */}
      <div className="border-t border-border bg-background p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Raw Score:</span>
          <span className="font-mono">{signals.rawScore}</span>
        </div>
        {signals.riskPenalty > 0 && (
          <div className="flex items-center justify-between text-xs text-red-600 mb-1">
            <span>Risk Penalty:</span>
            <span className="font-mono">-{signals.riskPenalty}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm font-semibold text-foreground pt-1 border-t border-border">
          <span>Final Score:</span>
          <span className="font-mono">{signals.finalScore}</span>
        </div>
      </div>

      {/* Data Source Legend */}
      <div className="border-t border-border p-4 bg-blue-50">
        <div className="text-xs text-blue-800">
          <div className="font-semibold mb-1">Data Sources:</div>
          <div className="space-y-1">
            <div>📅 Daily Log = Today's athlete-submitted mood log</div>
            <div>📊 Weekly Trend = Past 7 days AI-generated summary</div>
            <div>🔀 Blended = 70% daily + 30% weekly</div>
            <div>💬 Platform Activity = Chat engagement metrics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
