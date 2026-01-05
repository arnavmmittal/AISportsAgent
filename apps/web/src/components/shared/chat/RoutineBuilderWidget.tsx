/**
 * Routine Builder Widget Component
 *
 * Displays pre-performance routines with timer-based cues.
 * Includes interactive timer and step-by-step guidance.
 * Part of Phase 5.1 Advanced Features.
 */

import React, { useState, useEffect, useRef } from 'react';

interface RoutineCue {
  type: string; // 'physical', 'mental', 'environmental', 'social'
  description: string;
  duration_seconds: number;
  why_included?: string;
}

interface PrePerformanceRoutine {
  name: string;
  sport: string;
  phase: string;
  total_duration_seconds: number;
  cues: RoutineCue[];
  customization_notes: string;
  effectiveness_tracking: string[];
}

interface RoutineBuilderWidgetProps {
  routine: PrePerformanceRoutine;
  onComplete?: () => void;
  onSaveCustomization?: (customizedRoutine: PrePerformanceRoutine) => void;
}

export function RoutineBuilderWidget({
  routine,
  onComplete,
  onSaveCustomization,
}: RoutineBuilderWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total elapsed time for current cue
  const getCurrentCueDuration = (): number => {
    if (currentCueIndex === 0) return elapsedSeconds;
    const previousCuesTime = routine.cues
      .slice(0, currentCueIndex)
      .reduce((sum, cue) => sum + cue.duration_seconds, 0);
    return elapsedSeconds - previousCuesTime;
  };

  // Start routine timer
  const startRoutine = () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentCueIndex(0);
    setElapsedSeconds(0);
  };

  // Pause/Resume timer
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Stop routine
  const stopRoutine = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentCueIndex(0);
    setElapsedSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const newElapsed = prev + 1;

          // Calculate cumulative time for cues
          let cumulativeTime = 0;
          let nextCueIndex = currentCueIndex;

          for (let i = 0; i <= currentCueIndex; i++) {
            cumulativeTime += routine.cues[i].duration_seconds;
          }

          // Check if we need to advance to next cue
          if (newElapsed >= cumulativeTime && currentCueIndex < routine.cues.length - 1) {
            nextCueIndex = currentCueIndex + 1;
            setCurrentCueIndex(nextCueIndex);
          }

          // Check if routine is complete
          if (newElapsed >= routine.total_duration_seconds) {
            setIsRunning(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (onComplete) {
              onComplete();
            }
          }

          return newElapsed;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isRunning, isPaused, currentCueIndex, routine, onComplete]);

  // Get icon for cue type
  const getCueIcon = (type: string): string => {
    switch (type) {
      case 'physical':
        return '💪';
      case 'mental':
        return '🧠';
      case 'environmental':
        return '🌍';
      case 'social':
        return '👥';
      default:
        return '⭐';
    }
  };

  // Get color for cue type
  const getCueColor = (type: string): string => {
    switch (type) {
      case 'physical':
        return 'blue';
      case 'mental':
        return 'purple';
      case 'environmental':
        return 'green';
      case 'social':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const currentCue = routine.cues[currentCueIndex];
  const progress = (elapsedSeconds / routine.total_duration_seconds) * 100;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-6 mt-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏱️</span>
            <h3 className="text-xl font-bold text-gray-800">{routine.name}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-indigo-100 px-3 py-1 rounded-full font-medium">
              {routine.phase.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(routine.total_duration_seconds)}
            </span>
            <span className="text-gray-500">{routine.cues.length} steps</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Timer Controls (when running) */}
          {isRunning && (
            <div className="bg-card p-6 rounded-xl mb-4 border-2 border-indigo-400">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-indigo-600 mb-2">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-sm text-gray-600">
                  of {formatTime(routine.total_duration_seconds)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Current Cue */}
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getCueIcon(currentCue.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase">
                        Step {currentCueIndex + 1} of {routine.cues.length}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${getCueColor(currentCue.type)}-200 text-${getCueColor(currentCue.type)}-700`}>
                        {currentCue.type}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium mb-1">{currentCue.description}</p>
                    {currentCue.why_included && (
                      <p className="text-xs text-gray-600 italic">{currentCue.why_included}</p>
                    )}
                    <div className="mt-2 text-sm text-indigo-600 font-medium">
                      {formatTime(getCurrentCueDuration())} / {formatTime(currentCue.duration_seconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={togglePause}
                  className="px-6 py-2 bg-muted/100 text-white rounded-lg font-medium hover:bg-muted-foreground transition-colors flex items-center gap-2"
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <button
                  onClick={stopRoutine}
                  className="px-6 py-2 bg-muted-foreground/100 text-white rounded-lg font-medium hover:bg-muted-foreground/30 transition-colors flex items-center gap-2"
                >
                  ⏹️ Stop
                </button>
              </div>
            </div>
          )}

          {/* Start Button (when not running) */}
          {!isRunning && (
            <div className="bg-card p-4 rounded-xl mb-4 border-2 border-indigo-300">
              <div className="text-center">
                <button
                  onClick={startRoutine}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg flex items-center gap-2 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start Routine
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  {routine.cues.length} steps • {formatTime(routine.total_duration_seconds)} total
                </p>
              </div>
            </div>
          )}

          {/* Routine Steps */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📋</span> Routine Steps
            </h4>
            <div className="space-y-2">
              {routine.cues.map((cue, index) => {
                const cueColor = getCueColor(cue.type);
                const isCurrentCue = isRunning && index === currentCueIndex;
                const isPastCue = isRunning && index < currentCueIndex;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isCurrentCue
                        ? 'bg-indigo-100 border-indigo-400 shadow-md'
                        : isPastCue
                        ? 'bg-muted border-gray-300 opacity-60'
                        : 'bg-card border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCueIcon(cue.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">
                            STEP {index + 1}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${cueColor}-100 text-${cueColor}-700`}>
                            {cue.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(cue.duration_seconds)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{cue.description}</p>
                        {cue.why_included && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            💡 {cue.why_included}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customization Notes */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>✏️</span> Customization Notes
            </h4>
            <p className="text-sm text-gray-600 bg-muted/10 p-3 rounded-lg border border-muted">
              {routine.customization_notes}
            </p>
          </div>

          {/* Effectiveness Tracking */}
          <div className="bg-card p-4 rounded-lg border-2 border-accent/20">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>📊</span> Track Effectiveness
            </h4>
            <ul className="space-y-1 mb-3">
              {routine.effectiveness_tracking.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {onSaveCustomization && (
              <button
                onClick={() => onSaveCustomization(routine)}
                className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Save My Routine
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
