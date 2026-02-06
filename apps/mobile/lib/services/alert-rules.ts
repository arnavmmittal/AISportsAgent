/**
 * Alert Rules API Service
 *
 * Allows coaches to create, manage, and toggle custom alert rules
 * for proactive athlete monitoring.
 */

import { getStoredToken } from '../auth';
import config from '../../config';

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  threshold: number | null;
  thresholdString: string | null;
  comparisonOp: string | null;
  timeWindowDays: number | null;
  minOccurrences: number | null;
  channels: string[];
  isEnabled: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

export interface TriggerType {
  value: string;
  label: string;
  description: string;
  icon: string;
  requiresThreshold?: boolean;
  requiresTimeWindow?: boolean;
  requiresThresholdString?: boolean;
  requiresMinOccurrences?: boolean;
}

export const TRIGGER_TYPES: TriggerType[] = [
  {
    value: 'READINESS_DROP',
    label: 'Low Readiness',
    description: 'Alert when readiness drops below threshold',
    icon: 'trending-down',
    requiresThreshold: true,
  },
  {
    value: 'READINESS_DECLINE',
    label: 'Readiness Trend',
    description: 'Alert when readiness is trending downward',
    icon: 'trending-down',
    requiresTimeWindow: true,
  },
  {
    value: 'INACTIVITY',
    label: 'Check-in Inactivity',
    description: 'Alert when no check-in for X days',
    icon: 'person-remove',
    requiresThreshold: true,
  },
  {
    value: 'CHAT_INACTIVITY',
    label: 'Chat Inactivity',
    description: 'Alert when no chat sessions for X days',
    icon: 'chatbubble',
    requiresThreshold: true,
  },
  {
    value: 'SENTIMENT_DECLINE',
    label: 'Negative Sentiment',
    description: 'Alert when chat sentiment is consistently negative',
    icon: 'warning',
    requiresThreshold: true,
    requiresTimeWindow: true,
  },
  {
    value: 'THEME_MENTION',
    label: 'Topic Mentioned',
    description: 'Alert when specific topic appears in chats',
    icon: 'chatbubble',
    requiresThresholdString: true,
  },
  {
    value: 'MULTIPLE_ATHLETES',
    label: 'Team-wide Condition',
    description: 'Alert when multiple athletes meet a condition',
    icon: 'people',
    requiresThreshold: true,
    requiresMinOccurrences: true,
  },
  {
    value: 'MISSED_CHECKINS',
    label: 'Missed Check-ins',
    description: 'Alert when X check-ins missed in time window',
    icon: 'calendar',
    requiresMinOccurrences: true,
    requiresTimeWindow: true,
  },
];

export const THEME_OPTIONS = [
  'injury-concern',
  'performance-anxiety',
  'academic-stress',
  'team-conflict',
  'coach-pressure',
  'burnout',
  'sleep-issues',
  'recovery',
];

// Demo data for offline/demo mode
const DEMO_ALERT_RULES: AlertRule[] = [
  {
    id: 'demo-rule-1',
    name: 'Low Readiness Alert',
    description: 'Alert when any athlete readiness drops below 50',
    triggerType: 'READINESS_DROP',
    threshold: 50,
    thresholdString: null,
    comparisonOp: 'LT',
    timeWindowDays: null,
    minOccurrences: null,
    channels: ['IN_APP', 'EMAIL'],
    isEnabled: true,
    createdAt: '2025-01-15T10:00:00Z',
    lastTriggeredAt: '2025-01-28T14:30:00Z',
    triggerCount: 3,
  },
  {
    id: 'demo-rule-2',
    name: 'Check-in Inactivity',
    description: 'Alert when athletes miss check-ins for 5+ days',
    triggerType: 'INACTIVITY',
    threshold: 5,
    thresholdString: null,
    comparisonOp: null,
    timeWindowDays: null,
    minOccurrences: null,
    channels: ['IN_APP'],
    isEnabled: true,
    createdAt: '2025-01-16T09:00:00Z',
    lastTriggeredAt: '2025-01-27T08:00:00Z',
    triggerCount: 5,
  },
  {
    id: 'demo-rule-3',
    name: 'Performance Anxiety Detection',
    description: 'Alert when performance anxiety mentioned in chats',
    triggerType: 'THEME_MENTION',
    threshold: null,
    thresholdString: 'performance-anxiety',
    comparisonOp: null,
    timeWindowDays: null,
    minOccurrences: null,
    channels: ['IN_APP'],
    isEnabled: true,
    createdAt: '2025-01-20T11:00:00Z',
    lastTriggeredAt: '2025-01-26T16:45:00Z',
    triggerCount: 7,
  },
  {
    id: 'demo-rule-4',
    name: 'Team-wide Low Readiness',
    description: 'Alert when 3+ athletes have readiness below 60',
    triggerType: 'MULTIPLE_ATHLETES',
    threshold: 60,
    thresholdString: null,
    comparisonOp: 'LT',
    timeWindowDays: null,
    minOccurrences: 3,
    channels: ['IN_APP', 'EMAIL', 'SMS'],
    isEnabled: false,
    createdAt: '2025-01-18T14:00:00Z',
    lastTriggeredAt: null,
    triggerCount: 0,
  },
];

