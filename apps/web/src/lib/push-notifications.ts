/**
 * Push Notification Service
 *
 * Sends push notifications to mobile devices via Expo Push API.
 * Supports targeting specific users, roles, or broadcast to all users.
 */

import { prisma } from '@/lib/prisma';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Notification channels (must match mobile app channel IDs)
export enum NotificationChannel {
  DEFAULT = 'default',
  CRISIS = 'crisis',
  ASSIGNMENTS = 'assignments',
  GOALS = 'goals',
}

// Notification priority
export enum NotificationPriority {
  DEFAULT = 'default',
  HIGH = 'high',
}

export interface PushNotificationData {
  type: string;
  [key: string]: unknown;
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  data?: PushNotificationData;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  badge?: number;
  sound?: string | null;
  ttl?: number; // Time to live in seconds
}

export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

export interface SendResult {
  successful: number;
  failed: number;
  tickets: PushTicket[];
  errors: string[];
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  options: PushNotificationOptions
): Promise<SendResult> {
  // Get user's push tokens
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) {
    return {
      successful: 0,
      failed: 0,
      tickets: [],
      errors: ['User has no registered push tokens'],
    };
  }

  return sendPushToTokens(
    tokens.map(t => t.token),
    options
  );
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  options: PushNotificationOptions
): Promise<SendResult> {
  // Get all push tokens for these users
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });

  if (tokens.length === 0) {
    return {
      successful: 0,
      failed: 0,
      tickets: [],
      errors: ['No users have registered push tokens'],
    };
  }

  return sendPushToTokens(
    tokens.map(t => t.token),
    options
  );
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendPushToRole(
  role: 'ATHLETE' | 'COACH' | 'ADMIN',
  options: PushNotificationOptions
): Promise<SendResult> {
  // Get all users with this role
  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });

  if (users.length === 0) {
    return {
      successful: 0,
      failed: 0,
      tickets: [],
      errors: [`No users with role ${role}`],
    };
  }

  return sendPushToUsers(
    users.map(u => u.id),
    options
  );
}

/**
 * Send push notification to all users at a school
 */
export async function sendPushToSchool(
  schoolId: string,
  options: PushNotificationOptions
): Promise<SendResult> {
  // Get all users at this school
  const users = await prisma.user.findMany({
    where: { schoolId },
    select: { id: true },
  });

  if (users.length === 0) {
    return {
      successful: 0,
      failed: 0,
      tickets: [],
      errors: [`No users at school ${schoolId}`],
    };
  }

  return sendPushToUsers(
    users.map(u => u.id),
    options
  );
}

/**
 * Send push notification to specific Expo push tokens
 */
