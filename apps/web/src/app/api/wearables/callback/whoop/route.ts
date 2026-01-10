/**
 * WHOOP OAuth Callback API
 *
 * GET - Handle OAuth callback from WHOOP
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import whoopClient from '@/lib/wearables/whoop-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('WHOOP OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/wearables?error=${encodeURIComponent(error)}`, process.env.NEXTAUTH_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/wearables?error=missing_params', process.env.NEXTAUTH_URL)
      );
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = decoded.userId;
    } catch {
      return NextResponse.redirect(
        new URL('/wearables?error=invalid_state', process.env.NEXTAUTH_URL)
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/callback/whoop`;
    const tokens = await whoopClient.exchangeCodeForTokens(code, redirectUri);

    // Get WHOOP user info
    const whoopUser = await whoopClient.getUser(tokens.access_token);

    // Create or update wearable connection
    await prisma.wearableConnection.upsert({
      where: { athleteId: userId },
      create: {
        athleteId: userId,
        provider: 'WHOOP',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        syncEnabled: true,
        syncStatus: 'PENDING',
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        syncStatus: 'PENDING',
        syncError: null,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/wearables?success=true', process.env.NEXTAUTH_URL)
    );
  } catch (error) {
    console.error('WHOOP callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/wearables?error=${encodeURIComponent(errorMessage)}`, process.env.NEXTAUTH_URL)
    );
  }
}
