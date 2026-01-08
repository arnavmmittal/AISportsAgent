import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const { id: goalId } = await params;
    const body = await req.json();
    const { progress, status, title, description, targetDate } = body;

    // Get the goal to verify ownership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Verify user can update this goal
    if (user!.id !== goal.athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot update other users\' goals' },
        { status: 403 }
      );
    }

    // Update goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(progress !== undefined && { progress }),
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      },
    });

    return NextResponse.json({ success: true, data: updatedGoal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const { id: goalId } = await params;

    // Get the goal to verify ownership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Verify user can delete this goal
    if (user!.id !== goal.athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot delete other users\' goals' },
        { status: 403 }
      );
    }

    // Delete goal
    await prisma.goal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
