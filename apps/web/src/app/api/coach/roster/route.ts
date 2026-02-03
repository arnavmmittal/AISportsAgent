/**
 * Coach Bulk Roster API
 *
 * Bulk operations for managing large rosters (150+ athletes).
 *
 * GET  /api/coach/roster?export=csv - Export roster to CSV
 * POST /api/coach/roster - Bulk import athletes from CSV data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for bulk import
const BulkImportSchema = z.object({
  athletes: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    sport: z.string().min(1),
    year: z.string().optional(),
    position: z.string().optional(),
  })),
  sendInvites: z.boolean().default(false),
});

// GET - Export roster to CSV
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get('export');

    // Get all athletes for this coach
    const relations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user.id },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true, email: true } },
          },
        },
      },
    });

    // Also get coach's invite code for reference
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { inviteCode: true, sport: true },
    });

    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = [
        'Athlete ID',
        'Name',
        'Email',
        'Sport',
        'Year',
        'Position',
        'Consent Granted',
        'Risk Level',
        'Joined Date',
      ];

      const rows = relations.map((rel) => [
        rel.athleteId,
        rel.Athlete?.User?.name || '',
        rel.Athlete?.User?.email || '',
        rel.Athlete?.sport || '',
        rel.Athlete?.year || '',
        rel.Athlete?.teamPosition || '',
        rel.consentGranted ? 'Yes' : 'No',
        rel.Athlete?.riskLevel || 'LOW',
        rel.joinedAt.toISOString().split('T')[0],
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="roster-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON roster summary
    return NextResponse.json({
      totalAthletes: relations.length,
      consentedAthletes: relations.filter((r) => r.consentGranted).length,
      inviteCode: coach?.inviteCode,
      sport: coach?.sport,
      athletes: relations.map((rel) => ({
        id: rel.athleteId,
        name: rel.Athlete?.User?.name || null,
        email: rel.Athlete?.User?.email || null,
        sport: rel.Athlete?.sport || null,
        year: rel.Athlete?.year || null,
        position: rel.Athlete?.teamPosition || null,
        consentGranted: rel.consentGranted,
        riskLevel: rel.Athlete?.riskLevel || 'LOW',
        joinedAt: rel.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roster' },
      { status: 500 }
    );
  }
}

// POST - Bulk import athletes
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = BulkImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { athletes, sendInvites } = validation.data;

    // Get coach info with school
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { sport: true, inviteCode: true, User: { select: { schoolId: true } } },
    });

    if (!coach?.User?.schoolId) {
      return NextResponse.json({ error: 'Coach school not found' }, { status: 404 });
    }

    const schoolId = coach.User.schoolId;

    const results: {
      created: Array<{ name: string; email: string; status: string }>;
      existing: Array<{ name: string; email: string; status: string }>;
      errors: Array<{ name: string; email: string; error: string }>;
    } = {
      created: [],
      existing: [],
      errors: [],
    };

    for (const athlete of athletes) {
      try {
        // Check if user already exists
        let existingUser = await prisma.user.findUnique({
          where: { email: athlete.email },
        });

        if (existingUser) {
          // Check if athlete record exists
          const existingAthlete = await prisma.athlete.findUnique({
            where: { userId: existingUser.id },
          });

          if (existingAthlete) {
            // Check if already connected to this coach
            const existingRelation = await prisma.coachAthleteRelation.findFirst({
              where: {
                coachId: user.id,
                athleteId: existingUser.id,
              },
            });

            if (existingRelation) {
              results.existing.push({
                name: athlete.name,
                email: athlete.email,
                status: 'Already on roster',
              });
              continue;
            }

            // Create connection
            await prisma.coachAthleteRelation.create({
              data: {
                coachId: user.id,
                athleteId: existingUser.id,
                consentGranted: false,
              },
            });

            results.existing.push({
              name: athlete.name,
              email: athlete.email,
              status: 'Connected existing athlete',
            });
          } else {
            // User exists but no athlete record - create one
            await prisma.athlete.create({
              data: {
                userId: existingUser.id,
                sport: athlete.sport || coach?.sport || 'General',
                year: athlete.year || 'Unknown',
                teamPosition: athlete.position,
              },
            });

            await prisma.coachAthleteRelation.create({
              data: {
                coachId: user.id,
                athleteId: existingUser.id,
                consentGranted: false,
              },
            });

            results.created.push({
              name: athlete.name,
              email: athlete.email,
              status: 'Created athlete profile and connected',
            });
          }
        } else {
          // Create new user and athlete
          const newUser = await prisma.user.create({
            data: {
              email: athlete.email,
              name: athlete.name,
              role: 'ATHLETE',
              schoolId,
            },
          });

          await prisma.athlete.create({
            data: {
              userId: newUser.id,
              sport: athlete.sport || coach?.sport || 'General',
              year: athlete.year || 'Unknown',
              teamPosition: athlete.position,
            },
          });

          await prisma.coachAthleteRelation.create({
            data: {
              coachId: user.id,
              athleteId: newUser.id,
              consentGranted: false,
            },
          });

          results.created.push({
            name: athlete.name,
            email: athlete.email,
            status: sendInvites ? 'Created and invite pending' : 'Created (no invite sent)',
          });

          // TODO: Send invite email if sendInvites is true
          if (sendInvites) {
            await sendAthleteInvite(athlete.email, athlete.name, coach?.inviteCode || '');
          }
        }
      } catch (error) {
        console.error(`Error processing athlete ${athlete.email}:`, error);
        results.errors.push({
          name: athlete.name,
          email: athlete.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: athletes.length,
        created: results.created.length,
        existing: results.existing.length,
        errors: results.errors.length,
      },
      results,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}

/**
 * Send athlete invite email
 *
 * In pilot mode, logs to console. In production, sends via Resend.
 */
async function sendAthleteInvite(
  email: string,
  name: string,
  inviteCode: string
): Promise<void> {
  const isProductionEmailEnabled =
    process.env.NODE_ENV === 'production' &&
    !!process.env.RESEND_API_KEY &&
    process.env.ENABLE_INVITE_EMAILS === 'true';

  const inviteUrl = `${process.env.NEXTAUTH_URL || 'https://app.aisportsagent.com'}/auth/signup?code=${inviteCode}`;

  if (isProductionEmailEnabled) {
    try {
      // Production implementation (uncomment when Resend is added):
      /*
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'AI Sports Agent <invites@aisportsagent.com>',
        to: email,
        subject: `You're invited to AI Sports Agent`,
        html: `
          <h2>Hi ${name}!</h2>
          <p>Your coach has invited you to join AI Sports Agent - your 24/7 AI mental performance partner.</p>
          <p>
            <a href="${inviteUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p>Or use this invite code during signup: <strong>${inviteCode}</strong></p>
        `,
      });
      */

      console.log(`[INVITE] Would send email to ${email}`);
    } catch (error) {
      console.error('[INVITE] Failed to send email:', error);
    }
  } else {
    console.log(`[PILOT] Invite would be sent to ${email} with code ${inviteCode}`);
  }
}
