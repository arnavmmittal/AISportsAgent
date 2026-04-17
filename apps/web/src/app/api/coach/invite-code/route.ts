/**
 * Coach Invite Code API
 * GET: Return the coach's existing invite code from the database
 * POST: Generate a new random invite code and save it to the coach record
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generate a secure random 8-character alphanumeric invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: {
        inviteCode: true,
        sport: true,
        User: {
          select: { name: true },
        },
        CoachAthletes: {
          select: { id: true },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach record not found' },
        { status: 404 }
      );
    }

    // If no invite code exists yet, generate one
    let inviteCode = coach.inviteCode;
    if (!inviteCode) {
      inviteCode = generateInviteCode();
      await prisma.coach.update({
        where: { userId: user.id },
        data: { inviteCode },
      });
    }

    return NextResponse.json({
      data: {
        inviteCode,
        coachName: coach.User.name,
        sport: coach.sport,
        athleteCount: coach.CoachAthletes.length,
      },
    });
  } catch (error) {
    console.error('Invite code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Generate a new unique invite code with retry for uniqueness
    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      inviteCode = generateInviteCode();
      const existing = await prisma.coach.findFirst({
        where: { inviteCode },
        select: { userId: true },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code. Please try again.' },
        { status: 500 }
      );
    }

    // Save the new invite code
    const updatedCoach = await prisma.coach.update({
      where: { userId: user.id },
      data: { inviteCode },
      select: {
        inviteCode: true,
        sport: true,
        User: {
          select: { name: true },
        },
        CoachAthletes: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      data: {
        inviteCode: updatedCoach.inviteCode,
        coachName: updatedCoach.User.name,
        sport: updatedCoach.sport,
        athleteCount: updatedCoach.CoachAthletes.length,
      },
    });
  } catch (error) {
    console.error('Invite code generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
