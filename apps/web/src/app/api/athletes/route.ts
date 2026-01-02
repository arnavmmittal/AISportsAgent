import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateReadiness } from '@/lib/analytics/readiness';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sports = searchParams.get('sports')?.split(',').filter(Boolean);

    // Build where clause
    const where: any = {
      role: 'ATHLETE',
      athlete: {
        isNot: null,
      },
    };

    // Add sport filter if provided
    if (sports && sports.length > 0) {
      where.athlete = {
        ...where.athlete,
        sport: { in: sports },
      };
    }

    // Fetch athletes with their latest mood log
    const athletes = await prisma.user.findMany({
      where,
      include: {
        athlete: true,
        moodLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to match frontend interface
    const transformedAthletes = athletes.map((user) => {
      const latestMood = user.moodLogs[0];

      // Calculate readiness if we have mood data
      let readinessScore = null;
      if (latestMood) {
        const readiness = calculateReadiness({
          mood: latestMood.mood,
          confidence: latestMood.confidence,
          stress: latestMood.stress,
          energy: latestMood.energy || undefined,
          sleep: latestMood.sleep || undefined,
          focus: latestMood.focus || undefined,
          motivation: latestMood.motivation || undefined,
          createdAt: latestMood.createdAt,
        }, user.athlete?.sport || 'Basketball');
        readinessScore = readiness.overall;
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

        // Add stress/sleep concerns
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
        sport: user.athlete?.sport || 'Unknown',
        year: user.athlete?.year || 'FRESHMAN',
        riskLevel,
        lastCheckIn: latestMood?.createdAt || null,
        moodScore: latestMood?.mood || null,
        readinessScore,
        concern,
        missedCheckIns: 0, // TODO: Calculate based on expected frequency
      };
    });

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
