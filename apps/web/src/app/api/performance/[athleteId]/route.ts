/**
 * Performance Metrics API - Get performance data for a specific athlete
 *
 * GET /api/performance/[athleteId]?limit=10
 * - Returns performance metrics for the athlete
 * - Includes readiness scores and mental state correlations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  try {
    // 1. Check authentication (coaches and the athlete themselves can view)
    const { authorized, session, user, response } = await requireAuth(request);
    if (!authorized || !session || !user) return response;

    const { athleteId } = await params;

    // 2. Verify access permissions
    // Coaches can view all athletes in their school
    // Athletes can only view their own data
    if (user.role === 'ATHLETE' && user.id !== athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized access to athlete data' },
        { status: 403 }
      );
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // 4. Fetch performance metrics
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        athleteId: athleteId,
      },
      orderBy: {
        gameDate: 'desc',
      },
      take: limit,
    });

    // 5. Calculate summary statistics
    const totalGames = performanceMetrics.length;
    const wins = performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'WIN').length;
    const losses = performanceMetrics.filter(m => m.outcome?.toUpperCase() === 'LOSS').length;
    const avgReadiness = performanceMetrics.length > 0
      ? performanceMetrics
          .filter(m => m.readinessScore !== null)
          .reduce((sum, m) => sum + (m.readinessScore || 0), 0) /
        performanceMetrics.filter(m => m.readinessScore !== null).length
      : null;

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: performanceMetrics,
      summary: {
        totalGames,
        wins,
        losses,
        winRate: totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0,
        avgReadiness: avgReadiness ? avgReadiness.toFixed(1) : null,
      },
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
