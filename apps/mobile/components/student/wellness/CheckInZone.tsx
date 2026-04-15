import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { createMoodLog } from '../../../lib/apiWithFallback';
import { getStoredUserId } from '../../../lib/auth';
import MetricSelector from './MetricSelector';

const MOOD_OPTIONS = [
  { value: 2, label: 'Low' },
  { value: 4, label: 'Below Avg' },
  { value: 6, label: 'OK' },
  { value: 8, label: 'Good' },
  { value: 10, label: 'Great' },
];

const STRESS_OPTIONS = [
  { value: 2, label: 'Very Calm' },
  { value: 4, label: 'Calm' },
  { value: 6, label: 'Moderate' },
  { value: 8, label: 'High' },
  { value: 10, label: 'Very High' },
];

const SLEEP_OPTIONS = [
  { value: 4, label: '<5h' },
  { value: 5, label: '5-6h' },
  { value: 7, label: '6-7h' },
  { value: 8, label: '7-8h' },
  { value: 9, label: '8h+' },
];

const CONTEXT_TAGS = [
  'Pre-game', 'Post-game', 'Practice', 'Off-day', 'Travel',
  'Exam week', 'Injury recovery', 'Personal',
];

interface PillSelectorProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function PillSelector({ label, value, onChange }: PillSelectorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.pillRow}>
      <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        <View style={styles.pillContainer}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.pill,
                {
                  backgroundColor: n === value ? colors.accent : colors.backgroundSecondary,
                  borderColor: n === value ? colors.accent : colors.border,
                },
              ]}
              onPress={() => onChange(n)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: n === value ? '#fff' : colors.textSecondary },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface CheckInZoneProps {
  onSubmitSuccess?: () => void;
}

export default function CheckInZone({ onSubmitSuccess }: CheckInZoneProps) {
  const { colors } = useTheme();

  // Core metrics
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);

  // Expanded details
  const [showDetails, setShowDetails] = useState(false);
  const [confidence, setConfidence] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [rpe, setRpe] = useState(5);

  // Context & notes
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (mood === null || stress === null || sleep === null) {
      Alert.alert('Incomplete', 'Please select mood, stress, and sleep before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      await createMoodLog(userId, {
        mood,
        confidence: showDetails ? confidence : 5,
        stress,
        energy: showDetails ? rpe : 5,
        sleep,
        notes: [
          notes.trim(),
          selectedTags.length > 0 ? `Context: ${selectedTags.join(', ')}` : '',
          showDetails ? `Sleep Quality: ${sleepQuality}/10, Soreness: ${soreness}/10` : '',
        ]
          .filter(Boolean)
          .join(' | ') || undefined,
      });

      // Reset form
      setMood(null);
      setStress(null);
      setSleep(null);
      setShowDetails(false);
      setConfidence(5);
      setSleepQuality(5);
      setSoreness(5);
      setRpe(5);
      setSelectedTags([]);
      setNotes('');

      Alert.alert('Success', 'Check-in saved!');
      onSubmitSuccess?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const coreComplete = mood !== null && stress !== null && sleep !== null;

  return (
    <View>
      <MetricSelector
        label="Mood"
        icon="happy-outline"
        options={MOOD_OPTIONS}
        value={mood}
        onChange={setMood}
        colorScale="positive"
      />

      <MetricSelector
        label="Stress"
        icon="flame-outline"
        options={STRESS_OPTIONS}
        value={stress}
        onChange={setStress}
        colorScale="negative"
      />

      <MetricSelector
        label="Sleep"
        icon="moon-outline"
        options={SLEEP_OPTIONS}
        value={sleep}
        onChange={setSleep}
        colorScale="positive"
      />

      {/* Expandable details */}
      <TouchableOpacity
        style={[styles.expandToggle, { borderColor: colors.border }]}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.accent}
        />
        <Text style={[styles.expandText, { color: colors.accent }]}>
          {showDetails ? 'Hide details' : 'Want to share more?'}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={[styles.detailsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <PillSelector label="Confidence" value={confidence} onChange={setConfidence} />
          <PillSelector label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} />
          <PillSelector label="Soreness" value={soreness} onChange={setSoreness} />
          <PillSelector label="RPE" value={rpe} onChange={setRpe} />
        </View>
      )}

      {/* Context tags */}
      <View style={styles.tagsSection}>
        <Text style={[styles.tagsLabel, { color: colors.textSecondary }]}>Context</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tagsRow}>
            {CONTEXT_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active ? colors.accent : colors.backgroundSecondary,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Notes */}
      <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.notesHeader}>
          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.notesLabel, { color: colors.textPrimary }]}>Notes (optional)</Text>
        </View>
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={notes}
          onChangeText={(t) => setNotes(t.slice(0, 200))}
          placeholder="Any thoughts or reflections?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          maxLength={200}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.textTertiary }]}>{notes.length}/200</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.accent },
          (!coreComplete || isSubmitting) && styles.submitDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!coreComplete || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.submitText}>Save Check-in</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  expandText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  detailsBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  pillRow: {
    marginBottom: Spacing.md,
  },
  pillLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  pillScroll: {
    flexGrow: 0,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: Spacing.md,
  },
  tagsLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  notesCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  notesLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Typography.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
