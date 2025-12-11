import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  targetAthleteIds: z.array(z.string()).optional().nullable(),
  targetSport: z.string().optional().nullable(),
});

// GET /api/assignments/[id] - Get single assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        submissions: {
          select: {
            id: true,
            athleteId: true,
            response: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Authorization check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { athlete: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Coaches can see assignments they created
    if (user.role === 'COACH' && assignment.coachId === user.id) {
      return NextResponse.json({ assignment });
    }

    // Athletes can see assignments targeted to them
    if (user.role === 'ATHLETE' && user.athlete) {
      const isTargeted =
        assignment.targetAthleteIds === null || // All athletes
        (Array.isArray(assignment.targetAthleteIds) &&
          assignment.targetAthleteIds.includes(user.id));

      const isSportMatch =
        assignment.targetSport === null ||
        assignment.targetSport === user.athlete.sport;

      if (isTargeted && isSportMatch) {
        // Only return athlete's own submission
        const athleteSubmission = assignment.submissions.find(
          (s: any) => s.athleteId === user.id
        );

        return NextResponse.json({
          assignment: {
            ...assignment,
            submissions: athleteSubmission ? [athleteSubmission] : [],
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'Forbidden - You do not have access to this assignment' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/[id] - Update assignment (coach only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coach: true },
    });

    if (!user || user.role !== 'COACH' || !user.coach) {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Verify assignment exists and belongs to this coach
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.coachId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own assignments' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Build update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.targetAthleteIds !== undefined) {
      updateData.targetAthleteIds = data.targetAthleteIds;
    }
    if (data.targetSport !== undefined) {
      updateData.targetSport = data.targetSport;
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        submissions: true,
      },
    });

    return NextResponse.json({
      assignment: updatedAssignment,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - Delete assignment (coach only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coach: true },
    });

    if (!user || user.role !== 'COACH' || !user.coach) {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Verify assignment exists and belongs to this coach
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.coachId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own assignments' },
        { status: 403 }
      );
    }

    // Delete assignment (cascades to submissions)
    await prisma.assignment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
