'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Brain,
  Zap,
  Moon,
  Heart,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreGameSessionProps {
  onComplete?: (data: SessionData) => void;
  onClose?: () => void;
  gameScheduleId?: string;
  gameInfo?: {
    opponent: string;
    gameDate: string;
    location?: string;
    stakes?: string;
    homeAway?: string;
  };
}

interface SessionData {
  moodScore: number;
  confidenceScore: number;
  anxietyScore: number;
  focusScore: number;
  energyLevel: number;
  sleepQuality: number;
  athleteGoal: string;
  focusCue: string;
}

type SessionStep = 'intro' | 'mood' | 'confidence' | 'anxiety' | 'energy' | 'goal' | 'complete';

const STEPS: SessionStep[] = ['intro', 'mood', 'confidence', 'anxiety', 'energy', 'goal', 'complete'];

export function PreGameSession({ onComplete, onClose, gameScheduleId, gameInfo }: PreGameSessionProps) {
  const [currentStep, setCurrentStep] = useState<SessionStep>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const [sessionData, setSessionData] = useState<SessionData>({
    moodScore: 5,
    confidenceScore: 5,
    anxietyScore: 5,
    focusScore: 5,
    energyLevel: 5,
    sleepQuality: 5,
    athleteGoal: '',
    focusCue: '',
  });

  // Start session when component mounts
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const response = await fetch('/api/athlete/pre-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameScheduleId,
          sessionType: 'QUICK_CHECKIN',
        }),
      });
      const data = await response.json();
      if (data.session) {
        setSessionId(data.session.id);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/athlete/pre-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...sessionData,
        }),
      });
      const data = await response.json();

      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }

      setCurrentStep('complete');
      onComplete?.(sessionData);
    } catch (error) {
      console.error('Failed to complete session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentStep === 'goal') {
      completeSession();
    } else if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const progress = (STEPS.indexOf(currentStep) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <span className="text-white/70 text-sm font-medium">
          {currentStep === 'complete' ? 'Done!' : `${STEPS.indexOf(currentStep)}/${STEPS.length - 2}`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <IntroStep gameInfo={gameInfo} onNext={handleNext} />
          )}
          {currentStep === 'mood' && (
            <SliderStep
              key="mood"
              icon={<Heart className="w-8 h-8" />}
              title="How are you feeling right now?"
              subtitle="Rate your overall mood"
              value={sessionData.moodScore}
              onChange={(v) => setSessionData({ ...sessionData, moodScore: v })}
              lowLabel="Not great"
              highLabel="Excellent"
              color="from-red-400 to-pink-500"
            />
          )}
          {currentStep === 'confidence' && (
            <SliderStep
              key="confidence"
              icon={<Trophy className="w-8 h-8" />}
              title="How confident are you feeling?"
              subtitle="Trust in your preparation"
              value={sessionData.confidenceScore}
              onChange={(v) => setSessionData({ ...sessionData, confidenceScore: v })}
              lowLabel="Uncertain"
              highLabel="Very confident"
              color="from-yellow-400 to-orange-500"
            />
          )}
          {currentStep === 'anxiety' && (
            <SliderStep
              key="anxiety"
              icon={<Brain className="w-8 h-8" />}
              title="How nervous or anxious are you?"
              subtitle="Pre-competition nerves are normal"
              value={sessionData.anxietyScore}
              onChange={(v) => setSessionData({ ...sessionData, anxietyScore: v })}
              lowLabel="Very calm"
              highLabel="Very anxious"
              color="from-purple-400 to-indigo-500"
              inverted
            />
          )}
          {currentStep === 'energy' && (
            <DoubleSliderStep
              key="energy"
              value1={sessionData.energyLevel}
              value2={sessionData.sleepQuality}
              onChange1={(v) => setSessionData({ ...sessionData, energyLevel: v })}
              onChange2={(v) => setSessionData({ ...sessionData, sleepQuality: v })}
            />
          )}
          {currentStep === 'goal' && (
            <GoalStep
              key="goal"
              goal={sessionData.athleteGoal}
              focusCue={sessionData.focusCue}
              onGoalChange={(v) => setSessionData({ ...sessionData, athleteGoal: v })}
              onCueChange={(v) => setSessionData({ ...sessionData, focusCue: v })}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep
              key="complete"
              recommendations={recommendations}
              sessionData={sessionData}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep !== 'intro' && currentStep !== 'complete' && (
        <div className="p-6 flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentStep === 'goal' ? (
              <>
                Complete
                <CheckCircle2 className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Intro Step
function IntroStep({ gameInfo, onNext }: { gameInfo?: any; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-md"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">
        Pre-Game Mental Check-In
      </h1>

      {gameInfo && (
        <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">vs {gameInfo.opponent}</span>
          </div>
          {gameInfo.gameDate && (
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(gameInfo.gameDate).toLocaleDateString()}</span>
            </div>
          )}
          {gameInfo.location && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{gameInfo.location}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-white/70 mb-8">
        Take 2 minutes to check in with yourself. This quick assessment helps you
        optimize your mental state for peak performance.
      </p>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        Let's Go
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// Slider Step
function SliderStep({
  icon,
  title,
  subtitle,
  value,
  onChange,
  lowLabel,
  highLabel,
  color,
  inverted,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  color: string;
  inverted?: boolean;
}) {
  const displayValue = inverted ? 11 - value : value;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-md"
    >
      <div className={cn(
        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br",
        color
      )}>
        {icon}
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        {title}
      </h2>
      <p className="text-white/60 text-center mb-8">
        {subtitle}
      </p>

      <div className="mb-6">
        <div className={cn(
          "text-6xl font-bold text-center mb-4 bg-gradient-to-r bg-clip-text text-transparent",
          color
        )}>
          {value}
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer bg-white/20"
          style={{
            background: `linear-gradient(to right,
              ${inverted ? '#ef4444' : '#22c55e'} 0%,
              ${inverted ? '#ef4444' : '#22c55e'} ${(value - 1) * 11.1}%,
              rgba(255,255,255,0.2) ${(value - 1) * 11.1}%,
              rgba(255,255,255,0.2) 100%)`,
          }}
        />

        <div className="flex justify-between mt-2 text-sm text-white/50">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Double Slider Step (Energy + Sleep)
function DoubleSliderStep({
  value1,
  value2,
  onChange1,
  onChange2,
}: {
  value1: number;
  value2: number;
  onChange1: (value: number) => void;
  onChange2: (value: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-md space-y-8"
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Energy Level</h3>
            <p className="text-white/60 text-sm">How physically ready do you feel?</p>
          </div>
          <span className="ml-auto text-3xl font-bold text-yellow-400">{value1}</span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={value1}
          onChange={(e) => onChange1(parseInt(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #f59e0b 0%,
              #f59e0b ${(value1 - 1) * 11.1}%,
              rgba(255,255,255,0.2) ${(value1 - 1) * 11.1}%,
              rgba(255,255,255,0.2) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-white/40">
          <span>Exhausted</span>
          <span>Energized</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sleep Quality</h3>
            <p className="text-white/60 text-sm">How well did you sleep last night?</p>
          </div>
          <span className="ml-auto text-3xl font-bold text-indigo-400">{value2}</span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={value2}
          onChange={(e) => onChange2(parseInt(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #818cf8 0%,
              #818cf8 ${(value2 - 1) * 11.1}%,
              rgba(255,255,255,0.2) ${(value2 - 1) * 11.1}%,
              rgba(255,255,255,0.2) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-white/40">
          <span>Poor</span>
          <span>Great</span>
        </div>
      </div>
    </motion.div>
  );
}

// Goal Step
function GoalStep({
  goal,
  focusCue,
  onGoalChange,
  onCueChange,
}: {
  goal: string;
  focusCue: string;
  onGoalChange: (value: string) => void;
  onCueChange: (value: string) => void;
}) {
  const quickGoals = [
    "Stay composed under pressure",
    "Trust my preparation",
    "Play one point at a time",
    "Give maximum effort",
    "Stay present",
  ];

  const quickCues = [
    "Breathe",
    "Trust it",
    "Next play",
    "Let's go",
    "I got this",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-md"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
        <Target className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Set Your Intentions
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-white/80 font-medium mb-2">
            One thing to focus on today:
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            placeholder="e.g., Stay composed under pressure"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickGoals.map((q) => (
              <button
                key={q}
                onClick={() => onGoalChange(q)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-colors",
                  goal === q
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white/80 font-medium mb-2">
            Your power word or cue:
          </label>
          <input
            type="text"
            value={focusCue}
            onChange={(e) => onCueChange(e.target.value)}
            placeholder="e.g., Breathe"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickCues.map((q) => (
              <button
                key={q}
                onClick={() => onCueChange(q)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-colors",
                  focusCue === q
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Complete Step
function CompleteStep({
  recommendations,
  sessionData,
  onClose,
}: {
  recommendations: string[];
  sessionData: SessionData;
  onClose?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-3xl font-bold text-white mb-3">
        You're Ready!
      </h2>

      {sessionData.athleteGoal && (
        <div className="bg-white/10 rounded-2xl p-4 mb-6">
          <p className="text-white/60 text-sm mb-1">Your focus today:</p>
          <p className="text-white font-semibold text-lg">{sessionData.athleteGoal}</p>
          {sessionData.focusCue && (
            <div className="mt-2 inline-block px-4 py-1 bg-emerald-500/30 rounded-full">
              <span className="text-emerald-300 font-medium">"{sessionData.focusCue}"</span>
            </div>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left">
          <p className="text-white/60 text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Quick tips for you:
          </p>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-white/80 text-sm flex gap-2">
                <span className="text-emerald-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Go Compete!
      </button>
    </motion.div>
  );
}
