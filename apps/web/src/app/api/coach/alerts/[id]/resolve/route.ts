/**
 * Coach Alert Resolve API
 * Marks an alert as reviewed/resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    const alertId = params.id;
    const body = await request.json();
    const { notes, escalate, escalatedTo } = body;

    // Verify alert exists and belongs to coach's athlete
    const alert = await prisma.crisisAlert.findUnique({
      where: { id: alertId },
      include: {
        Athlete: true,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Verify coach has access to this athlete
    const coachAthleteRelation = await prisma.coachAthleteRelation.findFirst({
      where: {
        coachId: user.id,
        athleteId: alert.athleteId,
        consentGranted: true,
      },
    });

    if (!coachAthleteRelation) {
      return NextResponse.json({ error: 'Forbidden - No access to this athlete' }, { status: 403 });
    }

    // Update alert
    const updatedAlert = await prisma.crisisAlert.update({
      where: { id: alertId },
      data: {
        reviewed: true,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        notes: notes || null,
        escalated: escalate || false,
        escalatedTo: escalatedTo || null,
      },
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: updatedAlert.id,
        reviewed: updatedAlert.reviewed,
        reviewedBy: updatedAlert.reviewedBy,
        reviewedAt: updatedAlert.reviewedAt?.toISOString(),
        notes: updatedAlert.notes,
        escalated: updatedAlert.escalated,
        escalatedTo: updatedAlert.escalatedTo,
      },
    });
  } catch (error) {
    console.error('Alert resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
