/**
 * Athlete Detail Screen
 * Comprehensive view of individual athlete data, performance, and mental health trends
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Chart configuration
const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#3b82f6',
  },
};

export default function AthleteDetailScreen() {
  const { athleteId } = useLocalSearchParams();
  const [athlete, setAthlete] = useState<any>(null);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<any[]>([]);
  const [coachNotes, setCoachNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'mental' | 'alerts'>('overview');

  // Intervention states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (athleteId) {
      loadAthleteData();
    }
  }, [athleteId]);

  const loadAthleteData = async () => {
    try {
      setIsLoading(true);
      const [athleteData, mood, perf, goalData, chat] = await Promise.all([
        apiClient.getAthleteProfile(athleteId as string),
        apiClient.getMoodLogs(athleteId as string, 30),
        fetch(`${apiClient['baseURL']}/api/performance/${athleteId}?limit=10`).then(r => r.json()),
        apiClient.getGoals(athleteId as string),
        apiClient.getChatSessions(athleteId as string),
      ]);

      setAthlete(athleteData);
      setMoodLogs(athleteData.moodLogs || mood);
      setPerformanceMetrics(perf.data || []);
      setGoals(athleteData.goals || goalData);
      setChatSessions(athleteData.chatSessions || chat);
      setCrisisAlerts(athleteData.crisisAlerts || []);
      setCoachNotes(athleteData.coachNotes || []);
      setRelationshipNotes(athleteData.relationship?.notes || '');
    } catch (error) {
      console.error('Failed to load athlete data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCheckIn = async () => {
    if (!checkInMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${apiClient['baseURL']}/api/coach/athletes/${athleteId}/intervention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await import('expo-secure-store').then(s => s.getItemAsync('auth_token'))}`,
        },
        body: JSON.stringify({
          message: checkInMessage,
          type: 'CHECK_IN',
        }),
      });

      if (!res.ok) throw new Error('Failed to send check-in');

      Alert.alert('Success', 'Check-in sent successfully!');
      setCheckInMessage('');
      setShowCheckInModal(false);
      loadAthleteData();
    } catch (err) {
      console.error('Error sending check-in:', err);
      Alert.alert('Error', 'Failed to send check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${apiClient['baseURL']}/api/coach/athletes/${athleteId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await import('expo-secure-store').then(s => s.getItemAsync('auth_token'))}`,
        },
        body: JSON.stringify({
          content: newNote,
          category: noteCategory,
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');

      Alert.alert('Success', 'Note added successfully!');
      setNewNote('');
      setShowAddNoteModal(false);
      loadAthleteData();
    } catch (err) {
      console.error('Error adding note:', err);
      Alert.alert('Error', 'Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
      case 'CRITICAL':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
      default:
        return '#10b981';
    }
  };

  const calculateAverage = (data: any[], key: string) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[key] || 0), 0);
    return (sum / data.length).toFixed(1);
  };

  // Prepare mood chart data
  const moodChartData = {
    labels: moodLogs.slice(0, 7).reverse().map((_, i) => `D${i + 1}`),
    datasets: [
      {
        data: moodLogs.slice(0, 7).reverse().map((log) => log.mood),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const stressChartData = {
    labels: moodLogs.slice(0, 7).reverse().map((_, i) => `D${i + 1}`),
    datasets: [
      {
        data: moodLogs.slice(0, 7).reverse().map((log) => log.stress),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!athlete) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
        <Text style={styles.errorText}>Athlete not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <LinearGradient colors={['#3b82f6', '#2563eb', '#1e40af']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{athlete.name}</Text>
              <Text style={styles.headerSubtitle}>
                {athlete.sport} • {athlete.year} • {athlete.position || 'N/A'}
              </Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(athlete.riskLevel) }]}>
              <Text style={styles.riskText}>{athlete.riskLevel}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('overview');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('performance');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
              Performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mental' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('mental');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'mental' && styles.tabTextActive]}>
              Mental
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('alerts');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
              Alerts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Weekly Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Summary</Text>
              <View style={styles.weeklySummaryCard}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
                  style={styles.weeklySummaryGradient}
                >
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                      <Text style={styles.summaryLabel}>This Week</Text>
                    </View>
                  </View>

                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>
                        {moodLogs.slice(0, 7).length}
                      </Text>
                      <Text style={styles.summaryStatLabel}>Check-ins</Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>
                        {calculateAverage(moodLogs.slice(0, 7), 'mood')}
                      </Text>
                      <Text style={styles.summaryStatLabel}>Avg Mood</Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>
                        {chatSessions.filter(s => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(s.createdAt) >= weekAgo;
                        }).length}
                      </Text>
                      <Text style={styles.summaryStatLabel}>Chats</Text>
                    </View>
                  </View>

                  {moodLogs.length >= 7 && (
                    <View style={styles.summaryTrend}>
                      <Text style={styles.summaryTrendLabel}>Trend:</Text>
                      {moodLogs[0]?.mood > moodLogs[6]?.mood ? (
                        <View style={styles.trendPositive}>
                          <Ionicons name="trending-up" size={16} color="#10b981" />
                          <Text style={styles.trendPositiveText}>Improving</Text>
                        </View>
                      ) : moodLogs[0]?.mood < moodLogs[6]?.mood ? (
                        <View style={styles.trendNegative}>
                          <Ionicons name="trending-down" size={16} color="#ef4444" />
                          <Text style={styles.trendNegativeText}>Declining</Text>
                        </View>
                      ) : (
                        <View style={styles.trendStable}>
                          <Ionicons name="remove" size={16} color="#3b82f6" />
                          <Text style={styles.trendStableText}>Stable</Text>
                        </View>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                  style={styles.statGradient}
                >
                  <Ionicons name="happy-outline" size={24} color="#10b981" />
                  <Text style={styles.statValue}>{calculateAverage(moodLogs, 'mood')}</Text>
                  <Text style={styles.statLabel}>Avg Mood</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']}
                  style={styles.statGradient}
                >
                  <Ionicons name="flash-outline" size={24} color="#ef4444" />
                  <Text style={styles.statValue}>{calculateAverage(moodLogs, 'stress')}</Text>
                  <Text style={styles.statLabel}>Avg Stress</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
                  style={styles.statGradient}
                >
                  <Ionicons name="trophy-outline" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{calculateAverage(moodLogs, 'confidence')}</Text>
                  <Text style={styles.statLabel}>Avg Confidence</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']}
                  style={styles.statGradient}
                >
                  <Ionicons name="bed-outline" size={24} color="#8b5cf6" />
                  <Text style={styles.statValue}>{calculateAverage(moodLogs, 'sleep')}h</Text>
                  <Text style={styles.statLabel}>Avg Sleep</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Active Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Goals ({goals.filter(g => g.status === 'IN_PROGRESS').length})</Text>
              {goals.filter(g => g.status === 'IN_PROGRESS').slice(0, 3).map((goal, idx) => (
                <View key={idx} style={styles.goalCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.goalGradient}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalCategory}>{goal.category}</Text>
                    </View>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                    {goal.completionPct !== null && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${goal.completionPct}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{goal.completionPct}%</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
              {goals.filter(g => g.status === 'IN_PROGRESS').length === 0 && (
                <Text style={styles.emptyText}>No active goals</Text>
              )}
            </View>

            {/* Recent Chat Sessions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Conversations ({chatSessions.length})</Text>
              {chatSessions.slice(0, 3).map((session, idx) => (
                <View key={idx} style={styles.chatCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.chatGradient}
                  >
                    <View style={styles.chatHeader}>
                      <Ionicons name="chatbubbles-outline" size={20} color="#3b82f6" />
                      <Text style={styles.chatDate}>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {session.summary && <Text style={styles.chatSummary}>{session.summary}</Text>}
                    {session.sentiment && (
                      <View style={styles.sentimentChip}>
                        <Text style={styles.sentimentText}>{session.sentiment}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
              {chatSessions.length === 0 && (
                <Text style={styles.emptyText}>No chat sessions yet</Text>
              )}
            </View>

            {/* Coach Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Coach Notes ({coachNotes.length})</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddNoteModal(true);
                  }}
                  style={styles.addButton}
                >
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              {coachNotes.length > 0 ? (
                coachNotes.slice(0, 5).map((note, idx) => (
                  <View key={idx} style={styles.noteCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                      style={styles.noteGradient}
                    >
                      <View style={styles.noteHeader}>
                        <View style={styles.noteCategoryChip}>
                          <Text style={styles.noteCategoryText}>{note.category}</Text>
                        </View>
                        <Text style={styles.noteDate}>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.noteContent}>{note.content}</Text>
                    </LinearGradient>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No coach notes yet. Tap + to add one.</Text>
              )}
            </View>

            {/* Relationship Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relationship Notes</Text>
              <View style={styles.relationshipNotesCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.relationshipNotesGradient}
                >
                  <TextInput
                    style={styles.relationshipNotesInput}
                    value={relationshipNotes}
                    onChangeText={setRelationshipNotes}
                    placeholder="Add private notes about your relationship with this athlete..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity
                    style={styles.saveNotesButton}
                    onPress={async () => {
                      try {
                        setIsSaving(true);
                        const res = await fetch(`${apiClient['baseURL']}/api/coach/athletes/${athleteId}/intervention`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${await import('expo-secure-store').then(s => s.getItemAsync('auth_token'))}`,
                          },
                          body: JSON.stringify({ notes: relationshipNotes }),
                        });
                        if (!res.ok) throw new Error('Failed to update notes');
                        Alert.alert('Success', 'Notes updated successfully!');
                      } catch (err) {
                        Alert.alert('Error', 'Failed to update notes');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    <Text style={styles.saveNotesButtonText}>
                      {isSaving ? 'Saving...' : 'Save Notes'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </View>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View>
            {/* Performance Summary Stats */}
            {performanceMetrics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Summary</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                      style={styles.statGradient}
                    >
                      <Ionicons name="trophy" size={24} color="#10b981" />
                      <Text style={styles.statValue}>
                        {performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'WIN').length}
                      </Text>
                      <Text style={styles.statLabel}>Wins</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']}
                      style={styles.statGradient}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                      <Text style={styles.statValue}>
                        {performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'LOSS').length}
                      </Text>
                      <Text style={styles.statLabel}>Losses</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
                      style={styles.statGradient}
                    >
                      <Ionicons name="stats-chart" size={24} color="#3b82f6" />
                      <Text style={styles.statValue}>
                        {(
                          (performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'WIN').length /
                            performanceMetrics.length) *
                          100
                        ).toFixed(0)}%
                      </Text>
                      <Text style={styles.statLabel}>Win Rate</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']}
                      style={styles.statGradient}
                    >
                      <Ionicons name="pulse" size={24} color="#8b5cf6" />
                      <Text style={styles.statValue}>
                        {performanceMetrics.filter(m => m.readinessScore).length > 0
                          ? (
                              performanceMetrics
                                .filter(m => m.readinessScore)
                                .reduce((sum, m) => sum + m.readinessScore, 0) /
                              performanceMetrics.filter(m => m.readinessScore).length
                            ).toFixed(0)
                          : 'N/A'}
                      </Text>
                      <Text style={styles.statLabel}>Avg Readiness</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            )}

            {/* Performance Correlation Chart */}
            {performanceMetrics.length >= 5 &&
              performanceMetrics.filter(m => m.readinessScore && m.stats?.points).length >= 5 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Performance vs Readiness Correlation</Text>
                  <View style={styles.chartCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                      style={styles.chartGradient}
                    >
                      <Text style={styles.chartDescription}>
                        Points scored vs mental readiness score - showing correlation between mental
                        state and performance
                      </Text>
                      <BarChart
                        data={{
                          labels: performanceMetrics
                            .slice(0, 7)
                            .reverse()
                            .map((_, i) => `G${i + 1}`),
                          datasets: [
                            {
                              data: performanceMetrics
                                .slice(0, 7)
                                .reverse()
                                .map(m => m.stats?.points || 0),
                            },
                          ],
                        }}
                        width={screenWidth - 64}
                        height={220}
                        yAxisSuffix=""
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        }}
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />
                      <Text style={styles.chartSubtext}>
                        Recent games performance (points scored)
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Games</Text>
              {performanceMetrics.slice(0, 5).map((metric, idx) => (
                <View key={idx} style={styles.performanceCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.performanceGradient}
                  >
                    <View style={styles.performanceHeader}>
                      <Text style={styles.performanceDate}>
                        {new Date(metric.gameDate).toLocaleDateString()}
                      </Text>
                      <View
                        style={[
                          styles.outcomeChip,
                          {
                            backgroundColor:
                              metric.outcome === 'WIN'
                                ? '#10b981'
                                : metric.outcome === 'LOSS'
                                ? '#ef4444'
                                : '#6b7280',
                          },
                        ]}
                      >
                        <Text style={styles.outcomeText}>{metric.outcome}</Text>
                      </View>
                    </View>
                    <Text style={styles.performanceOpponent}>vs {metric.opponentName}</Text>
                    {metric.stats && (
                      <View style={styles.statsRow}>
                        {metric.stats.points && (
                          <Text style={styles.statItem}>{metric.stats.points} PTS</Text>
                        )}
                        {metric.stats.assists && (
                          <Text style={styles.statItem}>{metric.stats.assists} AST</Text>
                        )}
                        {metric.stats.rebounds && (
                          <Text style={styles.statItem}>{metric.stats.rebounds} REB</Text>
                        )}
                      </View>
                    )}
                    {metric.readinessScore && (
                      <Text style={styles.readinessText}>
                        Readiness: {metric.readinessScore}/100
                      </Text>
                    )}
                  </LinearGradient>
                </View>
              ))}
              {performanceMetrics.length === 0 && (
                <Text style={styles.emptyText}>No performance data available</Text>
              )}
            </View>
          </View>
        )}

        {/* Mental Health Tab */}
        {activeTab === 'mental' && (
          <View>
            {/* Mental Health Risk Indicators */}
            {moodLogs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mental Health Indicators</Text>
                <View style={styles.riskIndicatorCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.riskIndicatorGradient}
                  >
                    <View style={styles.riskRow}>
                      <View style={styles.riskItem}>
                        <View style={styles.riskIconContainer}>
                          <Ionicons
                            name={
                              calculateAverage(moodLogs.slice(0, 7), 'mood') >= 7
                                ? 'checkmark-circle'
                                : calculateAverage(moodLogs.slice(0, 7), 'mood') >= 5
                                ? 'alert-circle'
                                : 'warning'
                            }
                            size={32}
                            color={
                              calculateAverage(moodLogs.slice(0, 7), 'mood') >= 7
                                ? '#10b981'
                                : calculateAverage(moodLogs.slice(0, 7), 'mood') >= 5
                                ? '#f59e0b'
                                : '#ef4444'
                            }
                          />
                        </View>
                        <Text style={styles.riskLabel}>Mood Level</Text>
                        <Text
                          style={[
                            styles.riskValue,
                            {
                              color:
                                calculateAverage(moodLogs.slice(0, 7), 'mood') >= 7
                                  ? '#10b981'
                                  : calculateAverage(moodLogs.slice(0, 7), 'mood') >= 5
                                  ? '#f59e0b'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {calculateAverage(moodLogs.slice(0, 7), 'mood') >= 7
                            ? 'Good'
                            : calculateAverage(moodLogs.slice(0, 7), 'mood') >= 5
                            ? 'Fair'
                            : 'Low'}
                        </Text>
                      </View>

                      <View style={styles.riskItem}>
                        <View style={styles.riskIconContainer}>
                          <Ionicons
                            name={
                              calculateAverage(moodLogs.slice(0, 7), 'stress') <= 4
                                ? 'checkmark-circle'
                                : calculateAverage(moodLogs.slice(0, 7), 'stress') <= 6
                                ? 'alert-circle'
                                : 'warning'
                            }
                            size={32}
                            color={
                              calculateAverage(moodLogs.slice(0, 7), 'stress') <= 4
                                ? '#10b981'
                                : calculateAverage(moodLogs.slice(0, 7), 'stress') <= 6
                                ? '#f59e0b'
                                : '#ef4444'
                            }
                          />
                        </View>
                        <Text style={styles.riskLabel}>Stress Level</Text>
                        <Text
                          style={[
                            styles.riskValue,
                            {
                              color:
                                calculateAverage(moodLogs.slice(0, 7), 'stress') <= 4
                                  ? '#10b981'
                                  : calculateAverage(moodLogs.slice(0, 7), 'stress') <= 6
                                  ? '#f59e0b'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {calculateAverage(moodLogs.slice(0, 7), 'stress') <= 4
                            ? 'Low'
                            : calculateAverage(moodLogs.slice(0, 7), 'stress') <= 6
                            ? 'Moderate'
                            : 'High'}
                        </Text>
                      </View>

                      <View style={styles.riskItem}>
                        <View style={styles.riskIconContainer}>
                          <Ionicons
                            name={
                              calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 7
                                ? 'checkmark-circle'
                                : calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 6
                                ? 'alert-circle'
                                : 'warning'
                            }
                            size={32}
                            color={
                              calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 7
                                ? '#10b981'
                                : calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 6
                                ? '#f59e0b'
                                : '#ef4444'
                            }
                          />
                        </View>
                        <Text style={styles.riskLabel}>Sleep Quality</Text>
                        <Text
                          style={[
                            styles.riskValue,
                            {
                              color:
                                calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 7
                                  ? '#10b981'
                                  : calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 6
                                  ? '#f59e0b'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 7
                            ? 'Good'
                            : calculateAverage(moodLogs.slice(0, 7), 'sleep') >= 6
                            ? 'Fair'
                            : 'Poor'}
                        </Text>
                      </View>
                    </View>

                    {/* Trend Indicators */}
                    <View style={styles.trendRow}>
                      <Text style={styles.trendLabel}>7-Day Trends:</Text>
                      <View style={styles.trendChips}>
                        {moodLogs[0]?.mood > moodLogs[6]?.mood && (
                          <View style={[styles.trendChip, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <Ionicons name="trending-up" size={14} color="#10b981" />
                            <Text style={[styles.trendChipText, { color: '#10b981' }]}>
                              Mood Improving
                            </Text>
                          </View>
                        )}
                        {moodLogs[0]?.stress < moodLogs[6]?.stress && (
                          <View style={[styles.trendChip, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <Ionicons name="trending-down" size={14} color="#10b981" />
                            <Text style={[styles.trendChipText, { color: '#10b981' }]}>
                              Stress Decreasing
                            </Text>
                          </View>
                        )}
                        {moodLogs[0]?.stress > moodLogs[6]?.stress && (
                          <View style={[styles.trendChip, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <Ionicons name="trending-up" size={14} color="#ef4444" />
                            <Text style={[styles.trendChipText, { color: '#ef4444' }]}>
                              Stress Increasing
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Mood Trend */}
            {moodLogs.length >= 7 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7-Day Mood Trend</Text>
                <View style={styles.chartCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.chartGradient}
                  >
                    <LineChart
                      data={moodChartData}
                      width={screenWidth - 64}
                      height={220}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '6',
                          strokeWidth: '2',
                          stroke: '#10b981',
                        },
                      }}
                      bezier
                      style={{
                        marginVertical: 8,
                        borderRadius: 16,
                      }}
                    />
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Stress Trend */}
            {moodLogs.length >= 7 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7-Day Stress Trend</Text>
                <View style={styles.chartCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.chartGradient}
                  >
                    <LineChart
                      data={stressChartData}
                      width={screenWidth - 64}
                      height={220}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '6',
                          strokeWidth: '2',
                          stroke: '#ef4444',
                        },
                      }}
                      bezier
                      style={{
                        marginVertical: 8,
                        borderRadius: 16,
                      }}
                    />
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Mood Log History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Mood Logs</Text>
              {moodLogs.slice(0, 10).map((log, idx) => (
                <View key={idx} style={styles.moodLogCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.moodLogGradient}
                  >
                    <Text style={styles.moodLogDate}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.moodLogMetrics}>
                      <View style={styles.moodLogMetric}>
                        <Text style={styles.moodLogLabel}>Mood</Text>
                        <Text style={styles.moodLogValue}>{log.mood}/10</Text>
                      </View>
                      <View style={styles.moodLogMetric}>
                        <Text style={styles.moodLogLabel}>Stress</Text>
                        <Text style={styles.moodLogValue}>{log.stress}/10</Text>
                      </View>
                      <View style={styles.moodLogMetric}>
                        <Text style={styles.moodLogLabel}>Confidence</Text>
                        <Text style={styles.moodLogValue}>{log.confidence}/10</Text>
                      </View>
                      <View style={styles.moodLogMetric}>
                        <Text style={styles.moodLogLabel}>Sleep</Text>
                        <Text style={styles.moodLogValue}>{log.sleep}h</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <View>
            {/* Crisis Alerts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Crisis Alerts ({crisisAlerts.length})</Text>
              {crisisAlerts.length > 0 ? (
                crisisAlerts.map((alert) => (
                  <View key={alert.id} style={styles.alertCard}>
                    <LinearGradient
                      colors={
                        alert.severity === 'CRITICAL'
                          ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']
                          : alert.severity === 'HIGH'
                          ? ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']
                          : ['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']
                      }
                      style={styles.alertGradient}
                    >
                      <View style={styles.alertHeader}>
                        <View style={styles.alertSeverityContainer}>
                          <Ionicons
                            name={
                              alert.severity === 'CRITICAL'
                                ? 'warning'
                                : alert.severity === 'HIGH'
                                ? 'alert-circle'
                                : 'information-circle'
                            }
                            size={24}
                            color={
                              alert.severity === 'CRITICAL'
                                ? '#ef4444'
                                : alert.severity === 'HIGH'
                                ? '#f59e0b'
                                : '#3b82f6'
                            }
                          />
                          <View
                            style={[
                              styles.alertSeverityBadge,
                              {
                                backgroundColor:
                                  alert.severity === 'CRITICAL'
                                    ? '#ef4444'
                                    : alert.severity === 'HIGH'
                                    ? '#f59e0b'
                                    : '#3b82f6',
                              },
                            ]}
                          >
                            <Text style={styles.alertSeverityText}>{alert.severity}</Text>
                          </View>
                        </View>
                        <Text style={styles.alertDate}>
                          {new Date(alert.detectedAt).toLocaleDateString()}
                        </Text>
                      </View>

                      {alert.Message && (
                        <Text style={styles.alertContent} numberOfLines={3}>
                          {alert.Message.content}
                        </Text>
                      )}

                      <View style={styles.alertFooter}>
                        <View
                          style={[
                            styles.alertStatusChip,
                            {
                              backgroundColor: alert.reviewed
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                            },
                          ]}
                        >
                          <Ionicons
                            name={alert.reviewed ? 'checkmark-circle' : 'time'}
                            size={16}
                            color={alert.reviewed ? '#10b981' : '#ef4444'}
                          />
                          <Text
                            style={[
                              styles.alertStatusText,
                              { color: alert.reviewed ? '#10b981' : '#ef4444' },
                            ]}
                          >
                            {alert.reviewed ? 'Reviewed' : 'Pending Review'}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))
              ) : (
                <View style={styles.emptyAlertCard}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                    style={styles.emptyAlertGradient}
                  >
                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                    <Text style={styles.emptyAlertTitle}>No Crisis Alerts</Text>
                    <Text style={styles.emptyAlertText}>
                      This athlete has no crisis alerts. Mental health monitoring is active.
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Readiness Forecast */}
            {moodLogs.length >= 7 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Readiness Trend & Forecast</Text>
                <View style={styles.forecastCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.forecastGradient}
                  >
                    <Text style={styles.forecastDescription}>
                      Based on mood, stress, and sleep patterns over the last 14 days
                    </Text>

                    {/* Last 7 Days Trend */}
                    <Text style={styles.forecastSubtitle}>Last 7 Days</Text>
                    <View style={styles.readinessDots}>
                      {moodLogs.slice(0, 7).reverse().map((log, idx) => {
                        const readiness = Math.round(
                          ((log.mood + (10 - log.stress) + log.confidence) / 30) * 100
                        );
                        return (
                          <View key={idx} style={styles.readinessDotContainer}>
                            <View
                              style={[
                                styles.readinessDot,
                                {
                                  backgroundColor:
                                    readiness >= 80
                                      ? '#10b981'
                                      : readiness >= 60
                                      ? '#f59e0b'
                                      : '#ef4444',
                                },
                              ]}
                            >
                              <Text style={styles.readinessDotText}>{readiness}</Text>
                            </View>
                            <Text style={styles.readinessDotLabel}>D{idx - 6}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Trend Insight */}
                    <View style={styles.trendInsight}>
                      {moodLogs[0] && moodLogs[6] && (
                        <>
                          {moodLogs[0].mood > moodLogs[6].mood + 1 ? (
                            <View style={[styles.trendBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                              <Ionicons name="trending-up" size={20} color="#10b981" />
                              <Text style={[styles.trendBadgeText, { color: '#10b981' }]}>
                                Improving Trend
                              </Text>
                            </View>
                          ) : moodLogs[0].mood < moodLogs[6].mood - 1 ? (
                            <View style={[styles.trendBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                              <Ionicons name="trending-down" size={20} color="#ef4444" />
                              <Text style={[styles.trendBadgeText, { color: '#ef4444' }]}>
                                Declining Trend
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.trendBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                              <Ionicons name="remove" size={20} color="#3b82f6" />
                              <Text style={[styles.trendBadgeText, { color: '#3b82f6' }]}>
                                Stable Trend
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Check In */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCheckInModal(true);
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.fabGradient}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Check-In Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#1e293b', '#334155']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send Check-In</Text>
                  <TouchableOpacity
                    onPress={() => setShowCheckInModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>
                  Send a personalized check-in message to {athlete?.name}
                </Text>

                <TextInput
                  style={styles.modalInput}
                  value={checkInMessage}
                  onChangeText={setCheckInMessage}
                  placeholder="How are you feeling today? Ready for the big game?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowCheckInModal(false);
                      setCheckInMessage('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSendButton}
                    onPress={handleSendCheckIn}
                    disabled={isSaving}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.modalSendGradient}
                    >
                      <Text style={styles.modalSendText}>
                        {isSaving ? 'Sending...' : 'Send Check-In'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showAddNoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddNoteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#1e293b', '#334155']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Coach Note</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddNoteModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>
                  Add a private note about {athlete?.name}
                </Text>

                {/* Category Selector */}
                <View style={styles.categorySelector}>
                  {['GENERAL', 'PERFORMANCE', 'MENTAL', 'ACADEMIC'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        noteCategory === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => setNoteCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          noteCategory === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="Enter your note here..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowAddNoteModal(false);
                      setNewNote('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSendButton}
                    onPress={handleAddNote}
                    disabled={isSaving}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.modalSendGradient}
                    >
                      <Text style={styles.modalSendText}>
                        {isSaving ? 'Saving...' : 'Add Note'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
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
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (screenWidth - Spacing.lg * 2 - Spacing.md) / 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: '#fff',
    marginVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  goalCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  goalGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  goalCategory: {
    fontSize: Typography.xs,
    color: '#3b82f6',
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  chatCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  chatGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chatDate: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  chatSummary: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  sentimentChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: BorderRadius.sm,
  },
  sentimentText: {
    fontSize: Typography.xs,
    color: '#3b82f6',
    fontWeight: '600',
  },
  performanceCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  performanceGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  performanceDate: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  outcomeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  outcomeText: {
    fontSize: Typography.xs,
    color: '#fff',
    fontWeight: '700',
  },
  performanceOpponent: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statItem: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  readinessText: {
    fontSize: Typography.sm,
    color: '#3b82f6',
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  chartGradient: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  moodLogCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  moodLogGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  moodLogDate: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  moodLogMetrics: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  moodLogMetric: {
    flex: 1,
  },
  moodLogLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  moodLogValue: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.base,
    color: '#fff',
    textAlign: 'center',
  },
  chartDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  chartSubtext: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  riskIndicatorCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  riskIndicatorGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  riskItem: {
    alignItems: 'center',
    flex: 1,
  },
  riskIconContainer: {
    marginBottom: Spacing.sm,
  },
  riskLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  riskValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  trendRow: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.md,
  },
  trendLabel: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  trendChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  trendChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  alertCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  alertGradient: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  alertSeverityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertSeverityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  alertSeverityText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  alertDate: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  alertContent: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  alertFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.md,
  },
  alertStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  alertStatusText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  emptyAlertCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptyAlertGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  emptyAlertTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#10b981',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyAlertText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  forecastCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  forecastGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  forecastDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  forecastSubtitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },
  readinessDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  readinessDotContainer: {
    alignItems: 'center',
  },
  readinessDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  readinessDotText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  readinessDotLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  trendInsight: {
    marginTop: Spacing.md,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  trendBadgeText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  // Weekly Summary Styles
  weeklySummaryCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  weeklySummaryGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  summaryRow: {
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#fff',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  summaryStatLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: Spacing.md,
  },
  summaryTrendLabel: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  trendPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: BorderRadius.sm,
  },
  trendPositiveText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: '#10b981',
  },
  trendNegative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: BorderRadius.sm,
  },
  trendNegativeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: '#ef4444',
  },
  trendStable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: BorderRadius.sm,
  },
  trendStableText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: '#3b82f6',
  },
  // Coach Notes Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    padding: 4,
  },
  noteCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  noteGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noteCategoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: BorderRadius.sm,
  },
  noteCategoryText: {
    fontSize: Typography.xs,
    color: '#3b82f6',
    fontWeight: '600',
  },
  noteDate: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  noteContent: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  // Relationship Notes Styles
  relationshipNotesCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  relationshipNotesGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  relationshipNotesInput: {
    fontSize: Typography.sm,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    marginBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  saveNotesButton: {
    backgroundColor: '#3b82f6',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-end',
  },
  saveNotesButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal and FAB Styles
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalGradient: {
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalDescription: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalInput: {
    fontSize: Typography.base,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  modalSendButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalSendGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalSendText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.sm,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
});
