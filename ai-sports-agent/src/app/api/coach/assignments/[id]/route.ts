import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for assignment updates
const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  type: z.enum(['REFLECTION', 'EXERCISE', 'VIDEO_WATCH', 'READING', 'JOURNALING', 'GOAL_SETTING', 'MINDFULNESS']).optional(),
  category: z.string().min(1).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  estimatedTime: z.number().min(1).max(300).optional(),
  resources: z.any().optional(),
  sportFilter: z.string().optional(),
  yearFilter: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/coach/assignments/[id] - Get assignment details with submissions
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Fetch assignment with submissions
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        coachUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        submissions: {
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { submittedAt: 'desc' },
            { startedAt: 'desc' },
          ],
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify coach owns this assignment or is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (assignment.coachId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this assignment' },
        { status: 403 }
      );
    }

    // Calculate statistics
    const totalSubmissions = assignment.submissions.length;
    const completedSubmissions = assignment.submissions.filter(
      s => s.status === 'SUBMITTED' || s.status === 'REVIEWED'
    ).length;
    const inProgressSubmissions = assignment.submissions.filter(
      s => s.status === 'IN_PROGRESS'
    ).length;
    const notStartedSubmissions = assignment.submissions.filter(
      s => s.status === 'NOT_STARTED'
    ).length;

    return NextResponse.json({
      assignment,
      stats: {
        total: totalSubmissions,
        completed: completedSubmissions,
        inProgress: inProgressSubmissions,
        notStarted: notStartedSubmissions,
        completionRate: totalSubmissions > 0
          ? Math.round((completedSubmissions / totalSubmissions) * 100)
          : 0,
      },
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT /api/coach/assignments/[id] - Update assignment
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify assignment exists and coach owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this assignment' },
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
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update assignment
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.instructions) updateData.instructions = data.instructions;
    if (data.type) updateData.type = data.type;
    if (data.category) updateData.category = data.category;
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.estimatedTime) updateData.estimatedTime = data.estimatedTime;
    if (data.resources !== undefined) updateData.resources = data.resources;
    if (data.sportFilter !== undefined) updateData.sportFilter = data.sportFilter;
    if (data.yearFilter !== undefined) updateData.yearFilter = data.yearFilter;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
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

// DELETE /api/coach/assignments/[id] - Delete assignment
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify assignment exists and coach owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this assignment' },
        { status: 403 }
      );
    }

    // Delete assignment (cascade will delete submissions)
    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Assignment deleted successfully',
      submissionsDeleted: existingAssignment._count.submissions,
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
