/**
 * HRV Chart Component (React Native)
 *
 * Displays 30-day Heart Rate Variability trend with baseline reference
 * Uses react-native-chart-kit for visualization (Whoop-style)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface HRVChartProps {
  athleteId: string;
  days?: number;
}

interface HRVDataPoint {
  date: string;
  hrv: number;
  displayDate: string;
}

export function HRVChart({ athleteId, days = 30 }: HRVChartProps) {
  const [data, setData] = useState<HRVDataPoint[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHRVData();
  }, [athleteId, days]);

  async function fetchHRVData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/biometrics?athleteId=${athleteId}&metricType=hrv&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch HRV data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load HRV data');
      }

      // Transform data for chart
      const transformedData = result.data.map((point: any) => {
        const date = new Date(point.recordedAt);
        return {
          date: date.toISOString().split('T')[0],
          hrv: point.value,
          displayDate: date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
          }),
        };
      });

      setData(transformedData);

      // Calculate 7-day baseline
      if (transformedData.length >= 7) {
        const last7Days = transformedData.slice(-7);
        const avgHRV = last7Days.reduce((sum: number, d: HRVDataPoint) => sum + d.hrv, 0) / 7;
        setBaseline(Math.round(avgHRV));
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching HRV data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load HRV data');
      setIsLoading(false);
    }
  }

  const getHRVStatus = (hrv: number): { text: string; color: string } => {
    if (hrv >= 70) return { text: 'Excellent', color: '#10b981' };
    if (hrv >= 50) return { text: 'Good', color: '#3b82f6' };
    return { text: 'Low', color: '#f59e0b' };
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading HRV data...</Text>
      </View>
    );
  }

  if (error || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'No HRV data available'}</Text>
      </View>
    );
  }

  const latestHRV = data[data.length - 1].hrv;
  const status = getHRVStatus(latestHRV);
  const screenWidth = Dimensions.get('window').width;

  // Prepare chart data (show every 5th label to avoid crowding)
  const chartData = {
    labels: data.map((d, idx) => (idx % 5 === 0 ? d.date.split('-')[2] : '')),
    datasets: [
      {
        data: data.map(d => d.hrv),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate Variability (HRV)</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Latest</Text>
          <Text style={styles.statValue}>{latestHRV.toFixed(0)} ms</Text>
        </View>
        {baseline && (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>7-Day Avg</Text>
            <Text style={styles.statValue}>{baseline} ms</Text>
          </View>
        )}
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
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
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Optimal (&gt;70ms)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Low (&lt;50ms)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});
