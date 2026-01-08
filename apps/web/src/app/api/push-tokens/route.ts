/**

 * Push Token Registration API
 * Allows mobile devices to register/update their push notification tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const pushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
  deviceType: z.enum(['ios', 'android']).optional(),
  deviceName: z.string().optional(),
});

// POST /api/push-tokens - Register or update push token
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = pushTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { token, deviceType, deviceName } = validationResult.data;

    // Upsert push token (update if exists, create if not)
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: user.id,
        deviceType,
        deviceName,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        token,
        deviceType,
        deviceName,
      },
    });

    console.log(`[Push Token] Registered token for user ${user.id}: ${deviceType || 'unknown'} device`);

    return NextResponse.json({
      success: true,
      tokenId: pushToken.id,
      message: 'Push token registered successfully',
    });

  } catch (error) {
    console.error('[Push Token] Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

// DELETE /api/push-tokens - Unregister push token (on logout)
export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get token from query or body
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter required' },
        { status: 400 }
      );
    }

    // Delete token (only if it belongs to this user)
    const result = await prisma.pushToken.deleteMany({
      where: {
        token,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Token not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log(`[Push Token] Unregistered token for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Push token unregistered successfully',
    });

  } catch (error) {
    console.error('[Push Token] Unregister error:', error);
    return NextResponse.json(
      { error: 'Failed to unregister push token' },
      { status: 500 }
    );
  }
}

// GET /api/push-tokens - Get all registered tokens for current user
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all tokens for this user
    const tokens = await prisma.pushToken.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        token: true,
        deviceType: true,
        deviceName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      tokens,
      count: tokens.length,
    });

  } catch (error) {
    console.error('[Push Token] Get tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to get push tokens' },
      { status: 500 }
    );
  }
}
