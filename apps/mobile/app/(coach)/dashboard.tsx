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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import {
  getTouchpoints,
  completeTouchpoint,
  skipTouchpoint,
  formatScheduledTime,
  getTouchpointIcon,
  Touchpoint,
  TouchpointStats,
} from '../../lib/services/touchpoints';
import {
  getAthleteActivity,
  formatTimeAgo,
  AthleteActivity,
  ActivitySummary,
} from '../../lib/services/activity-monitor';

export default function CoachDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7');

  // Touchpoints state
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [touchpointStats, setTouchpointStats] = useState<TouchpointStats | null>(null);

  // Activity monitor state
  const [activities, setActivities] = useState<AthleteActivity[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    loadAllData();
  }, [timeRange]);

  const loadAllData = async () => {
    try {
      // Load all data in parallel
      const [dashboardResult, touchpointsResult, activityResult] = await Promise.all([
        apiClient.getCoachDashboard({ timeRange }),
        getTouchpoints(),
        getAthleteActivity(),
      ]);

      setDashboardData(dashboardResult);
      setTouchpoints(touchpointsResult.touchpoints);
      setTouchpointStats(touchpointsResult.stats);
      setActivities(activityResult.activities);
      setActivitySummary(activityResult.summary);
    } catch (error) {
      console.error('Failed to load coach dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  const handleCompleteTouchpoint = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await completeTouchpoint(id);
    if (success) {
      setTouchpoints((prev) => prev.filter((tp) => tp.id !== id));
      if (touchpointStats) {
        setTouchpointStats({
          ...touchpointStats,
          pending: touchpointStats.pending - 1,
          completed: touchpointStats.completed + 1,
        });
      }
    }
  };

  const handleSkipTouchpoint = async (id: string) => {
    Alert.alert('Skip Touchpoint', 'Are you sure you want to skip this touchpoint?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const success = await skipTouchpoint(id);
          if (success) {
            setTouchpoints((prev) => prev.filter((tp) => tp.id !== id));
            if (touchpointStats) {
              setTouchpointStats({
                ...touchpointStats,
                pending: touchpointStats.pending - 1,
              });
            }
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: AthleteActivity['status']) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'offline':
        return '#6b7280';
    }
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

        {/* ROI Dashboard Quick Access */}
        <TouchableOpacity
          style={styles.roiCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(coach)/roi');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roiCardGradient}
          >
            <View style={styles.roiCardLeft}>
              <View style={styles.roiIconContainer}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
              </View>
              <View>
                <Text style={styles.roiCardTitle}>ROI Dashboard</Text>
                <Text style={styles.roiCardSubtitle}>Metrics for budget justification</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#10b981" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Chat Insights Quick Access */}
        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(coach)/chat-insights');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickAccessGradient}
          >
            <View style={styles.quickAccessLeft}>
              <View style={[styles.quickAccessIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <Ionicons name="chatbubbles" size={24} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.quickAccessTitle}>Chat Insights</Text>
                <Text style={styles.quickAccessSubtitle}>Conversation patterns & themes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Alert Rules Quick Access */}
        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(coach)/alert-rules');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.quickAccessGradient, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}
          >
            <View style={styles.quickAccessLeft}>
              <View style={[styles.quickAccessIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="notifications" size={24} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.quickAccessTitle}>Alert Rules</Text>
                <Text style={styles.quickAccessSubtitle}>Proactive athlete monitoring</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Activity Monitor Widget */}
        <View style={styles.widgetSection}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleRow}>
              <Ionicons name="pulse" size={20} color="#8b5cf6" />
              <Text style={styles.widgetTitle}>Live Activity</Text>
            </View>
            {activitySummary && (
              <View style={styles.activityBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activityBadgeText}>{activitySummary.activeNow} chatting</Text>
              </View>
            )}
          </View>
          <View style={styles.widgetCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              style={styles.widgetGradient}
            >
              {activitySummary && (
                <View style={styles.activityStats}>
                  <View style={styles.activityStatItem}>
                    <Text style={styles.activityStatValue}>{activitySummary.totalAthletes}</Text>
                    <Text style={styles.activityStatLabel}>Total</Text>
                  </View>
                  <View style={styles.activityStatDivider} />
                  <View style={styles.activityStatItem}>
                    <Text style={[styles.activityStatValue, { color: '#10b981' }]}>
                      {activitySummary.activeNow}
                    </Text>
                    <Text style={styles.activityStatLabel}>Active</Text>
                  </View>
                  <View style={styles.activityStatDivider} />
                  <View style={styles.activityStatItem}>
                    <Text style={[styles.activityStatValue, { color: '#f59e0b' }]}>
                      {activitySummary.recentlyActive}
                    </Text>
                    <Text style={styles.activityStatLabel}>Recent</Text>
                  </View>
                </View>
              )}

              {activities.length > 0 && (
                <View style={styles.activityList}>
                  {activities.slice(0, 4).map((athlete) => (
                    <View key={athlete.athleteId} style={styles.activityItem}>
                      <View style={styles.activityItemLeft}>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor(athlete.status) },
                          ]}
                        />
                        <Text style={styles.activityAthleteName}>{athlete.athleteName}</Text>
                      </View>
                      <Text style={styles.activityTime}>
                        {athlete.status === 'active'
                          ? `${athlete.chatDuration}m in chat`
                          : formatTimeAgo(athlete.lastHeartbeat)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {activities.length === 0 && (
                <Text style={styles.widgetEmpty}>No recent activity</Text>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Touchpoints Widget */}
        <View style={styles.widgetSection}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleRow}>
              <Ionicons name="hand-left" size={20} color="#ec4899" />
              <Text style={styles.widgetTitle}>Touchpoints</Text>
            </View>
            {touchpointStats && touchpointStats.overdue > 0 && (
              <View style={styles.overdueBadge}>
                <Ionicons name="alert" size={14} color="#ef4444" />
                <Text style={styles.overdueBadgeText}>{touchpointStats.overdue} overdue</Text>
              </View>
            )}
          </View>
          <View style={styles.widgetCard}>
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.15)', 'rgba(236, 72, 153, 0.05)']}
              style={styles.widgetGradient}
            >
              {touchpointStats && (
                <View style={styles.touchpointStats}>
                  <View style={styles.touchpointStatItem}>
                    <Text style={styles.touchpointStatValue}>{touchpointStats.todayScheduled}</Text>
                    <Text style={styles.touchpointStatLabel}>Today</Text>
                  </View>
                  <View style={styles.touchpointStatItem}>
                    <Text style={styles.touchpointStatValue}>{touchpointStats.pending}</Text>
                    <Text style={styles.touchpointStatLabel}>Pending</Text>
                  </View>
                  <View style={styles.touchpointStatItem}>
                    <Text style={[styles.touchpointStatValue, { color: '#10b981' }]}>
                      {touchpointStats.completed}
                    </Text>
                    <Text style={styles.touchpointStatLabel}>Done</Text>
                  </View>
                </View>
              )}

              {touchpoints.length > 0 && (
                <View style={styles.touchpointList}>
                  {touchpoints.slice(0, 3).map((tp) => (
                    <View
                      key={tp.id}
                      style={[
                        styles.touchpointItem,
                        tp.status === 'OVERDUE' && styles.touchpointItemOverdue,
                      ]}
                    >
                      <View style={styles.touchpointItemContent}>
                        <View style={styles.touchpointItemTop}>
                          <Ionicons
                            name={getTouchpointIcon(tp.type) as any}
                            size={16}
                            color={tp.status === 'OVERDUE' ? '#ef4444' : '#ec4899'}
                          />
                          <Text style={styles.touchpointAthleteName}>{tp.athleteName}</Text>
                          <Text
                            style={[
                              styles.touchpointTime,
                              tp.status === 'OVERDUE' && styles.touchpointTimeOverdue,
                            ]}
                          >
                            {formatScheduledTime(tp.scheduledFor)}
                          </Text>
                        </View>
                        {tp.message && (
                          <Text style={styles.touchpointMessage} numberOfLines={1}>
                            {tp.message}
                          </Text>
                        )}
                      </View>
                      <View style={styles.touchpointActions}>
                        <TouchableOpacity
                          style={styles.touchpointActionBtn}
                          onPress={() => handleCompleteTouchpoint(tp.id)}
                        >
                          <Ionicons name="checkmark" size={18} color="#10b981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.touchpointActionBtn}
                          onPress={() => handleSkipTouchpoint(tp.id)}
                        >
                          <Ionicons name="close" size={18} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {touchpoints.length === 0 && (
                <Text style={styles.widgetEmpty}>No pending touchpoints</Text>
              )}
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
  roiCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  roiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: BorderRadius.lg,
  },
  roiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  roiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roiCardTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  roiCardSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quickAccessCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickAccessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: BorderRadius.lg,
  },
  quickAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  quickAccessSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  // Widget styles
  widgetSection: {
    marginBottom: Spacing.lg,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  widgetTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  widgetCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  widgetGradient: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
  },
  widgetEmpty: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: Typography.sm,
    paddingVertical: Spacing.md,
  },
  // Activity Monitor styles
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  activityBadgeText: {
    fontSize: Typography.xs,
    color: '#10b981',
    fontWeight: '600',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activityStatItem: {
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  activityStatLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  activityStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityAthleteName: {
    fontSize: Typography.sm,
    color: '#fff',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  // Touchpoints styles
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  overdueBadgeText: {
    fontSize: Typography.xs,
    color: '#ef4444',
    fontWeight: '600',
  },
  touchpointStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  touchpointStatItem: {
    alignItems: 'center',
  },
  touchpointStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  touchpointStatLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  touchpointList: {
    gap: Spacing.sm,
  },
  touchpointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  touchpointItemOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  touchpointItemContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  touchpointItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  touchpointAthleteName: {
    fontSize: Typography.sm,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  touchpointTime: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  touchpointTimeOverdue: {
    color: '#ef4444',
    fontWeight: '600',
  },
  touchpointMessage: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginLeft: 20,
  },
  touchpointActions: {
    flexDirection: 'row',
    gap: 4,
  },
  touchpointActionBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
