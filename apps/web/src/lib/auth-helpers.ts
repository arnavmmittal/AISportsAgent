/**
 * Auth Helper Functions - Server-side authentication utilities
 *
 * Use these helpers in API routes to verify permissions and enforce
 * role-based access control.
 *
 * Supports both NextAuth sessions (web) and JWT tokens (mobile)
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { Session } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
}

export interface AuthResult {
  authorized: boolean;
  session: Session | null;
  user: AuthUser | null;
  response?: NextResponse;
}

/**
 * Verify authentication from either JWT token (mobile) or NextAuth session (web)
 */
export async function verifyAuthFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Check for Bearer token (mobile app)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload as AuthUser;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Fall back to NextAuth session (web app)
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email ?? '',
        role: session.user.role ?? 'ATHLETE',
        schoolId: session.user.schoolId ?? '',
      };
    }
  } catch (error) {
    console.error('Session verification failed:', error);
  }

  return null;
}

/**
 * Require authentication - Any authenticated user (supports both JWT and session)
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, user, response } = await requireAuth(request);
 * if (!authorized) return response;
 * ```
 */
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  let user: AuthUser | null = null;
  let session: Session | null = null;

  // If request provided, check for JWT token first
  if (request) {
    user = await verifyAuthFromRequest(request);
    if (user) {
      return {
        authorized: true,
        session: null,
        user,
      };
    }
  } else {
    // Fall back to session-only auth
    session = await auth();
    if (session?.user?.id) {
      user = {
        id: session.user.id,
        email: session.user.email ?? '',
        role: session.user.role ?? 'ATHLETE',
        schoolId: session.user.schoolId ?? '',
      };
      return {
        authorized: true,
        session,
        user,
      };
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
 * const { authorized, session, response } = await requireAdmin();
 * if (!authorized) return response;
 * ```
 */
export async function requireAdmin(): Promise<AuthResult> {
  const { authorized, session, response } = await requireAuth();

  if (!authorized) {
    return { authorized: false, session: null, response };
  }

  if (session!.user?.role !== 'ADMIN') {
    return {
      authorized: false,
      session: session,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Require ATHLETE role
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, session, response } = await requireAthlete();
 * if (!authorized) return response;
 * ```
 */
export async function requireAthlete(): Promise<AuthResult> {
  const { authorized, session, response } = await requireAuth();

  if (!authorized) {
    return { authorized: false, session: null, response };
  }

  if (session!.user?.role !== 'ATHLETE' && session!.user?.role !== 'ADMIN') {
    return {
      authorized: false,
      session: session,
      response: NextResponse.json(
        { error: 'Forbidden - Athlete access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Verify user owns resource (e.g., checking if athlete_id matches session user)
 *
 * Usage:
 * ```typescript
 * const { authorized, session } = await requireAuth();
 * if (!authorized) return response;
 *
 * if (!verifyOwnership(session, athleteId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function verifyOwnership(session: Session | null, resourceUserId: string): boolean {
  if (!session) return false;

  // Admins can access all resources
  if (session.user?.role === 'ADMIN') return true;

  // Users can only access their own resources
  return session.user?.id === resourceUserId;
}

/**
 * Verify user belongs to the same school as the resource
 *
 * Usage:
 * ```typescript
 * const { authorized, session } = await requireCoach();
 * if (!authorized) return response;
 *
 * if (!verifySchoolAccess(session, athlete.schoolId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function verifySchoolAccess(session: Session | null, resourceSchoolId: string): boolean {
  if (!session) return false;

  // Admins can access all schools
  if (session.user?.role === 'ADMIN') return true;

  // Users can only access resources from their school
  return session.user?.schoolId === resourceSchoolId;
}

/**
 * Get user ID from session (convenience function)
 */
export function getUserId(session: Session | null): string | null {
  return session?.user?.id || null;
}

/**
 * Get user role from session (convenience function)
 */
export function getUserRole(session: Session | null): string | null {
  return session?.user?.role || null;
}

/**
 * Get school ID from session (convenience function)
 */
export function getSchoolId(session: Session | null): string | null {
  return session?.user?.schoolId || null;
}
