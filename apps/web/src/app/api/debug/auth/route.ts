import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check auth state
 * GET /api/debug/auth - Check if current Supabase user exists in Prisma
 *
 * SECURITY: Requires authentication and is disabled in production by default
 */
export async function GET(req: NextRequest) {
  // Block in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 404 });
  }

  // Require at least basic authentication
  const { authorized, response } = await requireAuth(req);
  if (!authorized) return response!;
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseUser: null,
    prismaUser: null,
    prismaAthlete: null,
    match: false,
    error: null,
  };

  try {
    // Get Supabase auth user
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      results.error = `Supabase auth error: ${authError.message}`;
      return NextResponse.json(results);
    }

    if (!supabaseUser) {
      results.error = 'No Supabase user session found - user not logged in';
      return NextResponse.json(results);
    }

    results.supabaseUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      createdAt: supabaseUser.created_at,
    };

    // Check if this user exists in Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
      },
    });

    if (!prismaUser) {
      // Try to find by email instead
      const userByEmail = await prisma.user.findUnique({
        where: { email: supabaseUser.email! },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      results.error = `Supabase user ID not found in Prisma database. User may need to be re-seeded.`;
      results.prismaUserByEmail = userByEmail ? {
        id: userByEmail.id,
        email: userByEmail.email,
        message: 'User exists by email but with different ID - database is out of sync with Supabase Auth',
      } : 'No user found by email either';

      return NextResponse.json(results);
    }

    results.prismaUser = prismaUser;
    results.match = true;

    // Check if athlete record exists
    if (prismaUser.role === 'ATHLETE') {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: prismaUser.id },
        select: {
          userId: true,
          sport: true,
          year: true,
        },
      });
      results.prismaAthlete = athlete || 'No athlete record found';
    }

    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
}
