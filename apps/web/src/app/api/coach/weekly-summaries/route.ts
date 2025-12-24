/**
 * Coach Weekly Summaries API
 *
 * Returns weekly chat summaries for athletes (ONLY if consent granted)
 *
 * PRIVACY GATES (ALL must pass):
 * 1. CoachAthleteRelation.consentGranted = true
 * 2. Athlete.consentChatSummaries = true
 * 3. Coach.schoolId = Athlete.schoolId (tenant boundary)
 * 4. Summary.revokedAt IS NULL
 * 5. Summary.expiresAt > NOW()
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { decryptFieldSafe, decryptArray } from '@/lib/encryption';
import { logWeeklySummaryView } from '@/lib/audit';

/**
 * GET /api/coach/weekly-summaries
 *
 * Query params:
 * - athleteId (required): Athlete user ID
 * - weekStart (optional): ISO date for specific week
 * - limit (optional): Number of weeks to return (default: 4)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can access
    if (user!.role !== 'COACH') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const weekStartParam = searchParams.get('weekStart');
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      );
    }

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
      select: {
        userId: true,
        User: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // PRIVACY GATE 1 & 2: Check relationship consent AND athlete consent
    const relation = await prisma.coachAthleteRelation.findFirst({
      where: {
        coachId: coach.userId,
        athleteId: athleteId,
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: {
                name: true,
                schoolId: true,
              },
            },
          },
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'No relationship found with this athlete' },
        { status: 404 }
      );
    }

    if (!relation.consentGranted) {
      return NextResponse.json(
        { error: 'Athlete has not granted coach access consent' },
        { status: 403 }
      );
    }

    if (!relation.Athlete.consentChatSummaries) {
      return NextResponse.json(
        { error: 'Athlete has not enabled weekly chat summaries' },
        { status: 403 }
      );
    }

    // PRIVACY GATE 3: Tenant boundary check (same school)
    if (coach.User.schoolId !== relation.Athlete.User.schoolId) {
      console.error(`[Weekly Summaries] Cross-tenant access attempt: Coach \${coach.userId} trying to access athlete \${athleteId}`);
      return NextResponse.json(
        { error: 'Unauthorized access across institutions' },
        { status: 403 }
      );
    }

    // Build query for summaries
    const now = new Date();
    const where: any = {
      athleteId: athleteId,
      summaryType: 'WEEKLY',
      revokedAt: null,              // PRIVACY GATE 4
      expiresAt: { gt: now },       // PRIVACY GATE 5
    };

    // If specific week requested, filter by weekStart
    if (weekStartParam) {
      const weekStart = new Date(weekStartParam);
      where.weekStart = weekStart;
    }

    // Fetch summaries
    const summaries = await prisma.chatSummary.findMany({
      where,
      orderBy: { weekStart: 'desc' },
      take: limit,
    });

    // Decrypt sensitive fields
    const decryptedSummaries = summaries.map((summary) => ({
      ...summary,
      keyThemes: decryptArray(summary.keyThemes as string[]),
      adherenceNotes: decryptFieldSafe(summary.adherenceNotes),
      recommendedActions: decryptArray(summary.recommendedActions as string[]),
    }));

    // Log access to audit trail
    for (const summary of decryptedSummaries) {
      await logWeeklySummaryView(
        coach.userId,
        summary.id,
        athleteId,
        {
          headers: {
            'x-forwarded-for': req.headers.get('x-forwarded-for') || undefined,
            'user-agent': req.headers.get('user-agent') || undefined,
          },
        }
      );

      // Update viewedByCoach status if not already viewed
      if (!summary.viewedByCoach) {
        await prisma.chatSummary.update({
          where: { id: summary.id },
          data: {
            viewedByCoach: true,
            viewedAt: new Date(),
            coachId: coach.userId,
          },
        });
      }
    }

    console.log(`[Weekly Summaries] Coach \${coach.userId} accessed \${decryptedSummaries.length} summaries for athlete \${athleteId}`);

    return NextResponse.json({
      success: true,
      summaries: decryptedSummaries,
      meta: {
        athleteId,
        athleteName: relation.Athlete.User.name,
        consentGranted: true,
        totalWeeks: decryptedSummaries.length,
      },
    });
  } catch (error: any) {
    console.error('[Weekly Summaries API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch weekly summaries',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
