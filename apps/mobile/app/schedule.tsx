/**
 * Schedule Management Screen
 *
 * Allows athletes to:
 * - View upcoming games
 * - Add new games to their schedule
 * - Edit or delete games
 * - Start pre-game sessions
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import {
  getSchedule,
  addGame,
  deleteGame,
  GameSchedule,
} from '../lib/services/schedule';
import { PreGameSession } from '../components/student';

export default function ScheduleScreen() {
  const router = useRouter();
  const [games, setGames] = useState<GameSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreGame, setShowPreGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameSchedule | null>(null);

  // Add game form
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [homeAway, setHomeAway] = useState<'HOME' | 'AWAY'>('HOME');
  const [stakes, setStakes] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CHAMPIONSHIP'>('MEDIUM');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const data = await getSchedule();
      setGames(data.games || []);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddGame = async () => {
    if (!opponent.trim()) {
      Alert.alert('Error', 'Please enter an opponent name');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newGame = await addGame({
      opponent: opponent.trim(),
      gameDate: gameDate.toISOString(),
      location: location.trim() || undefined,
      homeAway,
      stakes,
    });

    if (newGame) {
      setGames([...games, newGame].sort(
        (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
      ));
      setShowAddModal(false);
      resetForm();
    } else {
      Alert.alert('Error', 'Failed to add game. Please try again.');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to remove this game from your schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const success = await deleteGame(gameId);
            if (success) {
              setGames(games.filter((g) => g.id !== gameId));
            }
          },
        },
      ]
    );
  };

  const handleStartPreGame = (game: GameSchedule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGame(game);
    setShowPreGame(true);
  };

  const resetForm = () => {
    setOpponent('');
    setGameDate(new Date());
    setLocation('');
    setHomeAway('HOME');
    setStakes('MEDIUM');
  };

  const getStakesColor = (level: string): string => {
    switch (level) {
      case 'CHAMPIONSHIP':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.background, Colors.card]}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="calendar" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Schedule</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
          style={styles.addButton}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSchedule(true)}
            tintColor="#fff"
          />
        }
      >
        {games.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
              style={styles.emptyIcon}
            >
              <Ionicons name="calendar-outline" size={48} color={Colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Add your upcoming games to get pre-game mental preparation reminders.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.emptyButton}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Add First Game</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Upcoming Games */}
            <Text style={styles.sectionTitle}>Upcoming Games</Text>
            {games
              .filter((g) => isUpcoming(g.gameDate))
              .map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onStartPreGame={() => handleStartPreGame(game)}
                  onDelete={() => handleDeleteGame(game.id)}
                  getStakesColor={getStakesColor}
                  formatDate={formatDate}
                />
              ))}

            {/* Past Games */}
            {games.filter((g) => !isUpcoming(g.gameDate)).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
                  Past Games
                </Text>
                {games
                  .filter((g) => !isUpcoming(g.gameDate))
                  .map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isPast
                      onDelete={() => handleDeleteGame(game.id)}
                      getStakesColor={getStakesColor}
                      formatDate={formatDate}
                    />
                  ))}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Game Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[Colors.card, Colors.cardElevated]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Game</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Opponent */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Opponent *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={opponent}
                    onChangeText={setOpponent}
                    placeholder="e.g., State University"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                {/* Date & Time */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date & Time *</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                  >
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {gameDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={gameDate}
                      mode="datetime"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setGameDate(date);
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* Location */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={styles.formInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g., Home Stadium"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                {/* Home/Away */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Home or Away</Text>
                  <View style={styles.segmentedControl}>
                    <TouchableOpacity
                      onPress={() => setHomeAway('HOME')}
                      style={[
                        styles.segmentButton,
                        homeAway === 'HOME' && styles.segmentButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          homeAway === 'HOME' && styles.segmentTextActive,
                        ]}
                      >
                        Home
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setHomeAway('AWAY')}
                      style={[
                        styles.segmentButton,
                        homeAway === 'AWAY' && styles.segmentButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          homeAway === 'AWAY' && styles.segmentTextActive,
                        ]}
                      >
                        Away
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stakes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Game Importance</Text>
                  <View style={styles.stakesContainer}>
                    {(['LOW', 'MEDIUM', 'HIGH', 'CHAMPIONSHIP'] as const).map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setStakes(level)}
                        style={[
                          styles.stakesButton,
                          stakes === level && {
                            backgroundColor: `${getStakesColor(level)}33`,
                            borderColor: getStakesColor(level),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stakesText,
                            stakes === level && { color: getStakesColor(level) },
                          ]}
                        >
                          {level === 'CHAMPIONSHIP' ? '🏆' : level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity onPress={handleAddGame} style={styles.submitButton}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Add to Schedule</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Pre-Game Session Modal */}
      <Modal visible={showPreGame} animationType="slide" presentationStyle="fullScreen">
        <PreGameSession
          gameScheduleId={selectedGame?.id}
          gameInfo={
            selectedGame
              ? {
                  opponent: selectedGame.opponent,
                  gameDate: selectedGame.gameDate,
                  location: selectedGame.location,
                  stakes: selectedGame.stakes,
                  homeAway: selectedGame.homeAway,
                }
              : undefined
          }
          onComplete={() => {
            setShowPreGame(false);
            loadSchedule();
          }}
          onClose={() => setShowPreGame(false)}
        />
      </Modal>
    </View>
  );
}

// Game Card Component
function GameCard({
  game,
  isPast,
  onStartPreGame,
  onDelete,
  getStakesColor,
  formatDate,
}: {
  game: GameSchedule;
  isPast?: boolean;
  onStartPreGame?: () => void;
  onDelete: () => void;
  getStakesColor: (level: string) => string;
  formatDate: (date: string) => string;
}) {
  const sessionCompleted = !!game.PreGameSession?.completedAt;

  return (
    <View style={[styles.gameCard, isPast && styles.gameCardPast]}>
      <View style={styles.gameCardHeader}>
        <View
          style={[
            styles.gameCardIcon,
            { backgroundColor: `${getStakesColor(game.stakes)}22` },
          ]}
        >
          <Ionicons
            name={sessionCompleted ? 'checkmark-circle' : 'trophy'}
            size={24}
            color={sessionCompleted ? '#22c55e' : getStakesColor(game.stakes)}
          />
        </View>
        <View style={styles.gameCardInfo}>
          <Text style={[styles.gameCardOpponent, isPast && styles.textMuted]}>
            vs {game.opponent}
          </Text>
          <Text style={styles.gameCardDate}>{formatDate(game.gameDate)}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.gameCardDetails}>
        <View style={styles.gameCardBadges}>
          <View
            style={[
              styles.badge,
              game.homeAway === 'HOME'
                ? { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                : { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: game.homeAway === 'HOME' ? '#22c55e' : '#3b82f6' },
              ]}
            >
              {game.homeAway}
            </Text>
          </View>
          {game.stakes !== 'LOW' && (
            <View
              style={[
                styles.badge,
                { backgroundColor: `${getStakesColor(game.stakes)}22` },
              ]}
            >
              <Text style={[styles.badgeText, { color: getStakesColor(game.stakes) }]}>
                {game.stakes}
              </Text>
            </View>
          )}
        </View>
        {game.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.locationText}>{game.location}</Text>
          </View>
        )}
      </View>

      {!isPast && onStartPreGame && (
        <TouchableOpacity onPress={onStartPreGame} style={styles.preGameButton}>
          <LinearGradient
            colors={sessionCompleted ? ['#22c55e', '#16a34a'] : ['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.preGameButtonGradient}
          >
            <Ionicons
              name={sessionCompleted ? 'checkmark-circle' : 'sparkles'}
              size={16}
              color="#fff"
            />
            <Text style={styles.preGameButtonText}>
              {sessionCompleted ? 'View Mental Prep' : 'Start Pre-Game'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#fff',
  },
  gameCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gameCardPast: {
    opacity: 0.6,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gameCardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  gameCardInfo: {
    flex: 1,
  },
  gameCardOpponent: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#fff',
  },
  gameCardDate: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameCardDetails: {
    marginBottom: Spacing.md,
  },
  gameCardBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  preGameButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  preGameButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  preGameButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
  },
  textMuted: {
    color: Colors.textSecondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalGradient: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  modalClose: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: '#fff',
    fontSize: Typography.base,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: Typography.base,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
  },
  stakesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stakesButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stakesText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  submitButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
});
