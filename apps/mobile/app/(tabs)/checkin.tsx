import { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { getStoredUserId } from '../../lib/auth';
import { createMoodLog } from '../../lib/apiWithFallback';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface SliderFieldProps {
  label: string;
  icon: string;
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function SliderField({ label, icon, value, onValueChange, min = 1, max = 10, step = 1, suffix = '/10' }: SliderFieldProps) {
  return (
    <View style={styles.sliderCard}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelRow}>
          <Ionicons name={icon as any} size={20} color={Colors.accent} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <Text style={styles.sliderValue}>{value}{suffix}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.gray700}
        thumbTintColor={Colors.accent}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>Low</Text>
        <Text style={styles.sliderLabelText}>High</Text>
      </View>
    </View>
  );
}

export default function CheckinScreen() {
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      await createMoodLog(userId, {
        mood,
        confidence,
        energy,
        stress,
        sleep,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setMood(5);
      setConfidence(5);
      setEnergy(5);
      setStress(5);
      setSleep(7);
      setNotes('');

      Alert.alert('Success', 'Check-in saved.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Daily Check-in</Text>
              <Text style={styles.headerSubtitle}>How are you feeling today?</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SliderField
          label="Mood"
          icon="happy-outline"
          value={mood}
          onValueChange={setMood}
        />

        <SliderField
          label="Confidence"
          icon="shield-checkmark-outline"
          value={confidence}
          onValueChange={setConfidence}
        />

        <SliderField
          label="Energy"
          icon="flash-outline"
          value={energy}
          onValueChange={setEnergy}
        />

        <SliderField
          label="Stress"
          icon="thermometer-outline"
          value={stress}
          onValueChange={setStress}
        />

        <SliderField
          label="Sleep"
          icon="moon-outline"
          value={sleep}
          onValueChange={setSleep}
          min={0}
          max={12}
          step={0.5}
          suffix="h"
        />

        {/* Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.notesLabel}>Notes (optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any thoughts or reflections?"
            placeholderTextColor={Colors.gray500}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Save Check-in</Text>
            </>
          )}
        </TouchableOpacity>

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
  // Slider cards
  sliderCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sliderValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.accent,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sliderLabelText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  // Notes
  notesCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notesLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  notesInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  // Submit
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
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
