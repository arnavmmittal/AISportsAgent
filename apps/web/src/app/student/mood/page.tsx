'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Heart,
  Zap,
  Flame,
  Battery,
  Moon,
  Save,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface MoodLogData {
  id: string;
  date: Date;
  mood: number;
  confidence: number;
  stress: number;
  energy: number;
  sleep: number;
  notes?: string;
}

export default function StudentMoodPage() {
  // Today's check-in state
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Historical data
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);

  // Load past week logs on mount
  useEffect(() => {
    const mockLogs = generateMockWeekLogs();
    setPastWeekLogs(mockLogs);
  }, []);

  // Generate mock data for the past 7 days
  const generateMockWeekLogs = (): MoodLogData[] => {
    const logs: MoodLogData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Only add logs for some days (simulate partial logging)
      if (i !== 1 && i !== 4) {
        logs.push({
          id: `log_${i}`,
          date,
          mood: Math.floor(Math.random() * 4) + 6, // 6-10
          confidence: Math.floor(Math.random() * 4) + 5, // 5-9
          stress: Math.floor(Math.random() * 6) + 2, // 2-8
          energy: Math.floor(Math.random() * 4) + 5, // 5-9
          sleep: Math.floor(Math.random() * 3) + 6, // 6-9
        });
      }
    }
    return logs;
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😔';
    if (value <= 5) return '😐';
    if (value <= 7) return '🙂';
    return '😊';
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return 'from-red-500 to-red-600';
    if (value <= 5) return 'from-yellow-500 to-orange-500';
    if (value <= 7) return 'from-green-500 to-emerald-500';
    return 'from-purple-500 to-violet-600';
  };

  const getMoodBgColor = (value: number) => {
    if (value <= 3) return 'bg-red-100';
    if (value <= 5) return 'bg-yellow-100';
    if (value <= 7) return 'bg-green-100';
    return 'bg-purple-100';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      // const userId = session?.user?.id || 'athlete_test_123';
      // await apiClient.createMoodLog(userId, {
      //   mood,
      //   confidence,
      //   stress,
      //   energy,
      //   sleep,
      //   notes: notes.trim() || undefined,
      // });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Mood log saved successfully!');

      // Reset form
      setMood(5);
      setConfidence(5);
      setStress(5);
      setEnergy(5);
      setSleep(7);
      setNotes('');

      // Add new log to past week (for demo purposes)
      const newLog: MoodLogData = {
        id: `log_${Date.now()}`,
        date: new Date(),
        mood,
        confidence,
        stress,
        energy,
        sleep,
        notes: notes.trim() || undefined,
      };
      setPastWeekLogs([...pastWeekLogs.slice(1), newLog]);
    } catch (error) {
      console.error('Error saving mood log:', error);
      toast.error('Failed to save mood log. Please try again.');
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-8 h-8 text-pink-600" />
            Daily Mood Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Track your mental state and build self-awareness</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Badge>
      </div>

      {/* 7-Day Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Past 7 Days</CardTitle>
          <CardDescription>Your mood tracking history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {days.map((date, index) => {
              const log = pastWeekLogs.find(
                (l) => l.date.toDateString() === date.toDateString()
              );
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    log
                      ? `bg-gradient-to-br ${getMoodColor(log.mood)} text-white border-transparent`
                      : 'bg-background border-border'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  <div className="text-center space-y-1">
                    <p
                      className={`text-xs font-semibold uppercase ${
                        log ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isToday && !log ? 'text-primary' : log ? 'text-white' : 'text-muted-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </p>
                    {log ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                        <span className="text-xs font-semibold text-white">{log.mood}/10</span>
                      </div>
                    ) : (
                      <div className="h-10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Summary */}
          {pastWeekLogs.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-blue-900">Weekly Summary</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Mood</p>
                  <p className="text-lg font-bold text-blue-900">
                    {(
                      pastWeekLogs.reduce((sum, log) => sum + log.mood, 0) / pastWeekLogs.length
                    ).toFixed(1)}
                    /10
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-ins</p>
                  <p className="text-lg font-bold text-blue-900">{pastWeekLogs.length}/7 days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Sleep</p>
                  <p className="text-lg font-bold text-blue-900">
                    {(
                      pastWeekLogs.reduce((sum, log) => sum + log.sleep, 0) / pastWeekLogs.length
                    ).toFixed(1)}
                    h
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Check-In Form */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl">Today's Check-In</CardTitle>
          <CardDescription>
            How are you feeling today? Take a moment to check in with yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-purple-600" />
                <label className="font-semibold text-foreground">Mood</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMoodEmoji(mood)}</span>
                <span className="text-lg font-bold text-purple-600">{mood}/10</span>
              </div>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value: number[]) => setMood(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                <label className="font-semibold text-foreground">Confidence</label>
              </div>
              <span className="text-lg font-bold text-green-600">{confidence}/10</span>
            </div>
            <Slider
              value={[confidence]}
              onValueChange={(value: number[]) => setConfidence(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Stress Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <label className="font-semibold text-foreground">Stress Level</label>
              </div>
              <span className="text-lg font-bold text-orange-600">{stress}/10</span>
            </div>
            <Slider
              value={[stress]}
              onValueChange={(value: number[]) => setStress(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Energy Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-pink-600" />
                <label className="font-semibold text-foreground">Energy Level</label>
              </div>
              <span className="text-lg font-bold text-pink-600">{energy}/10</span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={(value: number[]) => setEnergy(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Sleep Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                <label className="font-semibold text-foreground">Sleep</label>
              </div>
              <span className="text-lg font-bold text-indigo-600">{sleep}h</span>
            </div>
            <Slider
              value={[sleep]}
              onValueChange={(value: number[]) => setSleep(value[0])}
              min={0}
              max={12}
              step={0.5}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="font-semibold text-foreground flex items-center gap-2">
              <span>Notes (optional)</span>
              <span className="text-xs font-normal text-gray-500">{notes.length}/500</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value.slice(0, 500))}
              placeholder="How are you feeling? Any thoughts or reflections?"
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Check-In
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-5 h-5 text-purple-600" />
            Why Track Your Mood?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>
                <strong>Self-awareness:</strong> Recognize patterns in your emotional state
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>
                <strong>Early warning:</strong> Spot declining trends before they become serious
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>
                <strong>Progress tracking:</strong> See how interventions and strategies help over
                time
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>
                <strong>Communication:</strong> Share accurate data with your coach when you need
                support
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
