'use client';

/**
 * Weekly Summary Drawer Component
 *
 * Displays weekly chat summaries for athletes (ONLY if consent granted)
 * - Expandable/collapsible design
 * - Shows structured metrics, themes, and recommendations
 * - No raw chat content displayed
 */

import { useState, useEffect } from 'react';
import { WeeklySummary } from '@/types/coach-portal';

interface WeeklySummaryDrawerProps {
  athleteId: string;
  athleteName: string;
  consentGranted: boolean;
}

export default function WeeklySummaryDrawer({
  athleteId,
  athleteName,
  consentGranted,
}: WeeklySummaryDrawerProps) {
  const [expanded, setExpanded] = useState(false);
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && consentGranted) {
      fetchSummaries();
    }
  }, [expanded, consentGranted]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/coach/weekly-summaries?athleteId=${athleteId}&limit=4`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch summaries');
      }

      const data = await res.json();
      setSummaries(data.summaries || []);
    } catch (err: any) {
      console.error('Error fetching weekly summaries:', err);
      setError(err.message || 'Failed to load weekly summaries');
    } finally {
      setLoading(false);
    }
  };

  // Format date range
  const formatWeekRange = (weekStart: Date, weekEnd: Date) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get score color
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 8) return 'text-secondary';
    if (score >= 6) return 'text-muted-foreground';
    return 'text-muted-foreground';
  };

  if (!consentGranted) {
    return (
      <div className="border border-border rounded-lg bg-background">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-muted-foreground mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium text-muted-foreground">Weekly Summary Not Available</span>
          </div>
        </div>
        <div className="px-4 pb-4 text-sm text-muted-foreground">
          {athleteName} has not enabled weekly chat summaries.
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-background transition-colors"
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-foreground">Weekly Summary</span>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading summaries...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={fetchSummaries}
                className="mt-2 text-sm text-primary hover:text-blue-700"
              >
                Retry
              </button>
            </div>
          ) : summaries.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No weekly summaries available yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {summaries.map((summary) => (
                <div key={summary.id} className="p-4 space-y-3">
                  {/* Week Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {formatWeekRange(summary.weekStart, summary.weekEnd)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {summary.sessionCount} session{summary.sessionCount !== 1 ? 's' : ''} • {summary.totalMessages} messages
                    </span>
                  </div>

                  {/* Scores Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.moodScore)}`}>
                        {summary.moodScore ? summary.moodScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Mood</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.confidenceScore)}`}>
                        {summary.confidenceScore ? summary.confidenceScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.sleepQualityScore)}`}>
                        {summary.sleepQualityScore ? summary.sleepQualityScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Sleep</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.stressScore ? 10 - summary.stressScore : null)}`}>
                        {summary.stressScore ? summary.stressScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Stress</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.engagementScore)}`}>
                        {summary.engagementScore ? summary.engagementScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(summary.sorenessScore ? 10 - summary.sorenessScore : null)}`}>
                        {summary.sorenessScore ? summary.sorenessScore.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Soreness</div>
                    </div>
                  </div>

                  {/* Key Themes */}
                  {summary.keyThemes && summary.keyThemes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">Key Themes:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {summary.keyThemes.map((theme, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground">
                            {theme}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risk Flags */}
                  {summary.riskFlags && summary.riskFlags.length > 0 && (
                    <div className="bg-muted-foreground/10 border border-muted-foreground rounded p-2">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Risk Flags:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {summary.riskFlags.map((flag, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground">
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {summary.recommendedActions && summary.recommendedActions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <h4 className="text-xs font-semibold text-blue-800 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recommended Actions:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {summary.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-xs text-blue-700">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Adherence Notes */}
                  {summary.adherenceNotes && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">Engagement Notes:</h4>
                      <p className="text-xs text-muted-foreground">{summary.adherenceNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
