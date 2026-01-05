/**

 * Athlete Coach Consent API
 * Manages athlete consent for sharing data with coaches
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/athlete/coach-consent
 * Returns list of coaches the athlete is connected to and consent status
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only athletes can access
    if (user!.role !== 'ATHLETE') {
      return NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      );
    }

    // Get all coach relationships
    const relations = await prisma.coachAthleteRelation.findMany({
      where: { athleteId: user!.id },
      include: {
        Coach: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: relations.map((rel) => ({
        id: rel.id,
        coachId: rel.coachId,
        coachName: rel.Coach.User.name,
        coachEmail: rel.Coach.User.email,
        sport: rel.Coach.sport,
        title: rel.Coach.title,
        joinedAt: rel.joinedAt,
        consentGranted: rel.consentGranted,
      })),
    });
  } catch (error) {
    console.error('Error fetching coach relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach relationships' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/athlete/coach-consent
 * Updates consent status for a specific coach
 * Body: { relationId: string, consentGranted: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only athletes can update consent
    if (user!.role !== 'ATHLETE') {
      return NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { relationId, consentGranted } = body;

    if (!relationId || typeof consentGranted !== 'boolean') {
      return NextResponse.json(
        { error: 'relationId and consentGranted are required' },
        { status: 400 }
      );
    }

    // Verify the relationship belongs to this athlete
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: { id: relationId },
      include: {
        Coach: {
          include: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Coach relationship not found' },
        { status: 404 }
      );
    }

    if (relation.athleteId !== user!.id) {
      return NextResponse.json(
        { error: 'Forbidden - This relationship does not belong to you' },
        { status: 403 }
      );
    }

    // Update consent
    const updated = await prisma.coachAthleteRelation.update({
      where: { id: relationId },
      data: { consentGranted },
    });

    return NextResponse.json({
      success: true,
      message: consentGranted
        ? `You have granted ${relation.Coach.User.name} access to view your data`
        : `You have revoked ${relation.Coach.User.name}'s access to your data`,
      data: {
        relationId: updated.id,
        consentGranted: updated.consentGranted,
      },
    });
  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/athlete/coach-consent
 * Removes a coach-athlete relationship
 * Body: { relationId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only athletes can remove relationships
    if (user!.role !== 'ATHLETE') {
      return NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { relationId } = body;

    if (!relationId) {
      return NextResponse.json(
        { error: 'relationId is required' },
        { status: 400 }
      );
    }

    // Verify the relationship belongs to this athlete
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: { id: relationId },
      include: {
        Coach: {
          include: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Coach relationship not found' },
        { status: 404 }
      );
    }

    if (relation.athleteId !== user!.id) {
      return NextResponse.json(
        { error: 'Forbidden - This relationship does not belong to you' },
        { status: 403 }
      );
    }

    // Delete relationship
    await prisma.coachAthleteRelation.delete({
      where: { id: relationId },
    });

    return NextResponse.json({
      success: true,
      message: `You have disconnected from ${relation.Coach.User.name}`,
    });
  } catch (error) {
    console.error('Error removing coach relationship:', error);
    return NextResponse.json(
      { error: 'Failed to remove coach relationship' },
      { status: 500 }
    );
  }
}
