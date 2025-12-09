import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateConsentSchema = z.object({
  consentChatSummaries: z.boolean().optional(),
  consentCoachView: z.boolean().optional(),
});

// GET /api/athlete/consent - Get athlete's consent settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      select: {
        consentChatSummaries: true,
        consentCoachView: true,
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ consent: athlete });

  } catch (error) {
    console.error('Error fetching consent settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent settings' },
      { status: 500 }
    );
  }
}

// PUT /api/athlete/consent - Update athlete's consent settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify user is an athlete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { athlete: true },
    });

    if (!user || user.role !== 'ATHLETE' || !user.athlete) {
      return NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateConsentSchema.safeParse(body);

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

    // Update consent settings
    const updateData: any = {};
    if (data.consentChatSummaries !== undefined) {
      updateData.consentChatSummaries = data.consentChatSummaries;
    }
    if (data.consentCoachView !== undefined) {
      updateData.consentCoachView = data.consentCoachView;
    }

    const updatedAthlete = await prisma.athlete.update({
      where: { userId: session.user.id },
      data: updateData,
      select: {
        consentChatSummaries: true,
        consentCoachView: true,
      },
    });

    return NextResponse.json({
      consent: updatedAthlete,
      message: 'Consent settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating consent settings:', error);
    return NextResponse.json(
      { error: 'Failed to update consent settings' },
      { status: 500 }
    );
  }
}
