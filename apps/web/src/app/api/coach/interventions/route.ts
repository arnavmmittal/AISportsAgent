/**
 * Coach Interventions API
 *
 * GET /api/coach/interventions
 * Query params: coachId
 *
 * Returns prioritized intervention queue for all consented athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { getCoachInterventionQueue } from '@/lib/analytics/interventions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify coach authentication
  const { authorized, user, response } = await requireCoach(req);
  if (!authorized) return response;

  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const coachId = searchParams.get('coachId') || user!.id;

    // Generate intervention queue
    const queue = await getCoachInterventionQueue(coachId);

    return NextResponse.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('[API] Error generating intervention queue:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate intervention recommendations',
      },
      { status: 500 }
    );
  }
}
