/**
 * Coach Invite Code Regenerate API
 * Generates a new invite code for the coach
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Generate new invite code
    const newInviteCode = `COACH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Update coach's invite code
    const coach = await prisma.coach.update({
      where: { userId: user.id },
      data: {
        inviteCode: newInviteCode,
      },
      include: {
        User: {
          select: {
            name: true,
          },
        },
        CoachAthletes: {
          where: {
            consentGranted: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        inviteCode: coach.inviteCode,
        coachName: coach.User.name,
        sport: coach.sport,
        athleteCount: coach.CoachAthletes.length,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        usageCount: coach.CoachAthletes.length,
        maxUses: null, // unlimited
      },
    });
  } catch (error) {
    console.error('Invite code regeneration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
