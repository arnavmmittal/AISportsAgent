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
    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-secondary/20 p-6 mt-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏋️</span>
            <h3 className="text-xl font-bold text-gray-800">{drill.name}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-teal-100 px-3 py-1 rounded-full font-medium">
              {drill.mental_skill.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {drill.duration_minutes} min
            </span>
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
          {/* Setup */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>⚙️</span> Setup
            </h4>
            <p className="text-gray-600 text-sm bg-card p-3 rounded-lg">
              {drill.setup}
            </p>
          </div>

          {/* Mental & Physical Components */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-card p-4 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                <span>🧠</span> Mental Component
              </h4>
              <p className="text-gray-600 text-sm">{drill.mental_component}</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <span>💪</span> Physical Component
              </h4>
              <p className="text-gray-600 text-sm">{drill.physical_component}</p>
            </div>
          </div>

          {/* 4-Week Progression */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📈</span> 4-Week Progression
            </h4>
            <div className="space-y-2">
              {drill.progression.map((week, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentWeek === index + 1
                      ? 'bg-teal-100 border-teal-400'
                      : 'bg-card border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        currentWeek === index + 1
                          ? 'bg-teal-500 text-white'
                          : currentWeek > index + 1
                          ? 'bg-secondary/100 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentWeek > index + 1 ? '✓' : index + 1}
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{week}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Current Week:</label>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {[1, 2, 3, 4].map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>🎯</span> Success Metrics
            </h4>
            <ul className="bg-card p-4 rounded-lg space-y-2">
              {drill.success_metrics.map((metric, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-teal-500 mt-0.5">•</span>
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coaching Notes */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>💡</span> Coaching Notes
            </h4>
            <p className="text-sm text-gray-600 bg-muted/10 p-3 rounded-lg border border-muted">
              {drill.coaching_notes}
            </p>
          </div>

          {/* Track Progress */}
          <div className="bg-card p-4 rounded-lg border-2 border-teal-300">
            <h4 className="font-semibold text-gray-700 mb-3">Track Your Progress</h4>
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="How did this week's drill go? Note any challenges or improvements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleTrackProgress}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
              >
                Log Progress
              </button>
              {onStartDrill && (
                <button
                  onClick={onStartDrill}
                  className="px-4 py-2 bg-secondary/100 text-white rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Start Drill
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
