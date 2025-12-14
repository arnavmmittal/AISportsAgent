import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Goal } from '@sports-agent/types';
import { apiClient, getStoredUserId, getStoredUserRole } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface SuggestedGoal {
  id: string;
  title: string;
  description: string;
  category: Goal['category'];
  reason: string;
  icon: string;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<'ATHLETE' | 'COACH' | 'ADMIN' | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PERFORMANCE' as Goal['category'],
    targetDate: '',
  });

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    const role = await getStoredUserRole();
    setUserRole(role);

    loadGoals();
    // Only load suggestions for athletes
    if (role === 'ATHLETE') {
      loadSuggestedGoals();
    } else {
      setIsLoadingSuggestions(false);
    }
  };

  const loadGoals = async () => {
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      const filters: any = {};
      if (selectedCategory !== 'ALL') filters.category = selectedCategory;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const data = await apiClient.getGoals(userId, filters);
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload goals when filters change
  useEffect(() => {
    if (!isLoading) {
      loadGoals();
    }
  }, [selectedCategory, searchQuery]);

  const loadSuggestedGoals = async () => {
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      const suggestions = await apiClient.getGoalSuggestions(userId);
      setSuggestedGoals(suggestions);
    } catch (error) {
      console.error('Failed to load suggested goals:', error);
      // Keep empty suggestions on error
      setSuggestedGoals([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      const goal = await apiClient.createGoal({
        athleteId: userId,
        title: newGoal.title,
        description: newGoal.description || undefined,
        category: newGoal.category,
        status: 'NOT_STARTED',
        progress: 0,
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGoals([goal, ...goals]);
      setIsModalVisible(false);
      setNewGoal({ title: '', description: '', category: 'PERFORMANCE', targetDate: '' });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create goal');
    }
  };

  const addSuggestedGoal = async (suggestion: SuggestedGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      const goal = await apiClient.createGoal({
        athleteId: userId,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        status: 'NOT_STARTED',
        progress: 0,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGoals([goal, ...goals]);
      setSuggestedGoals(suggestedGoals.filter((s) => s.id !== suggestion.id));
      Alert.alert('Goal Added!', `"${suggestion.title}" has been added to your goals.`);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to add suggested goal');
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const updated = await apiClient.updateGoal(goalId, {
        progress,
        status: progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      });

      if (progress === 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await apiClient.deleteGoal(goalId);
            setGoals(goals.filter((g) => g.id !== goalId));
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const getCategoryGradient = (category: Goal['category']) => {
    switch (category) {
      case 'PERFORMANCE':
        return ['#8b5cf6', '#a78bfa']; // Purple
      case 'MENTAL':
        return ['#ec4899', '#f472b6']; // Pink
      case 'ACADEMIC':
        return ['#10b981', '#34d399']; // Emerald
      case 'PERSONAL':
        return ['#f59e0b', '#fbbf24']; // Amber
      default:
        return ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'];
    }
  };

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'PERFORMANCE':
        return 'trophy';
      case 'MENTAL':
        return 'heart';
      case 'ACADEMIC':
        return 'school';
      case 'PERSONAL':
        return 'person';
      default:
        return 'star';
    }
  };

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'ellipse-outline';
      case 'IN_PROGRESS':
        return 'play-circle';
      case 'COMPLETED':
        return 'checkmark-circle';
      case 'ABANDONED':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const renderSuggestedGoal = ({ item }: { item: SuggestedGoal }) => (
    <View style={styles.suggestionCard}>
      <LinearGradient
        colors={getCategoryGradient(item.category)}
        style={styles.suggestionGradient}
      >
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionHeader}>
            <View style={styles.suggestionIconContainer}>
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </View>
            <TouchableOpacity
              style={styles.addSuggestionButton}
              onPress={() => addSuggestedGoal(item)}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.suggestionTitle}>{item.title}</Text>
          <Text style={styles.suggestionDescription}>{item.description}</Text>

          <View style={styles.suggestionFooter}>
            <View style={styles.suggestionReasonBadge}>
              <Ionicons name="sparkles" size={12} color="#fbbf24" />
              <Text style={styles.suggestionReason}>{item.reason}</Text>
            </View>
            <Text style={styles.suggestionCategory}>{item.category}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderGoal = ({ item }: { item: Goal }) => (
    <View style={styles.goalCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.goalGradient}
      >
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleRow}>
              <LinearGradient
                colors={getCategoryGradient(item.category)}
                style={styles.categoryIconContainer}
              >
                <Ionicons name={getCategoryIcon(item.category)} size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.goalTitleContainer}>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.goalCategory}>{item.category}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteGoal(item.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {item.description && <Text style={styles.goalDescription}>{item.description}</Text>}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelRow}>
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={16}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.progressLabel}>Progress</Text>
              </View>
              <Text style={styles.progressValue}>{item.progress}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={getCategoryGradient(item.category)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${item.progress}%` }]}
              />
            </View>
          </View>

          <View style={styles.progressButtons}>
            <TouchableOpacity
              style={[styles.progressButton, item.progress === 0 && styles.progressButtonDisabled]}
              onPress={() => updateGoalProgress(item.id, Math.max(0, item.progress - 10))}
              disabled={item.progress === 0}
            >
              <Ionicons
                name="remove-circle-outline"
                size={18}
                color={item.progress === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.progressButtonText,
                  item.progress === 0 && styles.progressButtonTextDisabled,
                ]}
              >
                -10%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.progressButton,
                item.progress === 100 && styles.progressButtonDisabled,
              ]}
              onPress={() => updateGoalProgress(item.id, Math.min(100, item.progress + 10))}
              disabled={item.progress === 100}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={item.progress === 100 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.progressButtonText,
                  item.progress === 100 && styles.progressButtonTextDisabled,
                ]}
              >
                +10%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => updateGoalProgress(item.id, 100)}
              disabled={item.progress === 100}
            >
              <LinearGradient
                colors={
                  item.progress === 100
                    ? ['rgba(16, 185, 129, 0.3)', 'rgba(52, 211, 153, 0.3)']
                    : ['#10b981', '#34d399']
                }
                style={styles.completeButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.completeButtonText}>
                  {item.progress === 100 ? 'Done!' : 'Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with gradient */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#8b5cf6', '#d946ef', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="trophy" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.headerTitle}>Goals</Text>
                <Text style={styles.headerSubtitle}>Track your progress</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsModalVisible(true);
              }}
              style={styles.addButton}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search goals..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['ALL', 'PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat);
              }}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {goals.length === 0 && suggestedGoals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="trophy" size={64} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyText}>
            Set your first goal to start tracking your progress
          </Text>
          <TouchableOpacity
            style={styles.createButtonContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsModalVisible(true);
            }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButton}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Goal</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            suggestedGoals.length > 0 ? (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsTitleRow}>
                  <Ionicons name="sparkles" size={24} color="#fbbf24" />
                  <Text style={styles.suggestionsTitle}>AI-Suggested Goals</Text>
                </View>
                <Text style={styles.suggestionsSubtitle}>
                  Personalized recommendations based on your profile & recent activity
                </Text>
                <FlatList
                  data={suggestedGoals}
                  renderItem={renderSuggestedGoal}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsScroll}
                />

                <Text style={styles.yourGoalsTitle}>Your Goals</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Goal Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0f172a', '#1e293b']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                createGoal();
              }}
            >
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              placeholder="e.g., Improve free throw percentage"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={100}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              placeholder="Details about this goal..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryButtonContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNewGoal({ ...newGoal, category: cat });
                  }}
                >
                  <LinearGradient
                    colors={
                      newGoal.category === cat
                        ? getCategoryGradient(cat)
                        : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                    }
                    style={styles.categoryButton}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat)}
                      size={20}
                      color={newGoal.category === cat ? '#fff' : 'rgba(255,255,255,0.5)'}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newGoal.category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Date (optional)</Text>
            <TextInput
              style={styles.input}
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <View style={styles.modalBottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#8b5cf6',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: '#fff',
    paddingVertical: Spacing.md,
  },
  categoryScroll: {
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#a78bfa',
  },
  categoryChipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 24,
  },
  createButtonContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  createButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '800',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  // AI Suggestions Section
  suggestionsSection: {
    marginBottom: Spacing.xl,
  },
  suggestionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  suggestionsTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
  },
  suggestionsSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  suggestionsScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  suggestionCard: {
    width: 280,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  suggestionGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.xl,
  },
  suggestionContent: {
    padding: Spacing.lg,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  suggestionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSuggestionButton: {
    opacity: 0.9,
  },
  suggestionTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  suggestionDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionReasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  suggestionReason: {
    fontSize: Typography.xs,
    color: '#fff',
    fontWeight: '600',
  },
  suggestionCategory: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  yourGoalsTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  // Goal Cards
  goalCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  goalGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
  },
  goalContent: {
    padding: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  goalCategory: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  goalDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: '#fff',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressButtonDisabled: {
    opacity: 0.4,
  },
  progressButtonText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  progressButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  completeButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
  },
  modalCancel: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  modalSave: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: '#8b5cf6',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
  },
  categoryButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  modalBottomPadding: {
    height: 40,
  },
});
