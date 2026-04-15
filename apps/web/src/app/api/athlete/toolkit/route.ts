import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateToolkitRecommendations } from '@/lib/athlete-toolkit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  maxRecommendations: z.coerce.number().int().min(1).max(5).optional().default(3),
});

/**
 * GET /api/athlete/toolkit
 *
 * Returns personalized sport psychology technique recommendations
 * grounded in the knowledge base, adapted to the athlete's current state.
 */
export async function GET(req: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { maxRecommendations } = parsed.data;

    const athlete = await prisma.athlete.findUnique({
      where: { userId: user!.id },
      select: { userId: true },
    });
    if (!athlete) {
      return NextResponse.json(
        { success: false, error: 'Athlete profile not found' },
        { status: 404 },
      );
    }

    // Fetch last 14 mood logs for context
    const moodLogs = await prisma.moodLog.findMany({
      where: { athleteId: athlete.userId },
      orderBy: { createdAt: 'desc' },
      take: 14,
      select: {
        mood: true,
        confidence: true,
        stress: true,
        sleep: true,
        contextTags: true,
        createdAt: true,
      },
    });

    // Determine current state from today's log or most recent
    const todayLog = moodLogs.find(
      l => l.createdAt.toDateString() === new Date().toDateString(),
    );
    const currentState = todayLog
      ? {
          mood: todayLog.mood,
          stress: todayLog.stress,
          confidence: todayLog.confidence || 5,
          sleep: todayLog.sleep || 7,
        }
      : moodLogs.length > 0
        ? {
            mood: moodLogs[0].mood,
            stress: moodLogs[0].stress,
            confidence: moodLogs[0].confidence || 5,
            sleep: moodLogs[0].sleep || 7,
          }
        : { mood: 5, stress: 5, confidence: 5, sleep: 7 };

    const contextTags = todayLog?.contextTags || [];

    const result = await generateToolkitRecommendations({
      currentState,
      recentLogs: moodLogs.map(l => ({
        mood: l.mood,
        stress: l.stress,
        confidence: l.confidence || 5,
        contextTags: l.contextTags,
        createdAt: l.createdAt,
      })),
      contextTags,
      maxRecommendations,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /api/athlete/toolkit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate toolkit' },
      { status: 500 },
    );
  }
}
