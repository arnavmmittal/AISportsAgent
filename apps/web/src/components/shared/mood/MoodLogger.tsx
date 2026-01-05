'use client';

/**
 * Mood logging component for athletes to track daily mental state
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface MoodLogData {
  mood: number;
  confidence: number;
  stress: number;
  energy?: number;
  sleep?: number;
  notes?: string;
  tags?: string[];
}

export function MoodLogger() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<MoodLogData>({
    mood: 5,
    confidence: 5,
    stress: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSliderChange = (field: keyof MoodLogData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSubmitting(true);

    try {
      // Submit to Prisma database via API route
      const response = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          athleteId: session.user.id,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          mood: 5,
          confidence: 5,
          stress: 5,
        });
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting mood log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Please sign in to log your mood</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Daily Check-In</h2>
        <p className="text-muted-foreground mb-6">How are you feeling today?</p>

        {showSuccess && (
          <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-success font-medium">Mood logged successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Slider */}
          <SliderField
            label="Mood"
            value={formData.mood}
            onChange={(val) => handleSliderChange('mood', val)}
            min={1}
            max={10}
            lowLabel="Very Low"
            highLabel="Excellent"
            color="blue"
          />

          {/* Confidence Slider */}
          <SliderField
            label="Confidence"
            value={formData.confidence}
            onChange={(val) => handleSliderChange('confidence', val)}
            min={1}
            max={10}
            lowLabel="Not Confident"
            highLabel="Very Confident"
            color="green"
          />

          {/* Stress Slider */}
          <SliderField
            label="Stress Level"
            value={formData.stress}
            onChange={(val) => handleSliderChange('stress', val)}
            min={1}
            max={10}
            lowLabel="Relaxed"
            highLabel="Very Stressed"
            color="orange"
          />

          {/* Energy Slider */}
          <SliderField
            label="Energy Level (Optional)"
            value={formData.energy || 5}
            onChange={(val) => handleSliderChange('energy', val)}
            min={1}
            max={10}
            lowLabel="Exhausted"
            highLabel="Energized"
            color="purple"
          />

          {/* Sleep Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hours of Sleep (Optional)
            </label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={formData.sleep || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : 0;
                setFormData((prev) => ({ ...prev, sleep: value || undefined }));
              }}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="7.5"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Any specific thoughts or events affecting your mood today?"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all blue-glow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Log Mood'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  lowLabel,
  highLabel,
  color,
}: SliderFieldProps) {
  const colorConfig = {
    blue: {
      textClass: 'text-primary',
      hex: '#1E40AF', // primary (deep blue)
    },
    green: {
      textClass: 'text-secondary',
      hex: '#3B82F6', // secondary (bright blue) - was green
    },
    orange: {
      textClass: 'text-muted-foreground',
      hex: '#94A3B8', // muted-foreground (steel gray) - was orange
    },
    purple: {
      textClass: 'text-accent',
      hex: '#5BA3F5', // accent (light blue)
    },
  };

  const config = colorConfig[color];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className={`text-2xl font-bold ${config.textClass}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${config.hex} 0%, ${config.hex} ${
            ((value - min) / (max - min)) * 100
          }%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
