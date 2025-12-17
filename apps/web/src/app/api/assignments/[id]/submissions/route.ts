import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/assignments/[id]/submissions - Coach views all submissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { id } = await params;

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
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: {
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

    if (assignment.coachId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view submissions for your own assignments' },
        { status: 403 }
      );
    }

    // Get athlete info for each submission
    const submissionsWithAthletes = await Promise.all(
      assignment.submissions.map(async (submission: any) => {
        const athlete = await prisma.user.findUnique({
          where: { id: submission.athleteId },
          select: {
            id: true,
            name: true,
            email: true,
            athlete: {
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
