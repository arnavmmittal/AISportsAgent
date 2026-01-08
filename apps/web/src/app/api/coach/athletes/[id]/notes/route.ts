/**

 * Coach Notes API
 * Allows coaches to add private notes about athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can add notes
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    const { id: athleteId } = await params;
    const body = await req.json();
    const { content, category } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

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

    // Create coach note
    const note = await prisma.coachNote.create({
      data: {
        coachId: coach.userId,
        athleteId: athleteId,
        content: content.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Note added successfully',
      data: note,
    });
  } catch (error) {
    console.error('Error adding coach note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can delete notes
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    await params; // Await params even though not used for consistency

    const body = await req.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

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

    // Verify note belongs to this coach
    const note = await prisma.coachNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.coachId !== coach.userId) {
      return NextResponse.json(
        { error: 'Note not found or does not belong to this coach' },
        { status: 404 }
      );
    }

    // Delete note
    await prisma.coachNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coach note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
