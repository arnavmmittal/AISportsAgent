/**
 * PreGameCard - Upcoming game card with pre-game session CTA
 *
 * Shows on the athlete dashboard when there's an upcoming game.
 * Features:
 * - Game info (opponent, date, location)
 * - Urgency indicators for game day
 * - Quick access to pre-game mental check-in
 * - Completion status display
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { getSchedule, GameSchedule } from '../../lib/services/schedule';
import { PreGameSession } from './PreGameSession';

interface PreGameCardProps {
  onSessionComplete?: () => void;
}

export function PreGameCard({ onSessionComplete }: PreGameCardProps) {
  const router = useRouter();
  const [upcomingGame, setUpcomingGame] = useState<GameSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSession, setShowSession] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    fetchUpcomingGame();
  }, []);

  const fetchUpcomingGame = async () => {
    try {
      const data = await getSchedule(1);
      if (data.nextGame) {
        setUpcomingGame(data.nextGame);
        setSessionCompleted(!!data.nextGame.PreGameSession?.completedAt);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSession(true);
  };

  const handleSessionComplete = () => {
    setSessionCompleted(true);
    setShowSession(false);
    fetchUpcomingGame();
    onSessionComplete?.();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator color={Colors.primary} />
        </LinearGradient>
      </View>
    );
  }

  // No upcoming game
  if (!upcomingGame) {
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/schedule');
        }}
        activeOpacity={0.8}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="calendar-outline" size={24} color={Colors.gray400} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>No Upcoming Games</Text>
            <Text style={styles.emptySubtitle}>Tap to add your schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </View>
      </TouchableOpacity>
    );
  }

  const gameDate = new Date(upcomingGame.gameDate);
  const now = new Date();
  const hoursUntilGame = Math.floor((gameDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysUntilGame = Math.floor(hoursUntilGame / 24);
  const isGameSoon = hoursUntilGame <= 4 && hoursUntilGame > 0;

  const getStakesColors = (stakes: string): [string, string] => {
    switch (stakes) {
      case 'CHAMPIONSHIP':
        return ['#f59e0b', '#d97706'];
      case 'HIGH':
        return ['#ef4444', '#dc2626'];
      case 'MEDIUM':
        return ['#3b82f6', '#2563eb'];
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  const stakesColors = getStakesColors(upcomingGame.stakes);

  return (
    <>
      <View
        style={[
          styles.container,
          sessionCompleted && styles.containerCompleted,
          isGameSoon && !sessionCompleted && styles.containerUrgent,
        ]}
      >
        {/* Urgency indicator */}
        {isGameSoon && !sessionCompleted && (
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.urgencyBar}
          />
        )}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={sessionCompleted ? ['#22c55e', '#16a34a'] : stakesColors}
              style={styles.iconContainer}
            >
              <Ionicons
                name={sessionCompleted ? 'checkmark-circle' : 'trophy'}
                size={24}
                color="#fff"
              />
            </LinearGradient>

            <View style={styles.headerInfo}>
              <Text style={styles.opponent}>vs {upcomingGame.opponent}</Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.badge,
                    upcomingGame.homeAway === 'HOME' ? styles.badgeHome : styles.badgeAway,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      upcomingGame.homeAway === 'HOME'
                        ? styles.badgeTextHome
                        : styles.badgeTextAway,
                    ]}
                  >
                    {upcomingGame.homeAway}
                  </Text>
                </View>
                {upcomingGame.stakes !== 'LOW' && (
                  <View style={[styles.badge, { backgroundColor: `${stakesColors[0]}33` }]}>
                    <Text style={[styles.badgeText, { color: stakesColors[0] }]}>
                      {upcomingGame.stakes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Game Details */}
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={14} color={Colors.gray400} />
              <Text style={styles.detailText}>
                {gameDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color={Colors.gray400} />
              <Text style={styles.detailText}>
                {gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            {upcomingGame.location && (
              <View style={styles.detailItem}>
                <Ionicons name="location" size={14} color={Colors.gray400} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {upcomingGame.location}
                </Text>
              </View>
            )}
          </View>

          {/* Status */}
          <View
            style={[
              styles.statusContainer,
              sessionCompleted && styles.statusCompleted,
              isGameSoon && !sessionCompleted && styles.statusUrgent,
            ]}
          >
            {sessionCompleted ? (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                <Text style={styles.statusTextCompleted}>Pre-game check-in complete!</Text>
              </View>
            ) : isGameSoon ? (
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                <Text style={styles.statusTextUrgent}>
                  Game in {hoursUntilGame} hour{hoursUntilGame !== 1 ? 's' : ''} - Time for your
                  mental prep!
                </Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <Ionicons name="sparkles" size={18} color="#818cf8" />
                <Text style={styles.statusText}>
                  {daysUntilGame > 0
                    ? `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''} until game day`
                    : `${hoursUntilGame} hours until game time`}
                </Text>
              </View>
            )}
          </View>

          {/* CTA Button */}
          <TouchableOpacity onPress={handleStartSession} activeOpacity={0.8}>
            {sessionCompleted ? (
              <View style={styles.completedButton}>
                <Text style={styles.completedButtonText}>View Your Mental Prep</Text>
                <Ionicons name="chevron-forward" size={18} color="#22c55e" />
              </View>
            ) : (
              <LinearGradient
                colors={isGameSoon ? ['#f59e0b', '#f97316'] : ['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ctaButton, isGameSoon && styles.ctaButtonPulse]}
              >
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.ctaButtonText}>Start Pre-Game Check-In</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pre-Game Session Modal */}
      <Modal visible={showSession} animationType="slide" presentationStyle="fullScreen">
        <PreGameSession
          gameScheduleId={upcomingGame.id}
          gameInfo={{
            opponent: upcomingGame.opponent,
            gameDate: upcomingGame.gameDate,
            location: upcomingGame.location,
            stakes: upcomingGame.stakes,
            homeAway: upcomingGame.homeAway,
          }}
          onComplete={handleSessionComplete}
          onClose={() => setShowSession(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
  },
  containerCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  containerUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  urgencyBar: {
    height: 3,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  opponent: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeHome: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  badgeAway: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  badgeTextHome: {
    color: '#22c55e',
  },
  badgeTextAway: {
    color: '#3b82f6',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statusTextCompleted: {
    flex: 1,
    fontSize: Typography.sm,
    color: '#22c55e',
    fontWeight: '600',
  },
  statusTextUrgent: {
    flex: 1,
    fontSize: Typography.sm,
    color: '#f59e0b',
    fontWeight: '600',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  ctaButtonPulse: {
    // Add animation via Animated API if needed
  },
  ctaButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    gap: Spacing.sm,
  },
  completedButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#22c55e',
  },
  loadingContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  loadingGradient: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
});
