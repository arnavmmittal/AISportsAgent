/**
 * Biometric Overview Component (React Native)
 *
 * Summary cards displaying 7-day averages for all biometric metrics:
 * - HRV (Heart Rate Variability)
 * - Resting Heart Rate
 * - Sleep Duration
 * - Recovery Score
 *
 * Shows trend indicators (↑ improving, ↓ declining, → stable)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BiometricSummary {
  hrv: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  restingHR: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  sleep: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  recovery: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
}

interface BiometricOverviewProps {
  athleteId: string;
}

export function BiometricOverview({ athleteId }: BiometricOverviewProps) {
  const [summary, setSummary] = useState<BiometricSummary>({
    hrv: null,
    restingHR: null,
    sleep: null,
    recovery: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBiometricSummary();
  }, [athleteId]);

  async function fetchBiometricSummary() {
    try {
      setIsLoading(true);

      // Fetch last 14 days to calculate trends (last 7 days vs previous 7 days)
      const metrics = ['hrv', 'resting_hr', 'sleep_duration', 'recovery_score'];

      const summaryData: BiometricSummary = {
        hrv: null,
        restingHR: null,
        sleep: null,
        recovery: null,
      };

      for (const metricType of metrics) {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/biometrics?athleteId=${athleteId}&metricType=${metricType}&days=14`
        );

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            const data = result.data.map((d: any) => d.value);

            // Calculate 7-day average (most recent 7 days)
            const last7Days = data.slice(-7);
            const avg = last7Days.reduce((sum: number, val: number) => sum + val, 0) / last7Days.length;

            // Calculate trend (compare last 7 days vs previous 7 days)
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (data.length >= 14) {
              const previous7Days = data.slice(-14, -7);
              const previousAvg = previous7Days.reduce((sum: number, val: number) => sum + val, 0) / previous7Days.length;

              // Determine trend direction
              // For HRV and recovery score: higher is better
              // For resting HR: lower is better
              const isImproving =
                metricType === 'resting_hr'
                  ? avg < previousAvg - 2 // HR decreased by more than 2 bpm
                  : avg > previousAvg + (metricType === 'hrv' ? 5 : 5); // HRV/recovery increased

              const isDeclining =
                metricType === 'resting_hr'
                  ? avg > previousAvg + 2 // HR increased by more than 2 bpm
                  : avg < previousAvg - (metricType === 'hrv' ? 5 : 5); // HRV/recovery decreased

              if (isImproving) trend = 'up';
              else if (isDeclining) trend = 'down';
            }

            const unit = result.data[0].unit || '';

            switch (metricType) {
              case 'hrv':
                summaryData.hrv = { avg: Math.round(avg), trend, unit };
                break;
              case 'resting_hr':
                summaryData.restingHR = { avg: Math.round(avg), trend, unit };
                break;
              case 'sleep_duration':
                summaryData.sleep = { avg: Math.round(avg * 10) / 10, trend, unit }; // 1 decimal
                break;
              case 'recovery_score':
                summaryData.recovery = { avg: Math.round(avg), trend, unit };
                break;
            }
          }
        }
      }

      setSummary(summaryData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching biometric summary:', err);
      setIsLoading(false);
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <MaterialCommunityIcons name="trending-up" size={16} color="#10b981" />;
    if (trend === 'down') return <MaterialCommunityIcons name="trending-down" size={16} color="#ef4444" />;
    return <MaterialCommunityIcons name="minus" size={16} color="#9ca3af" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#9ca3af';
  };

  const getTrendMessage = (metric: string, trend: 'up' | 'down' | 'stable') => {
    if (metric === 'hrv') {
      if (trend === 'up') return 'Improving recovery';
      if (trend === 'down') return 'Declining - increase rest';
      return 'Stable';
    }

    if (metric === 'restingHR') {
      if (trend === 'up') return 'Lower is better';
      if (trend === 'down') return 'Improving fitness';
      return 'Stable';
    }

    if (metric === 'sleep') {
      if (trend === 'up') return 'Good sleep habits';
      if (trend === 'down') return 'Increase sleep time';
      return 'Stable';
    }

    if (metric === 'recovery') {
      if (trend === 'up') return 'Excellent recovery';
      if (trend === 'down') return 'More rest needed';
      return 'Stable';
    }

    return 'Stable';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading biometric data...</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 columns with 16px padding

  return (
    <View style={styles.container}>
      {/* HRV Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color="#6b7280" />
            <Text style={styles.cardTitle}>HRV (7-day avg)</Text>
          </View>
          {summary.hrv && getTrendIcon(summary.hrv.trend)}
        </View>
        <View style={styles.cardContent}>
          {summary.hrv ? (
            <>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{summary.hrv.avg}</Text>
                <Text style={styles.unit}> {summary.hrv.unit}</Text>
              </View>
              <Text style={[styles.trendText, { color: getTrendColor(summary.hrv.trend) }]}>
                {getTrendMessage('hrv', summary.hrv.trend)}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>No data</Text>
          )}
        </View>
      </View>

      {/* Resting HR Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="heart" size={16} color="#6b7280" />
            <Text style={styles.cardTitle}>Resting HR (7-day avg)</Text>
          </View>
          {summary.restingHR && getTrendIcon(summary.restingHR.trend)}
        </View>
        <View style={styles.cardContent}>
          {summary.restingHR ? (
            <>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{summary.restingHR.avg}</Text>
                <Text style={styles.unit}> {summary.restingHR.unit}</Text>
              </View>
              <Text style={[styles.trendText, { color: getTrendColor(summary.restingHR.trend) }]}>
                {getTrendMessage('restingHR', summary.restingHR.trend)}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>No data</Text>
          )}
        </View>
      </View>

      {/* Sleep Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="sleep" size={16} color="#6b7280" />
            <Text style={styles.cardTitle}>Sleep (7-day avg)</Text>
          </View>
          {summary.sleep && getTrendIcon(summary.sleep.trend)}
        </View>
        <View style={styles.cardContent}>
          {summary.sleep ? (
            <>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{summary.sleep.avg}</Text>
                <Text style={styles.unit}> {summary.sleep.unit}</Text>
              </View>
              <Text style={[styles.trendText, { color: getTrendColor(summary.sleep.trend) }]}>
                {getTrendMessage('sleep', summary.sleep.trend)}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>No data</Text>
          )}
        </View>
      </View>

      {/* Recovery Score Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="chart-line" size={16} color="#6b7280" />
            <Text style={styles.cardTitle}>Recovery (7-day avg)</Text>
          </View>
          {summary.recovery && getTrendIcon(summary.recovery.trend)}
        </View>
        <View style={styles.cardContent}>
          {summary.recovery ? (
            <>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{summary.recovery.avg}</Text>
                <Text style={styles.unit}>/100</Text>
              </View>
              <Text style={[styles.trendText, { color: getTrendColor(summary.recovery.trend) }]}>
                {getTrendMessage('recovery', summary.recovery.trend)}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>No data</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 16,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  cardContent: {
    marginTop: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  unit: {
    fontSize: 16,
    color: '#6b7280',
  },
  trendText: {
    fontSize: 11,
    marginTop: 4,
  },
  noData: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
