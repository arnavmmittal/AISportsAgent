/**
 * Escalation Stats API
 *
 * GET - View escalation statistics (admin only)
 * POST - Manually trigger escalation check (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { runEscalationCheck, getEscalationStats } from '@/lib/crisis-escalation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/escalation-stats
 * Get escalation statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get escalation stats
    const stats = await getEscalationStats();

    return NextResponse.json({
      success: true,
      stats: {
        totalAlerts: stats.totalAlerts,
        unreviewed: stats.unreviewed,
        escalated: stats.escalated,
        averageReviewTimeMinutes: stats.averageReviewTime,
        bySeverity: stats.bySeverity,
      },
      escalationTimeframes: {
        CRITICAL: '5 minutes',
        HIGH: '15 minutes',
        MEDIUM: '1 hour',
        LOW: '24 hours',
      },
    });

  } catch (error) {
    console.error('[Escalation Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/escalation-stats
 * Manually trigger escalation check (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log(`[Escalation] Manual trigger by admin ${user.email}`);

    // Run escalation check
    const result = await runEscalationCheck();

    return NextResponse.json({
      success: true,
      triggeredBy: user.email,
      timestamp: new Date().toISOString(),
      result: {
        totalChecked: result.totalChecked,
        escalated: result.escalated.length,
        skipped: result.skipped,
        errors: result.errors,
      },
      escalations: result.escalated,
    });

  } catch (error) {
    console.error('[Escalation] Manual trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to run escalation check' },
      { status: 500 }
    );
  }
}
