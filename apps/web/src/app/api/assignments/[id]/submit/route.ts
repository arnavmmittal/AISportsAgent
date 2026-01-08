import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { requireAuth } from '@/lib/auth-helpers';
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
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const { id } = await params;

    // Verify user is an athlete
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { Athlete: true },
    });

    if (!fullUser || fullUser.role !== 'ATHLETE' || !fullUser.Athlete) {
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
        assignment.targetAthleteIds.includes(fullUser.id));

    const isSportMatch =
      assignment.targetSport === null ||
      assignment.targetSport === fullUser.Athlete.sport;

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
          athleteId: fullUser.id,
        },
      },
      update: {
        response: data.response,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        assignmentId: id,
        athleteId: fullUser.id,
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
