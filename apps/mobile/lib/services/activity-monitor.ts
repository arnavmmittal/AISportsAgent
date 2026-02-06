/**
 * Activity Monitor API Service
 *
 * Real-time view of athlete chat activity.
 * Privacy-preserving: shows activity status, not content.
 */

import { getStoredToken } from '../auth';
import config from '../../config';

export interface AthleteActivity {
  athleteId: string;
  athleteName: string;
  status: 'active' | 'inactive' | 'offline';
  sessionId?: string;
  lastHeartbeat?: string;
  chatDuration?: number;
}

export interface ActivitySummary {
  totalAthletes: number;
  activeNow: number;
  recentlyActive: number;
}

// Demo data
const DEMO_ACTIVITIES: AthleteActivity[] = [
  {
    athleteId: 'demo-1',
    athleteName: 'Jordan Martinez',
    status: 'active',
    sessionId: 'session-1',
    chatDuration: 12,
  },
  {
    athleteId: 'demo-2',
    athleteName: 'Alex Chen',
    status: 'active',
    sessionId: 'session-2',
    chatDuration: 3,
  },
  {
    athleteId: 'demo-3',
    athleteName: 'Taylor Williams',
    status: 'inactive',
    lastHeartbeat: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    athleteId: 'demo-4',
    athleteName: 'Casey Johnson',
    status: 'inactive',
    lastHeartbeat: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

const DEMO_SUMMARY: ActivitySummary = {
  totalAthletes: 24,
  activeNow: 2,
  recentlyActive: 2,
};

/**
 * Fetch athlete activity
 */
export async function getAthleteActivity(): Promise<{
  activities: AthleteActivity[];
  summary: ActivitySummary;
}> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { activities: DEMO_ACTIVITIES, summary: DEMO_SUMMARY };
    }

    const response = await fetch(`${config.apiUrl}/api/athlete/activity`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Activity fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      activities: data.activities || DEMO_ACTIVITIES,
      summary: data.summary || DEMO_SUMMARY,
    };
  } catch (error) {
    console.log('Activity API error, using demo data:', error);
    return { activities: DEMO_ACTIVITIES, summary: DEMO_SUMMARY };
  }
}

/**
 * Format duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Format time ago
 */
export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return '-';
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
