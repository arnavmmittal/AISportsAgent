/**

 * Multi-Modal Correlation Analysis API
 *
 * GET /api/analytics/multi-modal?athleteId=xxx&days=90
 *
 * Returns comprehensive correlation analysis combining:
 * - Traditional readiness metrics
 * - Chat sentiment and topics
 * - Performance outcomes
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultiModalCorrelation } from '@/lib/analytics/multi-modal-correlation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const days = parseInt(searchParams.get('days') || '90');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Perform multi-modal analysis
    const analysis = await analyzeMultiModalCorrelation(athleteId, startDate, endDate);

    // Check if we have sufficient data
    if (!analysis) {
      return NextResponse.json({
        success: false,
        athleteId,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        },
        error: 'Insufficient data for analysis',
        message: 'Need at least 5 games with mood logs to perform correlation analysis',
        analysis: null
      }, { status: 200 }); // Return 200, not 500, so build doesn't fail
    }

    return NextResponse.json({
      success: true,
      athleteId,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      },
      analysis
    });
  } catch (error: any) {
    console.error('Multi-modal correlation analysis failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform multi-modal correlation analysis',
        details: error.message
      },
      { status: 500 }
    );
  }
}
