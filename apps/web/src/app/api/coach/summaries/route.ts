import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/coach/summaries - Get all chat summaries for athletes who consented
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

    const schoolId = user.schoolId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const sport = searchParams.get('sport');
    const viewed = searchParams.get('viewed'); // "true" | "false" | null

    // Find all athletes in coach's school who have consented to share summaries
    const athleteFilter: any = {
      user: {
        schoolId: schoolId,
      },
      consentChatSummaries: true, // Only athletes who have consented
    };

    if (athleteId) {
      athleteFilter.userId = athleteId;
    }

    if (sport) {
      athleteFilter.sport = sport;
    }

    const athletes = await prisma.athlete.findMany({
      where: athleteFilter,
      select: {
        userId: true,
        sport: true,
        year: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (athletes.length === 0) {
      return NextResponse.json({
        summaries: [],
        stats: {
          total: 0,
          unread: 0,
          athletesSharing: 0,
        },
      });
    }

    const athleteIds = athletes.map(a => a.userId);

    // Build summary filter
    const summaryFilter: any = {
      athleteId: {
        in: athleteIds,
      },
    };

    if (viewed === 'true') {
      summaryFilter.viewedByCoach = true;
    } else if (viewed === 'false') {
      summaryFilter.viewedByCoach = false;
    }

    // Fetch chat summaries
    const summaries = await prisma.chatSummary.findMany({
      where: summaryFilter,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            topic: true,
            sentiment: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    // Calculate stats
    const stats = {
      total: summaries.length,
      unread: summaries.filter(s => !s.viewedByCoach).length,
      athletesSharing: athletes.length,
    };

    return NextResponse.json({
      summaries,
      stats,
    });

  } catch (error) {
    console.error('Error fetching coach summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    );
  }
}
