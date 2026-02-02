'use client';

/**
 * Enhanced Mood Logger - MINIMUM FRICTION DESIGN
 *
 * Core principle: Quick path should be FASTER than before, not slower.
 *
 * Quick Mode (default): 3 taps + submit = done in 5 seconds
 * Detailed Mode (optional): Full sliders + context when they want to share more
 *
 * Addresses issues WITHOUT adding friction:
 * 1. Privacy emphasis → Small visual cue, not a paragraph
 * 2. "I'm not sure" → Just tap the middle option
 * 3. Context capture → Only prompts on significant changes (auto-detected)
 * 4. Varied questions → Subtle variation, same interaction pattern
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  ChevronDown,
  Lock,
  Check,
  MessageCircle,
  Sun,
  CloudSun,
  Cloud,
  Frown,
  Meh,
  Smile,
  Zap,
  Battery,
  BatteryLow,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface MoodLogData {
  mood: number;
  confidence: number;
  stress: number;
  energy?: number;
  sleep?: number;
  notes?: string;
  contextTags: string[];
}

interface PreviousMoodLog {
  mood: number;
  confidence: number;
  stress: number;
  createdAt: string;
}

type QuickOption = 'low' | 'mid' | 'high';

// Quick selection options (3 taps total)
const QUICK_OPTIONS: Record<string, { low: number; mid: number; high: number }> = {
  mood: { low: 3, mid: 6, high: 8 },
  confidence: { low: 3, mid: 6, high: 8 },
  stress: { low: 3, mid: 5, high: 8 }, // Note: high stress = bad
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EnhancedMoodLogger() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [quickSelections, setQuickSelections] = useState<{
    mood: QuickOption | null;
    confidence: QuickOption | null;
    stress: QuickOption | null;
  }>({
    mood: null,
    confidence: null,
    stress: null,
  });
  const [detailedData, setDetailedData] = useState({
    mood: 6,
    confidence: 6,
    stress: 4,
    energy: 6,
    sleep: undefined as number | undefined,
    notes: '',
  });
  const [previousLog, setPreviousLog] = useState<PreviousMoodLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [significantChange, setSignificantChange] = useState<string | null>(null);
  const [contextNote, setContextNote] = useState('');

  // Fetch previous log for change detection
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/mood-logs?athleteId=${user.id}&limit=1`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.data?.[0] && setPreviousLog(data.data[0]))
      .catch(() => {});
  }, [user?.id]);

  // Check for significant change when quick selections made
  const checkSignificantChange = useCallback((field: 'mood' | 'confidence' | 'stress', selection: QuickOption) => {
    if (!previousLog) return;

    const newValue = QUICK_OPTIONS[field][selection];
    const oldValue = previousLog[field];
    const diff = Math.abs(newValue - oldValue);

    if (diff >= 3) {
      const direction = newValue > oldValue ? 'better' : 'tougher';
      const fieldLabel = field === 'mood' ? 'mood' : field === 'confidence' ? 'confidence' : 'stress level';
      setSignificantChange(`Looks like ${fieldLabel} is ${direction} than last time.`);
    }
  }, [previousLog]);

  const handleQuickSelect = (field: 'mood' | 'confidence' | 'stress', option: QuickOption) => {
    setQuickSelections(prev => ({ ...prev, [field]: option }));
    checkSignificantChange(field, option);
  };

  const isQuickComplete = quickSelections.mood && quickSelections.confidence && quickSelections.stress;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      let payload;

      if (mode === 'quick') {
        payload = {
          athleteId: user.id,
          mood: QUICK_OPTIONS.mood[quickSelections.mood!],
          confidence: QUICK_OPTIONS.confidence[quickSelections.confidence!],
          stress: QUICK_OPTIONS.stress[quickSelections.stress!],
          notes: contextNote || undefined,
          tags: '',
        };
      } else {
        payload = {
          athleteId: user.id,
          ...detailedData,
          tags: '',
        };
      }

      const response = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccess(true);
        setQuickSelections({ mood: null, confidence: null, stress: null });
        setSignificantChange(null);
        setContextNote('');
        setTimeout(() => setShowSuccess(false), 2500);
      }
    } catch (error) {
      console.error('Error submitting mood log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Please sign in to check in</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-card rounded-xl border border-green-500/30 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">All set!</h2>
          <p className="text-muted-foreground text-sm">Your check-in has been saved.</p>
          <button
            onClick={() => window.location.href = '/chat'}
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Want to talk about how you're feeling?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-card rounded-xl border border-border p-6">
        {/* Header - minimal */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Quick Check-In</h2>
            <p className="text-muted-foreground text-sm">How are you right now?</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </div>
        </div>

        {mode === 'quick' ? (
          <div className="space-y-6">
            {/* Mood - 3 options */}
            <QuickSelect
              label="Mood"
              selected={quickSelections.mood}
              onSelect={(opt) => handleQuickSelect('mood', opt)}
              options={[
                { value: 'low', label: 'Not great', icon: Frown, color: 'text-orange-400' },
                { value: 'mid', label: 'Okay', icon: Meh, color: 'text-slate-400' },
                { value: 'high', label: 'Good', icon: Smile, color: 'text-green-400' },
              ]}
            />

            {/* Confidence - 3 options */}
            <QuickSelect
              label="Confidence"
              selected={quickSelections.confidence}
              onSelect={(opt) => handleQuickSelect('confidence', opt)}
              options={[
                { value: 'low', label: 'Shaky', icon: Cloud, color: 'text-slate-400' },
                { value: 'mid', label: 'Okay', icon: CloudSun, color: 'text-blue-400' },
                { value: 'high', label: 'Strong', icon: Sun, color: 'text-amber-400' },
              ]}
            />

            {/* Stress - 3 options */}
            <QuickSelect
              label="Stress"
              selected={quickSelections.stress}
              onSelect={(opt) => handleQuickSelect('stress', opt)}
              options={[
                { value: 'low', label: 'Relaxed', icon: Battery, color: 'text-green-400' },
                { value: 'mid', label: 'Some', icon: Zap, color: 'text-amber-400' },
                { value: 'high', label: 'High', icon: BatteryLow, color: 'text-red-400' },
              ]}
            />

            {/* Significant change prompt - only appears when detected */}
            {significantChange && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{significantChange}</p>
                <input
                  type="text"
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  placeholder="What's going on? (optional)"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isQuickComplete || isSubmitting}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all',
                isQuickComplete
                  ? 'gradient-primary text-white hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Saving...' : 'Done'}
            </button>

            {/* Switch to detailed */}
            <button
              type="button"
              onClick={() => setMode('detailed')}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4" />
              Want to be more specific?
            </button>
          </div>
        ) : (
          <DetailedMode
            data={detailedData}
            onChange={(data) => setDetailedData(data)}
            onSubmit={handleSubmit}
            onBack={() => setMode('quick')}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// QUICK SELECT COMPONENT
// ============================================================================

interface QuickSelectProps {
  label: string;
  selected: QuickOption | null;
  onSelect: (option: QuickOption) => void;
  options: Array<{
    value: QuickOption;
    label: string;
    icon: React.ElementType;
    color: string;
  }>;
}

function QuickSelect({ label, selected, onSelect, options }: QuickSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                isSelected
                  ? 'bg-primary/20 border-primary/50'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              )}
            >
              <Icon className={cn('w-6 h-6', isSelected ? opt.color : 'text-muted-foreground')} />
              <span className={cn('text-xs', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DETAILED MODE COMPONENT
// ============================================================================

interface DetailedModeProps {
  data: {
    mood: number;
    confidence: number;
    stress: number;
    energy: number;
    sleep: number | undefined;
    notes: string;
  };
  onChange: (data: DetailedModeProps['data']) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function DetailedMode({ data, onChange, onSubmit, onBack, isSubmitting }: DetailedModeProps) {
  const update = (field: keyof typeof data, value: number | string | undefined) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        ← Back to quick mode
      </button>

      {/* Sliders */}
      <Slider label="Mood" value={data.mood} onChange={(v) => update('mood', v)} low="Low" high="Great" />
      <Slider label="Confidence" value={data.confidence} onChange={(v) => update('confidence', v)} low="Shaky" high="Strong" />
      <Slider label="Stress" value={data.stress} onChange={(v) => update('stress', v)} low="Relaxed" high="Stressed" />
      <Slider label="Energy" value={data.energy} onChange={(v) => update('energy', v)} low="Tired" high="Energized" />

      {/* Sleep */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Hours of sleep</label>
        <input
          type="number"
          min={0}
          max={16}
          step={0.5}
          value={data.sleep || ''}
          onChange={(e) => update('sleep', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="7.5"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
        <textarea
          value={data.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          rows={2}
          placeholder="Anything on your mind?"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Check-In'}
      </button>
    </form>
  );
}

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

function Slider({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-lg font-bold text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export default EnhancedMoodLogger;
