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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { apiClient, getStoredUserId } from '../../lib/auth';

export default function MoodScreen() {
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😔';
    if (value <= 5) return '😐';
    if (value <= 7) return '🙂';
    return '😊';
  };

  const getStressColor = (value: number) => {
    if (value <= 3) return '#10b981';
    if (value <= 5) return '#f59e0b';
    if (value <= 7) return '#f97316';
    return '#ef4444';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error('User not logged in');

      await apiClient.createMoodLog({
        athleteId: userId,
        date: new Date(),
        mood,
        confidence,
        stress,
        energy,
        sleep,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Mood log saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setMood(5);
            setConfidence(5);
            setStress(5);
            setEnergy(5);
            setSleep(7);
            setNotes('');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save mood log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          How are you feeling today? Take a moment to check in with yourself.
        </Text>

        {/* Mood */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Mood</Text>
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
            onValueChange={setMood}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#2563eb"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Low</Text>
            <Text style={styles.sliderLabelText}>High</Text>
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Confidence</Text>
            <Text style={styles.sliderValue}>{confidence}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={confidence}
            onValueChange={setConfidence}
            minimumTrackTintColor="#10b981"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#10b981"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Low</Text>
            <Text style={styles.sliderLabelText}>High</Text>
          </View>
        </View>

        {/* Stress */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Stress Level</Text>
            <Text style={[styles.sliderValue, { color: getStressColor(stress) }]}>
              {stress}/10
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={stress}
            onValueChange={setStress}
            minimumTrackTintColor={getStressColor(stress)}
            maximumTrackTintColor="#d1d5db"
            thumbTintColor={getStressColor(stress)}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Low</Text>
            <Text style={styles.sliderLabelText}>High</Text>
          </View>
        </View>

        {/* Energy */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Energy Level</Text>
            <Text style={styles.sliderValue}>{energy}/10</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor="#f59e0b"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#f59e0b"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Low</Text>
            <Text style={styles.sliderLabelText}>High</Text>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Sleep (hours)</Text>
            <Text style={styles.sliderValue}>{sleep}h</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={sleep}
            onValueChange={setSleep}
            minimumTrackTintColor="#8b5cf6"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#8b5cf6"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>0h</Text>
            <Text style={styles.sliderLabelText}>12h</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How are you feeling? Any thoughts or reflections?"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Check-In</Text>
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
    backgroundColor: '#f9fafb',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  sliderContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
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
    fontSize: 12,
    color: '#9ca3af',
  },
  notesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
