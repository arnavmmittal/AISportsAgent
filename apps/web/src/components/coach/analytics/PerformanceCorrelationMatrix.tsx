/**
 * Performance Correlation Matrix Component
 *
 * Visualizes correlations between mental state metrics and performance:
 * - Bar chart showing correlation strength (-1 to +1)
 * - Color coding: green (positive), red (negative)
 * - Significance indicators (p < 0.05)
 * - Sample size display
 * - Actionable insights
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { PerformanceCorrelationAnalysis, CorrelationResult } from '@/lib/analytics/performance-correlation';

interface PerformanceCorrelationMatrixProps {
  athleteId: string;
  days?: number;
}

export function PerformanceCorrelationMatrix({ athleteId, days = 90 }: PerformanceCorrelationMatrixProps) {
  const [analysis, setAnalysis] = useState<PerformanceCorrelationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCorrelations() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/analytics/performance-correlation?athleteId=${athleteId}&days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch performance correlations');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to analyze correlations');
        }

        setAnalysis(result.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching performance correlations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load correlation analysis');
        setIsLoading(false);
      }
    }

    fetchCorrelations();
  }, [athleteId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Mental State ↔ Performance Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Analyzing correlations...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Mental State ↔ Performance Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{error || 'No correlation data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { correlations, topFactor, recommendations } = analysis;

  if (correlations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Mental State ↔ Performance Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-2">Not enough data for correlation analysis</p>
            <p className="text-sm text-muted-foreground">
              Need at least 20 performance data points paired with mental state metrics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData = correlations.map((c) => ({
    metric: c.metric,
    correlation: c.correlation,
    absCorrelation: Math.abs(c.correlation),
    color: c.correlation > 0 ? '#10b981' : '#ef4444',
    isSignificant: c.isSignificant,
    sampleSize: c.sampleSize,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const corr = correlations.find((c) => c.metric === data.metric)!;

      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-sm font-bold mb-1">{data.metric}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            r = {data.correlation.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Strength: {corr.strength.replace('_', ' ')}
          </p>
          <p className="text-xs text-muted-foreground">
            Sample size: {data.sampleSize} paired observations
          </p>
          {data.isSignificant && (
            <Badge variant="outline" className="mt-2 text-xs bg-secondary/10 text-secondary border-secondary/20 dark:bg-secondary/10/20 dark:text-accent dark:border-secondary">
              Statistically significant (p &lt; 0.05)
            </Badge>
          )}
        </div>
      );
    }
    return null;
  };

  const getStrengthBadge = (strength: string) => {
    if (strength === 'very_strong' || strength === 'strong') {
      return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 dark:bg-secondary/10/20 dark:text-accent dark:border-secondary">Strong</Badge>;
    } else if (strength === 'moderate') {
      return <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted dark:bg-muted-foreground/10/20 dark:text-muted-foreground dark:border-muted-foreground">Moderate</Badge>;
    } else {
      return <Badge variant="default">Weak</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Mental State ↔ Performance Correlation
        </CardTitle>
        <CardDescription>
          How mental metrics predict performance outcomes over {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Top Factor Highlight */}
        {topFactor && (
          <div className="mb-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Top Performance Factor</p>
                <p className="text-sm mt-1">{topFactor.insight}</p>
                <div className="flex gap-2 mt-2">
                  {getStrengthBadge(topFactor.strength)}
                  {topFactor.isSignificant && (
                    <Badge variant="success">Significant</Badge>
                  )}
                  <Badge variant="default">{topFactor.sampleSize} games</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 12 }}
            />
            <YAxis type="category" dataKey="metric" tick={{ fontSize: 12 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#6b7280" strokeWidth={2} />
            <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={entry.isSignificant ? 1 : 0.5} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Correlation Details Table */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Detailed Breakdown</p>
          {correlations.map((corr) => (
            <div
              key={corr.metric}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-32">{corr.metric}</span>
                {getStrengthBadge(corr.strength)}
                {corr.isSignificant && (
                  <CheckCircle className="h-4 w-4 text-secondary" />
                )}
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: corr.correlation > 0 ? '#10b981' : '#ef4444' }}
                >
                  {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (n={corr.sampleSize})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Recommendations
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Interpretation Guide */}
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">How to interpret:</p>
          <p>• <strong>Positive correlation (+):</strong> Higher metric → better performance</p>
          <p>• <strong>Negative correlation (-):</strong> Higher metric → worse performance</p>
          <p>• <strong>Strong |r| ≥ 0.5:</strong> Reliable predictor of performance</p>
          <p>• <strong>Moderate |r| ≥ 0.3:</strong> Contributing factor</p>
          <p>• <strong>Weak |r| &lt; 0.3:</strong> Limited predictive value</p>
          <p>• <strong>✓ Significant:</strong> Statistically reliable (p &lt; 0.05)</p>
        </div>
      </CardContent>
    </Card>
  );
}
