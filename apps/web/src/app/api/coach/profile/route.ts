/**
 * Coach Profile API
 * Returns and updates coach profile information
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      include: {
        User: {
          select: {
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        CoachAthletes: {
          where: {
            consentGranted: true,
          },
          include: {
            Athlete: {
              include: {
                User: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    // Return profile data
    return NextResponse.json({
      profile: {
        name: coach.User.name,
        email: coach.User.email,
        image: coach.User.image,
        sport: coach.sport,
        title: coach.title,
        inviteCode: coach.inviteCode,
        athleteCount: coach.CoachAthletes.length,
        joinedAt: coach.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    const body = await request.json();
    const { name, title, sport, image } = body;

    // Update user name and image
    if (name || image) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(image && { image }),
        },
      });
    }

    // Update coach profile
    if (title || sport) {
      await prisma.coach.update({
        where: { userId: user.id },
        data: {
          ...(title && { title }),
          ...(sport && { sport }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
