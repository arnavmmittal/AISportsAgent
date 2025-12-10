import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 }
      );
    }

    const goals = await prisma.goal.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { athleteId, title, description, targetDate, category, progress } = body;

    if (!athleteId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId and title are required' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        athleteId,
        title,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || 'PERFORMANCE',
        progress: progress || 0,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(
      { success: true, data: goal },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
