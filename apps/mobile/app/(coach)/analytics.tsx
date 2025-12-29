/**
 * Coach Analytics - Mobile
 * Team trends, cohort comparisons, and correlation analysis
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { TeamHeatmap } from '../../components/coach/analytics/TeamHeatmap';
import { PerformanceCorrelationMatrix } from '../../components/coach/analytics/PerformanceCorrelationMatrix';
import { getStoredUserId } from '../../lib/auth';

export default function AnalyticsScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [activeTab, setActiveTab] = useState<'pulse' | 'performance' | 'interventions'>('pulse');
  const [coachId, setCoachId] = useState('');

  useEffect(() => {
    loadCoachId();
  }, []);

  const loadCoachId = async () => {
    const userId = await getStoredUserId();
    if (userId) {
      setCoachId(userId);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Fetch analytics data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Mock data
  const teamStats = {
    avgMood: 7.2,
    avgReadiness: 78,
    avgStress: 5.2,
    engagementRate: 84,
  };

  const cohortData = [
    { sport: 'Basketball', readiness: 82, mood: 7.8, stress: 4.8, count: 12 },
    { sport: 'Soccer', readiness: 75, mood: 7.2, stress: 5.5, count: 8 },
    { sport: 'Football', readiness: 78, mood: 6.9, stress: 5.8, count: 5 },
  ];

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
            <Text style={styles.headerTitle}>Analytics Hub</Text>
            <Text style={styles.headerSubtitle}>Deep team intelligence</Text>
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
          {(['7', '30', '90'] as const).map((range) => (
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

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pulse' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('pulse');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'pulse' && styles.tabTextActive]}>
              📊 Team Pulse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('performance');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
              🎯 Performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'interventions' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('interventions');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'interventions' && styles.tabTextActive]}>
              📈 Interventions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Team Pulse Tab */}
        {activeTab === 'pulse' && (
          <View>
            {/* Team Overview Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{teamStats.avgMood}</Text>
                  <Text style={styles.statLabel}>Avg Mood</Text>
                  <Text style={styles.statChange}>+0.3</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{teamStats.avgReadiness}</Text>
                  <Text style={styles.statLabel}>Avg Readiness</Text>
                  <Text style={styles.statChange}>-2</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{teamStats.avgStress}</Text>
                  <Text style={styles.statLabel}>Avg Stress</Text>
                  <Text style={styles.statChange}>+0.9</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{teamStats.engagementRate}%</Text>
                  <Text style={styles.statLabel}>Engagement</Text>
                  <Text style={styles.statChange}>+5%</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Team Heatmap */}
            {coachId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team Readiness Heatmap</Text>
                <TeamHeatmap coachId={coachId} days={14} />
              </View>
            )}

            {/* Cohort Comparison */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sport Comparisons</Text>
              {cohortData.map((cohort, idx) => (
                <View key={idx} style={styles.cohortCard}>
                  <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.cohortGradient}>
                    <View style={styles.cohortHeader}>
                      <Text style={styles.cohortName}>{cohort.sport}</Text>
                      <Text style={styles.cohortCount}>{cohort.count} athletes</Text>
                    </View>
                    <View style={styles.cohortMetrics}>
                      <View style={styles.cohortMetric}>
                        <Text style={styles.cohortLabel}>Readiness</Text>
                        <Text style={styles.cohortValue}>{cohort.readiness}</Text>
                      </View>
                      <View style={styles.cohortMetric}>
                        <Text style={styles.cohortLabel}>Mood</Text>
                        <Text style={styles.cohortValue}>{cohort.mood}</Text>
                      </View>
                      <View style={styles.cohortMetric}>
                        <Text style={styles.cohortLabel}>Stress</Text>
                        <Text style={styles.cohortValue}>{cohort.stress}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View style={styles.section}>
            {/* Performance Correlation Matrix - Note: Currently shows for demo athlete, can be enhanced with athlete selector */}
            {coachId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mental State ↔ Performance Correlation</Text>
                <PerformanceCorrelationMatrix athleteId={coachId} days={parseInt(timeRange)} />
              </View>
            )}

            <Text style={styles.sectionTitle}>Readiness-Performance Correlation</Text>
            <View style={styles.infoCard}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.infoGradient}>
                <Text style={styles.infoValue}>0.72</Text>
                <Text style={styles.infoLabel}>Strong positive correlation</Text>
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Performance Predictions</Text>
            <View style={styles.predictionCard}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.cardGradient}>
                <Text style={styles.predictionTitle}>✅ Likely to Excel</Text>
                <Text style={styles.predictionDetail}>5 athletes with high readiness (90+) for 5+ days</Text>
              </LinearGradient>
            </View>

            <View style={styles.predictionCard}>
              <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.cardGradient}>
                <Text style={styles.predictionTitle}>⚠️ Performance Risk</Text>
                <Text style={styles.predictionDetail}>3 athletes with declining readiness trends</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Interventions Tab */}
        {activeTab === 'interventions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intervention Success Rate</Text>
            <View style={styles.infoCard}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.infoGradient}>
                <Text style={styles.infoValue}>78%</Text>
                <Text style={styles.infoLabel}>Positive outcomes</Text>
                <Text style={styles.infoChange}>+5% from last month</Text>
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Most Effective Interventions</Text>
            {[
              { type: 'One-on-One Check-in', success: 85, count: 120 },
              { type: 'Goal Setting Session', success: 88, count: 78 },
              { type: 'Resource Sharing', success: 79, count: 95 },
              { type: 'Referral to Counseling', success: 92, count: 25 },
            ].map((intervention, idx) => (
              <View key={idx} style={styles.interventionCard}>
                <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.cardGradient}>
                  <View style={styles.interventionHeader}>
                    <Text style={styles.interventionType}>{intervention.type}</Text>
                    <Text style={styles.interventionSuccess}>{intervention.success}%</Text>
                  </View>
                  <Text style={styles.interventionCount}>{intervention.count} interventions</Text>
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
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  statChange: {
    fontSize: Typography.xs,
    color: '#10b981',
    marginTop: Spacing.xs,
    fontWeight: '600',
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
  cohortCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cohortGradient: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
  },
  cohortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cohortName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  cohortCount: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  cohortMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cohortMetric: {
    alignItems: 'center',
  },
  cohortLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xs,
  },
  cohortValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  infoGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  infoValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  infoLabel: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
  infoChange: {
    fontSize: Typography.sm,
    color: '#10b981',
    marginTop: Spacing.xs,
  },
  predictionCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardGradient: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
  },
  predictionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  predictionDetail: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  interventionCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  interventionType: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  interventionSuccess: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10b981',
  },
  interventionCount: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  bottomPadding: {
    height: 40,
  },
});
