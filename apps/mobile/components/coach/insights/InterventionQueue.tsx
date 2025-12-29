/**
 * Intervention Queue Component (React Native)
 *
 * Displays prioritized intervention recommendations for coaches:
 * - URGENT cards (red): Immediate action required
 * - HIGH cards (orange): Action within 2-3 days
 * - MEDIUM cards (yellow): Action within week
 * - LOW cards (blue): Optional/monitoring
 *
 * Features:
 * - Action buttons: "View Athlete", "Mark Complete"
 * - Due date badges for urgent/high priority
 * - Filter by priority level
 * - Track completion rate
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface InterventionRecommendation {
  id: string;
  athleteId: string;
  athleteName: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  rationale: string;
  estimatedDuration: string;
  dueBy?: Date;
  triggers: string[];
  relatedMetrics: {
    readiness?: number;
    mood?: number;
    stress?: number;
    confidence?: number;
    engagement?: number;
  };
}

interface InterventionQueue {
  urgent: InterventionRecommendation[];
  high: InterventionRecommendation[];
  medium: InterventionRecommendation[];
  low: InterventionRecommendation[];
  total: number;
}

interface InterventionQueueProps {
  coachId: string;
}

export function InterventionQueueComponent({ coachId }: InterventionQueueProps) {
  const [queue, setQueue] = useState<InterventionQueue | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInterventions();
  }, [coachId]);

  async function fetchInterventions() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/coach/interventions?coachId=${coachId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch intervention recommendations');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load interventions');
      }

      setQueue(result.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load intervention queue');
      setIsLoading(false);
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'alert-circle';
      case 'HIGH':
        return 'alert-circle-outline';
      case 'MEDIUM':
        return 'information';
      default:
        return 'check-circle';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { border: '#ef4444', bg: '#fef2f2' };
      case 'HIGH':
        return { border: '#fb923c', bg: '#fff7ed' };
      case 'MEDIUM':
        return { border: '#f59e0b', bg: '#fffbeb' };
      default:
        return { border: '#3b82f6', bg: '#eff6ff' };
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#ef4444';
      case 'HIGH':
        return '#fb923c';
      case 'MEDIUM':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getCategoryIcon = (category: string) => {
    return category.replace('_', ' ');
  };

  const handleViewAthlete = (athleteId: string) => {
    router.push(`/(coach)/athletes/${athleteId}` as any);
  };

  const handleMarkComplete = async (interventionId: string) => {
    // TODO: Implement intervention completion tracking
    console.log('Mark complete:', interventionId);
  };

  const getFilteredInterventions = (): InterventionRecommendation[] => {
    if (!queue) return [];

    if (selectedPriority === 'all') {
      return [...queue.urgent, ...queue.high, ...queue.medium, ...queue.low];
    } else {
      return queue[selectedPriority.toLowerCase() as 'urgent' | 'high' | 'medium' | 'low'];
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Intervention Queue</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading interventions...</Text>
        </View>
      </View>
    );
  }

  if (error || !queue) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Intervention Queue</Text>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{error || 'No intervention data available'}</Text>
        </View>
      </View>
    );
  }

  const filteredInterventions = getFilteredInterventions();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Intervention Queue ({queue.total})</Text>
        <View style={styles.badgeRow}>
          {queue.urgent.length > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: '#ef4444' }]}>
              <MaterialCommunityIcons name="alert-circle" size={12} color="#ffffff" />
              <Text style={styles.summaryBadgeText}>{queue.urgent.length} Urgent</Text>
            </View>
          )}
          {queue.high.length > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: '#fb923c' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#ffffff" />
              <Text style={styles.summaryBadgeText}>{queue.high.length} High</Text>
            </View>
          )}
          <View style={[styles.summaryBadge, { backgroundColor: '#9ca3af' }]}>
            <Text style={styles.summaryBadgeText}>{queue.medium.length} Medium</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: '#9ca3af' }]}>
            <Text style={styles.summaryBadgeText}>{queue.low.length} Low</Text>
          </View>
        </View>
      </View>

      {/* Priority Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {(['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => (
          <TouchableOpacity
            key={priority}
            style={[
              styles.filterButton,
              selectedPriority === priority && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPriority(priority)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPriority === priority && styles.filterButtonTextActive,
              ]}
            >
              {priority === 'all' ? 'All' : priority}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Intervention Cards */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.cardsContainer}>
        {filteredInterventions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10b981" />
            <Text style={styles.emptyText}>No interventions needed at this priority level</Text>
          </View>
        ) : (
          filteredInterventions.map((intervention) => {
            const colors = getPriorityColor(intervention.priority);
            return (
              <View
                key={intervention.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.bg, borderLeftColor: colors.border },
                ]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name={getPriorityIcon(intervention.priority) as any}
                    size={16}
                    color={colors.border}
                  />
                  <View style={styles.cardHeaderBadges}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityBadgeColor(intervention.priority) },
                      ]}
                    >
                      <Text style={styles.priorityBadgeText}>{intervention.priority}</Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{getCategoryIcon(intervention.category)}</Text>
                    </View>
                    {intervention.dueBy && (
                      <View style={styles.dueBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={10} color="#6b7280" />
                        <Text style={styles.dueBadgeText}>
                          Due {new Date(intervention.dueBy).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Card Title */}
                <Text style={styles.cardTitle}>{intervention.title}</Text>

                {/* Athlete Info */}
                <View style={styles.athleteInfo}>
                  <MaterialCommunityIcons name="account" size={12} color="#6b7280" />
                  <Text style={styles.athleteInfoText}>{intervention.athleteName}</Text>
                  <Text style={styles.athleteInfoSeparator}>•</Text>
                  <Text style={styles.athleteInfoText}>{intervention.estimatedDuration}</Text>
                </View>

                {/* Description */}
                <Text style={styles.cardDescription}>{intervention.description}</Text>

                {/* Rationale */}
                <Text style={styles.rationaleText}>
                  <Text style={styles.rationaleLabel}>Rationale:</Text> {intervention.rationale}
                </Text>

                {/* Metrics */}
                {Object.keys(intervention.relatedMetrics).length > 0 && (
                  <View style={styles.metricsRow}>
                    {intervention.relatedMetrics.readiness !== undefined && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          Readiness: {intervention.relatedMetrics.readiness}
                        </Text>
                      </View>
                    )}
                    {intervention.relatedMetrics.mood !== undefined && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          Mood: {intervention.relatedMetrics.mood.toFixed(1)}/10
                        </Text>
                      </View>
                    )}
                    {intervention.relatedMetrics.stress !== undefined && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          Stress: {intervention.relatedMetrics.stress.toFixed(1)}/10
                        </Text>
                      </View>
                    )}
                    {intervention.relatedMetrics.engagement !== undefined && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          Sessions: {intervention.relatedMetrics.engagement}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleViewAthlete(intervention.athleteId)}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={14} color="#ffffff" />
                    <Text style={styles.primaryButtonText}>View Athlete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleMarkComplete(intervention.id)}
                  >
                    <Text style={styles.secondaryButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  filterContainer: {
    marginBottom: 12,
    maxHeight: 40,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#4b5563',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dueBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6b7280',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  athleteInfoText: {
    fontSize: 11,
    color: '#6b7280',
  },
  athleteInfoSeparator: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardDescription: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 18,
  },
  rationaleText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 16,
  },
  rationaleLabel: {
    fontWeight: '600',
    color: '#1f2937',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  metricBadgeText: {
    fontSize: 10,
    color: '#4b5563',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4b5563',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
