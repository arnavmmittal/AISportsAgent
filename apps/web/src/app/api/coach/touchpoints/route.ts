/**
 * Coach Touchpoints API
 *
 * Quick check-ins and scheduled follow-ups for efficient athlete outreach.
 *
 * GET  /api/coach/touchpoints - Get all touchpoints (pending, scheduled, recent)
 * POST /api/coach/touchpoints - Create a new touchpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { TouchpointType, TouchpointStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for creating a touchpoint
const CreateTouchpointSchema = z.object({
  athleteId: z.string(),
  type: z.enum(['QUICK_CHECKIN', 'SCHEDULED_FOLLOW_UP', 'ENCOURAGEMENT', 'CONCERN_FOLLOW_UP']),
  message: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET - Get all touchpoints for the coach
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TouchpointStatus | null;
    const athleteId = searchParams.get('athleteId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build where clause
    const whereClause: Record<string, unknown> = {
      coachId: user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (athleteId) {
      whereClause.athleteId = athleteId;
    }

    // Get touchpoints
    const touchpoints = await prisma.coachTouchpoint.findMany({
      where: whereClause,
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Get counts by status
    const statusCounts = await prisma.coachTouchpoint.groupBy({
      by: ['status'],
      where: { coachId: user.id },
      _count: true,
    });

    // Get today's touchpoints count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.coachTouchpoint.count({
      where: {
        coachId: user.id,
        scheduledFor: {
          gte: today,
          lt: tomorrow,
        },
        status: 'PENDING',
      },
    });

    // Mark overdue touchpoints
    await prisma.coachTouchpoint.updateMany({
      where: {
        coachId: user.id,
        status: 'PENDING',
        scheduledFor: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    return NextResponse.json({
      touchpoints: touchpoints.map(tp => ({
        id: tp.id,
        athleteId: tp.athleteId,
        athleteName: tp.Athlete?.User?.name || null,
        type: tp.type,
        status: tp.status,
        message: tp.message,
        scheduledFor: tp.scheduledFor,
        completedAt: tp.completedAt,
        notes: tp.notes,
        createdAt: tp.createdAt,
      })),
      stats: {
        pending: statusCounts.find(s => s.status === 'PENDING')?._count || 0,
        completed: statusCounts.find(s => s.status === 'COMPLETED')?._count || 0,
        overdue: statusCounts.find(s => s.status === 'OVERDUE')?._count || 0,
        todayScheduled: todayCount,
      },
    });

  } catch (error) {
    console.error('Error fetching touchpoints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch touchpoints' },
      { status: 500 }
    );
  }
}

// POST - Create a new touchpoint
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateTouchpointSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify coach has access to this athlete
    const relation = await prisma.coachAthleteRelation.findFirst({
      where: {
        coachId: user.id,
        athleteId: data.athleteId,
        consentGranted: true,
      },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Athlete not found or not connected to this coach' },
        { status: 404 }
      );
    }

    // Create the touchpoint
    const touchpoint = await prisma.coachTouchpoint.create({
      data: {
        coachId: user.id,
        athleteId: data.athleteId,
        type: data.type as TouchpointType,
        message: data.message,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        notes: data.notes,
      },
    });

    // If it's a quick check-in or encouragement, also create a coach note
    if (data.type === 'QUICK_CHECKIN' || data.type === 'ENCOURAGEMENT') {
      await prisma.coachNote.create({
        data: {
          coachId: user.id,
          athleteId: data.athleteId,
          content: `[${data.type}] ${data.message || 'Quick touchpoint sent'}`,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      touchpoint: {
        id: touchpoint.id,
        athleteId: touchpoint.athleteId,
        athleteName: relation.Athlete.User.name,
        type: touchpoint.type,
        status: touchpoint.status,
        message: touchpoint.message,
        scheduledFor: touchpoint.scheduledFor,
        createdAt: touchpoint.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating touchpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create touchpoint' },
      { status: 500 }
    );
  }
}

// PATCH - Update touchpoint (mark complete, skip, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { touchpointId, action, notes } = body;

    if (!touchpointId || !action) {
      return NextResponse.json(
        { error: 'touchpointId and action are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingTouchpoint = await prisma.coachTouchpoint.findFirst({
      where: {
        id: touchpointId,
        coachId: user.id,
      },
    });

    if (!existingTouchpoint) {
      return NextResponse.json(
        { error: 'Touchpoint not found' },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'complete':
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: notes || existingTouchpoint.notes,
        };
        break;
      case 'skip':
        updateData = {
          status: 'SKIPPED',
          notes: notes || existingTouchpoint.notes,
        };
        break;
      case 'reschedule':
        if (!body.scheduledFor) {
          return NextResponse.json(
            { error: 'scheduledFor is required for reschedule' },
            { status: 400 }
          );
        }
        updateData = {
          scheduledFor: new Date(body.scheduledFor),
          status: 'PENDING',
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const touchpoint = await prisma.coachTouchpoint.update({
      where: { id: touchpointId },
      data: updateData,
    });

    return NextResponse.json({ success: true, touchpoint });

  } catch (error) {
    console.error('Error updating touchpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update touchpoint' },
      { status: 500 }
    );
  }
}
