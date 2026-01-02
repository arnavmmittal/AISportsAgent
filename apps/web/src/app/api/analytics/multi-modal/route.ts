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
