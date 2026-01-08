/**

 * Coach Invite Code API
 * Returns invite code for athletes to join coach's team
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Mock invite code for demo coach
    const mockData = {
      inviteCode: 'DEMO-COACH-2024',
      coachName: 'Demo Coach',
      sport: 'Basketball',
      athleteCount: 18,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      usageCount: 12,
      maxUses: null, // unlimited
    };

    return NextResponse.json({ data: mockData });
  } catch (error) {
    console.error('Invite code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Mock response for generating new invite code
    const mockData = {
      inviteCode: 'DEMO-COACH-' + Math.random().toString(36).substring(7).toUpperCase(),
      coachName: 'Demo Coach',
      sport: 'Basketball',
      athleteCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 0,
      maxUses: null,
    };

    return NextResponse.json({ data: mockData });
  } catch (error) {
    console.error('Invite code generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
