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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Goal } from '@sports-agent/types';
import { apiClient, getStoredUserId } from '../../lib/auth';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PERFORMANCE' as Goal['category'],
    targetDate: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      const data = await apiClient.getGoals(userId);
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
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

      setGoals([goal, ...goals]);
      setIsModalVisible(false);
      setNewGoal({ title: '', description: '', category: 'PERFORMANCE', targetDate: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    try {
      const updated = await apiClient.updateGoal(goalId, {
        progress,
        status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
      });

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
            await apiClient.deleteGoal(goalId);
            setGoals(goals.filter((g) => g.id !== goalId));
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'PERFORMANCE':
        return '#2563eb';
      case 'MENTAL':
        return '#8b5cf6';
      case 'ACADEMIC':
        return '#10b981';
      case 'PERSONAL':
        return '#f59e0b';
      default:
        return '#6b7280';
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

  const renderGoal = ({ item }: { item: Goal }) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={24}
            color={getCategoryColor(item.category)}
          />
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={[styles.goalCategory, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteGoal(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text style={styles.goalDescription}>{item.description}</Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{item.progress}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${item.progress}%`, backgroundColor: getCategoryColor(item.category) },
            ]}
          />
        </View>
      </View>

      <View style={styles.progressButtons}>
        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => updateGoalProgress(item.id, Math.max(0, item.progress - 10))}
          disabled={item.progress === 0}
        >
          <Text style={styles.progressButtonText}>-10%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => updateGoalProgress(item.id, Math.min(100, item.progress + 10))}
          disabled={item.progress === 100}
        >
          <Text style={styles.progressButtonText}>+10%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.progressButton, styles.completeButton]}
          onPress={() => updateGoalProgress(item.id, 100)}
          disabled={item.progress === 100}
        >
          <Text style={[styles.progressButtonText, styles.completeButtonText]}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyText}>Set your first goal to start tracking your progress</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.createButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TouchableOpacity onPress={createGoal}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              placeholder="e.g., Improve free throw percentage"
              maxLength={100}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              placeholder="Details about this goal..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    newGoal.category === cat && { backgroundColor: getCategoryColor(cat) },
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      newGoal.category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Date (optional)</Text>
            <TextInput
              style={styles.input}
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  progressButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  completeButtonText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
});
