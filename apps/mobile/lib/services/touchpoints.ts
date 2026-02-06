/**
 * Touchpoints API Service
 *
 * Enables coaches to send quick check-ins, encouragement,
 * and schedule follow-ups with athletes.
 */

import { getStoredToken } from '../auth';
import config from '../../config';

export interface Touchpoint {
  id: string;
  athleteId: string;
  athleteName: string | null;
  type: 'QUICK_CHECKIN' | 'SCHEDULED_FOLLOW_UP' | 'ENCOURAGEMENT' | 'CONCERN_FOLLOW_UP';
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';
  message: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TouchpointStats {
  pending: number;
  completed: number;
  overdue: number;
  todayScheduled: number;
}

export interface QuickMessage {
  label: string;
  message: string;
  type: Touchpoint['type'];
  icon: string;
}

export const QUICK_MESSAGES: QuickMessage[] = [
  {
    label: 'Quick Check-in',
    message: "Hey, just checking in! How are you feeling today?",
    type: 'QUICK_CHECKIN',
    icon: 'chatbubble',
  },
  {
    label: 'Encouragement',
    message: "Keep up the great work! Your effort is showing.",
    type: 'ENCOURAGEMENT',
    icon: 'heart',
  },
  {
    label: 'Concern Follow-up',
    message: "I noticed you might be going through something. I'm here if you want to talk.",
    type: 'CONCERN_FOLLOW_UP',
    icon: 'warning',
  },
];

// Demo data
const DEMO_TOUCHPOINTS: Touchpoint[] = [
  {
    id: 'tp-1',
    athleteId: 'demo-1',
    athleteName: 'James Garcia',
    type: 'SCHEDULED_FOLLOW_UP',
    status: 'PENDING',
    message: 'Follow up on performance anxiety discussion',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tp-2',
    athleteId: 'demo-2',
    athleteName: 'Sarah Johnson',
    type: 'CONCERN_FOLLOW_UP',
    status: 'OVERDUE',
    message: 'Check in after low readiness score',
    scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tp-3',
    athleteId: 'demo-3',
    athleteName: 'Mike Chen',
    type: 'QUICK_CHECKIN',
    status: 'PENDING',
    message: 'Weekly check-in',
    scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_STATS: TouchpointStats = {
  pending: 3,
  completed: 12,
  overdue: 1,
  todayScheduled: 2,
};

/**
 * Fetch touchpoints
 */
export async function getTouchpoints(
  athleteId?: string
): Promise<{ touchpoints: Touchpoint[]; stats: TouchpointStats }> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { touchpoints: DEMO_TOUCHPOINTS, stats: DEMO_STATS };
    }

    const url = athleteId
      ? `${config.apiUrl}/api/coach/touchpoints?athleteId=${athleteId}`
      : `${config.apiUrl}/api/coach/touchpoints?status=PENDING`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Touchpoints fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      touchpoints: data.touchpoints || DEMO_TOUCHPOINTS,
      stats: data.stats || DEMO_STATS,
    };
  } catch (error) {
    console.log('Touchpoints API error, using demo data:', error);
    return { touchpoints: DEMO_TOUCHPOINTS, stats: DEMO_STATS };
  }
}

/**
 * Send a touchpoint to an athlete
 */
export async function sendTouchpoint(
  athleteId: string,
  type: Touchpoint['type'],
  message: string,
  scheduledFor?: string
): Promise<Touchpoint | null> {
  try {
    const token = await getStoredToken();
    if (!token) {
      // Return demo touchpoint
      return {
        id: `tp-demo-${Date.now()}`,
        athleteId,
        athleteName: 'Demo Athlete',
        type,
        status: 'PENDING',
        message,
        scheduledFor: scheduledFor || null,
        completedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      };
    }

    const response = await fetch(`${config.apiUrl}/api/coach/touchpoints`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        athleteId,
        type,
        message,
        scheduledFor,
      }),
    });

    if (!response.ok) {
      throw new Error(`Send touchpoint failed: ${response.status}`);
    }

    const data = await response.json();
    return data.touchpoint;
  } catch (error) {
    console.error('Failed to send touchpoint:', error);
    return null;
  }
}

/**
 * Complete a touchpoint
 */
export async function completeTouchpoint(touchpointId: string): Promise<boolean> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return true; // Demo mode
    }

    const response = await fetch(`${config.apiUrl}/api/coach/touchpoints`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        touchpointId,
        action: 'complete',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to complete touchpoint:', error);
    return false;
  }
}

/**
 * Skip a touchpoint
 */
export async function skipTouchpoint(touchpointId: string): Promise<boolean> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return true; // Demo mode
    }

    const response = await fetch(`${config.apiUrl}/api/coach/touchpoints`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        touchpointId,
        action: 'skip',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to skip touchpoint:', error);
    return false;
  }
}

/**
 * Format scheduled time as relative
 */
export function formatScheduledTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) return 'Overdue';
  if (diffHours < 1) return 'Soon';
  if (diffHours < 24) return `In ${diffHours}h`;
  return `In ${diffDays}d`;
}

/**
 * Get icon name for touchpoint type
 */
export function getTouchpointIcon(type: Touchpoint['type']): string {
  switch (type) {
    case 'QUICK_CHECKIN':
      return 'chatbubble';
    case 'ENCOURAGEMENT':
      return 'heart';
    case 'CONCERN_FOLLOW_UP':
      return 'warning';
    case 'SCHEDULED_FOLLOW_UP':
      return 'calendar';
    default:
      return 'chatbubble';
  }
}
