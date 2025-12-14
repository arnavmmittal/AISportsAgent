/**
 * Coach Invite Code API
 * GET: Returns coach's invite code (generates if missing)
 * POST: Allows athletes to join using invite code
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { randomBytes } from 'crypto';

/**
 * Generate a readable invite code (8 characters, alphanumeric uppercase)
 * Format: ABCD1234
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove ambiguous chars (I, O, 0, 1)
  let code = '';
  const bytes = randomBytes(8);

  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * GET /api/coach/invite-code
 * Returns the coach's invite code (generates one if it doesn't exist)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches can get invite codes
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Get coach profile
    let coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            CoachAthletes: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Generate invite code if missing
    if (!coach.inviteCode) {
      let newCode = generateInviteCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure uniqueness
      while (attempts < maxAttempts) {
        const existing = await prisma.coach.findUnique({
          where: { inviteCode: newCode },
        });

        if (!existing) break;

        newCode = generateInviteCode();
        attempts++;
      }

      if (attempts === maxAttempts) {
        return NextResponse.json(
          { error: 'Failed to generate unique invite code. Please try again.' },
          { status: 500 }
        );
      }

      // Update coach with new invite code
      coach = await prisma.coach.update({
        where: { userId: user!.id },
        data: { inviteCode: newCode },
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              CoachAthletes: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        inviteCode: coach.inviteCode,
        coachName: coach.User.name,
        sport: coach.sport,
        athleteCount: coach._count.CoachAthletes,
      },
    });
  } catch (error) {
    console.error('Error fetching invite code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite code' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coach/invite-code
 * Allows athletes to join a coach using an invite code
 * Body: { inviteCode: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only athletes can join using invite codes
    if (user!.role !== 'ATHLETE') {
      return NextResponse.json(
        { error: 'Only athletes can use invite codes' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find coach by invite code
    const coach = await prisma.coach.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        User: {
          select: {
            name: true,
            email: true,
            School: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Verify athlete profile exists
    const athlete = await prisma.athlete.findUnique({
      where: { userId: user!.id },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete profile not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.coachAthleteRelation.findUnique({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: user!.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'You are already connected to this coach',
          data: {
            coachName: coach.User.name,
            sport: coach.sport,
            joinedAt: existing.joinedAt,
          }
        },
        { status: 409 }
      );
    }

    // Create coach-athlete relationship
    const relation = await prisma.coachAthleteRelation.create({
      data: {
        coachId: coach.userId,
        athleteId: user!.id,
        consentGranted: false, // Default to false, athlete can grant later
      },
      include: {
        Coach: {
          select: {
            sport: true,
            title: true,
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${coach.User.name}`,
      data: {
        coachName: coach.User.name,
        sport: coach.sport,
        title: coach.title,
        joinedAt: relation.joinedAt,
        consentGranted: relation.consentGranted,
      },
    });
  } catch (error) {
    console.error('Error joining coach:', error);
    return NextResponse.json(
      { error: 'Failed to join coach' },
      { status: 500 }
    );
  }
}
