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

    // Return mock data for demo users
    if (authUser!.id.startsWith('demo-')) {
      if (authUser!.role === 'COACH') {
        // Demo coach assignments
        const mockAssignments = [
          {
            id: 'assign-1',
            coachId: 'demo-coach-123',
            title: 'Pre-Game Mental Preparation',
            description: 'Complete the pre-game visualization exercise and journal about your experience.',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            targetAthleteIds: null,
            targetSport: 'Basketball',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            AssignmentSubmission: [
              { id: 'sub-1', athleteId: 'athlete-1', status: 'COMPLETED', submittedAt: new Date().toISOString() },
              { id: 'sub-2', athleteId: 'athlete-2', status: 'PENDING', submittedAt: null },
            ],
          },
          {
            id: 'assign-2',
            coachId: 'demo-coach-123',
            title: 'Weekly Mood Reflection',
            description: 'Reflect on your mood patterns this week and identify any triggers.',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            targetAthleteIds: null,
            targetSport: null,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            AssignmentSubmission: [],
          },
        ];
        return NextResponse.json({ assignments: mockAssignments });
      } else if (authUser!.role === 'ATHLETE') {
        // Demo athlete assignments
        const mockAssignments = [
          {
            id: 'assign-1',
            coachId: 'demo-coach-123',
            title: 'Pre-Game Mental Preparation',
            description: 'Complete the pre-game visualization exercise and journal about your experience.',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            targetAthleteIds: null,
            targetSport: 'Basketball',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            AssignmentSubmission: [
              {
                id: 'sub-1',
                status: 'PENDING',
                response: null,
                submittedAt: null,
              },
            ],
          },
        ];
        return NextResponse.json({ assignments: mockAssignments });
      }
    }

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
      // Athlete: Get assignments targeted to them
      const assignments = await prisma.assignment.findMany({
        where: {
          OR: [
            // Assignments specifically for this athlete
            {
              targetAthleteIds: {
                path: '$',
                array_contains: user.id,
              },
            },
            // Assignments for all athletes in their sport
            {
              targetAthleteIds: null,
              targetSport: user.Athlete.sport,
            },
            // Assignments for all athletes (no sport filter)
            {
              targetAthleteIds: null,
              targetSport: null,
            },
          ],
        },
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
        targetAthleteIds: data.targetAthleteIds || null,
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
