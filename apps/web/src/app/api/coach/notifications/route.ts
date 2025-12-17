/**
 * Coach Notifications API
 * Returns real-time notifications for coaches (crisis alerts, athlete requests, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user || user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get coach's athletes (only those who granted consent)
    const coachRelations = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId: user.id,
        consentGranted: true,
      },
      select: { athleteId: true },
    });

    const athleteIds = coachRelations.map((r) => r.athleteId);

    // Get crisis alerts for coach's athletes
    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        resolved: unreadOnly ? false : undefined,
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: limit,
    });

    // Transform to notification format
    const notifications = crisisAlerts.map((alert) => ({
      id: alert.id,
      type: 'CRISIS_ALERT',
      severity: alert.severity,
      title: `Crisis Alert: ${alert.Athlete.User.name}`,
      message: alert.message,
      athleteId: alert.athleteId,
      athleteName: alert.Athlete.User.name,
      createdAt: alert.detectedAt,
      read: alert.resolved,
      actionRequired: !alert.resolved && alert.severity === 'CRITICAL',
    }));

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('[Coach Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * Mark notification as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuthFromRequest(req);
    if (!user || user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    // Update crisis alert as resolved
    const updated = await prisma.crisisAlert.update({
      where: { id: notificationId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error('[Coach Notifications API] Error marking as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
