import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { logout, getStoredUserId } from '../../lib/auth';
import { getMoodLogs, getGoals } from '../../lib/apiWithFallback';
import type { MoodLog, Goal } from '@sports-agent/types';
import { Card, LoadingScreen, GradientCard } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moodStats, setMoodStats] = useState<any>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      // Load mood logs and goals in parallel (using fallback API)
      const [moodLogsData, goalsData] = await Promise.all([
        getMoodLogs(userId, 7),
        getGoals(userId),
      ]);

      setMoodLogs(moodLogsData);
      setGoals(goalsData);

      // Animate in content
      if (!isRefresh) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Ready to crush your goals today?',
      'Let\'s make today count!',
      'You\'re doing amazing!',
      'Time to level up!',
      'Stay focused on your goals!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#2563eb', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroGreeting}>{getGreeting()}!</Text>
                  <Text style={styles.heroMessage}>{getMotivationalMessage()}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonHero}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Mini Stats in Hero */}
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{moodLogs.length}</Text>
                  <Text style={styles.heroStatLabel}>Check-ins</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{goals.filter(g => g.status !== 'COMPLETED').length}</Text>
                  <Text style={styles.heroStatLabel}>Active Goals</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{getAverageMood()}</Text>
                  <Text style={styles.heroStatLabel}>Avg Mood</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="happy" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>
                {getMoodEmoji(getAverageMood())} {getAverageMood()}/10
              </Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#d1fae5', '#a7f3d0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.statValue}>{getAverageConfidence()}/10</Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="alert-circle" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{getAverageStress()}/10</Text>
              <Text style={styles.statLabel}>Stress</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/goals');
            }}
          >
            <LinearGradient
              colors={['#fce7f3', '#fbcfe8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="trophy" size={24} color="#ec4899" />
              <Text style={styles.statValue}>{goals.length}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </LinearGradient>
          </Pressable>
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

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/chat');
            }}
          >
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionIconGradient}
            >
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start Chat Session</Text>
              <Text style={styles.actionDescription}>Talk to your AI assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#10b981', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionIconGradient}
            >
              <Ionicons name="happy" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Daily Check-In</Text>
              <Text style={styles.actionDescription}>Log your mood and feelings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/goals');
            }}
          >
            <LinearGradient
              colors={['#f59e0b', '#fbbf24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionIconGradient}
            >
              <Ionicons name="trophy" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Goals</Text>
              <Text style={styles.actionDescription}>Track your progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </Pressable>
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
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  statCardGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
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
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  actionIconGradient: {
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
  // Hero Section
  heroSection: {
    marginTop: -Spacing.lg,
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xl,
  },
  heroGradient: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl * 1.5,
    borderBottomRightRadius: BorderRadius.xl * 1.5,
  },
  heroContent: {
    gap: Spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  heroMessage: {
    fontSize: Typography.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.medium,
  },
  logoutButtonHero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: '#fff',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.medium,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
