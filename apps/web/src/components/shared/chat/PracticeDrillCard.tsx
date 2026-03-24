/**
 * Practice Drill Card Component
 *
 * Displays sport-specific practice drills that integrate mental skills
 * into physical training. Part of Phase 5.1 Advanced Features.
 */

import React, { useState } from 'react';

interface PracticeDrill {
  name: string;
  mental_skill: string;
  setup: string;
  mental_component: string;
  physical_component: string;
  progression: string[];
  success_metrics: string[];
  duration_minutes: number;
  coaching_notes: string;
}

interface PracticeDrillCardProps {
  drill: PracticeDrill;
  onStartDrill?: () => void;
  onTrackProgress?: (week: number, notes: string) => void;
}

export function PracticeDrillCard({ drill, onStartDrill, onTrackProgress }: PracticeDrillCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [progressNotes, setProgressNotes] = useState('');

  const handleTrackProgress = () => {
    if (onTrackProgress) {
      onTrackProgress(currentWeek, progressNotes);
    }
    setProgressNotes('');
  };

  return (
    <div className="drill-card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{drill.name}</h3>
            <div className="flex items-center gap-3 text-sm opacity-80 mt-1">
              <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                {drill.mental_skill.replace(/_/g, ' ')}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {drill.duration_minutes} min
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
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
          {/* Setup */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">Setup</h4>
            <p className="text-sm bg-white/5 p-3 rounded-lg">{drill.setup}</p>
          </div>

          {/* Mental & Physical Components */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">Mental</h4>
              <p className="text-sm opacity-90">{drill.mental_component}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">Physical</h4>
              <p className="text-sm opacity-90">{drill.physical_component}</p>
            </div>
          </div>

          {/* 4-Week Progression */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70">4-Week Progression</h4>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="text-xs bg-white/10 border-0 rounded px-2 py-1 text-white focus:ring-1 focus:ring-white/30"
              >
                {[1, 2, 3, 4].map((week) => (
                  <option key={week} value={week} className="bg-gray-800">
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {drill.progression.map((week, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${
                    currentWeek === index + 1 ? 'bg-accent/20' : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      currentWeek === index + 1
                        ? 'bg-accent text-accent-foreground'
                        : currentWeek > index + 1
                        ? 'bg-white/20'
                        : 'bg-white/10'
                    }`}
                  >
                    {currentWeek > index + 1 ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className="text-sm flex-1">{week}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">Success Metrics</h4>
            <ul className="bg-white/5 p-3 rounded-lg space-y-1.5">
              {drill.success_metrics.map((metric, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coaching Notes */}
          {drill.coaching_notes && (
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Coaching Notes</h4>
              <p className="text-sm opacity-90">{drill.coaching_notes}</p>
            </div>
          )}

          {/* Track Progress */}
          <div className="pt-2">
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="How did this week's drill go?"
              className="w-full px-3 py-2 bg-white/10 border-0 rounded-lg text-sm placeholder:text-white/50 focus:ring-1 focus:ring-white/30 mb-3"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleTrackProgress}
                disabled={!progressNotes.trim()}
                className="flex-1 h-10 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Progress
              </button>
              {onStartDrill && (
                <button
                  onClick={onStartDrill}
                  className="h-10 px-4 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Start
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
