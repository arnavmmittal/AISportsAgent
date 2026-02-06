/**
 * Auth Helper Functions - Server-side authentication utilities
 *
 * Use these helpers in API routes to verify permissions and enforce
 * role-based access control.
 *
 * Supports both Supabase Auth sessions (web) and JWT tokens (mobile)
 *
 * Performance: Uses Redis/KV cache (60s TTL) to reduce database hits.
 * Falls back to in-memory when Redis isn't configured.
 */

import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getUser as getSupabaseUser } from './supabase-server';
import { prisma } from './prisma';
import { kvGet, kvSet, kvDelete } from './redis';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'test-secret-for-local-development-only-2024'
);

// =============================================
// User Cache (Redis-backed, reduces database hits)
// =============================================

const USER_CACHE_TTL_SECONDS = 60; // 60 seconds
const USER_CACHE_PREFIX = 'auth:user:';

/**
 * Get cached user or null if expired/missing
 */
async function getCachedUser(userId: string): Promise<AuthUser | null> {
  try {
    const cached = await kvGet<AuthUser>(`${USER_CACHE_PREFIX}${userId}`);
    return cached;
  } catch (error) {
    console.error('[Auth] Cache get error:', error);
    return null;
  }
}

/**
 * Cache user data with TTL
 */
async function setCachedUser(userId: string, user: AuthUser): Promise<void> {
  try {
    await kvSet(`${USER_CACHE_PREFIX}${userId}`, user, USER_CACHE_TTL_SECONDS);
  } catch (error) {
    console.error('[Auth] Cache set error:', error);
  }
}

/**
 * Invalidate cached user (call when user role/permissions change)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await kvDelete(`${USER_CACHE_PREFIX}${userId}`);
  } catch (error) {
    console.error('[Auth] Cache invalidate error:', error);
  }
}

/**
 * Clear entire user cache (for testing or role bulk updates)
 * Note: This only works fully with Redis KEYS command support
 */
export async function clearUserCache(): Promise<void> {
  // For Redis, we'd need to use KEYS or SCAN - this is a no-op for now
  // In production, user caches expire naturally after 60s
  console.warn('[Auth] clearUserCache called - caches will expire naturally');
}

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
 * Fetches full user profile from database with Redis caching
 */
async function getUserFromSupabase(supabaseUserId: string): Promise<AuthUser | null> {
  // Check cache first (Redis-backed)
  const cached = await getCachedUser(supabaseUserId);
  if (cached) {
    return cached;
  }

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

    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      schoolId: dbUser.schoolId || '',
    };

    // Cache the result in Redis
    await setCachedUser(supabaseUserId, user);

    return user;
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
