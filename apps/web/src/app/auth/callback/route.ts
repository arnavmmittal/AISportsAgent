import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Supabase Auth Callback Route
 *
 * This route handles the OAuth callback from Supabase Auth.
 * It exchanges the auth code for a session and redirects the user
 * to their role-specific dashboard.
 *
 * Flow:
 * 1. User clicks "Sign in with Email" or OAuth provider
 * 2. Supabase redirects to /auth/callback?code=...
 * 3. This route exchanges code for session
 * 4. Redirects to dashboard based on user role
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/auth/signin?error=callback_error`)
    }

    if (data?.user) {
      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user role:', userError)
        // Default to athlete dashboard if role fetch fails
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // Redirect based on role
      const roleRedirect = userData.role === 'COACH'
        ? '/coach/dashboard'
        : '/dashboard'

      return NextResponse.redirect(`${origin}${roleRedirect}`)
    }
  }

  // If no code or user, redirect to signin
  return NextResponse.redirect(`${origin}/auth/signin`)
}
