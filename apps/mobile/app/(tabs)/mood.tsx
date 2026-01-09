import { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getStoredUserId, apiClient } from '../../lib/auth';
import { createMoodLog, getMoodLogs } from '../../lib/apiWithFallback';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface MoodLogData {
  id: string;
  date: Date;
  mood: number;
  confidence: number;
  stress: number;
  energy: number;
  sleep: number;
}

export default function MoodScreen() {
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch past 30 days of mood logs for charts
  useEffect(() => {
    async function fetchMoodHistory() {
      try {
        const userId = await getStoredUserId();
        if (!userId) return;

        // Use real API with fallback to demo data
        const logs = await getMoodLogs(userId, 30);

        // Convert to MoodLogData format with Date objects
        const formattedLogs = logs.map((log: any) => ({
          ...log,
          date: new Date(log.createdAt || log.date),
        }));

        setPastWeekLogs(formattedLogs);
      } catch (error) {
        console.error('Failed to fetch mood history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchMoodHistory();
  }, []);

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😔';
    if (value <= 5) return '😐';
    if (value <= 7) return '🙂';
    return '😊';
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return ['#ef4444', '#f87171'] as const;
    if (value <= 5) return ['#f59e0b', '#fbbf24'] as const;
    if (value <= 7) return ['#10b981', '#34d399'] as const;
    return ['#8b5cf6', '#a78bfa'] as const;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      await createMoodLog(userId, {
        mood,
        confidence,
        stress,
        energy,
        sleep,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form and refresh history
      setMood(5);
      setConfidence(5);
      setStress(5);
      setEnergy(5);
      setSleep(7);
      setNotes('');

      // Refresh mood logs to show new entry in charts
      const refreshedLogs = await getMoodLogs(userId, 30);
      const formattedLogs = refreshedLogs.map((log: any) => ({
        ...log,
        date: new Date(log.createdAt || log.date),
      }));
      setPastWeekLogs(formattedLogs);

      Alert.alert('Success', 'Mood log saved successfully!');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to save mood log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get past 7 days including today
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const days = getLast7Days();

  // Prepare data for mood trend line chart (last 7 days)
  const getLast7DaysLogs = () => {
    const last7Days = getLast7Days();
    return last7Days.map((day) => {
      const log = pastWeekLogs.find(
        (l) => l.date.toDateString() === day.toDateString()
      );
      return log?.mood || 0;
    });
  };

  // Prepare data for average metrics bar chart
  const getAverageMetrics = () => {
    if (pastWeekLogs.length === 0) return { mood: 0, confidence: 0, stress: 0, energy: 0 };

    const sum = pastWeekLogs.reduce(
      (acc, log) => ({
        mood: acc.mood + log.mood,
        confidence: acc.confidence + log.confidence,
        stress: acc.stress + log.stress,
        energy: acc.energy + (log.energy || 5),
      }),
      { mood: 0, confidence: 0, stress: 0, energy: 0 }
    );

    return {
      mood: Math.round(sum.mood / pastWeekLogs.length),
      confidence: Math.round(sum.confidence / pastWeekLogs.length),
      stress: Math.round(sum.stress / pastWeekLogs.length),
      energy: Math.round(sum.energy / pastWeekLogs.length),
    };
  };

  const averageMetrics = getAverageMetrics();
  const moodTrendData = getLast7DaysLogs();

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
                  <Ionicons name="happy" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.headerTitle}>Daily Check-In</Text>
                <Text style={styles.headerSubtitle}>Track your mental state</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 7-Day Calendar View */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Past 7 Days</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarScroll}
          >
            {days.map((date, index) => {
              const log = pastWeekLogs.find(
                (l) => l.date.toDateString() === date.toDateString()
              );
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <View key={index} style={styles.dayCard}>
                  <LinearGradient
                    colors={
                      log
                        ? getMoodColor(log.mood)
                        : (['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)'] as const)
                    }
                    style={styles.dayCardGradient}
                  >
                    <View style={styles.dayCardContent}>
                      <Text style={styles.dayName}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>
                        {date.getDate()}
                      </Text>
                      {log ? (
                        <View style={styles.dayStats}>
                          <Text style={styles.dayEmoji}>{getMoodEmoji(log.mood)}</Text>
                          <Text style={styles.dayMoodValue}>{log.mood}/10</Text>
                        </View>
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Mood Trend Line Chart */}
        {pastWeekLogs.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Mood Trend (7 Days)</Text>
            <View style={styles.chartCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(217, 70, 239, 0.1)']}
                style={styles.chartGradient}
              >
                <LineChart
                  data={{
                    labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                    datasets: [
                      {
                        data: moodTrendData.map((m) => m || 0),
                        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                        strokeWidth: 3,
                      },
                    ],
                  }}
                  width={width - Spacing.lg * 2 - 32} // Container width minus padding
                  height={220}
                  yAxisSuffix=""
                  yAxisInterval={1}
                  fromZero
                  segments={5}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'rgba(0,0,0,0)',
                    backgroundGradientTo: 'rgba(0,0,0,0)',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                    style: {
                      borderRadius: BorderRadius.xl,
                    },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: '#8b5cf6',
                      fill: '#fff',
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: 'rgba(255,255,255,0.1)',
                    },
                  }}
                  bezier
                  style={{
                    borderRadius: BorderRadius.xl,
                  }}
                />
                <View style={styles.chartLegend}>
                  <Ionicons name="trending-up" size={16} color="#8b5cf6" />
                  <Text style={styles.chartLegendText}>
                    {pastWeekLogs.length} check-ins this week
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Average Metrics Bar Chart */}
        {pastWeekLogs.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Average Metrics</Text>
            <View style={styles.chartCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.1)']}
                style={styles.chartGradient}
              >
                <BarChart
                  data={{
                    labels: ['Mood', 'Confidence', 'Energy', 'Stress'],
                    datasets: [
                      {
                        data: [
                          averageMetrics.mood,
                          averageMetrics.confidence,
                          averageMetrics.energy,
                          averageMetrics.stress,
                        ],
                        colors: [
                          (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Mood - Purple
                          (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Confidence - Green
                          (opacity = 1) => `rgba(236, 72, 153, ${opacity})`, // Energy - Pink
                          (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Stress - Orange
                        ],
                      },
                    ],
                  }}
                  width={width - Spacing.lg * 2 - 32}
                  height={220}
                  yAxisSuffix=""
                  yAxisLabel=""
                  fromZero
                  segments={5}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'rgba(0,0,0,0)',
                    backgroundGradientTo: 'rgba(0,0,0,0)',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                    style: {
                      borderRadius: BorderRadius.xl,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: 'rgba(255,255,255,0.1)',
                    },
                  }}
                  withCustomBarColorFromData
                  flatColor
                  showBarTops={false}
                  showValuesOnTopOfBars
                  style={{
                    borderRadius: BorderRadius.xl,
                  }}
                />
                <View style={styles.chartLegend}>
                  <Ionicons name="bar-chart" size={16} color="#10b981" />
                  <Text style={styles.chartLegendText}>
                    Based on last {pastWeekLogs.length} check-ins
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Today's Check-In */}
        <Text style={styles.sectionTitle}>Today's Check-In</Text>
        <Text style={styles.introText}>
          How are you feeling today? Take a moment to check in with yourself.
        </Text>

        {/* Mood */}
        <View style={styles.sliderCard}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(217, 70, 239, 0.15)']}
            style={styles.sliderGradient}
          >
            <View style={styles.sliderContent}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelRow}>
                  <Ionicons name="happy-outline" size={24} color="#a78bfa" />
                  <Text style={styles.sliderLabel}>Mood</Text>
                </View>
                <Text style={styles.sliderValue}>
                  {getMoodEmoji(mood)} {mood}/10
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={mood}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMood(value);
                }}
                minimumTrackTintColor="#a78bfa"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#8b5cf6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Low</Text>
                <Text style={styles.sliderLabelText}>High</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Confidence */}
        <View style={styles.sliderCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(52, 211, 153, 0.15)']}
            style={styles.sliderGradient}
          >
            <View style={styles.sliderContent}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelRow}>
                  <Ionicons name="flash-outline" size={24} color="#34d399" />
                  <Text style={styles.sliderLabel}>Confidence</Text>
                </View>
                <Text style={[styles.sliderValue, { color: '#34d399' }]}>{confidence}/10</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={confidence}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setConfidence(value);
                }}
                minimumTrackTintColor="#34d399"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#10b981"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Low</Text>
                <Text style={styles.sliderLabelText}>High</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stress */}
        <View style={styles.sliderCard}>
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.15)', 'rgba(251, 191, 36, 0.15)']}
            style={styles.sliderGradient}
          >
            <View style={styles.sliderContent}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelRow}>
                  <Ionicons name="thermometer-outline" size={24} color="#fbbf24" />
                  <Text style={styles.sliderLabel}>Stress Level</Text>
                </View>
                <Text style={[styles.sliderValue, { color: '#fbbf24' }]}>{stress}/10</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={stress}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStress(value);
                }}
                minimumTrackTintColor="#fbbf24"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#f59e0b"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Low</Text>
                <Text style={styles.sliderLabelText}>High</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Energy */}
        <View style={styles.sliderCard}>
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.15)', 'rgba(244, 114, 182, 0.15)']}
            style={styles.sliderGradient}
          >
            <View style={styles.sliderContent}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelRow}>
                  <Ionicons name="battery-charging-outline" size={24} color="#f472b6" />
                  <Text style={styles.sliderLabel}>Energy Level</Text>
                </View>
                <Text style={[styles.sliderValue, { color: '#f472b6' }]}>{energy}/10</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={energy}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEnergy(value);
                }}
                minimumTrackTintColor="#f472b6"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#ec4899"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Low</Text>
                <Text style={styles.sliderLabelText}>High</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Sleep */}
        <View style={styles.sliderCard}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.15)']}
            style={styles.sliderGradient}
          >
            <View style={styles.sliderContent}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelRow}>
                  <Ionicons name="moon-outline" size={24} color="#a78bfa" />
                  <Text style={styles.sliderLabel}>Sleep</Text>
                </View>
                <Text style={[styles.sliderValue, { color: '#a78bfa' }]}>{sleep}h</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={12}
                step={0.5}
                value={sleep}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSleep(value);
                }}
                minimumTrackTintColor="#a78bfa"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#8b5cf6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>0h</Text>
                <Text style={styles.sliderLabelText}>12h</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Notes */}
        <View style={styles.notesCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.notesGradient}
          >
            <View style={styles.notesContent}>
              <View style={styles.notesHeader}>
                <Ionicons name="create-outline" size={24} color="rgba(255,255,255,0.7)" />
                <Text style={styles.notesLabel}>Notes (optional)</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling? Any thoughts or reflections?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{notes.length}/500</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButtonContainer}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isSubmitting
                ? ['rgba(139, 92, 246, 0.3)', 'rgba(217, 70, 239, 0.3)']
                : ['#10b981', '#34d399', '#6ee7b7']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Save Check-In</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding for tab bar
  },
  // 7-Day Calendar
  calendarSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  calendarScroll: {
    gap: Spacing.sm,
  },
  dayCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  dayCardGradient: {
    width: 85,
    height: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  dayCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  dayName: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayDate: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  dayDateToday: {
    color: '#fbbf24',
  },
  dayStats: {
    alignItems: 'center',
  },
  dayEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  dayMoodValue: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  // Today's Check-In
  introText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  sliderCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  sliderGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
  },
  sliderContent: {
    padding: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  sliderValue: {
    fontSize: Typography.lg,
    fontWeight: '900',
    color: '#a78bfa',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  // Notes
  notesCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  notesGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
  },
  notesContent: {
    padding: Spacing.lg,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notesLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  // Submit Button
  submitButtonContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  submitButton: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 40,
  },
  // Charts
  chartSection: {
    marginBottom: Spacing.xl,
  },
  chartCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  chartGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chartLegendText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
});
