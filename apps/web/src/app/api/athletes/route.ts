import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { calculateReadiness } from '@/lib/analytics/readiness';
import { requireCoach } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { authorized, response } = await requireCoach(request);
    if (!authorized) return response;

    const searchParams = request.nextUrl.searchParams;
    const sports = searchParams.get('sports')?.split(',').filter(Boolean);

    // Build where clause
    const where: any = {
      role: 'ATHLETE',
      Athlete: sports && sports.length > 0
        ? {
            is: {
              sport: { in: sports },
            },
          }
        : {
            isNot: null,
          },
    };

    // Fetch athletes with their latest mood log
    const athletes = await prisma.user.findMany({
      where,
      include: {
        Athlete: {
          include: {
            MoodLog: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to match frontend interface
    const transformedAthletes = await Promise.all(
      athletes.map(async (user) => {
        const latestMood = user.Athlete?.MoodLog?.[0];

        // Calculate enhanced readiness with chat insights if we have mood data
        let readinessScore = null;
        let baseReadiness = null;
        let chatContribution = 0;
        let chatInsights = null;

        if (latestMood) {
          const result = calculateReadiness(
            {
              mood: latestMood.mood,
              confidence: latestMood.confidence,
              stress: latestMood.stress,
              energy: latestMood.energy || undefined,
              sleep: latestMood.sleep || undefined,
              createdAt: latestMood.createdAt,
            },
            user.Athlete?.sport || 'Basketball'
          );

          readinessScore = result.overall;
          baseReadiness = result.overall;
        }

        // Determine risk level
        let riskLevel: 'critical' | 'warning' | 'good' | 'no-data' = 'no-data';
        let concern = null;

        if (readinessScore !== null) {
          if (readinessScore < 50) {
            riskLevel = 'critical';
            concern = `Readiness critically low (${readinessScore}/100)`;
          } else if (readinessScore < 70) {
            riskLevel = 'warning';
            concern = `Readiness below optimal (${readinessScore}/100)`;
          } else {
            riskLevel = 'good';
          }

          // Stress/sleep concerns
          if (latestMood && latestMood.stress >= 8) {
            concern = concern || `High stress level: ${latestMood.stress}/10`;
          }
          if (latestMood && latestMood.sleep && latestMood.sleep < 6) {
            concern = concern || `Low sleep: ${latestMood.sleep} hours`;
          }
        }

        return {
          id: user.id,
          name: user.name,
          sport: user.Athlete?.sport || 'Unknown',
          year: user.Athlete?.year || 'FRESHMAN',
          riskLevel,
          lastCheckIn: latestMood?.createdAt || null,
          moodScore: latestMood?.mood || null,
          readinessScore,
          baseReadiness,
          chatContribution,
          chatInsights,
          concern,
          missedCheckIns: 0, // TODO: Calculate based on expected frequency
        };
      })
    );

    return NextResponse.json({
      athletes: transformedAthletes,
      total: transformedAthletes.length,
    });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}
