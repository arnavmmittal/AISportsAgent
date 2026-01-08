import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAuth } from '@/lib/auth-helpers';
import { generateTeamSummary } from '@/lib/summaries/generateWeeklySummaries';

/**
 * API endpoint to get team-level summary for a coach.
 *
 * Enterprise Value:
 * - Provides high-level view of team mental performance
 * - Identifies trends across 150+ athletes
 * - Highlights at-risk athletes requiring immediate attention
 * - Enables data-driven coaching decisions
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Coach role required.' },
        { status: 401 }
      );
    }

    const coachId = user!.id;
    const teamSummary = await generateTeamSummary(coachId);

    return NextResponse.json({
      success: true,
      teamSummary,
    });
  } catch (error) {
    console.error('Error generating team summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate team summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
