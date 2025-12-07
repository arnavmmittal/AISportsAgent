import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for assignment creation
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  type: z.enum(['REFLECTION', 'EXERCISE', 'VIDEO_WATCH', 'READING', 'JOURNALING', 'GOAL_SETTING', 'MINDFULNESS']),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  estimatedTime: z.number().min(1).max(300), // 1-300 minutes
  resources: z.any().optional(), // JSON object with links, videos, etc.
  sportFilter: z.string().optional(), // null = all sports
  yearFilter: z.string().optional(), // null = all years
  dueDate: z.string().datetime(), // ISO datetime string
});

// GET /api/coach/assignments - List all assignments for the coach
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    if (!user || user.role !== 'COACH') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sportFilter = searchParams.get('sport');
    const status = searchParams.get('status'); // upcoming, overdue, completed

    // Build filter conditions
    const where: any = {
      coachId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (sportFilter) {
      where.sportFilter = sportFilter;
    }

    // Date filtering for status
    const now = new Date();
    if (status === 'upcoming') {
      where.dueDate = { gte: now };
    } else if (status === 'overdue') {
      where.dueDate = { lt: now };
    }

    // Fetch assignments with submission counts
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { assignedDate: 'desc' },
      ],
    });

    // Calculate completion statistics for each assignment
    const assignmentsWithStats = assignments.map(assignment => {
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

      return {
        ...assignment,
        stats: {
          total: totalSubmissions,
          completed: completedSubmissions,
          inProgress: inProgressSubmissions,
          notStarted: notStartedSubmissions,
          completionRate: totalSubmissions > 0
            ? Math.round((completedSubmissions / totalSubmissions) * 100)
            : 0,
        },
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithStats,
      total: assignmentsWithStats.length,
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/coach/assignments - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const schoolId = user.coach.schoolId;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAssignmentSchema.safeParse(body);

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

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        type: data.type,
        category: data.category,
        difficulty: data.difficulty,
        estimatedTime: data.estimatedTime,
        resources: data.resources || {},
        sportFilter: data.sportFilter || null,
        yearFilter: data.yearFilter || null,
        dueDate: new Date(data.dueDate),
        coachId: session.user.id,
        schoolId: schoolId,
      },
    });

    // Create submissions for all eligible athletes
    const athleteFilter: any = {
      schoolId: schoolId,
    };

    if (data.sportFilter) {
      athleteFilter.sport = data.sportFilter;
    }

    if (data.yearFilter) {
      athleteFilter.year = data.yearFilter;
    }

    const eligibleAthletes = await prisma.athlete.findMany({
      where: athleteFilter,
      select: { userId: true },
    });

    // Create NOT_STARTED submissions for all eligible athletes
    if (eligibleAthletes.length > 0) {
      await prisma.assignmentSubmission.createMany({
        data: eligibleAthletes.map(athlete => ({
          assignmentId: assignment.id,
          athleteId: athlete.userId,
          status: 'NOT_STARTED',
          response: {},
        })),
      });
    }

    return NextResponse.json({
      assignment,
      athletesAssigned: eligibleAthletes.length,
      message: 'Assignment created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
