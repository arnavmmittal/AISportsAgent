/**
 * Performance Correlation Matrix Component (React Native)
 *
 * Visualizes correlations between mental state metrics and performance:
 * - Horizontal bar chart showing correlation strength (-1 to +1)
 * - Color coding: green (positive), red (negative)
 * - Significance indicators (p < 0.05)
 * - Sample size display
 * - Actionable insights
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CorrelationResult {
  metric: string;
  correlation: number; // -1 to 1 (Pearson's r)
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  direction: 'positive' | 'negative' | 'none';
  sampleSize: number;
  isSignificant: boolean; // p < 0.05
  insight: string;
}

interface PerformanceCorrelationAnalysis {
  athleteId: string;
  dateRange: { from: Date; to: Date };
  correlations: CorrelationResult[];
  topFactor: CorrelationResult | null;
  recommendations: string[];
}

interface PerformanceCorrelationMatrixProps {
  athleteId: string;
  days?: number;
}

export function PerformanceCorrelationMatrix({ athleteId, days = 90 }: PerformanceCorrelationMatrixProps) {
  const [analysis, setAnalysis] = useState<PerformanceCorrelationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCorrelations();
  }, [athleteId, days]);

  async function fetchCorrelations() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/analytics/performance-correlation?athleteId=${athleteId}&days=${days}`
      );

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

  const getStrengthBadgeColor = (strength: string) => {
    if (strength === 'very_strong' || strength === 'strong') return '#10b981';
    if (strength === 'moderate') return '#f59e0b';
    return '#9ca3af';
  };

  const getStrengthBadgeText = (strength: string) => {
    if (strength === 'very_strong') return 'Very Strong';
    if (strength === 'strong') return 'Strong';
    if (strength === 'moderate') return 'Moderate';
    return 'Weak';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
          <Text style={styles.title}>Mental State ↔ Performance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Analyzing correlations...</Text>
        </View>
      </View>
    );
  }

  if (error || !analysis) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
          <Text style={styles.title}>Mental State ↔ Performance</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{error || 'No correlation data available'}</Text>
        </View>
      </View>
    );
  }

  const { correlations, topFactor, recommendations } = analysis;

  if (correlations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
          <Text style={styles.title}>Mental State ↔ Performance</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="information-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>Not enough data for correlation analysis</Text>
          <Text style={styles.errorSubtext}>
            Need at least 20 performance data points paired with mental state metrics
          </Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  // Prepare data for BarChart (absolute values for visualization)
  const chartData = {
    labels: correlations.map((c) => c.metric),
    datasets: [
      {
        data: correlations.map((c) => Math.abs(c.correlation)),
      },
    ],
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
        <Text style={styles.title}>Mental State ↔ Performance</Text>
      </View>
      <Text style={styles.subtitle}>
        How mental metrics predict performance outcomes over {days} days
      </Text>

      {/* Top Factor Highlight */}
      {topFactor && (
        <View style={styles.topFactor}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.topFactorTitle}>Top Performance Factor</Text>
            <Text style={styles.topFactorInsight}>{topFactor.insight}</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getStrengthBadgeColor(topFactor.strength) },
                ]}
              >
                <Text style={styles.badgeText}>{getStrengthBadgeText(topFactor.strength)}</Text>
              </View>
              {topFactor.isSignificant && (
                <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.badgeText}>Significant</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
                <Text style={styles.badgeText}>{topFactor.sampleSize} games</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Correlation Bar Chart */}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#f9fafb',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 10,
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      {/* Correlation Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Detailed Breakdown</Text>
        {correlations.map((corr) => (
          <View key={corr.metric} style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Text style={styles.metricName}>{corr.metric}</Text>
              <View
                style={[
                  styles.strengthBadge,
                  { backgroundColor: getStrengthBadgeColor(corr.strength) },
                ]}
              >
                <Text style={styles.strengthBadgeText}>{getStrengthBadgeText(corr.strength)}</Text>
              </View>
              {corr.isSignificant && (
                <MaterialCommunityIcons name="check-circle" size={14} color="#10b981" />
              )}
            </View>
            <View style={styles.detailRight}>
              <Text
                style={[
                  styles.correlationValue,
                  { color: corr.correlation > 0 ? '#10b981' : '#ef4444' },
                ]}
              >
                {corr.correlation > 0 ? '+' : ''}
                {corr.correlation.toFixed(2)}
              </Text>
              <Text style={styles.sampleSize}>(n={corr.sampleSize})</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.recommendations}>
          <View style={styles.recommendationsHeader}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#6b7280" />
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
          </View>
          {recommendations.map((rec, idx) => (
            <Text key={idx} style={styles.recommendationText}>
              • {rec}
            </Text>
          ))}
        </View>
      )}

      {/* Interpretation Guide */}
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>How to interpret:</Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>Positive correlation (+):</Text> Higher metric → better performance
        </Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>Negative correlation (-):</Text> Higher metric → worse performance
        </Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>Strong |r| ≥ 0.5:</Text> Reliable predictor of performance
        </Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>Moderate |r| ≥ 0.3:</Text> Contributing factor
        </Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>Weak |r| &lt; 0.3:</Text> Limited predictive value
        </Text>
        <Text style={styles.guideText}>
          • <Text style={styles.guideBold}>✓ Significant:</Text> Statistically reliable (p &lt; 0.05)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  topFactor: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  topFactorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  topFactorInsight: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 16,
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    minWidth: 100,
  },
  strengthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  strengthBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  correlationValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sampleSize: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  recommendations: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendationText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  guide: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  guideText: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    lineHeight: 16,
  },
  guideBold: {
    fontWeight: '600',
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
