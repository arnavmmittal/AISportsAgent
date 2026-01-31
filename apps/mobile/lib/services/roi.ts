/**
 * ROI Dashboard API Service
 *
 * Provides metrics for Athletic Directors to justify
 * sports psychology budget allocation.
 */

import { getStoredToken } from '../auth';
import config from '../../config';

export interface ROIMetrics {
  engagement: {
    totalAthletes: number;
    activeAthletes: number;
    engagementRate: number;
    avgSessionsPerAthlete: number;
    totalChatSessions: number;
    totalCheckIns: number;
    weeklyActiveUsers: number;
    engagementTrend: 'up' | 'down' | 'stable';
    engagementChange: number;
  };
  mentalHealth: {
    avgMoodScore: number;
    avgMoodChange: number;
    avgStressReduction: number;
    avgConfidenceGain: number;
    athletesImproved: number;
    athletesStable: number;
    athletesDeclined: number;
    improvementRate: number;
  };
  performance: {
    moodPerformanceCorrelation: number;
    gamesWithHighMood: number;
    winRateHighMood: number;
    winRateLowMood: number;
    performanceGain: number;
  };
  riskMitigation: {
    crisisAlertsDetected: number;
    crisisAlertsResolved: number;
    earlyInterventions: number;
    athletesAtRisk: number;
    athletesRecovered: number;
    preventedEscalations: number;
  };
  efficiency: {
    estimatedHoursSaved: number;
    chatSessionsReplacing11: number;
    automatedAlerts: number;
    avgResponseTime: string;
  };
  periodComparison: {
    currentPeriod: string;
    previousPeriod: string;
    engagementChange: number;
    moodChange: number;
    performanceChange: number;
  };
  highlights: {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    positive: boolean;
  }[];
}

// Demo ROI metrics for offline/demo mode
const DEMO_ROI_METRICS: ROIMetrics = {
  engagement: {
    totalAthletes: 48,
    activeAthletes: 42,
    engagementRate: 87,
    avgSessionsPerAthlete: 3.2,
    totalChatSessions: 156,
    totalCheckIns: 312,
    weeklyActiveUsers: 38,
    engagementTrend: 'up',
    engagementChange: 12,
  },
  mentalHealth: {
    avgMoodScore: 7.2,
    avgMoodChange: 0.8,
    avgStressReduction: 1.4,
    avgConfidenceGain: 1.2,
    athletesImproved: 34,
    athletesStable: 6,
    athletesDeclined: 2,
    improvementRate: 81,
  },
  performance: {
    moodPerformanceCorrelation: 0.72,
    gamesWithHighMood: 18,
    winRateHighMood: 78,
    winRateLowMood: 45,
    performanceGain: 33,
  },
  riskMitigation: {
    crisisAlertsDetected: 8,
    crisisAlertsResolved: 7,
    earlyInterventions: 12,
    athletesAtRisk: 3,
    athletesRecovered: 5,
    preventedEscalations: 7,
  },
  efficiency: {
    estimatedHoursSaved: 42,
    chatSessionsReplacing11: 156,
    automatedAlerts: 24,
    avgResponseTime: '< 5 min',
  },
  periodComparison: {
    currentPeriod: 'Dec 30 - Jan 29',
    previousPeriod: 'Nov 30 - Dec 29',
    engagementChange: 12,
    moodChange: 8,
    performanceChange: 15,
  },
  highlights: [
    {
      title: 'Athlete Engagement',
      value: '87%',
      change: 12,
      changeLabel: 'vs last month',
      positive: true,
    },
    {
      title: 'Mental Health Improvement',
      value: '81%',
      changeLabel: 'athletes improved',
      positive: true,
    },
    {
      title: 'Performance Correlation',
      value: '+33%',
      changeLabel: 'higher win rate with good mood',
      positive: true,
    },
    {
      title: 'Hours Saved',
      value: '42h',
      changeLabel: 'from AI chat sessions',
      positive: true,
    },
    {
      title: 'Early Risk Detection',
      value: '8',
      changeLabel: 'issues caught early',
      positive: true,
    },
  ],
};

/**
 * Fetch ROI metrics from API
 */
export async function getROIMetrics(): Promise<ROIMetrics> {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('No token, using demo ROI metrics');
      return DEMO_ROI_METRICS;
    }

    const response = await fetch(`${config.apiUrl}/api/coach/roi`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ROI fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || DEMO_ROI_METRICS;
  } catch (error) {
    console.log('ROI API error, using demo data:', error);
    return DEMO_ROI_METRICS;
  }
}
