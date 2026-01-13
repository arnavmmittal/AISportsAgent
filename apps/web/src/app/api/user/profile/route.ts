import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Fetches full user profile from database
 * Used by useAuth hook to get extended user data (role, name, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Get userId from query param or from authenticated session
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // If no userId provided, try to get from Supabase session
    if (!userId) {
      const supabaseUser = await getUser();
      userId = supabaseUser?.id || null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify the request is for the authenticated user (security check)
    const supabaseUser = await getUser();
    if (supabaseUser?.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Cannot access other user profiles' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        Athlete: {
          select: {
            userId: true,
            sport: true,
            year: true,
            teamPosition: true,
          },
        },
        Coach: {
          select: {
            userId: true,
            sport: true,
            title: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform response to match UserProfile interface
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      athlete: user.Athlete,
      coach: user.Coach,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
