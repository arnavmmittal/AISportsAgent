/**
 * WHOOP OAuth Connect API
 *
 * GET - Generate OAuth URL for WHOOP connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WHOOP_OAUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    const clientId = process.env.WHOOP_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'WHOOP not configured' },
        { status: 503 }
      );
    }

    // Build OAuth URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/callback/whoop`;
    const scope = 'read:recovery read:sleep read:workout read:profile read:body_measurement';
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');

    const authUrl = new URL(`${WHOOP_OAUTH_URL}/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      provider: 'WHOOP',
    });
  } catch (error) {
    console.error('WHOOP connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
