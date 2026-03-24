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

          for (let i = 0; i <= currentCueIndex; i++) {
            cumulativeTime += routine.cues[i].duration_seconds;
          }

          // Check if we need to advance to next cue
          if (newElapsed >= cumulativeTime && currentCueIndex < routine.cues.length - 1) {
            setCurrentCueIndex(currentCueIndex + 1);
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
  const getCueIcon = (type: string) => {
    switch (type) {
      case 'physical':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'mental':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'environmental':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'social':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  const currentCue = routine.cues[currentCueIndex];
  const progress = (elapsedSeconds / routine.total_duration_seconds) * 100;

  return (
    <div className="widget-card animate-fade-in">
      {/* Header */}
      <div className="widget-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="widget-title">{routine.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="bg-accent/10 text-accent px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                {routine.phase.replace(/_/g, ' ')}
              </span>
              <span>{formatTime(routine.total_duration_seconds)}</span>
              <span>{routine.cues.length} steps</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Timer Display (when running) */}
          {isRunning && (
            <div className="bg-primary text-primary-foreground rounded-xl p-5">
              {/* Timer */}
              <div className="text-center mb-4">
                <div className="text-4xl font-semibold tabular-nums mb-1">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-sm opacity-70">
                  of {formatTime(routine.total_duration_seconds)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-4">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Current Cue */}
              <div className="bg-white/10 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground flex-shrink-0">
                    {getCueIcon(currentCue.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        Step {currentCueIndex + 1} of {routine.cues.length}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/20">
                        {currentCue.type}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{currentCue.description}</p>
                    <div className="text-sm opacity-80 tabular-nums">
                      {formatTime(getCurrentCueDuration())} / {formatTime(currentCue.duration_seconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={togglePause}
                  className="flex-1 h-10 bg-white/20 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
                <button
                  onClick={stopRoutine}
                  className="h-10 px-4 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Start Button (when not running) */}
          {!isRunning && (
            <div className="text-center py-2">
              <button
                onClick={startRoutine}
                className="h-12 px-8 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Routine
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                {routine.cues.length} steps • {formatTime(routine.total_duration_seconds)} total
              </p>
            </div>
          )}

          {/* Routine Steps */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Routine Steps
            </h4>
            <div className="space-y-2">
              {routine.cues.map((cue, index) => {
                const isCurrentCue = isRunning && index === currentCueIndex;
                const isPastCue = isRunning && index < currentCueIndex;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrentCue
                        ? 'bg-accent/10 border-accent'
                        : isPastCue
                        ? 'bg-muted/50 border-border opacity-60'
                        : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        isCurrentCue ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getCueIcon(cue.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(cue.duration_seconds)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{cue.description}</p>
                        {cue.why_included && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {cue.why_included}
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
          {routine.customization_notes && (
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Customization Notes
              </h4>
              <p className="text-sm text-foreground">{routine.customization_notes}</p>
            </div>
          )}

          {/* Effectiveness Tracking */}
          {routine.effectiveness_tracking.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Track Effectiveness
              </h4>
              <ul className="space-y-1.5 mb-3">
                {routine.effectiveness_tracking.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {onSaveCustomization && (
                <button
                  onClick={() => onSaveCustomization(routine)}
                  className="w-full h-10 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Save My Routine
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
