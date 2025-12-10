import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout, getStoredUserId } from '../../lib/auth';
import { getMoodLogs, getGoals } from '../../lib/apiWithFallback';
import { apiClient } from '../../lib/auth';
import type { MoodLog, Goal } from '@sports-agent/types';
import { Card, LoadingScreen } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moodStats, setMoodStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      // Load mood logs, goals, and stats in parallel
      const [moodLogsData, goalsData, statsData] = await Promise.all([
        apiClient.getMoodLogs(userId, 7).catch(() => []),
        apiClient.getGoals(userId).catch(() => []),
        apiClient.getMoodStats(userId).catch(() => null),
      ]);

      setMoodLogs(moodLogsData);
      setGoals(goalsData);
      setMoodStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getAverageMood = () => {
    if (moodLogs.length === 0) return 0;
    const sum = moodLogs.reduce((acc, log) => acc + log.mood, 0);
    return Math.round(sum / moodLogs.length);
  };

  const getAverageConfidence = () => {
    if (moodLogs.length === 0) return 0;
    const sum = moodLogs.reduce((acc, log) => acc + log.confidence, 0);
    return Math.round(sum / moodLogs.length);
  };

  const getAverageStress = () => {
    if (moodLogs.length === 0) return 0;
    const sum = moodLogs.reduce((acc, log) => acc + log.stress, 0);
    return Math.round(sum / moodLogs.length);
  };

  const getGoalsProgress = () => {
    if (goals.length === 0) return 0;
    const completed = goals.filter((g) => g.status === 'COMPLETED').length;
    return Math.round((completed / goals.length) * 100);
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😔';
    if (value <= 5) return '😐';
    if (value <= 7) return '🙂';
    return '😊';
  };

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="happy" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>
              {getMoodEmoji(getAverageMood())} {getAverageMood()}/10
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="trending-up" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{getAverageConfidence()}/10</Text>
            <Text style={styles.statLabel}>Confidence</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="alert-circle" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>{getAverageStress()}/10</Text>
            <Text style={styles.statLabel}>Stress</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.errorLight }]}>
            <Ionicons name="trophy" size={24} color={Colors.error} />
            <Text style={styles.statValue}>{goals.length}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
        </View>

        {/* Recent Mood Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/mood')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {moodLogs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={Colors.gray300} />
              <Text style={styles.emptyText}>No check-ins yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/mood')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Log your first check-in</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            moodLogs.slice(0, 3).map((log) => (
              <Card key={log.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>{getMoodEmoji(log.mood)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    Mood: {log.mood}/10 • Confidence: {log.confidence}/10
                  </Text>
                  <Text style={styles.activityDate}>
                    {new Date(log.date).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Active Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={32} color={Colors.gray300} />
              <Text style={styles.emptyText}>No goals set</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/goals')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Create your first goal</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            goals
              .filter((g) => g.status !== 'COMPLETED')
              .slice(0, 3)
              .map((goal) => (
                <Card key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgress}>{goal.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${goal.progress}%`, backgroundColor: Colors.primary },
                      ]}
                    />
                  </View>
                </Card>
              ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start Chat Session</Text>
              <Text style={styles.actionDescription}>Talk to your AI assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/mood')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="happy" size={24} color={Colors.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Daily Check-In</Text>
              <Text style={styles.actionDescription}>Log your mood and feelings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/goals')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="trophy" size={24} color={Colors.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Goals</Text>
              <Text style={styles.actionDescription}>Track your progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  emptyCard: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  activityCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activityDate: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  goalCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  goalProgress: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
});
