import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout, getStoredUserId, getStoredUserRole } from '../../lib/auth';
import { apiClient } from '../../lib/auth';
import type { MoodLog, Goal } from '@sports-agent/types';

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="happy" size={24} color="#2563eb" />
            <Text style={styles.statValue}>
              {getMoodEmoji(getAverageMood())} {getAverageMood()}/10
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text style={styles.statValue}>{getAverageConfidence()}/10</Text>
            <Text style={styles.statLabel}>Confidence</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="alert-circle" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{getAverageStress()}/10</Text>
            <Text style={styles.statLabel}>Stress</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="trophy" size={24} color="#ef4444" />
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
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No check-ins yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/mood')}
              >
                <Text style={styles.emptyButtonText}>Log your first check-in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            moodLogs.slice(0, 3).map((log) => (
              <View key={log.id} style={styles.activityCard}>
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
              </View>
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
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No goals set</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/goals')}
              >
                <Text style={styles.emptyButtonText}>Create your first goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            goals
              .filter((g) => g.status !== 'COMPLETED')
              .slice(0, 3)
              .map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgress}>{goal.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${goal.progress}%`, backgroundColor: '#2563eb' },
                      ]}
                    />
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Ionicons name="chatbubbles" size={24} color="#2563eb" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start Chat Session</Text>
              <Text style={styles.actionDescription}>Talk to your AI assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/mood')}
          >
            <Ionicons name="happy" size={24} color="#10b981" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Daily Check-In</Text>
              <Text style={styles.actionDescription}>Log your mood and feelings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/goals')}
          >
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Goals</Text>
              <Text style={styles.actionDescription}>Track your progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
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
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  bottomPadding: {
    height: 40,
  },
});
