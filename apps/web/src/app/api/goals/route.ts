import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const category = searchParams.get('category'); // Filter by category
    const status = searchParams.get('status'); // Filter by status
    const search = searchParams.get('search'); // Search in title/description

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

    // Build where clause with filters
    const where: any = { athleteId };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const goals = await prisma.goal.findMany({
      where,
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
    // Verify authentication (supports both JWT and session)
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const body = await req.json();
    const { athleteId, title, description, targetDate, category, progress } = body;

    if (!athleteId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId and title are required' },
        { status: 400 }
      );
    }

    // Verify user can create goals for this athlete
    if (user!.id !== athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot create goals for other users' },
        { status: 403 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        athleteId,
        title,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || 'PERFORMANCE',
        status: 'IN_PROGRESS',
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
