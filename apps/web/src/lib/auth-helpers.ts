/**
 * Auth Helper Functions - Server-side authentication utilities
 *
 * Use these helpers in API routes to verify permissions and enforce
 * role-based access control.
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';

export interface AuthResult {
  authorized: boolean;
  session: Session | null;
  response?: NextResponse;
}

/**
 * Require authentication - Any authenticated user
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, session, response } = await requireAuth();
 * if (!authorized) return response;
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Require COACH role
 *
 * Usage in API routes:
 * ```typescript
 * const { authorized, session, response } = await requireCoach();
 * if (!authorized) return response;
 * ```
 */
export async function requireCoach(): Promise<AuthResult> {
  const { authorized, session, response } = await requireAuth();

  if (!authorized) {
    return { authorized: false, session: null, response };
  }

  if (session!.user?.role !== 'COACH' && session!.user?.role !== 'ADMIN') {
    return {
      authorized: false,
      session: session,
      response: NextResponse.json(
        { error: 'Forbidden - Coach access required' },
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
