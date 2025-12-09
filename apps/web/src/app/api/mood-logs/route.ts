import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { athleteId, mood, confidence, stress, energy, sleep, notes, tags } = body;

    if (!athleteId || mood === undefined || confidence === undefined || stress === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 }
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
