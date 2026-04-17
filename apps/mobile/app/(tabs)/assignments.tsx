import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoredToken, getStoredUserId } from '../../lib/auth';
import config from '../../config';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'REVIEWED';

interface AssignmentSubmission {
  id: string;
  status: AssignmentStatus;
  response: string | null;
  submittedAt: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  AssignmentSubmission: AssignmentSubmission[];
}

function getStatusConfig(status: AssignmentStatus, colors: ReturnType<typeof useTheme>['colors']) {
  switch (status) {
    case 'PENDING':
      return { color: colors.warning, bgColor: colors.warningLight, label: 'Pending' };
    case 'SUBMITTED':
      return { color: colors.success, bgColor: colors.successLight, label: 'Submitted' };
    case 'REVIEWED':
      return { color: colors.info, bgColor: colors.infoLight, label: 'Reviewed' };
    default:
      return { color: colors.textSecondary, bgColor: colors.backgroundSecondary, label: status };
  }
}

function getDueDateInfo(dueDate: string | null, colors: ReturnType<typeof useTheme>['colors']): { text: string; color: string } {
  if (!dueDate) return { text: 'No due date', color: colors.textTertiary };

  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, color: colors.error };
  } else if (diffDays === 0) {
    return { text: 'Due today', color: colors.warning };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', color: colors.warning };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, color: colors.warning };
  } else if (diffDays <= 7) {
    return { text: `Due in ${diffDays} days`, color: colors.success };
  } else {
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      color: colors.success,
    };
  }
}

function getAssignmentStatus(assignment: Assignment): AssignmentStatus {
  if (assignment.AssignmentSubmission && assignment.AssignmentSubmission.length > 0) {
    return assignment.AssignmentSubmission[0].status;
  }
  return 'PENDING';
}

export default function AssignmentsScreen() {
  const { colors, isDarkMode } = useTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setAssignments([]);
        return;
      }

      const response = await fetch(`${config.apiUrl}/api/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAssignments();
  }, [loadAssignments]);

  const handleExpand = (assignment: Assignment) => {
    if (expandedId === assignment.id) {
      setExpandedId(null);
      setResponseText('');
    } else {
      setExpandedId(assignment.id);
      const existing = assignment.AssignmentSubmission?.[0]?.response;
      setResponseText(existing || '');
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Please enter your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getStoredToken();
      if (!token) {
        Alert.alert('Error', 'You must be logged in to submit.');
        return;
      }

      const response = await fetch(`${config.apiUrl}/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: responseText }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Assignment submitted successfully!');
        setExpandedId(null);
        setResponseText('');
        await loadAssignments();
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      Alert.alert('Error', error.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: AssignmentStatus) => {
    const config = getStatusConfig(status, colors);
    return (
      <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    const dueDateInfo = getDueDateInfo(assignment.dueDate, colors);
    const isExpanded = expandedId === assignment.id;
    const isReviewed = status === 'REVIEWED';

    return (
      <View key={assignment.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => handleExpand(assignment)}
          activeOpacity={0.7}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardTitleArea}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={isExpanded ? undefined : 1}>
                {assignment.title}
              </Text>
              {renderStatusBadge(status)}
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textTertiary}
            />
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={dueDateInfo.color} />
              <Text style={[styles.metaText, { color: dueDateInfo.color }]}>
                {dueDateInfo.text}
              </Text>
            </View>
          </View>

          {!isExpanded && (
            <Text style={[styles.descriptionPreview, { color: colors.textSecondary }]} numberOfLines={2}>
              {assignment.description}
            </Text>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
            <Text style={[styles.descriptionFull, { color: colors.textPrimary }]}>{assignment.description}</Text>

            {status === 'SUBMITTED' && assignment.AssignmentSubmission?.[0]?.submittedAt && (
              <View style={[styles.submittedInfo, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.submittedText, { color: colors.success }]}>
                  Submitted{' '}
                  {new Date(assignment.AssignmentSubmission[0].submittedAt).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  )}
                </Text>
              </View>
            )}

            {!isReviewed && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {status === 'SUBMITTED' ? 'Update Response' : 'Your Response'}
                </Text>
                <TextInput
                  style={[styles.responseInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                  value={responseText}
                  onChangeText={setResponseText}
                  placeholder="Type your response here..."
                  placeholderTextColor={colors.gray500}
                  multiline
                  numberOfLines={6}
                  maxLength={2000}
                  textAlignVertical="top"
                />
                <Text style={[styles.characterCount, { color: colors.textTertiary }]}>{responseText.length}/2000</Text>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.accent }, isSubmitting && styles.submitButtonDisabled]}
                  onPress={() => handleSubmit(assignment.id)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        {status === 'SUBMITTED' ? 'Update' : 'Submit'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {isReviewed && assignment.AssignmentSubmission?.[0]?.response && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Your Response</Text>
                <View style={[styles.reviewedResponseBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.reviewedResponseText, { color: colors.textPrimary }]}>
                    {assignment.AssignmentSubmission[0].response}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.cardElevated }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? 'rgba(212,115,46,0.12)' : 'rgba(201,93,18,0.08)' }]}>
                <Ionicons name="clipboard" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tasks</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your assignments</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardElevated }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? 'rgba(212,115,46,0.12)' : 'rgba(201,93,18,0.08)' }]}>
              <Ionicons name="clipboard" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Tasks</Text>
              <Text style={[styles.headerSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.85)' }]}>Your assignments</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Assignments</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You don't have any assignments yet. Check back later!
            </Text>
          </View>
        ) : (
          assignments.map(renderAssignmentCard)
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header
  header: {
    paddingTop: 60,
    backgroundColor: Colors.primary,
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
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  // Loading & empty states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  // Meta
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  descriptionPreview: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  // Expanded
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  descriptionFull: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  submittedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submittedText: {
    fontSize: Typography.sm,
    color: Colors.success,
    fontWeight: '500',
  },
  // Response input
  responseInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  // Reviewed response
  reviewedResponseBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewedResponseText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  // Submit button
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});
