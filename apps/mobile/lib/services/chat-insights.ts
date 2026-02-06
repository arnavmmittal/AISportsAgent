/**
 * Chat Insights API Service
 *
 * Aggregates conversation analysis for coaches to understand
 * team-wide psychological patterns without reading individual chats.
 */

import { getStoredToken } from '../auth';
import config from '../../config';

export interface ChatInsightsData {
  teamSentiment: {
    current: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
  topThemes: {
    theme: string;
    count: number;
    athletes: string[];
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentHistory: {
    date: string;
    avgSentiment: number;
    sessionCount: number;
  }[];
  disengagedAthletes: {
    id: string;
    name: string;
    sport: string | null;
    daysSinceChat: number;
    lastChatDate: string | null;
  }[];
  concerningAthletes: {
    id: string;
    name: string;
    sport: string | null;
    concerningTopics: string[];
    avgSentiment: number;
    recentSessions: number;
  }[];
  stats: {
    totalSessions: number;
    athletesWithChats: number;
    avgSessionsPerAthlete: number;
    chatEngagementRate: number;
  };
  generatedAt?: string;
}

// Demo data for offline/demo mode
const DEMO_CHAT_INSIGHTS: ChatInsightsData = {
  teamSentiment: {
    current: 0.28,
    trend: 'improving',
    weeklyChange: 0.12,
  },
  topThemes: [
    {
      theme: 'performance-anxiety',
      count: 24,
      athletes: ['Jordan M.', 'Taylor S.', 'Casey R.', 'Riley P.'],
      trend: 'increasing',
    },
    {
      theme: 'confidence-building',
      count: 18,
      athletes: ['Jordan M.', 'Alex B.', 'Sam T.'],
      trend: 'stable',
    },
    {
      theme: 'pre-game-nerves',
      count: 15,
      athletes: ['Morgan L.', 'Casey R.', 'Drew K.'],
      trend: 'increasing',
    },
    {
      theme: 'team-dynamics',
      count: 12,
      athletes: ['Taylor S.', 'Sam T.'],
      trend: 'stable',
    },
    {
      theme: 'recovery-mindset',
      count: 10,
      athletes: ['Jordan M.', 'Riley P.', 'Alex B.'],
      trend: 'decreasing',
    },
    {
      theme: 'academic-balance',
      count: 8,
      athletes: ['Morgan L.', 'Drew K.'],
      trend: 'stable',
    },
  ],
  sentimentHistory: [
    { date: '2025-01-15', avgSentiment: 0.15, sessionCount: 8 },
    { date: '2025-01-16', avgSentiment: 0.18, sessionCount: 12 },
    { date: '2025-01-17', avgSentiment: 0.12, sessionCount: 6 },
    { date: '2025-01-18', avgSentiment: 0.22, sessionCount: 10 },
    { date: '2025-01-19', avgSentiment: 0.25, sessionCount: 14 },
    { date: '2025-01-20', avgSentiment: 0.2, sessionCount: 9 },
    { date: '2025-01-21', avgSentiment: 0.28, sessionCount: 11 },
    { date: '2025-01-22', avgSentiment: 0.3, sessionCount: 13 },
    { date: '2025-01-23', avgSentiment: 0.24, sessionCount: 7 },
    { date: '2025-01-24', avgSentiment: 0.32, sessionCount: 15 },
    { date: '2025-01-25', avgSentiment: 0.28, sessionCount: 12 },
    { date: '2025-01-26', avgSentiment: 0.35, sessionCount: 16 },
    { date: '2025-01-27', avgSentiment: 0.3, sessionCount: 11 },
    { date: '2025-01-28', avgSentiment: 0.28, sessionCount: 14 },
  ],
  disengagedAthletes: [
    {
      id: 'demo-1',
      name: 'Quinn Johnson',
      sport: 'Soccer',
      daysSinceChat: 14,
      lastChatDate: '2025-01-15T10:30:00Z',
    },
    {
      id: 'demo-2',
      name: 'Avery Williams',
      sport: 'Basketball',
      daysSinceChat: 10,
      lastChatDate: '2025-01-19T14:00:00Z',
    },
    {
      id: 'demo-3',
      name: 'Cameron Brown',
      sport: 'Tennis',
      daysSinceChat: 8,
      lastChatDate: '2025-01-21T09:15:00Z',
    },
  ],
  concerningAthletes: [
    {
      id: 'demo-4',
      name: 'Jordan Mitchell',
      sport: 'Swimming',
      concerningTopics: ['performance-anxiety', 'fear of failure'],
      avgSentiment: -0.25,
      recentSessions: 5,
    },
    {
      id: 'demo-5',
      name: 'Taylor Singh',
      sport: 'Track & Field',
      concerningTopics: ['team-conflict', 'coach-pressure'],
      avgSentiment: -0.18,
      recentSessions: 3,
    },
  ],
  stats: {
    totalSessions: 156,
    athletesWithChats: 38,
    avgSessionsPerAthlete: 4.1,
    chatEngagementRate: 79,
  },
};

/**
 * Fetch chat insights from API
 */
export async function getChatInsights(): Promise<ChatInsightsData> {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('No token, using demo chat insights');
      return DEMO_CHAT_INSIGHTS;
    }

    const response = await fetch(`${config.apiUrl}/api/coach/chat-insights`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chat insights fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data || DEMO_CHAT_INSIGHTS;
  } catch (error) {
    console.log('Chat insights API error, using demo data:', error);
    return DEMO_CHAT_INSIGHTS;
  }
}

/**
 * Format theme name for display
 */
export function formatThemeName(theme: string): string {
  return theme
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get sentiment display color
 */
export function getSentimentColor(sentiment: number): string {
  if (sentiment >= 0.3) return '#22c55e';
  if (sentiment >= 0) return '#3b82f6';
  if (sentiment >= -0.3) return '#f59e0b';
  return '#ef4444';
}

/**
 * Get sentiment label
 */
export function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 0.3) return 'Positive';
  if (sentiment >= 0) return 'Neutral-Positive';
  if (sentiment >= -0.3) return 'Neutral-Negative';
  return 'Negative';
}
