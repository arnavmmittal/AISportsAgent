/**
 * Push Notification Send API
 *
 * POST - Send push notifications to users
 *
 * Supports sending to:
 * - Specific user IDs
 * - All users with a specific role
 * - All users at a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  sendPushToUser,
  sendPushToUsers,
  sendPushToRole,
  sendPushToSchool,
  NotificationChannel,
  NotificationPriority,
} from '@/lib/push-notifications';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for send notification request
const sendNotificationSchema = z.object({
  // Target (one of these must be provided)
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  role: z.enum(['ATHLETE', 'COACH', 'ADMIN']).optional(),
  schoolId: z.string().optional(),
  athleteIds: z.array(z.string()).optional(), // For coach sending to specific athletes

  // Notification content
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),

  // Optional metadata
  data: z.record(z.unknown()).optional(),
  channel: z.enum(['default', 'crisis', 'assignments', 'goals']).optional(),
  priority: z.enum(['default', 'high']).optional(),
});

/**
 * POST /api/notifications/send
 * Send push notification to users
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to send notifications
    // Only coaches and admins can send to others
    const isCoachOrAdmin = user.role === 'COACH' || user.role === 'ADMIN';

    const body = await request.json();

    // Validate input
    const validationResult = sendNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      userId,
      userIds,
      role,
      schoolId,
      athleteIds,
      title,
      body: notificationBody,
      data,
      channel,
      priority,
    } = validationResult.data;

    // Build notification options
    const options = {
      title,
      body: notificationBody,
      data: data ? { ...data, type: data.type || 'custom' } : { type: 'custom' },
      channel: channel ? (channel as NotificationChannel) : NotificationChannel.DEFAULT,
      priority: priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.DEFAULT,
    };

    let result;
    let targetDescription: string;

    // Determine target and validate permissions
    if (userId) {
      // Sending to single user
      if (!isCoachOrAdmin && userId !== user.id) {
        return NextResponse.json(
          { error: 'Athletes can only send notifications to themselves' },
          { status: 403 }
        );
      }
      result = await sendPushToUser(userId, options);
      targetDescription = `user ${userId}`;

    } else if (userIds) {
      // Sending to multiple users
      if (!isCoachOrAdmin) {
        return NextResponse.json(
          { error: 'Only coaches and admins can send to multiple users' },
          { status: 403 }
        );
      }
      result = await sendPushToUsers(userIds, options);
      targetDescription = `${userIds.length} users`;

    } else if (athleteIds) {
      // Sending to specific athletes (coach feature)
      if (!isCoachOrAdmin) {
        return NextResponse.json(
          { error: 'Only coaches and admins can send to athletes' },
          { status: 403 }
        );
      }

      // Verify these athletes exist and get their user IDs
      const athletes = await prisma.athlete.findMany({
        where: { userId: { in: athleteIds } },
        select: { userId: true },
      });

      if (athletes.length === 0) {
        return NextResponse.json(
          { error: 'No valid athletes found' },
          { status: 404 }
        );
      }

      result = await sendPushToUsers(athletes.map(a => a.userId), options);
      targetDescription = `${athletes.length} athletes`;

    } else if (role) {
      // Sending to all users with a role (admin only)
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can send role-wide notifications' },
          { status: 403 }
        );
      }
      result = await sendPushToRole(role, options);
      targetDescription = `all ${role.toLowerCase()}s`;

    } else if (schoolId) {
      // Sending to all users at a school (admin only)
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can send school-wide notifications' },
          { status: 403 }
        );
      }
      result = await sendPushToSchool(schoolId, options);
      targetDescription = `school ${schoolId}`;

    } else {
      return NextResponse.json(
        { error: 'Must specify target: userId, userIds, athleteIds, role, or schoolId' },
        { status: 400 }
      );
    }

    // Log notification send
    console.log(`[Notifications] ${user.email} sent notification to ${targetDescription}: ${result.successful}/${result.successful + result.failed} delivered`);

    // Return result
    return NextResponse.json({
      success: result.successful > 0,
      sent: result.successful,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });

  } catch (error) {
    console.error('[Notifications] Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
