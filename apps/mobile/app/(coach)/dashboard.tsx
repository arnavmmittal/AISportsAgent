/**
 * Coach Dashboard
 * Shows team analytics, at-risk athletes, crisis alerts, and readiness scores
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function CoachDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    loadDashboard();
  }, [timeRange]);

  const loadDashboard = async () => {
    try {
      const data = await apiClient.getCoachDashboard({ timeRange });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load coach dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  const getReadinessColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return ['#10b981', '#34d399'] as const;
      case 'good':
        return ['#3b82f6', '#60a5fa'] as const;
      case 'fair':
        return ['#f59e0b', '#fbbf24'] as const;
      case 'at-risk':
        return ['#ef4444', '#f87171'] as const;
      default:
        return ['#6b7280', '#9ca3af'] as const;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const { overview, teamMood, crisisAlerts, atRiskAthletes, athleteReadiness } = dashboardData || {};

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb', '#1e40af']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Team Dashboard</Text>
              <Text style={styles.headerSubtitle}>Performance & Wellness Overview</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {['7', '14', '30'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeChip, timeRange === range && styles.timeRangeChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeRange(range);
              }}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.cardGradient}>
              <Ionicons name="people" size={32} color="#3b82f6" />
              <Text style={styles.overviewValue}>{overview?.totalAthletes || 0}</Text>
              <Text style={styles.overviewLabel}>Total Athletes</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.cardGradient}>
              <Ionicons name="shield-checkmark" size={32} color="#10b981" />
              <Text style={styles.overviewValue}>{overview?.athletesWithConsent || 0}</Text>
              <Text style={styles.overviewLabel}>With Consent</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']} style={styles.cardGradient}>
              <Ionicons name="warning" size={32} color="#ef4444" />
              <Text style={styles.overviewValue}>{overview?.atRiskCount || 0}</Text>
              <Text style={styles.overviewLabel}>At Risk</Text>
            </LinearGradient>
          </View>

          <View style={styles.overviewCard}>
            <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.cardGradient}>
              <Ionicons name="alert-circle" size={32} color="#f59e0b" />
              <Text style={styles.overviewValue}>{overview?.crisisAlertsCount || 0}</Text>
              <Text style={styles.overviewLabel}>Crisis Alerts</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Team Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Mood (Last {timeRange} days)</Text>
          <View style={styles.moodCard}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.cardGradient}>
              <View style={styles.moodRow}>
                <View style={styles.moodItem}>
                  <Ionicons name="happy" size={24} color="#10b981" />
                  <Text style={styles.moodValue}>{teamMood?.avgMood?.toFixed(1) || 'N/A'}/10</Text>
                  <Text style={styles.moodLabel}>Mood</Text>
                </View>
                <View style={styles.moodItem}>
                  <Ionicons name="trophy" size={24} color="#3b82f6" />
                  <Text style={styles.moodValue}>{teamMood?.avgConfidence?.toFixed(1) || 'N/A'}/10</Text>
                  <Text style={styles.moodLabel}>Confidence</Text>
                </View>
                <View style={styles.moodItem}>
                  <Ionicons name="flash" size={24} color="#f59e0b" />
                  <Text style={styles.moodValue}>{teamMood?.avgStress?.toFixed(1) || 'N/A'}/10</Text>
                  <Text style={styles.moodLabel}>Stress</Text>
                </View>
              </View>
              <Text style={styles.moodStats}>Based on {teamMood?.totalLogs || 0} logs</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Athlete Readiness (Today) */}
        {athleteReadiness && athleteReadiness.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Readiness</Text>
            {athleteReadiness.slice(0, 10).map((item: any, index: number) => (
              <View key={index} style={styles.readinessCard}>
                <LinearGradient
                  colors={getReadinessColor(item.status)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.readinessGradient}
                >
                  <View style={styles.readinessInfo}>
                    <Text style={styles.athleteName}>{item.athlete.name}</Text>
                    <Text style={styles.athletePosition}>
                      {item.athlete.athlete?.teamPosition || item.athlete.athlete?.sport}
                    </Text>
                  </View>
                  <View style={styles.readinessScore}>
                    <Text style={styles.readinessValue}>{item.readiness}</Text>
                    <Text style={styles.readinessMax}>/10</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {/* At-Risk Athletes */}
        {atRiskAthletes && atRiskAthletes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>At-Risk Athletes</Text>
            {atRiskAthletes.map((athlete: any) => (
              <View key={athlete.id} style={styles.alertCard}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.alertHeader}>
                    <Ionicons name="warning" size={24} color="#ef4444" />
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                  </View>
                  <Text style={styles.athleteInfo}>
                    {athlete.sport} • {athlete.year}
                  </Text>
                  {athlete.recentMood && (
                    <View style={styles.moodRow}>
                      <Text style={styles.moodStat}>Mood: {athlete.recentMood.mood}/10</Text>
                      <Text style={styles.moodStat}>Stress: {athlete.recentMood.stress}/10</Text>
                      <Text style={styles.moodStat}>Confidence: {athlete.recentMood.confidence}/10</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {/* Crisis Alerts */}
        {crisisAlerts && crisisAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Crisis Alerts</Text>
            {crisisAlerts.slice(0, 5).map((alert: any) => (
              <View key={alert.id} style={styles.alertCard}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.alertHeader}>
                    <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                    <Text style={styles.athleteName}>{alert.athlete.name}</Text>
                  </View>
                  <Text style={styles.alertType}>Type: {alert.alertType}</Text>
                  <Text style={styles.alertDate}>
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeRangeChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  timeRangeChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  timeRangeText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  overviewCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: Spacing.sm,
  },
  overviewLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  moodCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  moodItem: {
    alignItems: 'center',
  },
  moodValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.xs,
  },
  moodLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  moodStats: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  moodStat: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  readinessCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  readinessGradient: {
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  athletePosition: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  athleteInfo: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  readinessScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  readinessValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  readinessMax: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  alertCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  alertType: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  alertDate: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.xs,
  },
  bottomPadding: {
    height: 40,
  },
});
