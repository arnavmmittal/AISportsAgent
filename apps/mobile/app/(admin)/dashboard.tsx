/**
 * Admin Dashboard
 * System-wide statistics, school management, user management
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiClient.getAdminDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const { overview, recentActivity, schools, usersByRole, topSports, recentCrisisAlerts } = dashboardData || {};

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#a855f7', '#9333ea', '#7e22ce']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>System Overview</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(admin)/schools');
              }}
              style={styles.schoolsButton}
            >
              <Ionicons name="business" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#a855f7" />
        }
      >
        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(168, 85, 247, 0.2)', 'rgba(147, 51, 234, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="people" size={28} color="#a855f7" />
                <Text style={styles.overviewValue}>{overview?.totalUsers || 0}</Text>
                <Text style={styles.overviewLabel}>Total Users</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="person" size={28} color="#3b82f6" />
                <Text style={styles.overviewValue}>{overview?.totalAthletes || 0}</Text>
                <Text style={styles.overviewLabel}>Athletes</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="school" size={28} color="#10b981" />
                <Text style={styles.overviewValue}>{overview?.totalCoaches || 0}</Text>
                <Text style={styles.overviewLabel}>Coaches</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="business" size={28} color="#f59e0b" />
                <Text style={styles.overviewValue}>{overview?.totalSchools || 0}</Text>
                <Text style={styles.overviewLabel}>Schools</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(236, 72, 153, 0.2)', 'rgba(219, 39, 119, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="trophy" size={28} color="#ec4899" />
                <Text style={styles.overviewValue}>{overview?.totalGoals || 0}</Text>
                <Text style={styles.overviewLabel}>Goals</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient colors={['rgba(20, 184, 166, 0.2)', 'rgba(13, 148, 136, 0.1)']} style={styles.cardGradient}>
                <Ionicons name="happy" size={28} color="#14b8a6" />
                <Text style={styles.overviewValue}>{overview?.totalMoodLogs || 0}</Text>
                <Text style={styles.overviewLabel}>Mood Logs</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Recent Activity (Last 30 days) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 30 Days</Text>
          <View style={styles.activityCard}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.cardGradient}>
              <View style={styles.activityRow}>
                <View style={styles.activityItem}>
                  <Ionicons name="person-add" size={24} color="#a855f7" />
                  <Text style={styles.activityValue}>{recentActivity?.newUsers || 0}</Text>
                  <Text style={styles.activityLabel}>New Users</Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="flag" size={24} color="#3b82f6" />
                  <Text style={styles.activityValue}>{recentActivity?.newGoals || 0}</Text>
                  <Text style={styles.activityLabel}>New Goals</Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="analytics" size={24} color="#10b981" />
                  <Text style={styles.activityValue}>{recentActivity?.newMoodLogs || 0}</Text>
                  <Text style={styles.activityLabel}>Mood Logs</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Crisis Alerts */}
        {overview?.activeCrisisAlerts > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Crisis Alerts</Text>
            <View style={styles.alertBanner}>
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.alertGradient}>
                <Ionicons name="warning" size={32} color="#fff" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertValue}>{overview.activeCrisisAlerts}</Text>
                  <Text style={styles.alertLabel}>Require immediate attention</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Schools */}
        {schools && schools.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Schools</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/schools')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {schools.slice(0, 5).map((school: any) => (
              <View key={school.id} style={styles.schoolCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.schoolHeader}>
                    <View>
                      <Text style={styles.schoolName}>{school.name}</Text>
                      <Text style={styles.schoolDivision}>{school.division}</Text>
                    </View>
                    <View style={styles.schoolBadge}>
                      <Text style={styles.schoolCount}>{school.athleteCount}</Text>
                      <Text style={styles.schoolCountLabel}>athletes</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {/* Top Sports */}
        {topSports && topSports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Sports by Participation</Text>
            {topSports.slice(0, 5).map((sport: any, index: number) => (
              <View key={sport.sport} style={styles.sportCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.sportGradient}
                >
                  <View style={styles.sportRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.sportName}>{sport.sport}</Text>
                  <Text style={styles.sportCount}>{sport._count.userId} athletes</Text>
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
    shadowColor: '#a855f7',
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
  schoolsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  sectionLink: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#a855f7',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
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
    fontSize: 28,
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
  activityCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.xs,
  },
  activityLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  alertBanner: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  alertLabel: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  schoolCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  schoolDivision: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  schoolBadge: {
    alignItems: 'center',
  },
  schoolCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#a855f7',
  },
  schoolCountLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  sportCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  sportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sportRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: '#fff',
  },
  sportName: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  sportCount: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  bottomPadding: {
    height: 40,
  },
});
