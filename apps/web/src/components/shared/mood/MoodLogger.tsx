'use client';

/**
 * MoodLogger Component - AI Sports Agent
 * Professional daily check-in interface for athletes
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Frown,
  Target,
  Brain,
  Zap,
  Moon,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/Input';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="elevated" padding="lg">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body">
              Please sign in to log your daily check-in
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="mb-6"
          >
            <Card
              variant="flat"
              padding="md"
              className="bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Check-In Recorded
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Your daily metrics have been saved successfully
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form */}
      <Card variant="elevated" padding="none">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <CardTitle>Daily Performance Check-In</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-2">
            Track your mental readiness and recovery
          </p>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Core Metrics */}
            <div className="space-y-6">
              <SliderMetric
                label="Mood"
                icon={formData.mood >= 6 ? <Smile className="w-5 h-5" /> : <Frown className="w-5 h-5" />}
                value={formData.mood}
                onChange={(val) => handleSliderChange('mood', val)}
                min={1}
                max={10}
                lowLabel="Very Low"
                highLabel="Excellent"
              />

              <SliderMetric
                label="Confidence"
                icon={<Target className="w-5 h-5" />}
                value={formData.confidence}
                onChange={(val) => handleSliderChange('confidence', val)}
                min={1}
                max={10}
                lowLabel="Not Confident"
                highLabel="Very Confident"
              />

              <SliderMetric
                label="Stress Level"
                icon={<Brain className="w-5 h-5" />}
                value={formData.stress}
                onChange={(val) => handleSliderChange('stress', val)}
                min={1}
                max={10}
                lowLabel="Relaxed"
                highLabel="Very Stressed"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Optional Metrics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Additional Metrics (Optional)
                </span>
              </div>

              <SliderMetric
                label="Energy Level"
                icon={<Zap className="w-5 h-5" />}
                value={formData.energy || 5}
                onChange={(val) => handleSliderChange('energy', val)}
                min={1}
                max={10}
                lowLabel="Exhausted"
                highLabel="Energized"
                optional
              />

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Moon className="w-5 h-5 text-gray-400" />
                  Hours of Sleep
                </label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={formData.sleep || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : 0;
                    setFormData((prev) => ({ ...prev, sleep: value || undefined }));
                  }}
                  placeholder="7.5"
                  className="font-mono text-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 font-body text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                  rows={3}
                  placeholder="Any specific thoughts or events affecting your performance today?"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}
              >
                {isSubmitting ? 'Recording Check-In...' : 'Complete Check-In'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface SliderMetricProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  optional?: boolean;
}

function SliderMetric({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  lowLabel,
  highLabel,
  optional = false,
}: SliderMetricProps) {
  return (
    <div>
      {/* Label with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {optional && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(Optional)</span>
            )}
          </span>
        </div>

        {/* Large Numeric Display - Whoop-style */}
        <motion.span
          key={value}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="text-4xl font-mono font-bold text-primary-600 dark:text-primary-400 tabular-nums"
        >
          {value}
        </motion.span>
      </div>

      {/* Custom Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="slider-athletic w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary-600)) 0%, hsl(var(--primary-600)) ${
              ((value - min) / (max - min)) * 100
            }%, hsl(var(--gray-200)) ${((value - min) / (max - min)) * 100}%, hsl(var(--gray-200)) 100%)`,
          }}
        />
      </div>

      {/* Range Labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>

      {/* Custom slider thumb styling */}
      <style jsx>{`
        .slider-athletic::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(var(--primary-600));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider-athletic::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .slider-athletic::-webkit-slider-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
        }

        .slider-athletic::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(var(--primary-600));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider-athletic::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .slider-athletic::-moz-range-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
        }

        @media (prefers-color-scheme: dark) {
          .slider-athletic::-webkit-slider-thumb {
            background: hsl(var(--primary-500));
          }

          .slider-athletic::-moz-range-thumb {
            background: hsl(var(--primary-500));
          }
        }
      `}</style>
    </div>
  );
}
