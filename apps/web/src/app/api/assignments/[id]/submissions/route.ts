import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/assignments/[id]/submissions - Coach views all submissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const { id } = await params;

    // Verify user is a coach
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { Coach: true },
    });

    if (!fullUser || fullUser.role !== 'COACH' || !fullUser.Coach) {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Verify assignment exists and belongs to this coach
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        AssignmentSubmission: {
          include: {
            // Include athlete user info for display
          },
          orderBy: {
            submittedAt: 'desc',
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

    if (assignment.coachId !== user!.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view submissions for your own assignments' },
        { status: 403 }
      );
    }

    // Get athlete info for each submission
    const submissionsWithAthletes = await Promise.all(
      assignment.AssignmentSubmission.map(async (submission: any) => {
        const athlete = await prisma.user.findUnique({
          where: { id: submission.athleteId },
          select: {
            id: true,
            name: true,
            email: true,
            Athlete: {
              select: {
                sport: true,
                year: true,
                teamPosition: true,
              },
            },
          },
        });

        return {
          ...submission,
          athlete,
        };
      })
    );

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
      },
      submissions: submissionsWithAthletes,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
