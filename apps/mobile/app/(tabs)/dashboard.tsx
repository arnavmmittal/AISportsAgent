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
import { apiClient } from '../../lib/auth';
import type { MoodLog, Goal } from '@sports-agent/types';
import { Card, LoadingScreen, GradientCard } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { BiometricOverview } from '../../components/biometrics/BiometricOverview';
import { HRVChart } from '../../components/biometrics/HRVChart';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moodStats, setMoodStats] = useState<any>(null);
  const [crisisAlerts, setCrisisAlerts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDashboardData();

    // Animate gradient continuously for visual interest
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const userId = await getStoredUserId();
      if (!userId) {
        console.log('No user ID found, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      setUserId(userId);

      // Fetch all dashboard data in parallel
      const [moodLogsData, goalsData, assignmentsData] = await Promise.all([
        getMoodLogs(userId, 7),
        getGoals(userId),
        apiClient.getAssignments().catch(() => []),
      ]);

      setMoodLogs(moodLogsData);
      setGoals(goalsData);
      setAssignments(assignmentsData);

      // Fetch crisis alerts (athlete-specific endpoint)
      try {
        const response = await fetch(`${apiClient['baseURL']}/api/athlete/crisis-alerts`, {
          headers: {
            Authorization: `Bearer ${await import('../../lib/auth').then(m => m.getStoredToken())}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCrisisAlerts(data.alerts || []);
        }
      } catch (error) {
        console.log('Failed to fetch crisis alerts:', error);
      }

      if (!isRefresh) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
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
    router.replace('/(auth)/welcome');
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
      'Ready to crush your goals today? 💪',
      'Let\'s make today count! 🔥',
      'You\'re doing amazing! ⭐',
      'Time to level up! 🚀',
      'Stay focused on your goals! 🎯',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient Mesh */}
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={['#60a5fa']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Vibrant Gradient */}
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
            colors={['#6366f1', '#8b5cf6', '#d946ef', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Glassmorphic overlay */}
            <View style={styles.glassOverlay}>
              <View style={styles.heroHeader}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroGreeting}>{getGreeting()}!</Text>
                  <Text style={styles.heroMessage}>{getMotivationalMessage()}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.logoutButtonGradient}
                  >
                    <Ionicons name="log-out-outline" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Enhanced Stats with Glass Cards */}
              <View style={styles.heroStatsContainer}>
                <View style={styles.heroStatGlassCard}>
                  <Text style={styles.heroStatValue}>{moodLogs.length}</Text>
                  <Text style={styles.heroStatLabel}>Check-ins</Text>
                  <View style={styles.statIconBadge}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                  </View>
                </View>
                <View style={styles.heroStatGlassCard}>
                  <Text style={styles.heroStatValue}>{goals.filter(g => g.status !== 'COMPLETED').length}</Text>
                  <Text style={styles.heroStatLabel}>Active Goals</Text>
                  <View style={styles.statIconBadge}>
                    <Ionicons name="trophy" size={14} color="#fbbf24" />
                  </View>
                </View>
                <View style={styles.heroStatGlassCard}>
                  <Text style={styles.heroStatValue}>{getMoodEmoji(getAverageMood())}</Text>
                  <Text style={styles.heroStatLabel}>Mood Today</Text>
                  <View style={styles.statIconBadge}>
                    <Ionicons name="heart" size={14} color="#f87171" />
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Crisis Alert Banner */}
        {crisisAlerts.filter((a) => !a.resolved).length > 0 && (
          <Animated.View
            style={[
              styles.crisisAlertBanner,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#dc2626', '#ef4444', '#f87171']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crisisAlertGradient}
            >
              <View style={styles.crisisAlertIconContainer}>
                <Ionicons name="warning" size={28} color="#fff" />
              </View>
              <View style={styles.crisisAlertContent}>
                <Text style={styles.crisisAlertTitle}>Support Available 24/7</Text>
                <Text style={styles.crisisAlertMessage}>
                  We're here for you. If you're in crisis, help is available immediately.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.crisisAlertButton}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  // Open crisis resources (could navigate or show modal)
                  router.push('/(tabs)/chat');
                }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.crisisAlertButtonGradient}
                >
                  <Ionicons name="chatbubbles" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Vibrant Stat Cards with Triadic Colors */}
        <Text style={styles.sectionTitleLight}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {/* Mood - Purple/Blue */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa', '#c4b5fd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconGlass}
                >
                  <Ionicons name="happy" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.statValueWhite}>{getAverageMood()}/10</Text>
              <Text style={styles.statLabelWhite}>Average Mood</Text>
              <Text style={styles.statEmoji}>{getMoodEmoji(getAverageMood())}</Text>
            </LinearGradient>
          </Pressable>

          {/* Confidence - Green/Emerald */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#10b981', '#34d399', '#6ee7b7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconGlass}
                >
                  <Ionicons name="trending-up" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.statValueWhite}>{getAverageConfidence()}/10</Text>
              <Text style={styles.statLabelWhite}>Confidence</Text>
              <Text style={styles.statEmoji}>💪</Text>
            </LinearGradient>
          </Pressable>

          {/* Stress - Orange/Amber */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={['#f59e0b', '#fbbf24', '#fcd34d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconGlass}
                >
                  <Ionicons name="flash" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.statValueWhite}>{getAverageStress()}/10</Text>
              <Text style={styles.statLabelWhite}>Stress Level</Text>
              <Text style={styles.statEmoji}>⚡</Text>
            </LinearGradient>
          </Pressable>

          {/* Goals - Pink/Rose */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/goals');
            }}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.secondary, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.statIconGlass}
                >
                  <Ionicons name="trophy" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.statValueWhite}>{goals.length}</Text>
              <Text style={styles.statLabelWhite}>Total Goals</Text>
              <Text style={styles.statEmoji}>🎯</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Biometric Overview */}
        {userId && (
          <>
            <Text style={styles.sectionTitleLight}>Biometrics</Text>
            <BiometricOverview athleteId={userId} />
          </>
        )}

        {/* HRV Chart */}
        {userId && (
          <>
            <Text style={styles.sectionTitleLight}>Heart Rate Variability</Text>
            <HRVChart athleteId={userId} days={30} />
          </>
        )}

        {/* Quick Actions with Modern Cards */}
        <Text style={styles.sectionTitleLight}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/chat');
            }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="chatbubbles" size={26} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start Chat</Text>
              <Text style={styles.actionDescription}>Talk to your AI coach</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/mood');
            }}
          >
            <LinearGradient
              colors={[Colors.success, '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="happy" size={26} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Daily Check-In</Text>
              <Text style={styles.actionDescription}>Log your mood & feelings</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/goals');
            }}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="trophy" size={26} color="#fff" />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Goals</Text>
              <Text style={styles.actionDescription}>Track your progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        {/* Recent Activity with Glass Cards */}
        {moodLogs.length > 0 && (
          <>
            <Text style={styles.sectionTitleLight}>Recent Check-Ins</Text>
            <View style={styles.activityContainer}>
              {moodLogs.slice(0, 3).map((log, index) => (
                <View key={log.id} style={styles.activityGlassCard}>
                  <View style={styles.activityIconContainer}>
                    <Text style={styles.activityEmoji}>{getMoodEmoji(log.mood)}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      Mood: {log.mood}/10  •  Confidence: {log.confidence}/10
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Active Goals with Progress Bars */}
        {goals.filter(g => g.status !== 'COMPLETED').length > 0 && (
          <>
            <Text style={styles.sectionTitleLight}>Active Goals</Text>
            <View style={styles.goalsContainer}>
              {goals
                .filter((g) => g.status !== 'COMPLETED')
                .slice(0, 3)
                .map((goal) => (
                  <View key={goal.id} style={styles.goalGlassCard}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalProgress}>{goal.progress}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={['#8b5cf6', '#ec4899']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${goal.progress}%` }]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Upcoming Assignments */}
        {assignments.length > 0 && (
          <>
            <Text style={styles.sectionTitleLight}>Upcoming Assignments</Text>
            <View style={styles.assignmentsContainer}>
              {assignments.slice(0, 3).map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.assignmentGlassCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(tabs)/assignments');
                  }}
                >
                  <View style={styles.assignmentHeader}>
                    <View style={styles.assignmentIconBadge}>
                      <Ionicons name="document-text" size={22} color="#fff" />
                    </View>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                      {assignment.dueDate && (
                        <View style={styles.assignmentDueDate}>
                          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.assignmentDueText}>
                            Due {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                    {assignment.status === 'PENDING' && (
                      <View style={styles.assignmentStatusBadge}>
                        <Text style={styles.assignmentStatusText}>Todo</Text>
                      </View>
                    )}
                    {assignment.status === 'SUBMITTED' && (
                      <View style={[styles.assignmentStatusBadge, styles.assignmentStatusComplete]}>
                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  // Hero Section - Vibrant Gradient
  heroSection: {
    marginTop: -Spacing.lg,
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  heroGradient: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  glassOverlay: {
    gap: Spacing.xl,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMessage: {
    fontSize: Typography.lg,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  // Glass Stats Cards in Hero
  heroStatsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroStatGlassCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    position: 'relative',
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
  },
  statIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Section Title
  sectionTitleLight: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  // Vibrant Stat Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  statCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  statCardGradient: {
    padding: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    position: 'relative',
  },
  statCardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  statIconContainer: {
    marginBottom: Spacing.md,
  },
  statIconGlass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  statValueWhite: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabelWhite: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 24,
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  // Quick Actions
  actionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: Spacing.md,
  },
  actionCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.8,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  // Activity Cards
  activityContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  activityGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: Spacing.md,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 26,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  // Goals
  goalsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  goalGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  goalProgress: {
    fontSize: Typography.base,
    fontWeight: '900',
    color: '#fff',
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomPadding: {
    height: 60,
  },
  // Crisis Alert Banner
  crisisAlertBanner: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  crisisAlertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  crisisAlertIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  crisisAlertContent: {
    flex: 1,
  },
  crisisAlertTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  crisisAlertMessage: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 18,
  },
  crisisAlertButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  crisisAlertButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Assignments
  assignmentsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  assignmentGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assignmentIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  assignmentDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignmentDueText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  assignmentStatusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  assignmentStatusText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fbbf24',
  },
  assignmentStatusComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
});
