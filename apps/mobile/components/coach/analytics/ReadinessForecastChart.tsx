/**
 * Readiness Forecast Component (React Native)
 *
 * Displays 7-day readiness forecast with:
 * - Historical trend line (past 30 days)
 * - Forecast line (7 days ahead)
 * - Risk flags and alerts
 * - Actionable recommendations
 * - Forecast details table
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ForecastPoint {
  date: string; // YYYY-MM-DD
  predictedScore: number; // 0-100
  lowerBound: number; // predictedScore - 1 std dev
  upperBound: number; // predictedScore + 1 std dev
  confidence: 'high' | 'medium' | 'low';
}

interface ReadinessForecast {
  athleteId: string;
  historicalData: { date: string; score: number }[];
  forecast: ForecastPoint[];
  currentScore: number;
  trend: 'improving' | 'declining' | 'stable';
  riskFlags: string[];
  recommendations: string[];
}

interface ReadinessForecastProps {
  athleteId: string;
  days?: number;
}

export function ReadinessForecastChart({ athleteId, days = 30 }: ReadinessForecastProps) {
  const [forecast, setForecast] = useState<ReadinessForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecast();
  }, [athleteId, days]);

  async function fetchForecast() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/analytics/readiness-forecast?athleteId=${athleteId}&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch readiness forecast');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate forecast');
      }

      setForecast(result.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching readiness forecast:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>7-Day Readiness Forecast</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Generating forecast...</Text>
        </View>
      </View>
    );
  }

  if (error || !forecast) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>7-Day Readiness Forecast</Text>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{error || 'Unable to generate forecast'}</Text>
          <Text style={styles.errorSubtext}>
            Requires at least 14 days of historical readiness data
          </Text>
        </View>
      </View>
    );
  }

  const { historicalData, forecast: forecastData, currentScore, trend, riskFlags, recommendations } = forecast;

  // Combine historical and forecast for visualization (show last 14 historical + 7 forecast)
  const last14Historical = historicalData.slice(-14);
  const combinedData = [
    ...last14Historical.map((d) => d.score),
    ...forecastData.map((d) => d.predictedScore),
  ];

  const combinedLabels = [
    ...last14Historical.map((d, idx) => (idx % 3 === 0 ? new Date(d.date).getDate().toString() : '')),
    ...forecastData.map((d) => new Date(d.date).getDate().toString()),
  ];

  const screenWidth = Dimensions.get('window').width;

  const getTrendIcon = () => {
    if (trend === 'improving') return <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />;
    if (trend === 'declining') return <MaterialCommunityIcons name="trending-down" size={20} color="#ef4444" />;
    return <MaterialCommunityIcons name="minus" size={20} color="#9ca3af" />;
  };

  const getTrendColor = () => {
    if (trend === 'improving') return '#10b981';
    if (trend === 'declining') return '#ef4444';
    return '#9ca3af';
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    if (confidence === 'high') return '#10b981';
    if (confidence === 'medium') return '#f59e0b';
    return '#9ca3af';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>7-Day Readiness Forecast</Text>
        <View style={styles.currentScoreRow}>
          <Text style={styles.currentScoreLabel}>Current: {currentScore}</Text>
          {getTrendIcon()}
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend}
          </Text>
        </View>
        <Text style={styles.subtitle}>Exponential smoothing forecast with confidence bounds</Text>
      </View>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <View style={styles.riskFlagsContainer}>
          <MaterialCommunityIcons name="alert" size={20} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.riskFlagsTitle}>Risk Flags Detected</Text>
            {riskFlags.map((flag, idx) => (
              <Text key={idx} style={styles.riskFlagText}>
                • {flag}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Forecast Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: combinedLabels,
            datasets: [
              {
                data: combinedData,
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              },
            ],
          }}
          width={screenWidth - 64}
          height={260}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#f9fafb',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#3b82f6',
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines
          withOuterLines
          withVerticalLines={false}
          withHorizontalLines
          segments={5}
          fromZero
        />
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>Forecast →</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Historical (actual)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#3b82f6', opacity: 0.6 }]} />
          <Text style={styles.legendText}>Forecast (predicted)</Text>
        </View>
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

      {/* Forecast Details Table */}
      <View style={styles.detailsTable}>
        <Text style={styles.detailsTableTitle}>7-Day Forecast Details</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Predicted</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Range</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Confidence</Text>
        </View>
        {forecastData.map((point) => (
          <View key={point.date} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {new Date(point.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1, textAlign: 'center' }]}>
              {point.predictedScore}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellRange, { flex: 1, textAlign: 'center' }]}>
              {point.lowerBound}-{point.upperBound}
            </Text>
            <View style={{ flex: 1, alignItems: 'center' as const }}>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceBadgeColor(point.confidence) },
                ]}
              >
                <Text style={styles.confidenceBadgeText}>{point.confidence}</Text>
              </View>
            </View>
          </View>
        ))}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  currentScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  currentScoreLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  riskFlagsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  riskFlagsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 6,
  },
  riskFlagText: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
  },
  dividerLine: {
    position: 'absolute',
    right: 90,
    top: 20,
    bottom: 40,
    width: 2,
    backgroundColor: '#3b82f6',
    opacity: 0.3,
  },
  dividerLabel: {
    position: 'absolute',
    right: 50,
    top: 120,
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  recommendations: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  detailsTable: {
    marginTop: 16,
  },
  detailsTableTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 11,
    color: '#4b5563',
  },
  tableCellBold: {
    fontWeight: '600',
    color: '#1f2937',
  },
  tableCellRange: {
    fontSize: 10,
    color: '#9ca3af',
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
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
