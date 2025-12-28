import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { generateWeeklySummaries } from '@/lib/summaries/generateWeeklySummaries';

/**
 * API endpoint to trigger weekly summary generation.
 *
 * This can be called:
 * 1. Manually by admins/coaches (with proper auth)
 * 2. By a cron job (using an API key for auth)
 * 3. On a scheduled basis (Vercel Cron, AWS EventBridge, etc.)
 *
 * Enterprise Value:
 * - Automated weekly insights for coaches
 * - Scalable to 150+ athletes per coach
 * - Identifies at-risk athletes automatically
 * - No manual work required from coaching staff
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    // Option 1: NextAuth session (for manual triggers by coaches/admins)
    const { authorized, user } = await requireAuth(request);

    // Option 2: API key (for cron jobs)
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.SUMMARY_GENERATION_API_KEY;

    const isAuthorized =
      (authorized && (user!.role === 'ADMIN' || user!.role === 'COACH')) ||
      (apiKey && validApiKey && apiKey === validApiKey);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin/Coach role or valid API key required.' },
        { status: 401 }
      );
    }

    console.log('Starting weekly summary generation...');
    const results = await generateWeeklySummaries();

    // If there are high-risk athletes, we should notify coaches immediately
    // (This could trigger email notifications, Slack alerts, etc.)
    if (results.highRiskAlerts.length > 0) {
      console.warn(`HIGH RISK ATHLETES DETECTED: ${results.highRiskAlerts.join(', ')}`);
      // TODO: Implement immediate notification system
      // await sendHighRiskAlerts(results.highRiskAlerts);
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Generated ${results.successful} summaries. ${results.highRiskAlerts.length} high-risk alerts.`,
    });
  } catch (error) {
    console.error('Error generating weekly summaries:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate weekly summaries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check the status of the last summary generation.
 * Useful for monitoring and debugging.
 */
export async function GET(request: NextRequest) {
  const { authorized, user, response } = await requireAuth(request);
  if (!authorized) return response;

  if (user!.role !== 'ADMIN' && user!.role !== 'COACH') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get the most recent chat summaries to show when they were last generated
  const { prisma } = await import('@/lib/prisma');

  const recentSummaries = await prisma.chatSummary.findMany({
    orderBy: {
      generatedAt: 'desc',
    },
    take: 10,
    select: {
      id: true,
      generatedAt: true,
      athleteId: true,
      sessionCount: true,
    },
  });

  const totalSummaries = await prisma.chatSummary.count();

  return NextResponse.json({
    totalSummaries,
    recentSummaries,
    lastGeneratedAt: recentSummaries[0]?.generatedAt || null,
  });
}
