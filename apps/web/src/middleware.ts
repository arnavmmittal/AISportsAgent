import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Role-based route protection middleware using Supabase Auth
 *
 * Features:
 * - Redirects unauthenticated users to login
 * - Redirects authenticated users away from auth pages to role-specific home
 * - Prevents coaches from accessing athlete routes
 * - Prevents athletes from accessing coach routes
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user (more secure than getSession on server-side)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Route categorization
  const isAuthPage = pathname.startsWith('/auth');
  const isCoachRoute = pathname.startsWith('/coach');
  const isAthleteRoute = ['/chat', '/dashboard', '/student', '/mood', '/goals'].some(
    (path) => pathname.startsWith(path)
  );
  const isCoachApiRoute =
    pathname.startsWith('/api/analytics') ||
    pathname.startsWith('/api/performance') ||
    pathname.startsWith('/api/coach');
  const isPublicRoute = pathname.startsWith('/_next') || pathname.startsWith('/api');

  // Note: Role-based redirects are handled by signin page via /api/auth/user-role
  // Middleware only handles authentication check, not role-based access
  // This avoids Supabase REST API table name issues with Prisma's quoted names
  const role: string | null = null;

  // Redirect authenticated users away from home page to their dashboard
  if (pathname === '/' && user && role) {
    const redirectUrl = role === 'COACH' ? '/coach/dashboard' : '/student/home';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Redirect old student routes to new structure
  if (user && role === 'ATHLETE') {
    if (pathname === '/student/dashboard') {
      return NextResponse.redirect(new URL('/student/home', request.url));
    }
    if (pathname === '/student/chat') {
      return NextResponse.redirect(new URL('/student/ai-coach', request.url));
    }
    // Note: /student/mood redirects to /student/wellness (wellness page handles mood tracking)
    // /student/progress redirects to /student/goals (goals page shows progress stats)
    // Don't redirect /student/goals - it's the canonical location now
    if (pathname === '/student/mood') {
      return NextResponse.redirect(new URL('/student/wellness', request.url));
    }
  }

  // Allow home page for unauthenticated users and other public routes
  if (pathname === '/' || isPublicRoute) {
    return response;
  }

  // Redirect unauthenticated users to login (except for auth pages)
  if (!user && !isAuthPage) {
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to their role-specific home
  if (user && isAuthPage && role) {
    const redirectUrl = role === 'COACH' ? '/coach/dashboard' : '/student/home';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Role-based access control
  if (user && role) {
    // Coaches cannot access athlete routes
    if (role === 'COACH' && isAthleteRoute) {
      return NextResponse.redirect(new URL('/coach/dashboard', request.url));
    }

    // Athletes cannot access coach routes
    if (role === 'ATHLETE' && isCoachRoute) {
      return NextResponse.redirect(new URL('/student/home', request.url));
    }

    // Athletes cannot access coach API routes
    if (role === 'ATHLETE' && isCoachApiRoute) {
      return NextResponse.json({ error: 'Forbidden - Coach access required' }, { status: 403 });
    }

    // Only coaches and admins can access coach API routes
    if (isCoachApiRoute && role !== 'COACH' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Coach access required' }, { status: 403 });
    }
  }

  return response;
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
