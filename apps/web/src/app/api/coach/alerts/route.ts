/**
 * Generated Alerts API
 *
 * GET  /api/coach/alerts - Get all alerts for the coach
 * POST /api/coach/alerts/evaluate - Trigger rule evaluation (manual or cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import {
  evaluateRulesForCoach,
  getUnreadAlertsForCoach,
} from '@/lib/alerts/rule-evaluator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get all alerts for the coach
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = {
      coachId: user.id,
      isDismissed: false,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const alerts = await prisma.generatedAlert.findMany({
      where: whereClause,
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.generatedAlert.count({
      where: {
        coachId: user.id,
        isRead: false,
        isDismissed: false,
      },
    });

    return NextResponse.json({
      alerts: alerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        isRead: alert.isRead,
        createdAt: alert.createdAt,
        athleteId: alert.athleteId,
        athleteName: alert.Athlete?.User?.name || null,
        metadata: alert.metadata,
      })),
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST - Mark alerts as read or trigger evaluation
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alertId, alertIds } = body;

    switch (action) {
      case 'evaluate':
        // Trigger rule evaluation
        await evaluateRulesForCoach(user.id);
        const newAlerts = await getUnreadAlertsForCoach(user.id);
        return NextResponse.json({
          message: 'Rules evaluated',
          newAlerts: newAlerts.length,
        });

      case 'markRead':
        if (alertId) {
          await prisma.generatedAlert.updateMany({
            where: { id: alertId, coachId: user.id },
            data: { isRead: true, readAt: new Date() },
          });
        } else if (alertIds && Array.isArray(alertIds)) {
          await prisma.generatedAlert.updateMany({
            where: { id: { in: alertIds }, coachId: user.id },
            data: { isRead: true, readAt: new Date() },
          });
        }
        return NextResponse.json({ success: true });

      case 'markAllRead':
        await prisma.generatedAlert.updateMany({
          where: { coachId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        return NextResponse.json({ success: true });

      case 'dismiss':
        if (alertId) {
          await prisma.generatedAlert.updateMany({
            where: { id: alertId, coachId: user.id },
            data: { isDismissed: true },
          });
        }
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing alert action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
