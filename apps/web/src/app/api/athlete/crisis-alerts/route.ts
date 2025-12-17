import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/athlete/crisis-alerts - Get athlete's crisis alerts
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    // Get crisis alerts for this athlete
    const alerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: user!.id,
      },
      orderBy: {
        detectedAt: 'desc',
      },
      take: 10, // Last 10 alerts
      select: {
        id: true,
        severity: true,
        reviewed: true,
        reviewedAt: true,
        detectedAt: true,
        escalated: true,
        notes: true,
      },
    });

    return NextResponse.json({ alerts });

  } catch (error) {
    console.error('Error fetching crisis alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crisis alerts' },
      { status: 500 }
    );
  }
}
