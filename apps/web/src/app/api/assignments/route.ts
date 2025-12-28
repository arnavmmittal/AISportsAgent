import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().datetime().optional(),
  targetAthleteIds: z.array(z.string()).optional(),
  targetSport: z.string().optional(),
});

// GET /api/assignments - Get assignments (filtered by role)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user: authUser, response } = await requireAuth(request);
    if (!authorized) return response;

    const user = await prisma.user.findUnique({
      where: { id: authUser!.id },
      include: {
        Athlete: true,
        Coach: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role === 'COACH') {
      // Coach: Get all assignments they created
      const assignments = await prisma.assignment.findMany({
        where: {
          coachId: user.id,
        },
        include: {
          AssignmentSubmission: {
            select: {
              id: true,
              athleteId: true,
              status: true,
              submittedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ assignments });
    } else if (user.role === 'ATHLETE' && user.Athlete) {
      // Athlete: Get all assignments and filter in code (JSON array queries are complex in Prisma)
      const allAssignments = await prisma.assignment.findMany({
        include: {
          AssignmentSubmission: {
            where: {
              athleteId: user.id,
            },
            select: {
              id: true,
              status: true,
              response: true,
              submittedAt: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      // Filter assignments for this athlete
      const assignments = allAssignments.filter((assignment) => {
        // Check if targetAthleteIds includes this user
        if (assignment.targetAthleteIds) {
          const athleteIds = assignment.targetAthleteIds as string[];
          if (athleteIds.includes(user.id)) return true;
        }

        // Check if assignment is for all athletes in their sport
        if (!assignment.targetAthleteIds && assignment.targetSport === user.Athlete?.sport) {
          return true;
        }

        // Check if assignment is for all athletes
        if (!assignment.targetAthleteIds && !assignment.targetSport) {
          return true;
        }

        return false;
      });

      return NextResponse.json({ assignments });
    } else {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Coach creates assignment
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user: authUser, response } = await requireAuth(request);
    if (!authorized) return response;

    // Verify user is a coach
    const user = await prisma.user.findUnique({
      where: { id: authUser!.id },
      include: { Coach: true },
    });

    if (!user || user.role !== 'COACH' || !user.Coach) {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAssignmentSchema.safeParse(body);

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

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        coachId: user.id,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        targetAthleteIds: data.targetAthleteIds || undefined,
        targetSport: data.targetSport || null,
      },
      include: {
        AssignmentSubmission: true,
      },
    });

    // Create submission records for targeted athletes
    if (data.targetAthleteIds && data.targetAthleteIds.length > 0) {
      // Create submissions for specific athletes
      const submissionData = data.targetAthleteIds.map((athleteId) => ({
        assignmentId: assignment.id,
        athleteId,
        status: 'PENDING' as const,
      }));

      await prisma.assignmentSubmission.createMany({
        data: submissionData,
        skipDuplicates: true,
      });
    } else {
      // Create submissions for all athletes in target sport (or all athletes if no sport specified)
      const whereClause: any = {};
      if (data.targetSport) {
        whereClause.sport = data.targetSport;
      }

      const athletes = await prisma.athlete.findMany({
        where: whereClause,
        select: { userId: true },
      });

      if (athletes.length > 0) {
        const submissionData = athletes.map((athlete) => ({
          assignmentId: assignment.id,
          athleteId: athlete.userId,
          status: 'PENDING' as const,
        }));

        await prisma.assignmentSubmission.createMany({
          data: submissionData,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      assignment,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
