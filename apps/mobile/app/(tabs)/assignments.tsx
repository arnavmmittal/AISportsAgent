import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { apiClient } from '../../lib/auth';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  submissions: AssignmentSubmission[];
}

interface AssignmentSubmission {
  id: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  response: string | null;
  submittedAt: string | null;
}

export default function AssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await apiClient.getAssignments();
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      Alert.alert('Error', 'Failed to load assignments. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  const handleSelectAssignment = (assignment: Assignment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssignment(assignment);
    // Pre-fill response if already submitted
    if (assignment.submissions && assignment.submissions.length > 0) {
      setResponseText(assignment.submissions[0].response || '');
    } else {
      setResponseText('');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssignment(null);
    setResponseText('');
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    if (!responseText.trim()) {
      Alert.alert('Required', 'Please enter your response before submitting.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit this response? You can edit it later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiClient.submitAssignment(selectedAssignment.id, responseText);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Your response has been submitted!');

              // Refresh assignments list
              await loadAssignments();
              handleBack();
            } catch (error) {
              console.error('Failed to submit assignment:', error);
              Alert.alert('Error', 'Failed to submit assignment. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#fbbf24'; // Amber
      case 'SUBMITTED':
        return '#10b981'; // Green
      case 'REVIEWED':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Not Submitted';
      case 'SUBMITTED':
        return 'Submitted';
      case 'REVIEWED':
        return 'Reviewed';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Assignment Detail View
  if (selectedAssignment) {
    const submission = selectedAssignment.submissions?.[0];
    const status = submission?.status || 'PENDING';
    const isSubmitted = status !== 'PENDING';

    return (
      <View style={styles.container}>
        {/* Dark gradient background */}
        <LinearGradient
          colors={[Colors.background, Colors.card, Colors.cardElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Assignment</Text>
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Assignment Info Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.assignmentTitle}>{selectedAssignment.title}</Text>
                {selectedAssignment.dueDate && (
                  <View
                    style={[
                      styles.dueDateBadge,
                      isOverdue(selectedAssignment.dueDate) && styles.dueDateBadgeOverdue,
                    ]}
                  >
                    <Ionicons
                      name={isOverdue(selectedAssignment.dueDate) ? 'warning' : 'time-outline'}
                      size={14}
                      color={isOverdue(selectedAssignment.dueDate) ? '#ef4444' : '#fbbf24'}
                    />
                    <Text
                      style={[
                        styles.dueDateText,
                        isOverdue(selectedAssignment.dueDate) && styles.dueDateTextOverdue,
                      ]}
                    >
                      {formatDueDate(selectedAssignment.dueDate)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.assignmentDescription}>{selectedAssignment.description}</Text>

              {/* Status Badge */}
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <Text style={styles.statusText}>{getStatusText(status)}</Text>
                </View>
                {submission?.submittedAt && (
                  <Text style={styles.submittedAtText}>
                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Response Input Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.responseHeader}>
                <Text style={styles.responseLabel}>Your Response</Text>
                {isSubmitted && (
                  <Text style={styles.editHint}>Tap to edit and resubmit</Text>
                )}
              </View>

              <TextInput
                style={styles.textInput}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Enter your response here..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                editable={!isSubmitting}
              />

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={isSubmitting ? ['#6b7280', '#4b5563'] : ['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Ionicons
                    name={isSubmitted ? 'checkmark-done' : 'checkmark'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Submitting...' : isSubmitted ? 'Update Response' : 'Submit'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  }

  // Assignment List View
  const pendingAssignments = assignments.filter(
    (a) => !a.submissions || a.submissions.length === 0 || a.submissions[0].status === 'PENDING'
  );
  const submittedAssignments = assignments.filter(
    (a) => a.submissions && a.submissions.length > 0 && a.submissions[0].status !== 'PENDING'
  );

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with gradient */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary, Colors.accent]}
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
                  <Ionicons name="clipboard" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.headerTitle}>Assignments</Text>
                <Text style={styles.headerSubtitle}>
                  {pendingAssignments.length} pending
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b5cf6"
            colors={[Colors.primary, Colors.secondary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading assignments...</Text>
          </View>
        ) : assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={80} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No assignments yet</Text>
            <Text style={styles.emptySubtext}>
              Assignments from your coach will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Pending</Text>
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onPress={() => handleSelectAssignment(assignment)}
                  />
                ))}
              </>
            )}

            {/* Submitted Assignments */}
            {submittedAssignments.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Completed</Text>
                {submittedAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onPress={() => handleSelectAssignment(assignment)}
                  />
                ))}
              </>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

function AssignmentCard({
  assignment,
  onPress,
}: {
  assignment: Assignment;
  onPress: () => void;
}) {
  const submission = assignment.submissions?.[0];
  const status = submission?.status || 'PENDING';
  const isPending = status === 'PENDING';
  const isOverdueFlag = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#fbbf24';
      case 'SUBMITTED':
        return '#10b981';
      case 'REVIEWED':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Not Submitted';
      case 'SUBMITTED':
        return 'Submitted';
      case 'REVIEWED':
        return 'Reviewed';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity style={styles.assignmentCard} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.assignmentCardGradient}
      >
        <View style={styles.assignmentCardHeader}>
          <View style={styles.assignmentCardLeft}>
            <View
              style={[
                styles.assignmentIcon,
                { backgroundColor: isPending ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)' },
              ]}
            >
              <Ionicons
                name={isPending ? 'clipboard-outline' : 'checkmark-circle'}
                size={24}
                color={isPending ? '#fbbf24' : '#10b981'}
              />
            </View>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentCardTitle} numberOfLines={1}>
                {assignment.title}
              </Text>
              <Text style={styles.assignmentCardDescription} numberOfLines={2}>
                {assignment.description}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
        </View>

        <View style={styles.assignmentCardFooter}>
          <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusTextSmall}>{getStatusText(status)}</Text>
          </View>

          {assignment.dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons
                name={isOverdueFlag ? 'warning' : 'time-outline'}
                size={14}
                color={isOverdueFlag ? '#ef4444' : 'rgba(255,255,255,0.6)'}
              />
              <Text
                style={[
                  styles.dueDateTextSmall,
                  isOverdueFlag && { color: '#ef4444', fontWeight: '700' },
                ]}
              >
                {formatDueDate(assignment.dueDate)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
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
  detailContent: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  assignmentTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  assignmentDescription: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  dueDateBadgeOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  dueDateText: {
    fontSize: Typography.xs,
    color: '#fbbf24',
    fontWeight: '700',
  },
  dueDateTextOverdue: {
    color: '#ef4444',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: '#fff',
  },
  submittedAtText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  responseLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  editHint: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
    minHeight: 200,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  submitButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  assignmentCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  assignmentCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  assignmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  assignmentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  assignmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentCardTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  assignmentCardDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  assignmentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  statusTextSmall: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateTextSmall: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
