/**
 * Wearable Connect API
 * Initiate OAuth flow for wearable devices
 *
 * GET - Start OAuth flow and redirect to provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/auth-helpers';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// OAuth configuration for supported providers
const PROVIDER_CONFIG: Record<
  string,
  { authUrl: string; clientId: string | undefined; scopes: string[] }
> = {
  WHOOP: {
    authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    clientId: process.env.WHOOP_CLIENT_ID,
    scopes: ['read:profile', 'read:recovery', 'read:sleep', 'read:workout', 'read:cycles'],
  },
  GARMIN: {
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    clientId: process.env.GARMIN_CLIENT_ID,
    scopes: ['activity', 'health'],
  },
  OURA: {
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    clientId: process.env.OURA_CLIENT_ID,
    scopes: ['daily', 'heartrate', 'workout', 'sleep', 'personal'],
  },
  FITBIT: {
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    clientId: process.env.FITBIT_CLIENT_ID,
    scopes: ['activity', 'heartrate', 'sleep', 'profile'],
  },
};

const querySchema = z.object({
  provider: z.enum(['WHOOP', 'GARMIN', 'OURA', 'FITBIT', 'POLAR', 'APPLE_HEALTH']),
});

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const providerParam = searchParams.get('provider');

    const validated = querySchema.safeParse({ provider: providerParam });

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid provider. Supported: WHOOP, GARMIN, OURA, FITBIT' },
        { status: 400 }
      );
    }

    const provider = validated.data.provider;
    const config = PROVIDER_CONFIG[provider];

    if (!config || !config.clientId) {
      return NextResponse.json(
        { error: `${provider} integration is not configured` },
        { status: 501 }
      );
    }

    // Generate state for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        provider,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/wearables/callback`;

    // Build OAuth URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      provider,
    });
  } catch (error) {
    console.error('Wearable connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
