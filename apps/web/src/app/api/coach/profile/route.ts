/**
 * Coach Profile API
 * GET: Fetch coach profile (user + coach data)
 * PUT: Update coach profile (name, email, sport, teamName/title)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) {
      return response;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        Coach: {
          select: {
            sport: true,
            title: true,
          },
        },
        School: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        name: dbUser.name,
        email: dbUser.email,
        sport: dbUser.Coach?.sport || '',
        teamName: dbUser.School?.name || dbUser.Coach?.title || '',
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) {
      return response;
    }

    const body = await request.json();
    const { name, email, sport, teamName } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
      select: {
        name: true,
        email: true,
      },
    });

    // Update coach record if sport or title provided
    if (sport !== undefined || teamName !== undefined) {
      const coachData: Record<string, string> = {};
      if (sport !== undefined) coachData.sport = sport;
      if (teamName !== undefined) coachData.title = teamName;

      await prisma.coach.update({
        where: { userId: user.id },
        data: coachData,
      });
    }

    return NextResponse.json({
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        sport: sport || '',
        teamName: teamName || '',
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
