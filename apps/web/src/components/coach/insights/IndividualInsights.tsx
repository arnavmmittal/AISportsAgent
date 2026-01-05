/**
 * IndividualInsights Component
 * AI-generated insights for individual athletes
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import { ReadinessTrendChart } from '../charts/LineChart';

interface AthleteInsight {
  athleteId: string;
  athleteName: string;
  sport: string;
  currentReadiness: number;
  archetype: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: {
    title: string;
    action: string;
    evidence: string;
  }[];
  recentTrends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    significance: string;
  }[];
  progressHighlights: string[];
}

export default function IndividualInsights() {
  const [selectedAthlete, setSelectedAthlete] = useState<string>('sarah-johnson');

  // TODO: Replace with AI-generated insights from /api/coach/insights/individual/:athleteId
  const insights: Record<string, AthleteInsight> = {
    'sarah-johnson': {
      athleteId: 'sarah-johnson',
      athleteName: 'Sarah Johnson',
      sport: 'Basketball',
      currentReadiness: 95,
      archetype: 'Resilient Warrior 💪',
      summary: 'Sarah is operating at peak performance with exceptional mental resilience. She demonstrates consistent excellence across all wellness metrics and serves as a positive role model for teammates. Her 28-day meditation streak and high engagement with mental skills training suggest deep commitment to holistic development.',
      strengths: [
        'Exceptional self-regulation - maintains optimal readiness even under pressure',
        'Strong habit formation - 93% completion rate on all assignments',
        'Leadership qualities - positive influence on team cohesion (+12%)',
        'Growth mindset - actively seeks feedback and implements suggestions',
      ],
      concerns: [
        'None identified - Sarah is thriving across all dimensions',
      ],
      recommendations: [
        {
          title: 'Leadership Development Opportunity',
          action: 'Consider appointing Sarah as peer mentor for athletes struggling with stress management',
          evidence: 'Research shows peer mentoring improves outcomes for both mentor and mentee (Smith et al., 2019)',
        },
        {
          title: 'Challenge and Engagement',
          action: 'Introduce advanced mental skills training (e.g., advanced imagery protocols) to maintain engagement',
          evidence: 'High performers need continuous challenge to avoid plateaus (Ericsson & Pool, 2016)',
        },
      ],
      recentTrends: [
        { metric: 'Readiness Score', direction: 'stable', significance: 'Maintained 90+ for 14 consecutive days' },
        { metric: 'Stress Level', direction: 'down', significance: 'Decreased from 4.5 to 3.2 over past month' },
        { metric: 'Team Cohesion Influence', direction: 'up', significance: 'Teammates report increased motivation when practicing with Sarah' },
      ],
      progressHighlights: [
        'Achieved longest meditation streak on team (28 days)',
        'Completed pre-competition breathing protocol with 100% compliance',
        'Performance rating improved 15% since mental skills training began',
      ],
    },
    'mike-chen': {
      athleteId: 'mike-chen',
      athleteName: 'Mike Chen',
      sport: 'Basketball',
      currentReadiness: 63,
      archetype: 'Burnout Risk 🔥',
      summary: 'Mike is experiencing signs of accumulated stress and fatigue with declining readiness for 7+ consecutive days. Recent academic pressures (finals week) combined with intensive training load appear to be overwhelming his recovery capacity. Immediate intervention recommended to prevent further decline and potential burnout.',
      strengths: [
        'Strong athletic ability - physical performance metrics remain solid',
        'Team commitment - continues attending all practices despite low energy',
        'Self-awareness - acknowledges struggles in check-ins',
      ],
      concerns: [
        'Declining readiness trend (7 consecutive days below 70)',
        'Sleep debt accumulating (average 5.8 hours vs 7+ hour target)',
        'Low assignment completion (0/3 this week) suggests limited bandwidth',
        'Elevated stress (7.8/10) related to finals and performance anxiety',
      ],
      recommendations: [
        {
          title: 'Immediate Rest Day',
          action: 'Schedule 1-2 rest days this week to allow physiological and psychological recovery',
          evidence: 'Rest is critical for preventing overtraining syndrome (Kellmann et al., 2018)',
        },
        {
          title: 'Academic Support Coordination',
          action: 'Connect Mike with academic support services - time management coaching for finals prep',
          evidence: 'Academic stress is primary driver of his current state - addressing root cause is essential',
        },
        {
          title: 'Simplified Mental Skills Practice',
          action: 'Reduce assignment load, focus only on 5-min daily breathing exercises until readiness recovers',
          evidence: 'Overwhelmed athletes benefit from simplified, high-impact interventions (Gardner & Moore, 2007)',
        },
      ],
      recentTrends: [
        { metric: 'Readiness Score', direction: 'down', significance: 'Declined from 78 to 63 over 7 days (significant drop)' },
        { metric: 'Sleep Duration', direction: 'down', significance: 'Averaging 5.8 hours (2 hours below optimal)' },
        { metric: 'Stress Level', direction: 'up', significance: 'Increased from 5.5 to 7.8 (finals-related)' },
      ],
      progressHighlights: [
        'Despite struggles, has not missed a single practice (demonstrates commitment)',
        'Openly communicates challenges in AI chat (positive sign for intervention)',
      ],
    },
  };

  const currentInsight = insights[selectedAthlete];

  // Mock trend data
  const readinessTrendData = Array.from({ length: 14 }, (_, i) => ({
    date: `Day ${i + 1}`,
    score: currentInsight.currentReadiness + (Math.random() - 0.5) * 20,
  }));

  return (
    <div className="space-y-6">
      {/* Athlete Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.values(insights).map(athlete => (
          <button
            key={athlete.athleteId}
            onClick={() => setSelectedAthlete(athlete.athleteId)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
              selectedAthlete === athlete.athleteId
                ? 'bg-primary border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-semibold">{athlete.athleteName}</div>
            <div className="text-xs opacity-80">{athlete.sport}</div>
          </button>
        ))}
      </div>

      {/* Athlete Summary Card */}
      <div className="p-5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-accent rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentInsight.athleteName}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{currentInsight.sport}</span>
              <span className="text-sm">{currentInsight.archetype}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white mb-1">
              {currentInsight.currentReadiness}
            </div>
            <div className="text-xs text-slate-400">Current Readiness</div>
          </div>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">{currentInsight.summary}</p>
        <p className="text-xs text-slate-400 mt-3">
          🤖 AI-generated summary based on 30-day behavioral patterns and validated psychology frameworks
        </p>
      </div>

      {/* Readiness Trend */}
      <DashboardSection title="14-Day Readiness Trend">
        <ReadinessTrendChart data={readinessTrendData} height={250} />
      </DashboardSection>

      {/* Recent Trends */}
      <DashboardSection title="📈 Recent Trends">
        <div className="space-y-2">
          {currentInsight.recentTrends.map((trend, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-800/50 border-l-4 border-blue-500 rounded flex items-start justify-between"
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">{trend.metric}</h4>
                <p className="text-xs text-slate-300">{trend.significance}</p>
              </div>
              <span
                className={`ml-3 text-xl ${
                  trend.direction === 'up'
                    ? 'text-accent'
                    : trend.direction === 'down'
                    ? 'text-muted-foreground'
                    : 'text-blue-400'
                }`}
              >
                {trend.direction === 'up' && '📈'}
                {trend.direction === 'down' && '📉'}
                {trend.direction === 'stable' && '➡️'}
              </span>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Strengths and Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardSection title="💪 Strengths">
          <ul className="space-y-2">
            {currentInsight.strengths.map((strength, idx) => (
              <li
                key={idx}
                className="p-3 bg-secondary/20 border-l-4 border-secondary rounded"
              >
                <p className="text-sm text-slate-200">{strength}</p>
              </li>
            ))}
          </ul>
        </DashboardSection>

        <DashboardSection title="⚠️ Areas of Concern">
          <ul className="space-y-2">
            {currentInsight.concerns.map((concern, idx) => (
              <li
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  concern.includes('None')
                    ? 'bg-secondary/20 border-secondary'
                    : 'bg-muted/20 border-muted'
                }`}
              >
                <p className="text-sm text-slate-200">{concern}</p>
              </li>
            ))}
          </ul>
        </DashboardSection>
      </div>

      {/* AI Recommendations */}
      <DashboardSection title="💡 Personalized Recommendations">
        <div className="space-y-4">
          {currentInsight.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <h4 className="text-base font-semibold text-white mb-2">{rec.title}</h4>
              <p className="text-sm text-slate-200 mb-3">{rec.action}</p>
              <p className="text-xs text-blue-400">📚 Evidence: {rec.evidence}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Progress Highlights */}
      {currentInsight.progressHighlights.length > 0 && (
        <DashboardSection title="🌟 Progress Highlights">
          <ul className="space-y-2">
            {currentInsight.progressHighlights.map((highlight, idx) => (
              <li
                key={idx}
                className="p-3 bg-accent/20 border-l-4 border-accent rounded"
              >
                <p className="text-sm text-slate-200">{highlight}</p>
              </li>
            ))}
          </ul>
        </DashboardSection>
      )}
    </div>
  );
}
