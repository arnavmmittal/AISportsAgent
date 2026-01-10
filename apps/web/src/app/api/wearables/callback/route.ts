/**
 * Wearable OAuth Callback API
 * Handle OAuth callback from wearable providers
 *
 * GET - Handle OAuth callback, exchange code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Token endpoint configuration
const TOKEN_ENDPOINTS: Record<string, string> = {
  WHOOP: 'https://api.prod.whoop.com/oauth/oauth2/token',
  GARMIN: 'https://connect.garmin.com/oauth-service/oauth/token',
  OURA: 'https://cloud.ouraring.com/oauth/token',
  FITBIT: 'https://api.fitbit.com/oauth2/token',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // Build redirect URL for frontend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/student/settings', baseUrl);

    if (error) {
      redirectUrl.searchParams.set('wearable_error', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !stateParam) {
      redirectUrl.searchParams.set('wearable_error', 'missing_params');
      return NextResponse.redirect(redirectUrl);
    }

    // Decode state
    let state: { userId: string; provider: string; timestamp: number };
    try {
      state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    } catch {
      redirectUrl.searchParams.set('wearable_error', 'invalid_state');
      return NextResponse.redirect(redirectUrl);
    }

    // Validate timestamp (5 minutes max)
    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
      redirectUrl.searchParams.set('wearable_error', 'expired');
      return NextResponse.redirect(redirectUrl);
    }

    const { userId, provider } = state;

    // Exchange code for tokens
    const tokenEndpoint = TOKEN_ENDPOINTS[provider];
    if (!tokenEndpoint) {
      redirectUrl.searchParams.set('wearable_error', 'unsupported_provider');
      return NextResponse.redirect(redirectUrl);
    }

    const clientId = process.env[`${provider}_CLIENT_ID`];
    const clientSecret = process.env[`${provider}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      redirectUrl.searchParams.set('wearable_error', 'not_configured');
      return NextResponse.redirect(redirectUrl);
    }

    const callbackUrl = `${baseUrl}/api/wearables/callback`;

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      redirectUrl.searchParams.set('wearable_error', 'token_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const tokenExpiry = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Upsert the wearable connection
    await prisma.wearableConnection.upsert({
      where: { athleteId: userId },
      create: {
        athleteId: userId,
        provider: provider as any,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        syncStatus: 'PENDING',
      },
      update: {
        provider: provider as any,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        syncStatus: 'PENDING',
        syncError: null,
      },
    });

    redirectUrl.searchParams.set('wearable_connected', provider);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Wearable callback error:', error);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/student/settings', baseUrl);
    redirectUrl.searchParams.set('wearable_error', 'server_error');

    return NextResponse.redirect(redirectUrl);
  }
}
