import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  sport: z.string().optional(),
  year: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE']).optional(),
  teamPosition: z.string().optional(),
  image: z.string().url().optional().nullable(),
});

// GET /api/athlete/profile - Get athlete's profile
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const userData = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        Athlete: {
          select: {
            sport: true,
            year: true,
            teamPosition: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        ...userData,
        sport: userData.Athlete?.sport,
        year: userData.Athlete?.year,
        teamPosition: userData.Athlete?.teamPosition,
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/athlete/profile - Update athlete's profile
export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}

// PATCH /api/athlete/profile - Update athlete's profile (partial update)
export async function PATCH(request: NextRequest) {
  return handleUpdate(request);
}

async function handleUpdate(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user: authUser, response } = await requireAuth(request);
    if (!authorized) return response;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update User fields (name, image)
    const userUpdateData: any = {};
    if (data.name !== undefined) userUpdateData.name = data.name;
    if (data.image !== undefined) userUpdateData.image = data.image;

    // Update Athlete fields (sport, year, teamPosition)
    const athleteUpdateData: any = {};
    if (data.sport !== undefined) athleteUpdateData.sport = data.sport;
    if (data.year !== undefined) athleteUpdateData.year = data.year;
    if (data.teamPosition !== undefined) athleteUpdateData.teamPosition = data.teamPosition;

    // Perform updates in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update User table if there are user fields to update
      let user = await tx.user.findUnique({ where: { id: authUser!.id } });
      if (Object.keys(userUpdateData).length > 0) {
        user = await tx.user.update({
          where: { id: authUser!.id },
          data: userUpdateData,
        });
      }

      // Update Athlete table if there are athlete fields to update
      let athlete = null;
      if (Object.keys(athleteUpdateData).length > 0) {
        athlete = await tx.athlete.update({
          where: { userId: authUser!.id },
          data: athleteUpdateData,
        });
      } else {
        athlete = await tx.athlete.findUnique({
          where: { userId: authUser!.id },
        });
      }

      return { user, athlete };
    });

    return NextResponse.json({
      profile: {
        id: updatedUser.user!.id,
        name: updatedUser.user!.name,
        email: updatedUser.user!.email,
        image: updatedUser.user!.image,
        role: updatedUser.user!.role,
        sport: updatedUser.athlete?.sport,
        year: updatedUser.athlete?.year,
        teamPosition: updatedUser.athlete?.teamPosition,
      },
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
