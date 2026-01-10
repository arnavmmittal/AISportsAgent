/**
 * Coach Alerts API
 * Returns crisis alerts for coach's athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get coach's athletes
    const coachAthletes = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId: user.id,
        consentGranted: true,
      },
      select: {
        athleteId: true,
      },
    });

    const athleteIds = coachAthletes.map((relation) => relation.athleteId);

    // Get crisis alerts
    const alerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Message: {
          select: {
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        detectedAt: 'desc',
      },
    });

    // Transform alerts for response
    const transformedAlerts = alerts.map((alert) => ({
      id: alert.id,
      athleteId: alert.athleteId,
      athleteName: alert.Athlete.User.name,
      sport: alert.Athlete.sport,
      severity: alert.severity,
      message: alert.Message.content,
      detectedAt: alert.detectedAt.toISOString(),
      reviewed: alert.reviewed,
      reviewedBy: alert.reviewedBy,
      reviewedAt: alert.reviewedAt?.toISOString() || null,
      escalated: alert.escalated,
      escalatedTo: alert.escalatedTo,
      notes: alert.notes,
    }));

    // Calculate stats
    const criticalCount = transformedAlerts.filter(
      (alert) => alert.severity === 'CRITICAL' && !alert.reviewed
    ).length;
    const highCount = transformedAlerts.filter(
      (alert) => alert.severity === 'HIGH' && !alert.reviewed
    ).length;
    const mediumCount = transformedAlerts.filter(
      (alert) => alert.severity === 'MEDIUM' && !alert.reviewed
    ).length;

    return NextResponse.json({
      alerts: transformedAlerts,
      stats: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        total: transformedAlerts.length,
      },
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
