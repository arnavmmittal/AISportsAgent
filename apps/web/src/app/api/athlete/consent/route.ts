/**
 * Athlete Consent Management API
 *
 * Handles athlete consent for weekly chat summaries
 * - Updates Athlete.consentChatSummaries
 * - Revokes existing summaries when consent is withdrawn
 * - Logs all consent changes to audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logConsentUpdate, logSummaryRevocation } from '@/lib/audit';

/**
 * PUT /api/athlete/consent
 *
 * Updates athlete consent for weekly chat summaries
 *
 * Body: { consentChatSummaries: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an athlete
    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      select: {
        userId: true,
        consentChatSummaries: true,
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'User is not an athlete' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { consentChatSummaries } = body;

    if (typeof consentChatSummaries !== 'boolean') {
      return NextResponse.json(
        { error: 'consentChatSummaries must be a boolean' },
        { status: 400 }
      );
    }

    // Check if this is a change (don't update if same value)
    if (athlete.consentChatSummaries === consentChatSummaries) {
      return NextResponse.json({
        message: 'Consent unchanged',
        consentChatSummaries,
      });
    }

    // Update athlete consent
    const updatedAthlete = await prisma.athlete.update({
      where: { userId: session.user.id },
      data: { consentChatSummaries },
    });

    console.log(
      \`[Consent] Athlete \${session.user.id} \${consentChatSummaries ? 'granted' : 'revoked'} consent for chat summaries\`
    );

    // If revoking consent, mark all existing summaries as revoked
    if (!consentChatSummaries) {
      const now = new Date();

      const revokedSummaries = await prisma.chatSummary.updateMany({
        where: {
          athleteId: session.user.id,
          summaryType: 'WEEKLY',
          revokedAt: null, // Only update summaries not already revoked
        },
        data: {
          revokedAt: now,
          expiresAt: now, // Immediate deletion by cleanup job
        },
      });

      console.log(
        \`[Consent] Marked \${revokedSummaries.count} summaries as revoked for athlete \${session.user.id}\`
      );

      // Log revocation to audit trail
      await logSummaryRevocation(session.user.id, revokedSummaries.count);
    }

    // Log consent update to audit trail
    const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'))?.split(',')[0];
    await logConsentUpdate(
      session.user.id,
      consentChatSummaries,
      ipAddress
    );

    return NextResponse.json({
      message: consentChatSummaries
        ? 'Consent granted for weekly chat summaries'
        : 'Consent revoked for weekly chat summaries',
      consentChatSummaries,
      revokedCount: consentChatSummaries ? 0 : undefined,
    });
  } catch (error: any) {
    console.error('[Consent API] Error updating consent:', error);

    return NextResponse.json(
      {
        error: 'Failed to update consent',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/athlete/consent
 *
 * Retrieves current consent status for the authenticated athlete
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get athlete consent status
    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      select: {
        consentChatSummaries: true,
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'User is not an athlete' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      consentChatSummaries: athlete.consentChatSummaries,
    });
  } catch (error: any) {
    console.error('[Consent API] Error fetching consent:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch consent',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
