/**
 * Auth Helper Functions - Server-side authentication utilities
 *
 * Use these helpers in API routes to verify permissions and enforce
 * role-based access control.
 *
 * Supports both Supabase Auth sessions (web) and JWT tokens (mobile)
 */

import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getUser as getSupabaseUser } from './supabase-server';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
}

export interface AuthSession {
  user: AuthUser;
}

export interface AuthResult {
  authorized: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  response?: NextResponse;
}

/**
 * Get user data from Supabase auth user
 * Fetches full user profile from database
 */
async function getUserFromSupabase(supabaseUserId: string): Promise<AuthUser | null> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUserId },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
      },
    });

    if (!dbUser) {
      console.error('User found in Supabase but not in database:', supabaseUserId);
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      schoolId: dbUser.schoolId || '',
    };
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

/**
 * Verify authentication from either JWT token (mobile) or Supabase session (web)
 */
export async function verifyAuthFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Check for Bearer token (mobile app)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload as unknown as AuthUser;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Fall back to Supabase session (web app)
  try {
    const supabaseUser = await getSupabaseUser();
    if (supabaseUser?.id) {
      return await getUserFromSupabase(supabaseUser.id);
    }
  } catch (error) {
    console.error('Supabase session verification failed:', error);
  }

  return null;
}

/**
 * Require authentication - Any authenticated user (supports both JWT and Supabase session)
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, user, response } = await requireAuth(request);
 * if (!authorized) return response;
 * ```
 */
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  let user: AuthUser | null = null;

  // If request provided, check for JWT token first
  if (request) {
    user = await verifyAuthFromRequest(request);
    if (user) {
      return {
        authorized: true,
        session: { user },
        user,
      };
    }
  } else {
    // Fall back to Supabase session-only auth
    try {
      const supabaseUser = await getSupabaseUser();
      if (supabaseUser?.id) {
        user = await getUserFromSupabase(supabaseUser.id);
        if (user) {
          return {
            authorized: true,
            session: { user },
            user,
          };
        }
      }
    } catch (error) {
      console.error('Supabase auth check failed:', error);
    }
  }

  return {
    authorized: false,
    session: null,
    user: null,
    response: NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    ),
  };
}

/**
 * Require COACH role
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, user, response } = await requireCoach(request);
 * if (!authorized) return response;
 * ```
 */
export async function requireCoach(request?: NextRequest): Promise<AuthResult> {
  const { authorized, session, user, response } = await requireAuth(request);

  if (!authorized) {
    return { authorized: false, session: null, user: null, response };
  }

  if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
    return {
      authorized: false,
      session,
      user,
      response: NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    user,
  };
}

/**
 * Require ADMIN role
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, user, response } = await requireAdmin();
 * if (!authorized) return response;
 * ```
 */
export async function requireAdmin(request?: NextRequest): Promise<AuthResult> {
  const { authorized, session, user, response } = await requireAuth(request);

  if (!authorized) {
    return { authorized: false, session: null, user: null, response };
  }

  if (user!.role !== 'ADMIN') {
    return {
      authorized: false,
      session,
      user,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    user,
  };
}

/**
 * Require ATHLETE role
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, user, response } = await requireAthlete();
 * if (!authorized) return response;
 * ```
 */
export async function requireAthlete(request?: NextRequest): Promise<AuthResult> {
  const { authorized, session, user, response } = await requireAuth(request);

  if (!authorized) {
    return { authorized: false, session: null, user: null, response };
  }

  if (user!.role !== 'ATHLETE' && user!.role !== 'ADMIN') {
    return {
      authorized: false,
      session,
      user,
      response: NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    user,
  };
}

/**
 * Verify user owns resource (e.g., checking if athlete_id matches session user)
 *
 * Usage:
 * ```typescript
 * const { authorized, session, user } = await requireAuth();
 * if (!authorized) return response;
 *
 * if (!verifyOwnership(user, athleteId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function verifyOwnership(user: AuthUser | null, resourceUserId: string): boolean {
  if (!user) return false;

  // Admins can access all resources
  if (user.role === 'ADMIN') return true;

  // Users can only access their own resources
  return user.id === resourceUserId;
}

/**
 * Verify user belongs to the same school as the resource
 *
 * Usage:
 * ```typescript
 * const { authorized, user } = await requireCoach();
 * if (!authorized) return response;
 *
 * if (!verifySchoolAccess(user, athlete.schoolId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function verifySchoolAccess(user: AuthUser | null, resourceSchoolId: string): boolean {
  if (!user) return false;

  // Admins can access all schools
  if (user.role === 'ADMIN') return true;

  // Users can only access resources from their school
  return user.schoolId === resourceSchoolId;
}

/**
 * Get user ID from auth user (convenience function)
 */
export function getUserId(user: AuthUser | null): string | null {
  return user?.id || null;
}

/**
 * Get user role from auth user (convenience function)
 */
export function getUserRole(user: AuthUser | null): string | null {
  return user?.role || null;
}

/**
 * Get school ID from auth user (convenience function)
 */
export function getSchoolId(user: AuthUser | null): string | null {
  return user?.schoolId || null;
}
