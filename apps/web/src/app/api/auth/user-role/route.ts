/**
 * Get user role by ID
 * Used by signin page to determine redirect destination
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering (uses searchParams)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Require authentication — only return role for the authenticated user
    const { authorized, user: authUser, response } = await requireAuth(req);
    if (!authorized) return response;

    return NextResponse.json({ role: authUser!.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    // Return detailed error in staging for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal error',
      details: process.env.NEXT_PUBLIC_ENV === 'staging' ? errorMessage : undefined
    }, { status: 500 });
  }
}
