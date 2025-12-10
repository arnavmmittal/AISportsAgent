import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const body = await req.json();
    const { athleteId, mood, confidence, stress, energy, sleep, notes, tags } = body;

    if (!athleteId || mood === undefined || confidence === undefined || stress === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user can create mood logs for this athlete
    if (user!.id !== athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot create mood logs for other users' },
        { status: 403 }
      );
    }

    // Validate ranges
    if (mood < 1 || mood > 10 || confidence < 1 || confidence > 10 || stress < 1 || stress > 10) {
      return NextResponse.json(
        { error: 'Mood, confidence, and stress must be between 1 and 10' },
        { status: 400 }
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
