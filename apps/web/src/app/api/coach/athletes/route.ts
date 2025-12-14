/**
 * Coach Athletes List API
 * Returns list of athletes with consent for coach viewing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches and admins can access
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport');

    // Get coach's school
    const coach = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { School: true },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Build athlete filter
    const where: any = {
      schoolId: coach.schoolId,
      role: 'ATHLETE',
      Athlete: {
        consentCoachView: true,
        ...(sport && { sport }),
      },
    };

    const athletes = await prisma.user.findMany({
      where,
      include: {
        Athlete: {
          include: {
            MoodLog: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            Goal: {
              where: {
                status: { in: ['IN_PROGRESS', 'NOT_STARTED'] },
              },
              take: 3,
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: athletes.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        sport: a.Athlete?.sport,
        year: a.Athlete?.year,
        position: a.Athlete?.teamPosition,
        riskLevel: a.Athlete?.riskLevel,
        lastMoodLog: a.Athlete?.MoodLog?.[0] || null,
        activeGoalsCount: a.Athlete?.Goal?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}
