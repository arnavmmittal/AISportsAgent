import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for submission updates
const updateSubmissionSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED']).optional(),
  response: z.any().optional(), // JSON object with athlete's answers/notes
  timeSpent: z.number().min(0).optional(), // Minutes spent
  startedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/athlete/assignments/[id] - Get specific assignment submission
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

    const { id: submissionId } = await context.params;

    // Fetch submission with assignment details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            coachUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Assignment submission not found' },
        { status: 404 }
      );
    }

    // Verify athlete owns this submission
    if (submission.athleteId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this submission' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        response: submission.response,
        timeSpent: submission.timeSpent,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        coachFeedback: submission.coachFeedback,
        coachRating: submission.coachRating,
        reviewedAt: submission.reviewedAt,
        assignment: {
          id: submission.assignment.id,
          title: submission.assignment.title,
          description: submission.assignment.description,
          instructions: submission.assignment.instructions,
          type: submission.assignment.type,
          category: submission.assignment.category,
          difficulty: submission.assignment.difficulty,
          estimatedTime: submission.assignment.estimatedTime,
          resources: submission.assignment.resources,
          dueDate: submission.assignment.dueDate,
          assignedDate: submission.assignment.assignedDate,
          coachName: submission.assignment.coachUser.name,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching assignment submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment submission' },
      { status: 500 }
    );
  }
}

// PUT /api/athlete/assignments/[id] - Update submission (start, save progress, submit)
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

    const { id: submissionId } = await context.params;

    // Verify submission exists and athlete owns it
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Assignment submission not found' },
        { status: 404 }
      );
    }

    if (existingSubmission.athleteId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this submission' },
        { status: 403 }
      );
    }

    // Check if assignment is overdue
    const isOverdue = new Date(existingSubmission.assignment.dueDate) < new Date();
    if (isOverdue && existingSubmission.status !== 'SUBMITTED' && existingSubmission.status !== 'REVIEWED') {
      return NextResponse.json(
        { error: 'Cannot update - assignment is overdue' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateSubmissionSchema.safeParse(body);

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

    // Build update data
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;

      // Auto-set timestamps based on status changes
      if (data.status === 'IN_PROGRESS' && !existingSubmission.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === 'SUBMITTED' && !existingSubmission.submittedAt) {
        updateData.submittedAt = new Date();
      }
    }

    if (data.response !== undefined) {
      updateData.response = data.response;
    }

    if (data.timeSpent !== undefined) {
      updateData.timeSpent = data.timeSpent;
    }

    if (data.startedAt) {
      updateData.startedAt = new Date(data.startedAt);
    }

    if (data.submittedAt) {
      updateData.submittedAt = new Date(data.submittedAt);
    }

    // Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        assignment: {
          include: {
            coachUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      submission: updatedSubmission,
      message: 'Submission updated successfully',
    });

  } catch (error) {
    console.error('Error updating assignment submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
