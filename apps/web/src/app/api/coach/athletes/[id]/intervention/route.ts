/**

 * Coach Intervention API
 * Allows coaches to flag athletes, update relationship notes, and send check-ins
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH - Update relationship notes or flag status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can update
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    const { id: athleteId } = await params;
    const body = await req.json();
    const { notes } = body;

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Verify coach-athlete relationship exists
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: athleteId,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Athlete not found or not connected to this coach' },
        { status: 404 }
      );
    }

    // Update relationship notes
    const updated = await prisma.coachAthleteRelation.update({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: athleteId,
        },
      },
      data: {
        notes: notes || relation.notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Athlete information updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating athlete intervention:', error);
    return NextResponse.json(
      { error: 'Failed to update athlete information' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send check-in message to athlete
 * In production, this would integrate with email/SMS services
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can send check-ins
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    const { id: athleteId } = await params;
    const body = await req.json();
    const { message, type } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Verify coach-athlete relationship exists
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: athleteId,
        },
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
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Athlete not found or not connected to this coach' },
        { status: 404 }
      );
    }

    // Create a coach note to track the check-in
    const note = await prisma.coachNote.create({
      data: {
        coachId: coach.userId,
        athleteId: athleteId,
        content: `[${type || 'CHECK_IN'}] ${message.trim()}`,
        updatedAt: new Date(),
      },
    });

    // TODO: In production, integrate with email/SMS service to actually send the message
    // For now, we just log it
    console.log(`Check-in sent from ${coach.User.name} to ${relation.Athlete.User.name}:`, message);

    return NextResponse.json({
      success: true,
      message: 'Check-in sent successfully',
      data: {
        noteId: note.id,
        athleteName: relation.Athlete.User.name,
        coachName: coach.User.name,
        // In production, would return email/SMS delivery status
        deliveryStatus: 'logged',
      },
    });
  } catch (error) {
    console.error('Error sending check-in:', error);
    return NextResponse.json(
      { error: 'Failed to send check-in' },
      { status: 500 }
    );
  }
}
