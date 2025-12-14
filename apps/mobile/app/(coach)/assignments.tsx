/**
 * Coach Assignments Management
 * Create, view, and manage assignments for athletes
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  AssignmentSubmission: any[];
}

export default function CoachAssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    targetSport: '',
  });

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await apiClient.getAssignments();
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAssignments();
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    try {
      await apiClient.createAssignment({
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate || undefined,
        targetSport: newAssignment.targetSport || undefined,
      });

      setIsModalVisible(false);
      setNewAssignment({ title: '', description: '', dueDate: '', targetSport: '' });
      loadAssignments();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      Alert.alert('Error', 'Failed to create assignment');
    }
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const total = assignment.AssignmentSubmission?.length || 0;
    const submitted = assignment.AssignmentSubmission?.filter((s: any) => s.status === 'SUBMITTED' || s.status === 'REVIEWED').length || 0;
    return { total, submitted };
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
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
              <Text style={styles.headerTitle}>Assignments</Text>
              <Text style={styles.headerSubtitle}>Manage athlete tasks</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsModalVisible(true);
              }}
              style={styles.createButton}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
        {assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No assignments yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first assignment</Text>
          </View>
        ) : (
          assignments.map((assignment) => {
            const stats = getSubmissionStats(assignment);
            return (
              <View key={assignment.id} style={styles.assignmentCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View style={styles.statsChip}>
                      <Text style={styles.statsText}>
                        {stats.submitted}/{stats.total}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentDescription} numberOfLines={2}>
                    {assignment.description}
                  </Text>
                  {assignment.dueDate && (
                    <View style={styles.dueDate}>
                      <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.dueDateText}>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.createdDate}>
                    <Text style={styles.createdText}>
                      Created {new Date(assignment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Assignment Modal */}
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
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Assignment</Text>
            <TouchableOpacity onPress={handleCreateAssignment}>
              <Text style={styles.modalCreate}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScroll}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newAssignment.title}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, title: text })}
                placeholder="E.g., Pre-Game Visualization Exercise"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newAssignment.description}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, description: text })}
                placeholder="Describe the assignment in detail..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Sport (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newAssignment.targetSport}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, targetSport: text })}
                placeholder="E.g., Basketball (leave blank for all)"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newAssignment.dueDate}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, dueDate: text })}
                placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
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
  createButton: {
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
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.sm,
  },
  assignmentCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  assignmentTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginRight: Spacing.sm,
  },
  statsChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: BorderRadius.sm,
  },
  statsText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  assignmentDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  dueDateText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  createdDate: {
    marginTop: Spacing.xs,
  },
  createdText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  bottomPadding: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCancel: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
  },
  modalCreate: {
    fontSize: Typography.base,
    color: '#3b82f6',
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
  },
  modalScroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
  },
  textArea: {
    height: 150,
    paddingTop: Spacing.md,
  },
});
