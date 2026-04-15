'use client';

import { useState } from 'react';
import { Heart, Flame, Moon, Check } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { MetricSelector } from './MetricSelector';
import { ExpandableDetails } from './ExpandableDetails';
import { toast } from 'sonner';

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

interface CheckInZoneProps {
  onSubmitSuccess?: () => void;
  hasCheckedInToday: boolean;
}

export function CheckInZone({ onSubmitSuccess, hasCheckedInToday }: CheckInZoneProps) {
  const [mood, setMood] = useState(6);
  const [stress, setStress] = useState(4);
  const [sleep, setSleep] = useState(7);
  const [confidence, setConfidence] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [soreness, setSoreness] = useState(3);
  const [rpe, setRpe] = useState(5);
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) =>
    setContextTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const profileRes = await fetch('/api/athlete/profile');
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.profile?.id) {
        toast.error('Please log in to save check-ins');
        return;
      }

      const res = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: profileData.profile.id,
          mood: Math.round(mood),
          confidence,
          stress: Math.round(stress),
          sleep,
          sleepQuality,
          soreness,
          rpe,
          contextTags: contextTags.length ? contextTags : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Logged. Your readiness updated.');
        setMood(6); setStress(4); setSleep(7); setConfidence(5);
        setSleepQuality(5); setSoreness(3); setRpe(5);
        setContextTags([]); setNotes('');
        onSubmitSuccess?.();
      } else {
        toast.error(data.error || 'Failed to save check-in');
      }
    } catch {
      toast.error('Failed to save check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SpotlightCard className="p-5 sm:p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {hasCheckedInToday ? 'Update your check-in' : 'How are you feeling?'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">3 taps to capture your state</p>
        </div>

        <MetricSelector
          label="Mood"
          icon={Heart}
          options={MOOD_OPTIONS}
          value={mood}
          onChange={setMood}
          colorScale="positive"
        />

        <MetricSelector
          label="Stress"
          icon={Flame}
          options={STRESS_OPTIONS}
          value={stress}
          onChange={setStress}
          colorScale="negative"
        />

        <MetricSelector
          label="Sleep"
          icon={Moon}
          options={SLEEP_OPTIONS}
          value={sleep}
          onChange={setSleep}
          colorScale="positive"
        />

        <ExpandableDetails
          confidence={confidence}
          sleepQuality={sleepQuality}
          soreness={soreness}
          rpe={rpe}
          contextTags={contextTags}
          notes={notes}
          onConfidenceChange={setConfidence}
          onSleepQualityChange={setSleepQuality}
          onSorenessChange={setSoreness}
          onRpeChange={setRpe}
          onToggleTag={toggleTag}
          onNotesChange={setNotes}
        />

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving...</>
          ) : (
            <><Check className="w-4 h-4 mr-2" />Save Check-In</>
          )}
        </Button>
      </div>
    </SpotlightCard>
  );
}