export async function sendPushToTokens(
  tokens: string[],
  options: PushNotificationOptions
): Promise<SendResult> {
  const {
    title,
    body,
    data,
    channel = NotificationChannel.DEFAULT,
    priority = NotificationPriority.DEFAULT,
    badge,
    sound = 'default',
    ttl = 60 * 60, // 1 hour default
  } = options;

  // Filter to only Expo push tokens (they start with ExponentPushToken)
  const validTokens = tokens.filter(token =>
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );

  if (validTokens.length === 0) {
    return {
      successful: 0,
      failed: tokens.length,
      tickets: [],
      errors: ['No valid Expo push tokens found'],
    };
  }

  // Prepare messages (Expo API supports batching)
  const messages = validTokens.map(token => ({
    to: token,
    title,
    body,
    data,
    channelId: channel,
    priority,
    badge,
    sound,
    ttl,
  }));

  // Development mode: log instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.EXPO_ACCESS_TOKEN) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 PUSH NOTIFICATION (Development Mode - Not Sent)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Channel: ${channel}`);
    console.log(`Recipients: ${validTokens.length} devices`);
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      successful: validTokens.length,
      failed: 0,
      tickets: validTokens.map(() => ({ status: 'ok' as const, id: `dev-${Date.now()}` })),
      errors: [],
    };
  }

  try {
    // Send in batches of 100 (Expo limit)
    const BATCH_SIZE = 100;
    const allTickets: PushTicket[] = [];
    const errors: string[] = [];

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN && {
            'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          }),
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Push Notifications] Expo API error: ${response.status} - ${errorText}`);
        errors.push(`Expo API error: ${response.status}`);
        continue;
      }

      const result = await response.json();

      if (result.data) {
        allTickets.push(...result.data);
      }
    }

    // Count successes and failures
    const successful = allTickets.filter(t => t.status === 'ok').length;
    const failed = allTickets.filter(t => t.status === 'error').length + errors.length;

    // Log errors for investigation
    const ticketErrors = allTickets
      .filter(t => t.status === 'error')
      .map(t => t.message || t.details?.error || 'Unknown error');

    console.log(`[Push Notifications] Sent ${successful}/${validTokens.length} successfully`);

    return {
      successful,
      failed,
      tickets: allTickets,
      errors: [...errors, ...ticketErrors],
    };

  } catch (error) {
    console.error('[Push Notifications] Send error:', error);
    return {
      successful: 0,
      failed: validTokens.length,
      tickets: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// Convenience functions for common notification types
// ============================================================================

/**
 * Send crisis alert to coaches (high priority)
 */
export async function sendCrisisAlertToCoaches(
  athleteName: string,
  severity: string,
  alertId: string
): Promise<SendResult> {
  return sendPushToRole('COACH', {
    title: '🚨 Crisis Alert - Immediate Attention Required',
    body: `${athleteName} may need support (${severity.toLowerCase()} severity)`,
    data: {
      type: 'crisis_alert',
      alertId,
      severity,
    },
    channel: NotificationChannel.CRISIS,
    priority: NotificationPriority.HIGH,
    sound: 'default',
  });
}

/**
 * Send assignment reminder to athlete
 */
export async function sendAssignmentReminder(
  userId: string,
  assignmentTitle: string,
  assignmentId: string,
  dueIn: string // e.g., "1 day", "3 hours"
): Promise<SendResult> {
  return sendPushToUser(userId, {
    title: '📝 Assignment Due Soon',
    body: `"${assignmentTitle}" is due in ${dueIn}`,
    data: {
      type: 'assignment_reminder',
      assignmentId,
    },
    channel: NotificationChannel.ASSIGNMENTS,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Send goal milestone achievement notification
 */
export async function sendGoalMilestone(
  userId: string,
  goalTitle: string,
  goalId: string,
  progress: number
): Promise<SendResult> {
  const milestoneText = progress >= 100 ? 'completed' : `${progress}% complete`;

  return sendPushToUser(userId, {
    title: '🎯 Goal Milestone!',
    body: `${goalTitle} is now ${milestoneText}`,
    data: {
      type: 'goal_milestone',
      goalId,
      progress,
    },
    channel: NotificationChannel.GOALS,
    priority: NotificationPriority.DEFAULT,
  });
}

/**
 * Send pre-game reminder notification
 */
export async function sendPreGameReminder(
  userId: string,
  opponent: string,
  gameTime: Date
): Promise<SendResult> {
  const timeStr = gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return sendPushToUser(userId, {
    title: '🏆 Game Day!',
    body: `Your game against ${opponent} starts at ${timeStr}. Stay focused!`,
    data: {
      type: 'pregame_reminder',
      opponent,
      gameTime: gameTime.toISOString(),
    },
    channel: NotificationChannel.DEFAULT,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Send check-in reminder to athlete
 */
export async function sendCheckInReminder(userId: string): Promise<SendResult> {
  return sendPushToUser(userId, {
    title: '💬 Time for a Check-in',
    body: 'How are you feeling today? Take a moment to log your mood.',
    data: {
      type: 'checkin_reminder',
    },
    channel: NotificationChannel.DEFAULT,
    priority: NotificationPriority.DEFAULT,
  });
}

/**
 * Send new message notification
 */
export async function sendNewMessageNotification(
  userId: string,
  senderName: string,
  preview: string
): Promise<SendResult> {
  return sendPushToUser(userId, {
    title: `💬 ${senderName}`,
    body: preview.length > 100 ? `${preview.slice(0, 97)}...` : preview,
    data: {
      type: 'new_message',
    },
    channel: NotificationChannel.DEFAULT,
    priority: NotificationPriority.HIGH,
  });
}
