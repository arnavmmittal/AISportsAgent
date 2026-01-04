import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import {
  validateRequest,
  moodLogCreateSchema,
  ValidationError,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Validate and sanitize input with Zod
    let validatedData;
    try {
      validatedData = await validateRequest(req, moodLogCreateSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { athleteId, mood, confidence, stress, energy, sleep, notes, tags } = validatedData;

    // Verify user can create mood logs for this athlete
    if (user!.id !== athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot create mood logs for other users' },
        { status: 403 }
      );
    }

    // Create mood log
    const moodLog = await prisma.moodLog.create({
      data: {
        athleteId,
        mood,
        confidence,
        stress,
        energy: energy || null,
        sleep: sleep || null,
        notes: notes || null,
        tags: tags || '',
      },
    });

    return NextResponse.json(
      { success: true, data: moodLog },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating mood log:', error);
    return NextResponse.json(
      { error: 'Failed to create mood log' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 }
      );
    }

    // Verify user can access this athlete's data
    if (user!.id !== athleteId && user!.role !== 'ADMIN' && user!.role !== 'COACH') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot access other users\' data' },
        { status: 403 }
      );
    }

    const moodLogs = await prisma.moodLog.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: moodLogs });
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood logs' },
      { status: 500 }
    );
  }
}
