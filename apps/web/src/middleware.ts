import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Role-based route protection middleware
 *
 * Features:
 * - Redirects unauthenticated users to login
 * - Redirects authenticated users away from auth pages to role-specific home
 * - Prevents coaches from accessing athlete routes
 * - Prevents athletes from accessing coach routes
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const { pathname } = request.nextUrl;

  // Route categorization
  const isAuthPage = pathname.startsWith('/auth');
  const isCoachRoute = pathname.startsWith('/coach');
  const isAthleteRoute = ['/chat', '/dashboard', '/mood', '/goals'].some(
    path => pathname.startsWith(path)
  );
  const isCoachApiRoute = pathname.startsWith('/api/analytics') ||
                          pathname.startsWith('/api/performance') ||
                          pathname.startsWith('/api/coach');
  const isPublicRoute = pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/api');

  // Allow public routes and ALL API routes (individual routes handle their own auth)
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login (except for auth pages)
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to their role-specific home
  if (token && isAuthPage) {
    const role = token.role as string;
    const redirectUrl = role === 'COACH' ? '/coach/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Role-based access control
  if (token) {
    const role = token.role as string;

    // Coaches cannot access athlete routes
    if (role === 'COACH' && isAthleteRoute) {
      return NextResponse.redirect(new URL('/coach/dashboard', request.url));
    }

    // Athletes cannot access coach routes
    if (role === 'ATHLETE' && isCoachRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Athletes cannot access coach API routes
    if (role === 'ATHLETE' && isCoachApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Only coaches and admins can access coach API routes
    if (isCoachApiRoute && role !== 'COACH' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    // Admins can access everything (future-proofing)
    if (role === 'ADMIN') {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

/**
 * Matcher configuration - specifies which routes this middleware applies to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
