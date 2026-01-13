'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/shared/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  Smile,
  Meh,
  Frown,
  Heart,
  Zap,
  TrendingUp,
  Calendar,
  Brain,
  Lightbulb,
} from 'lucide-react';

// Mood emoji options (1-5 for UI)
const moodEmojis = [
  { icon: Frown, label: 'Struggling', value: 1, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { icon: Meh, label: 'Okay', value: 2, color: 'text-warning', bgColor: 'bg-warning/10' },
  { icon: Smile, label: 'Good', value: 3, color: 'text-accent', bgColor: 'bg-accent/10' },
  { icon: Heart, label: 'Great', value: 4, color: 'text-success', bgColor: 'bg-success/10' },
  { icon: Zap, label: 'Amazing', value: 5, color: 'text-primary', bgColor: 'bg-primary/10' },
];

interface MoodLogData {
  mood: number;
  confidence: number;
  stress: number;
  energy: number;
  sleep: number;
  notes?: string;
}

interface HistoricalMoodLog {
  id: string;
  mood: number;
  confidence: number;
  stress: number;
  energy: number | null;
  sleep: number | null;
  createdAt: string;
}

export default function MoodPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MoodLogData>({
    mood: 3, // UI scale 1-5
    confidence: 5,
    stress: 5,
    energy: 5,
    sleep: 7,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalMoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch historical mood logs
  useEffect(() => {
    const fetchMoodLogs = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/mood-logs?athleteId=${session.user.id}&limit=30`);
        const result = await response.json();

        if (result.success) {
          setHistoricalData(result.data);
        }
      } catch (error) {
        console.error('Error fetching mood logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoodLogs();
  }, [session?.user?.id, showSuccess]); // Refetch when a new mood is logged

  const handleMoodSelect = (moodValue: number) => {
    setFormData((prev) => ({ ...prev, mood: moodValue }));
  };

  const handleSliderChange = (field: keyof MoodLogData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSubmitting(true);

    try {
      // Map UI mood scale (1-5) to database scale (1-10): 1→2, 2→4, 3→6, 4→8, 5→10
      const dbMood = formData.mood * 2;

      const response = await fetch('/api/mood-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: session.user.id,
          mood: dbMood,
          confidence: formData.confidence,
          stress: formData.stress,
          energy: formData.energy,
          sleep: formData.sleep,
          notes: formData.notes || null,
          tags: '', // Empty string for SQLite compatibility
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting mood log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map database mood (1-10) back to UI scale (1-5) for display
  const mapMoodToUI = (dbMood: number) => Math.round(dbMood / 2);

  // Calculate insights from historical data
  const avgMood = historicalData.length > 0
    ? (historicalData.reduce((sum, log) => sum + mapMoodToUI(log.mood), 0) / historicalData.length).toFixed(1)
    : '0.0';
  const avgConfidence = historicalData.length > 0
    ? (historicalData.reduce((sum, log) => sum + log.confidence, 0) / historicalData.length).toFixed(1)
    : '0.0';
  const avgStress = historicalData.length > 0
    ? (historicalData.reduce((sum, log) => sum + log.stress, 0) / historicalData.length).toFixed(1)
    : '0.0';

  // Calculate streak (consecutive days with mood logs)
  const calculateStreak = () => {
    if (historicalData.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < historicalData.length; i++) {
      const logDate = new Date(historicalData[i].createdAt);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Mood Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your mental state and identify patterns over time
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading your mood history...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Mood Logger Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mood Logger Card */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Today's Check-In</CardTitle>
                  <CardDescription>How are you feeling right now?</CardDescription>
                </CardHeader>
                <CardContent>
                  {showSuccess && (
                    <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg animate-in fade-in">
                      <p className="text-success font-medium">✓ Mood logged successfully!</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Emoji Mood Selector */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Overall Mood</label>
                      <div className="flex gap-3 justify-center">
                        {moodEmojis.map((mood) => {
                          const Icon = mood.icon;
                          return (
                            <button
                              key={mood.value}
                              type="button"
                              onClick={() => handleMoodSelect(mood.value)}
                              className={`
                                flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                ${formData.mood === mood.value
                                  ? `${mood.bgColor} border-2 ${mood.color.replace('text-', 'border-')} scale-105 shadow-lg`
                                  : 'bg-background border-2 border-muted hover:border-accent/50 hover:scale-105'
                                }
                              `}
                            >
                              <Icon className={`size-8 ${formData.mood === mood.value ? mood.color : 'text-muted-foreground'}`} />
                              <span className={`text-xs font-medium ${formData.mood === mood.value ? mood.color : 'text-muted-foreground'}`}>
                                {mood.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Confidence Slider */}
                    <SliderField
                      label="Confidence Level"
                      value={formData.confidence}
                      onChange={(val) => handleSliderChange('confidence', val)}
                      min={1}
                      max={10}
                      lowLabel="Low"
                      highLabel="High"
                      color="success"
                    />

                    {/* Stress Slider */}
                    <SliderField
                      label="Stress Level"
                      value={formData.stress}
                      onChange={(val) => handleSliderChange('stress', val)}
                      min={1}
                      max={10}
                      lowLabel="Relaxed"
                      highLabel="Stressed"
                      color="warning"
                    />

                    {/* Energy Slider */}
                    <SliderField
                      label="Energy Level"
                      value={formData.energy}
                      onChange={(val) => handleSliderChange('energy', val)}
                      min={1}
                      max={10}
                      lowLabel="Exhausted"
                      highLabel="Energized"
                      color="accent"
                    />

                    {/* Sleep Input */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Hours of Sleep</label>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={formData.sleep}
                        onChange={(e) => handleSliderChange('sleep', parseFloat(e.target.value) || 0)}
                        className="w-full border-2 border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                        placeholder="7.5"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full border-2 border-muted rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                        rows={3}
                        placeholder="Any specific thoughts or events affecting your mood today?"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? 'Saving...' : 'Log Today\'s Mood'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Calendar Heatmap */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>30-Day Mood Calendar</CardTitle>
                      <CardDescription>Your mood patterns over the last month</CardDescription>
                    </div>
                    <Calendar className="size-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {historicalData.length > 0 ? (
                    <>
                      <div className="grid grid-cols-10 gap-2">
                        {historicalData.slice(0, 30).reverse().map((log, index) => {
                          const uiMood = mapMoodToUI(log.mood);
                          const moodColor =
                            uiMood === 5
                              ? 'bg-primary'
                              : uiMood === 4
                              ? 'bg-success'
                              : uiMood === 3
                              ? 'bg-accent'
                              : uiMood === 2
                              ? 'bg-warning'
                              : 'bg-destructive';

                          return (
                            <div
                              key={log.id}
                              className={`aspect-square rounded-md ${moodColor} hover:scale-110 transition-transform cursor-pointer`}
                              title={`${new Date(log.createdAt).toLocaleDateString()}: ${moodEmojis[uiMood - 1]?.label || 'Unknown'}`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded bg-destructive" />
                          <div className="w-4 h-4 rounded bg-warning" />
                          <div className="w-4 h-4 rounded bg-accent" />
                          <div className="w-4 h-4 rounded bg-success" />
                          <div className="w-4 h-4 rounded bg-primary" />
                        </div>
                        <span>More</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No mood logs yet. Start logging to see your patterns!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Insights & Charts */}
            <div className="space-y-6">
              {/* Mood Trend Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mood Trend</CardTitle>
                      <CardDescription>Last 7 days</CardDescription>
                    </div>
                    <TrendingUp className="size-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  {historicalData.length > 0 ? (
                    <div className="flex items-end justify-between h-40 gap-2">
                      {historicalData.slice(0, 7).reverse().map((log, index) => {
                        const uiMood = mapMoodToUI(log.mood);
                        return (
                          <div key={log.id} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full flex items-end" style={{ height: '140px' }}>
                              <div
                                className="w-full bg-gradient-to-t from-primary to-accent rounded-t-lg transition-all hover:opacity-80"
                                style={{ height: `${uiMood * 20}%`, minHeight: '20px' }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `D${index + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Insights Card */}
              <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="size-5 text-accent" />
                    <CardTitle>Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <span className="text-sm font-medium">Avg. Mood</span>
                      <Badge variant="secondary" className="text-lg">{avgMood}/5</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <span className="text-sm font-medium">Avg. Confidence</span>
                      <Badge variant="secondary" className="text-lg">{avgConfidence}/10</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <span className="text-sm font-medium">Avg. Stress</span>
                      <Badge variant="secondary" className="text-lg">{avgStress}/10</Badge>
                    </div>
                  </div>

                  {historicalData.length > 7 && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="size-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">AI Recommendation</h4>
                          <p className="text-xs text-muted-foreground">
                            {parseFloat(avgMood) >= 4
                              ? "You're doing great! Your consistent positive mood shows strong mental resilience. Keep it up!"
                              : parseFloat(avgStress) > 7
                              ? "Your stress levels have been elevated. Consider trying our breathing exercises or talking with your mental coach."
                              : "Your mood has been consistent this week. Consider setting a new mental performance goal to stay challenged."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Streak Card */}
              <Card className="border-2 border-success/20 bg-gradient-to-br from-success/5 to-success/10">
                <CardContent className="pt-6 text-center">
                  <div className="text-5xl font-bold text-success mb-2">{streak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak 🔥</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {streak > 0
                      ? "Keep logging daily to maintain your streak!"
                      : "Start logging today to begin your streak!"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
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
  color: 'success' | 'warning' | 'accent' | 'primary';
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
  const colorClasses = {
    success: { bg: 'oklch(0.70 0.17 165)', text: 'text-success' },
    warning: { bg: 'oklch(0.75 0.15 75)', text: 'text-warning' },
    accent: { bg: 'oklch(0.70 0.14 200)', text: 'text-accent' },
    primary: { bg: 'oklch(0.42 0.18 264)', text: 'text-primary' },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold">{label}</label>
        <span className={`text-2xl font-bold ${colorClasses[color].text}`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${colorClasses[color].bg} 0%, ${colorClasses[color].bg} ${
            ((value - min) / (max - min)) * 100
          }%, oklch(0.90 0 0) ${((value - min) / (max - min)) * 100}%, oklch(0.90 0 0) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
