'use client';

/**
 * Enhanced Mood Logger — D1-Optimized Subjective Monitoring
 *
 * Quick Mode: 3 taps + submit (5 seconds)
 * Detailed Mode: Professional gradient sliders + physical readiness + context tags (30 seconds)
 *
 * Changes from previous version:
 * - Removed energy field (r > 0.85 with mood+sleep, adds friction without signal)
 * - Added sleepQuality (1-10 quality, not just hours)
 * - Added soreness (1-10 body soreness)
 * - Added RPE (Rate of Perceived Exertion, post-session only)
 * - Replaced freeform notes with context tags (queryable, correlatable)
 * - Confidence is contextual (always shown in detailed, optional in quick)
 * - Professional gradient styling (no emojis)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Lock,
  Check,
  MessageCircle,
  ChevronUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface MoodLogPayload {
  athleteId: string;
  mood: number;
  stress: number;
  confidence?: number;
  sleepQuality?: number;
  sleep?: number;
  soreness?: number;
  rpe?: number;
  notes?: string;
  tags: string;
  contextTags: string[];
}

interface PreviousMoodLog {
  mood: number;
  confidence: number;
  stress: number;
  createdAt: string;
}

type QuickOption = 'low' | 'mid' | 'high';

const QUICK_OPTIONS: Record<string, { low: number; mid: number; high: number }> = {
  mood: { low: 3, mid: 6, high: 8 },
  stress: { low: 3, mid: 5, high: 8 },
};

// Context tags for D1 athletes — structured, queryable, correlatable
const CONTEXT_TAGS = [
  'Travel',
  'Exam Week',
  'Pre-Game',
  'Post-Game',
  'Injury Recovery',
  'Personal Issue',
  'Great Practice',
  'Team Conflict',
  'Rest Day',
  'Competition Week',
];

// ─── Component ───────────────────────────────────────────────────

export function EnhancedMoodLogger() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [quickSelections, setQuickSelections] = useState<{
    mood: QuickOption | null;
    stress: QuickOption | null;
  }>({ mood: null, stress: null });

  const [detailedData, setDetailedData] = useState({
    mood: 6,
    stress: 4,
    confidence: 6,
    sleepQuality: 7,
    sleepHours: undefined as number | undefined,
    soreness: 3,
    rpe: undefined as number | undefined,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [previousLog, setPreviousLog] = useState<PreviousMoodLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [significantChange, setSignificantChange] = useState<string | null>(null);

  // Fetch previous log for change detection
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/mood-logs?athleteId=${user.id}&limit=1`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.data?.[0] && setPreviousLog(data.data[0]))
      .catch(() => {});
  }, [user?.id]);

  const checkSignificantChange = useCallback((field: 'mood' | 'stress', selection: QuickOption) => {
    if (!previousLog) return;
    const newValue = QUICK_OPTIONS[field]![selection];
    const oldValue = previousLog[field];
    if (Math.abs(newValue - oldValue) >= 3) {
      const direction = newValue > oldValue ? 'better' : 'tougher';
      setSignificantChange(`${field} seems ${direction} than last time.`);
    }
  }, [previousLog]);

  const handleQuickSelect = (field: 'mood' | 'stress', option: QuickOption) => {
    setQuickSelections(prev => ({ ...prev, [field]: option }));
    checkSignificantChange(field, option);
  };

  const isQuickComplete = quickSelections.mood && quickSelections.stress;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      let payload: MoodLogPayload;

      if (mode === 'quick') {
        payload = {
          athleteId: user.id,
          mood: QUICK_OPTIONS.mood[quickSelections.mood!]!,
          stress: QUICK_OPTIONS.stress[quickSelections.stress!]!,
          tags: '',
          contextTags: selectedTags,
        };
      } else {
        payload = {
          athleteId: user.id,
          mood: detailedData.mood,
          stress: detailedData.stress,
          confidence: detailedData.confidence,
          sleepQuality: detailedData.sleepQuality,
          sleep: detailedData.sleepHours,
          soreness: detailedData.soreness,
          rpe: detailedData.rpe,
          tags: '',
          contextTags: selectedTags,
        };
      }

      const response = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccess(true);
        setQuickSelections({ mood: null, stress: null });
        setSignificantChange(null);
        setSelectedTags([]);
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
        <div className="bg-card rounded-xl border border-accent/30 p-8 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Check-in saved</h2>
          <p className="text-muted-foreground text-sm">Your data is being analyzed.</p>
          <button
            onClick={() => window.location.href = '/chat'}
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Talk with your coach AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-card rounded-xl border border-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Daily Check-In</h2>
            <p className="text-muted-foreground text-sm">How are you right now?</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </div>
        </div>

        {mode === 'quick' ? (
          <div className="space-y-6">
            {/* Quick Mood */}
            <QuickSelect
              label="Mood"
              selected={quickSelections.mood}
              onSelect={(opt) => handleQuickSelect('mood', opt)}
              options={[
                { value: 'low', label: 'Not great', color: 'border-destructive/50 bg-destructive/10 text-destructive' },
                { value: 'mid', label: 'Okay', color: 'border-chart-3/50 bg-chart-3/10 text-chart-3' },
                { value: 'high', label: 'Good', color: 'border-accent/50 bg-accent/10 text-accent' },
              ]}
            />

            {/* Quick Stress */}
            <QuickSelect
              label="Stress"
              selected={quickSelections.stress}
              onSelect={(opt) => handleQuickSelect('stress', opt)}
              options={[
                { value: 'low', label: 'Low', color: 'border-accent/50 bg-accent/10 text-accent' },
                { value: 'mid', label: 'Moderate', color: 'border-chart-3/50 bg-chart-3/10 text-chart-3' },
                { value: 'high', label: 'High', color: 'border-destructive/50 bg-destructive/10 text-destructive' },
              ]}
            />

            {/* Context tags — quick select */}
            <ContextTagPicker
              selected={selectedTags}
              onToggle={toggleTag}
            />

            {/* Significant change prompt */}
            {significantChange && (
              <p className="text-xs text-muted-foreground p-3 bg-primary/5 border border-primary/10 rounded-lg">
                {significantChange}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isQuickComplete || isSubmitting}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all',
                isQuickComplete
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
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
              More detail
            </button>
          </div>
        ) : (
          <DetailedMode
            data={detailedData}
            onChange={setDetailedData}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onSubmit={handleSubmit}
            onBack={() => setMode('quick')}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Quick Select ────────────────────────────────────────────────

interface QuickSelectProps {
  label: string;
  selected: QuickOption | null;
  onSelect: (option: QuickOption) => void;
  options: Array<{ value: QuickOption; label: string; color: string }>;
}

function QuickSelect({ label, selected, onSelect, options }: QuickSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                'p-3 rounded-xl border text-sm font-medium transition-all min-h-[48px]',
                isSelected ? opt.color : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Context Tag Picker ──────────────────────────────────────────

function ContextTagPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        What&apos;s going on? <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {CONTEXT_TAGS.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px]',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detailed Mode ───────────────────────────────────────────────

interface DetailedData {
  mood: number;
  stress: number;
  confidence: number;
  sleepQuality: number;
  sleepHours: number | undefined;
  soreness: number;
  rpe: number | undefined;
}

interface DetailedModeProps {
  data: DetailedData;
  onChange: (data: DetailedData) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function DetailedMode({ data, onChange, selectedTags, onToggleTag, onSubmit, onBack, isSubmitting }: DetailedModeProps) {
  const update = <K extends keyof DetailedData>(field: K, value: DetailedData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronUp className="w-4 h-4" />
        Quick mode
      </button>

      {/* Core metrics */}
      <GradientSlider
        label="Mood"
        value={data.mood}
        onChange={(v) => update('mood', v)}
        lowLabel="Low"
        highLabel="Excellent"
        gradient="from-destructive via-chart-3 to-accent"
      />

      <GradientSlider
        label="Stress"
        value={data.stress}
        onChange={(v) => update('stress', v)}
        lowLabel="Relaxed"
        highLabel="Very Stressed"
        gradient="from-accent via-chart-3 to-destructive"
      />

      <GradientSlider
        label="Confidence"
        value={data.confidence}
        onChange={(v) => update('confidence', v)}
        lowLabel="Shaky"
        highLabel="Strong"
        gradient="from-muted-foreground via-primary to-accent"
      />

      {/* Sleep */}
      <GradientSlider
        label="Sleep Quality"
        value={data.sleepQuality}
        onChange={(v) => update('sleepQuality', v)}
        lowLabel="Poor"
        highLabel="Great"
        gradient="from-destructive via-chart-3 to-accent"
      />

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Hours of Sleep <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="number"
          min={0}
          max={16}
          step={0.5}
          value={data.sleepHours ?? ''}
          onChange={(e) => update('sleepHours', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="7.5"
        />
      </div>

      {/* Physical readiness */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Physical</p>

        <GradientSlider
          label="Body Soreness"
          value={data.soreness}
          onChange={(v) => update('soreness', v)}
          lowLabel="None"
          highLabel="Very Sore"
          gradient="from-accent via-chart-3 to-destructive"
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            RPE (Perceived Exertion) <span className="text-muted-foreground font-normal">(post-session)</span>
          </label>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => update('rpe', val)}
                className={cn(
                  'flex-1 py-2 rounded text-xs font-medium transition-all min-h-[36px]',
                  data.rpe === val
                    ? val <= 3 ? 'bg-accent text-accent-foreground'
                      : val <= 6 ? 'bg-chart-3 text-foreground'
                      : 'bg-destructive text-destructive-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Easy</span>
            <span>Moderate</span>
            <span>Max Effort</span>
          </div>
        </div>
      </div>

      {/* Context tags */}
      <div className="pt-2 border-t border-border">
        <ContextTagPicker selected={selectedTags} onToggle={onToggleTag} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Check-In'}
      </button>
    </form>
  );
}

// ─── Gradient Slider ─────────────────────────────────────────────

function GradientSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  gradient,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  gradient: string;
}) {
  const pct = ((value - 1) / 9) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
      </div>
      <div className="relative">
        <div className={cn('absolute inset-0 h-2 rounded-full bg-gradient-to-r opacity-30', gradient)} />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-2 rounded-lg appearance-none cursor-pointer bg-transparent z-10"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default EnhancedMoodLogger;
