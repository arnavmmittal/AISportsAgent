import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitAssignmentSchema = z.object({
  response: z.string().min(1, 'Response is required'),
});

// POST /api/assignments/[id]/submit - Athlete submits response
export async function POST(
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

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify athlete is targeted by this assignment
    const isTargeted =
      assignment.targetAthleteIds === null || // All athletes
      (Array.isArray(assignment.targetAthleteIds) &&
        assignment.targetAthleteIds.includes(user.id));

    const isSportMatch =
      assignment.targetSport === null ||
      assignment.targetSport === user.athlete.sport;

    if (!isTargeted || !isSportMatch) {
      return NextResponse.json(
        { error: 'Forbidden - This assignment is not for you' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = submitAssignmentSchema.safeParse(body);

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

    // Create or update submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_athleteId: {
          assignmentId: id,
          athleteId: user.id,
        },
      },
      update: {
        response: data.response,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        assignmentId: id,
        athleteId: user.id,
        response: data.response,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      submission,
      message: 'Assignment submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}
