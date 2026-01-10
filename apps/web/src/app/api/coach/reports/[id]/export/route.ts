/**
 * Coach Report Export API
 * Exports a report as PDF or CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    const reportId = params.id;
    const body = await request.json();
    const { format = 'pdf' } = body; // pdf or csv

    // Get report
    const report = await prisma.chatSummary.findUnique({
      where: { id: reportId },
      include: {
        athlete: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify coach has access to this athlete
    const coachAthleteRelation = await prisma.coachAthleteRelation.findFirst({
      where: {
        coachId: user.id,
        athleteId: report.athleteId,
        consentGranted: true,
      },
    });

    if (!coachAthleteRelation) {
      return NextResponse.json({ error: 'Forbidden - No access to this athlete' }, { status: 403 });
    }

    // Mark as viewed by coach
    if (!report.viewedByCoach) {
      await prisma.chatSummary.update({
        where: { id: reportId },
        data: {
          viewedByCoach: true,
          viewedAt: new Date(),
        },
      });
    }

    // For now, return JSON data that frontend can use to generate PDF/CSV
    // In production, this would generate the file server-side
    const exportData = {
      athleteName: report.athlete.User.name,
      sport: report.athlete.sport,
      reportType: report.summaryType,
      weekStart: report.weekStart?.toISOString() || null,
      weekEnd: report.weekEnd?.toISOString() || null,
      summary: report.summary,
      keyThemes: report.keyThemes as any,
      emotionalState: report.emotionalState,
      moodScore: report.moodScore,
      stressScore: report.stressScore,
      sleepScore: report.sleepQualityScore,
      confidenceScore: report.confidenceScore,
      sorenessScore: report.sorenessScore,
      riskFlags: report.riskFlags,
      recommendedActions: report.recommendedActions,
      messageCount: report.messageCount,
      sessionCount: report.sessionCount,
      generatedAt: report.generatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      format,
      data: exportData,
      message: `Report exported as ${format.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
