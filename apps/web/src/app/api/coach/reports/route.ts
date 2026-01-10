/**
 * Coach Reports API
 * Returns weekly/monthly reports for coach's athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get coach's athletes
    const coachAthletes = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId: user.id,
        consentGranted: true,
      },
      select: {
        athleteId: true,
      },
    });

    const athleteIds = coachAthletes.map((relation) => relation.athleteId);

    // Get chat summaries (weekly reports)
    const reports = await prisma.chatSummary.findMany({
      where: {
        athleteId: { in: athleteIds },
        summaryType: 'WEEKLY',
      },
      include: {
        athlete: {
          include: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
      take: 50, // Limit to 50 most recent reports
    });

    // Transform reports for response
    const transformedReports = reports.map((report) => {
      const keyThemes = report.keyThemes as { theme: string; frequency: number }[];

      return {
        id: report.id,
        athleteId: report.athleteId,
        athleteName: report.athlete.User.name,
        sport: report.athlete.sport,
        type: report.summaryType,
        weekStart: report.weekStart?.toISOString() || null,
        weekEnd: report.weekEnd?.toISOString() || null,
        summary: report.summary,
        keyThemes: keyThemes || [],
        emotionalState: report.emotionalState,
        moodScore: report.moodScore,
        stressScore: report.stressScore,
        sleepScore: report.sleepQualityScore,
        confidenceScore: report.confidenceScore,
        riskFlags: report.riskFlags,
        recommendedActions: report.recommendedActions,
        messageCount: report.messageCount,
        sessionCount: report.sessionCount,
        viewedByCoach: report.viewedByCoach,
        generatedAt: report.generatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      reports: transformedReports,
      total: transformedReports.length,
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