/**
 * Fetch all alert rules
 */
export async function getAlertRules(): Promise<AlertRule[]> {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('No token, using demo alert rules');
      return DEMO_ALERT_RULES;
    }

    const response = await fetch(`${config.apiUrl}/api/coach/alert-rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Alert rules fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data.rules || DEMO_ALERT_RULES;
  } catch (error) {
    console.log('Alert rules API error, using demo data:', error);
    return DEMO_ALERT_RULES;
  }
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(
  rule: Partial<AlertRule>
): Promise<AlertRule | null> {
  try {
    const token = await getStoredToken();
    if (!token) {
      // Create local demo rule
      return {
        id: `demo-rule-${Date.now()}`,
        name: rule.name || '',
        description: rule.description || null,
        triggerType: rule.triggerType || 'READINESS_DROP',
        threshold: rule.threshold || null,
        thresholdString: rule.thresholdString || null,
        comparisonOp: rule.comparisonOp || null,
        timeWindowDays: rule.timeWindowDays || null,
        minOccurrences: rule.minOccurrences || null,
        channels: rule.channels || ['IN_APP'],
        isEnabled: true,
        createdAt: new Date().toISOString(),
        lastTriggeredAt: null,
        triggerCount: 0,
      };
    }

    const response = await fetch(`${config.apiUrl}/api/coach/alert-rules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    });

    if (!response.ok) {
      throw new Error(`Create rule failed: ${response.status}`);
    }

    const data = await response.json();
    return data.rule;
  } catch (error) {
    console.error('Failed to create alert rule:', error);
    return null;
  }
}

/**
 * Update an alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  updates: Partial<AlertRule>
): Promise<AlertRule | null> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return null;
    }

    const response = await fetch(
      `${config.apiUrl}/api/coach/alert-rules/${ruleId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error(`Update rule failed: ${response.status}`);
    }

    const data = await response.json();
    return data.rule;
  } catch (error) {
    console.error('Failed to update alert rule:', error);
    return null;
  }
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string): Promise<boolean> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return true; // Simulate success for demo
    }

    const response = await fetch(
      `${config.apiUrl}/api/coach/alert-rules/${ruleId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to delete alert rule:', error);
    return false;
  }
}

/**
 * Toggle alert rule enabled state
 */
export async function toggleAlertRule(
  ruleId: string,
  isEnabled: boolean
): Promise<boolean> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return true; // Simulate success for demo
    }

    const response = await fetch(
      `${config.apiUrl}/api/coach/alert-rules/${ruleId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to toggle alert rule:', error);
    return false;
  }
}

/**
 * Format trigger type for display
 */
export function formatTriggerLabel(rule: AlertRule): string {
  const trigger = TRIGGER_TYPES.find((t) => t.value === rule.triggerType);
  let details = trigger?.label || rule.triggerType;

  if (rule.threshold !== null) {
    if (rule.triggerType === 'READINESS_DROP') {
      details += ` < ${rule.threshold}`;
    } else if (
      rule.triggerType === 'INACTIVITY' ||
      rule.triggerType === 'CHAT_INACTIVITY'
    ) {
      details += ` (${rule.threshold}+ days)`;
    } else if (rule.triggerType === 'SENTIMENT_DECLINE') {
      details += ` < ${rule.threshold}`;
    }
  }

  if (rule.thresholdString) {
    details += `: "${rule.thresholdString.replace(/-/g, ' ')}"`;
  }

  if (rule.minOccurrences) {
    details += ` (${rule.minOccurrences}+ athletes)`;
  }

  return details;
}

/**
 * Get icon name for trigger type
 */
export function getTriggerIcon(triggerType: string): string {
  const trigger = TRIGGER_TYPES.find((t) => t.value === triggerType);
  return trigger?.icon || 'notifications';
}
