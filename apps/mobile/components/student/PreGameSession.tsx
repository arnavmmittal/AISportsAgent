/**
 * PreGameSession - Full-screen pre-game mental preparation flow
 *
 * A 2-minute guided check-in that helps athletes:
 * - Assess current mental state (mood, confidence, anxiety)
 * - Track physical readiness (energy, sleep)
 * - Set intentions and focus cues
 * - Get personalized recommendations
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import {
  startPreGameSession,
  completePreGameSession,
  PreGameSessionData,
} from '../../lib/services/schedule';

const { width } = Dimensions.get('window');

interface PreGameSessionProps {
  onComplete?: (data: SessionData) => void;
  onClose?: () => void;
  gameScheduleId?: string;
  gameInfo?: {
    opponent: string;
    gameDate: string;
    location?: string;
    stakes?: string;
    homeAway?: string;
  };
}

interface SessionData {
  moodScore: number;
  confidenceScore: number;
  anxietyScore: number;
  focusScore: number;
  energyLevel: number;
  sleepQuality: number;
  athleteGoal: string;
  focusCue: string;
}

type SessionStep = 'intro' | 'mood' | 'confidence' | 'anxiety' | 'energy' | 'goal' | 'complete';

const STEPS: SessionStep[] = ['intro', 'mood', 'confidence', 'anxiety', 'energy', 'goal', 'complete'];

export function PreGameSession({ onComplete, onClose, gameScheduleId, gameInfo }: PreGameSessionProps) {
  const [currentStep, setCurrentStep] = useState<SessionStep>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const [sessionData, setSessionData] = useState<SessionData>({
    moodScore: 5,
    confidenceScore: 5,
    anxietyScore: 5,
    focusScore: 5,
    energyLevel: 5,
    sleepQuality: 5,
    athleteGoal: '',
    focusCue: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    // Animate progress bar
    const progress = (STEPS.indexOf(currentStep) / (STEPS.length - 1)) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Animate content
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const initSession = async () => {
    const session = await startPreGameSession(gameScheduleId);
    if (session) {
      setSessionId(session.id);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const result = await completePreGameSession(sessionId, sessionData);
      setRecommendations(result.recommendations || []);
      setCurrentStep('complete');
      onComplete?.(sessionData);
    } catch (error) {
      console.error('Failed to complete session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentStep === 'goal') {
      handleComplete();
    } else if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'intro':
        return <IntroStep gameInfo={gameInfo} onNext={handleNext} />;
      case 'mood':
        return (
          <SliderStep
            icon="heart"
            iconColors={['#f43f5e', '#ec4899']}
            title="How are you feeling right now?"
            subtitle="Rate your overall mood"
            value={sessionData.moodScore}
            onChange={(v) => setSessionData({ ...sessionData, moodScore: v })}
            lowLabel="Not great"
            highLabel="Excellent"
          />
        );
      case 'confidence':
        return (
          <SliderStep
            icon="trophy"
            iconColors={['#f59e0b', '#f97316']}
            title="How confident are you feeling?"
            subtitle="Trust in your preparation"
            value={sessionData.confidenceScore}
            onChange={(v) => setSessionData({ ...sessionData, confidenceScore: v })}
            lowLabel="Uncertain"
            highLabel="Very confident"
          />
        );
      case 'anxiety':
        return (
          <SliderStep
            icon="pulse"
            iconColors={['#8b5cf6', '#6366f1']}
            title="How nervous or anxious are you?"
            subtitle="Pre-competition nerves are normal"
            value={sessionData.anxietyScore}
            onChange={(v) => setSessionData({ ...sessionData, anxietyScore: v })}
            lowLabel="Very calm"
            highLabel="Very anxious"
            inverted
          />
        );
      case 'energy':
        return (
          <DoubleSliderStep
            energyValue={sessionData.energyLevel}
            sleepValue={sessionData.sleepQuality}
            onEnergyChange={(v) => setSessionData({ ...sessionData, energyLevel: v })}
            onSleepChange={(v) => setSessionData({ ...sessionData, sleepQuality: v })}
          />
        );
      case 'goal':
        return (
          <GoalStep
            goal={sessionData.athleteGoal}
            focusCue={sessionData.focusCue}
            onGoalChange={(v) => setSessionData({ ...sessionData, athleteGoal: v })}
            onCueChange={(v) => setSessionData({ ...sessionData, focusCue: v })}
          />
        );
      case 'complete':
        return (
          <CompleteStep
            recommendations={recommendations}
            sessionData={sessionData}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#312e81', '#5b21b6', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#22c55e', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>

        <Text style={styles.stepIndicator}>
          {currentStep === 'complete' ? 'Done!' : `${STEPS.indexOf(currentStep)}/${STEPS.length - 2}`}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.stepContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      {currentStep !== 'intro' && currentStep !== 'complete' && (
        <View style={styles.navigation}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={styles.nextButton}
          >
            <LinearGradient
              colors={['#22c55e', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : currentStep === 'goal' ? (
                <>
                  <Text style={styles.nextButtonText}>Complete</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Intro Step
function IntroStep({ gameInfo, onNext }: { gameInfo?: any; onNext: () => void }) {
  return (
    <View style={styles.introContainer}>
      <LinearGradient
        colors={['#22c55e', '#10b981']}
        style={styles.introIcon}
      >
        <Ionicons name="sparkles" size={40} color="#fff" />
      </LinearGradient>

      <Text style={styles.introTitle}>Pre-Game Mental Check-In</Text>

      {gameInfo && (
        <View style={styles.gameInfoCard}>
          <View style={styles.gameInfoRow}>
            <Ionicons name="trophy" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.gameInfoText}>vs {gameInfo.opponent}</Text>
          </View>
          {gameInfo.gameDate && (
            <View style={styles.gameInfoRow}>
              <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.gameInfoSubtext}>
                {new Date(gameInfo.gameDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {gameInfo.location && (
            <View style={styles.gameInfoRow}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.gameInfoSubtext}>{gameInfo.location}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.introDescription}>
        Take 2 minutes to check in with yourself. This quick assessment helps you optimize your mental state for peak performance.
      </Text>

      <TouchableOpacity onPress={onNext} style={styles.startButton}>
        <LinearGradient
          colors={['#22c55e', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButtonGradient}
        >
          <Text style={styles.startButtonText}>Let's Go</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// Slider Step
function SliderStep({
  icon,
  iconColors,
  title,
  subtitle,
  value,
  onChange,
  lowLabel,
  highLabel,
  inverted,
}: {
  icon: string;
  iconColors: string[];
  title: string;
  subtitle: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
}) {
  const handleSliderChange = (newValue: number) => {
    onChange(newValue);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.sliderContainer}>
      <LinearGradient colors={iconColors as [string, string]} style={styles.sliderIcon}>
        <Ionicons name={icon as any} size={32} color="#fff" />
      </LinearGradient>

      <Text style={styles.sliderTitle}>{title}</Text>
      <Text style={styles.sliderSubtitle}>{subtitle}</Text>

      <Text style={[styles.sliderValue, { color: iconColors[0] }]}>{value}</Text>

      <View style={styles.sliderTrackContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => handleSliderChange(num)}
            style={[
              styles.sliderDot,
              num <= value && {
                backgroundColor: inverted
                  ? num >= 7
                    ? '#ef4444'
                    : '#22c55e'
                  : '#22c55e',
              },
            ]}
          >
            {num === value && (
              <View style={[styles.sliderDotActive, { backgroundColor: iconColors[0] }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{lowLabel}</Text>
        <Text style={styles.sliderLabel}>{highLabel}</Text>
      </View>
    </View>
  );
}

// Double Slider Step
function DoubleSliderStep({
  energyValue,
  sleepValue,
  onEnergyChange,
  onSleepChange,
}: {
  energyValue: number;
  sleepValue: number;
  onEnergyChange: (value: number) => void;
  onSleepChange: (value: number) => void;
}) {
  return (
    <View style={styles.doubleSliderContainer}>
      {/* Energy */}
      <View style={styles.miniSliderSection}>
        <View style={styles.miniSliderHeader}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.miniSliderIcon}>
            <Ionicons name="flash" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.miniSliderInfo}>
            <Text style={styles.miniSliderTitle}>Energy Level</Text>
            <Text style={styles.miniSliderSubtitle}>How physically ready do you feel?</Text>
          </View>
          <Text style={[styles.miniSliderValue, { color: '#f59e0b' }]}>{energyValue}</Text>
        </View>

        <View style={styles.miniSliderTrack}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => {
                onEnergyChange(num);
                Haptics.selectionAsync();
              }}
              style={[
                styles.miniDot,
                num <= energyValue && { backgroundColor: '#f59e0b' },
              ]}
            />
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelSmall}>Exhausted</Text>
          <Text style={styles.sliderLabelSmall}>Energized</Text>
        </View>
      </View>

      {/* Sleep */}
      <View style={styles.miniSliderSection}>
        <View style={styles.miniSliderHeader}>
          <LinearGradient colors={['#818cf8', '#6366f1']} style={styles.miniSliderIcon}>
            <Ionicons name="moon" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.miniSliderInfo}>
            <Text style={styles.miniSliderTitle}>Sleep Quality</Text>
            <Text style={styles.miniSliderSubtitle}>How well did you sleep last night?</Text>
          </View>
          <Text style={[styles.miniSliderValue, { color: '#818cf8' }]}>{sleepValue}</Text>
        </View>

        <View style={styles.miniSliderTrack}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => {
                onSleepChange(num);
                Haptics.selectionAsync();
              }}
              style={[
                styles.miniDot,
                num <= sleepValue && { backgroundColor: '#818cf8' },
              ]}
            />
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelSmall}>Poor</Text>
          <Text style={styles.sliderLabelSmall}>Great</Text>
        </View>
      </View>
    </View>
  );
}

