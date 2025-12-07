import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/athlete/assignments - Get all assignments for the athlete
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify user is an athlete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { athlete: true },
    });

    if (!user || user.role !== 'ATHLETE' || !user.athlete) {
      return NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build filter conditions for submissions
    const submissionWhere: any = {
      athleteId: session.user.id,
    };

    if (status) {
      submissionWhere.status = status;
    }

    // Fetch athlete's assignment submissions
    const submissions = await prisma.assignmentSubmission.findMany({
      where: submissionWhere,
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
      orderBy: [
        { assignment: { dueDate: 'asc' } },
        { startedAt: 'desc' },
      ],
    });

    // Filter by assignment type if specified
    const filteredSubmissions = type
      ? submissions.filter(sub => sub.assignment.type === type)
      : submissions;

    // Transform data for frontend
    const assignmentsWithSubmissions = filteredSubmissions.map(submission => ({
      submissionId: submission.id,
      assignmentId: submission.assignment.id,
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
      // Submission-specific data
      status: submission.status,
      response: submission.response,
      timeSpent: submission.timeSpent,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      coachFeedback: submission.coachFeedback,
      coachRating: submission.coachRating,
      reviewedAt: submission.reviewedAt,
    }));

    // Calculate summary stats
    const stats = {
      total: assignmentsWithSubmissions.length,
      notStarted: assignmentsWithSubmissions.filter(a => a.status === 'NOT_STARTED').length,
      inProgress: assignmentsWithSubmissions.filter(a => a.status === 'IN_PROGRESS').length,
      submitted: assignmentsWithSubmissions.filter(a => a.status === 'SUBMITTED').length,
      reviewed: assignmentsWithSubmissions.filter(a => a.status === 'REVIEWED').length,
      overdue: assignmentsWithSubmissions.filter(a =>
        new Date(a.dueDate) < new Date() &&
        (a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS')
      ).length,
    };

    return NextResponse.json({
      assignments: assignmentsWithSubmissions,
      stats,
    });

  } catch (error) {
    console.error('Error fetching athlete assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
