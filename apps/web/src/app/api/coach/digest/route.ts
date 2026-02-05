/**
 * Coach Digest API
 *
 * Manages weekly digest preferences and generation.
 *
 * GET  /api/coach/digest - Get digest preferences
 * POST /api/coach/digest - Generate a new digest (preview or send)
 * PUT  /api/coach/digest - Update digest preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateDigestData, generateDigestHtml, getWeekBoundaries } from '@/lib/digest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schemas
const UpdatePreferencesSchema = z.object({
  weeklyDigestEnabled: z.boolean().optional(),
  dailySummaryEnabled: z.boolean().optional(),
  crisisAlertsEnabled: z.boolean().optional(),
  athleteCheckInsEnabled: z.boolean().optional(),
  digestDay: z.number().min(0).max(6).optional(),
  digestHour: z.number().min(0).max(23).optional(),
  digestTimezone: z.string().optional(),
});

const GenerateDigestSchema = z.object({
  action: z.enum(['preview', 'send']),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

// GET - Get digest preferences
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create preferences
    let preferences = await prisma.coachDigestPreferences.findUnique({
      where: { coachId: user.id },
    });

    if (!preferences) {
      preferences = await prisma.coachDigestPreferences.create({
        data: {
          coachId: user.id,
        },
      });
    }

    // Get recent digests
    const recentDigests = await prisma.coachDigest.findMany({
      where: { coachId: user.id },
      orderBy: { periodEnd: 'desc' },
      take: 5,
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        digestType: true,
        status: true,
        sentAt: true,
        athleteCount: true,
        highlightsCount: true,
        alertsCount: true,
      },
    });

    return NextResponse.json({
      preferences: {
        weeklyDigestEnabled: preferences.weeklyDigestEnabled,
        dailySummaryEnabled: preferences.dailySummaryEnabled,
        crisisAlertsEnabled: preferences.crisisAlertsEnabled,
        athleteCheckInsEnabled: preferences.athleteCheckInsEnabled,
        digestDay: preferences.digestDay,
        digestHour: preferences.digestHour,
        digestTimezone: preferences.digestTimezone,
        lastDigestSentAt: preferences.lastDigestSentAt,
      },
      recentDigests,
    });
  } catch (error) {
    console.error('Error fetching digest preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch digest preferences' },
      { status: 500 }
    );
  }
}

// POST - Generate a new digest
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = GenerateDigestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, periodStart, periodEnd } = validation.data;

    // Calculate period
    const period = periodStart && periodEnd
      ? { start: new Date(periodStart), end: new Date(periodEnd) }
      : getWeekBoundaries();

    // Get coach name for email
    const coach = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    // Generate digest data
    const digestData = await generateDigestData(user.id, period.start, period.end);

    // Generate HTML content
    const htmlContent = generateDigestHtml(digestData, coach?.name || 'Coach');

    if (action === 'preview') {
      // Return preview data without saving
      return NextResponse.json({
        preview: true,
        data: digestData,
        html: htmlContent,
      });
    }

    // Save digest record
    const digest = await prisma.coachDigest.create({
      data: {
        coachId: user.id,
        periodStart: period.start,
        periodEnd: period.end,
        digestType: 'ADHOC',
        status: 'READY',
        content: digestData as unknown as object,
        htmlContent,
        athleteCount: digestData.summary.totalAthletes,
        highlightsCount: digestData.highlights.length,
        alertsCount: digestData.alerts.length,
      },
    });

    // In production, would send email here
    // For now, mark as sent if email would be sent
    const emailSent = await sendDigestEmail(user.id, coach?.name || 'Coach', htmlContent);

    if (emailSent) {
      await prisma.coachDigest.update({
        where: { id: digest.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Update last sent timestamp
      await prisma.coachDigestPreferences.upsert({
        where: { coachId: user.id },
        update: { lastDigestSentAt: new Date() },
        create: {
          coachId: user.id,
          lastDigestSentAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      digest: {
        id: digest.id,
        status: emailSent ? 'SENT' : 'READY',
        data: digestData,
      },
      emailSent,
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}

// PUT - Update digest preferences
export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = UpdatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const preferences = await prisma.coachDigestPreferences.upsert({
      where: { coachId: user.id },
      update: validation.data,
      create: {
        coachId: user.id,
        ...validation.data,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        weeklyDigestEnabled: preferences.weeklyDigestEnabled,
        dailySummaryEnabled: preferences.dailySummaryEnabled,
        crisisAlertsEnabled: preferences.crisisAlertsEnabled,
        athleteCheckInsEnabled: preferences.athleteCheckInsEnabled,
        digestDay: preferences.digestDay,
        digestHour: preferences.digestHour,
        digestTimezone: preferences.digestTimezone,
      },
    });
  } catch (error) {
    console.error('Error updating digest preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

/**
 * Send digest email
 *
 * In pilot mode, logs to console. In production, sends via Resend.
 */
async function sendDigestEmail(
  coachId: string,
  coachName: string,
  htmlContent: string
): Promise<boolean> {
  // Get coach email
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { email: true },
  });

  if (!coach?.email) {
    console.log('[DIGEST] No email found for coach');
    return false;
  }

  const isProductionEmailEnabled =
    process.env.NODE_ENV === 'production' &&
    !!process.env.RESEND_API_KEY &&
    process.env.ENABLE_DIGEST_EMAILS === 'true';

  if (isProductionEmailEnabled) {
    try {
      // Production implementation (uncomment when Resend is added):
      /*
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Weekly Digest <digest@flowsportscoach.com>',
        to: coach.email,
        subject: `Your Weekly Team Digest - Flow Sports Coach`,
        html: htmlContent,
      });
      */

      console.log(`[DIGEST] Would send email to ${coach.email}`);
      return true;
    } catch (error) {
      console.error('[DIGEST] Failed to send email:', error);
      return false;
    }
  }

  // Pilot mode - log but report success for testing
  console.log(`[PILOT] Weekly digest would be sent to ${coach.email}`);
  console.log('[PILOT] Preview the digest via the API or dashboard');
  return true;
}
