/**

 * Athlete Consent Management API
 *
 * Handles athlete consent for weekly chat summaries
 * - Updates Athlete.consentChatSummaries
 * - Revokes existing summaries when consent is withdrawn
 * - Logs all consent changes to audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logConsentUpdate, logSummaryRevocation } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Verify user is an athlete
    const athlete = await prisma.athlete.findUnique({
      where: { userId: user!.id },
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
      where: { userId: user!.id },
      data: { consentChatSummaries },
    });

    console.log(
      `[Consent] Athlete ${user!.id} ${consentChatSummaries ? 'granted' : 'revoked'} consent for chat summaries`
    );

    // If revoking consent, mark all existing summaries as revoked
    if (!consentChatSummaries) {
      const now = new Date();

      const revokedSummaries = await prisma.chatSummary.updateMany({
        where: {
          athleteId: user!.id,
          summaryType: 'WEEKLY',
          revokedAt: null, // Only update summaries not already revoked
        },
        data: {
          revokedAt: now,
          expiresAt: now, // Immediate deletion by cleanup job
        },
      });

      console.log(
        `[Consent] Marked ${revokedSummaries.count} summaries as revoked for athlete ${user!.id}`
      );

      // Log revocation to audit trail
      await logSummaryRevocation(user!.id, revokedSummaries.count);
    }

    // Log consent update to audit trail
    const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'))?.split(',')[0];
    await logConsentUpdate(
      user!.id,
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
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Get athlete consent status
    const athlete = await prisma.athlete.findUnique({
      where: { userId: user!.id },
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