// Goal Step
function GoalStep({
  goal,
  focusCue,
  onGoalChange,
  onCueChange,
}: {
  goal: string;
  focusCue: string;
  onGoalChange: (value: string) => void;
  onCueChange: (value: string) => void;
}) {
  const quickGoals = [
    'Stay composed under pressure',
    'Trust my preparation',
    'Play one point at a time',
    'Give maximum effort',
    'Stay present',
  ];

  const quickCues = ['Breathe', 'Trust it', 'Next play', "Let's go", 'I got this'];

  return (
    <View style={styles.goalContainer}>
      <LinearGradient colors={['#3b82f6', '#06b6d4']} style={styles.goalIcon}>
        <Ionicons name="flag" size={32} color="#fff" />
      </LinearGradient>

      <Text style={styles.goalTitle}>Set Your Intentions</Text>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>One thing to focus on today:</Text>
        <TextInput
          style={styles.goalInput}
          value={goal}
          onChangeText={onGoalChange}
          placeholder="e.g., Stay composed under pressure"
          placeholderTextColor="rgba(255,255,255,0.4)"
          multiline
        />
        <View style={styles.quickOptions}>
          {quickGoals.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => {
                onGoalChange(q);
                Haptics.selectionAsync();
              }}
              style={[styles.quickOption, goal === q && styles.quickOptionActive]}
            >
              <Text style={[styles.quickOptionText, goal === q && styles.quickOptionTextActive]}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>Your power word or cue:</Text>
        <TextInput
          style={styles.goalInput}
          value={focusCue}
          onChangeText={onCueChange}
          placeholder="e.g., Breathe"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />
        <View style={styles.quickOptions}>
          {quickCues.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => {
                onCueChange(q);
                Haptics.selectionAsync();
              }}
              style={[styles.quickOption, focusCue === q && styles.quickOptionActive]}
            >
              <Text style={[styles.quickOptionText, focusCue === q && styles.quickOptionTextActive]}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// Complete Step
function CompleteStep({
  recommendations,
  sessionData,
  onClose,
}: {
  recommendations: string[];
  sessionData: SessionData;
  onClose?: () => void;
}) {
  return (
    <View style={styles.completeContainer}>
      <LinearGradient colors={['#22c55e', '#10b981']} style={styles.completeIcon}>
        <Ionicons name="checkmark-circle" size={40} color="#fff" />
      </LinearGradient>

      <Text style={styles.completeTitle}>You're Ready!</Text>

      {sessionData.athleteGoal && (
        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>Your focus today:</Text>
          <Text style={styles.focusGoal}>{sessionData.athleteGoal}</Text>
          {sessionData.focusCue && (
            <View style={styles.focusCueContainer}>
              <Text style={styles.focusCue}>"{sessionData.focusCue}"</Text>
            </View>
          )}
        </View>
      )}

      {recommendations.length > 0 && (
        <View style={styles.recommendationsCard}>
          <View style={styles.recommendationsHeader}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.recommendationsLabel}>Quick tips for you:</Text>
          </View>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={onClose} style={styles.completeButton}>
        <LinearGradient
          colors={['#22c55e', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeButtonGradient}
        >
          <Text style={styles.completeButtonText}>Go Compete!</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sm,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  stepContent: {
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: Spacing.xs,
  },
  backButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '700',
  },

  // Intro
  introContainer: {
    alignItems: 'center',
    width: '100%',
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  gameInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  gameInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  gameInfoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  gameInfoSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sm,
  },
  introDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  startButton: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  startButtonText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },

  // Slider
  sliderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  sliderIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sliderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sliderSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.base,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  sliderValue: {
    fontSize: 64,
    fontWeight: '800',
    marginBottom: Spacing.xl,
  },
  sliderTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sliderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sliderLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: Typography.sm,
  },
  sliderLabelSmall: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: Typography.xs,
  },

  // Double Slider
  doubleSliderContainer: {
    width: '100%',
    gap: Spacing.xxl,
  },
  miniSliderSection: {
    gap: Spacing.md,
  },
  miniSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  miniSliderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSliderInfo: {
    flex: 1,
  },
  miniSliderTitle: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  miniSliderSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sm,
  },
  miniSliderValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  miniSliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Goal
  goalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  goalIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  goalSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  goalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.md,
    color: '#fff',
    fontSize: Typography.base,
    marginBottom: Spacing.sm,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  quickOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quickOptionActive: {
    backgroundColor: '#10b981',
  },
  quickOptionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.xs,
  },
  quickOptionTextActive: {
    color: '#fff',
  },

  // Complete
  completeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  focusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  focusLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
  },
  focusGoal: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  focusCueContainer: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  focusCue: {
    color: '#6ee7b7',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  recommendationsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  recommendationBullet: {
    color: '#10b981',
    fontSize: Typography.base,
  },
  recommendationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.sm,
    flex: 1,
  },
  completeButton: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },
});
