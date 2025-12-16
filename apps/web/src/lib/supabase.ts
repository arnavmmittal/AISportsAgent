import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client-side Supabase client for use in React components
 *
 * Usage:
 * ```tsx
 * import { createClient } from '@/lib/supabase'
 *
 * const supabase = createClient()
 * const { data, error } = await supabase.from('User').select('*')
 * ```
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Server-side Supabase client for use in Server Components and Route Handlers
 *
 * Usage in Server Components:
 * ```tsx
 * import { createServerSupabaseClient } from '@/lib/supabase'
 *
 * const supabase = await createServerSupabaseClient()
 * const { data, error } = await supabase.from('User').select('*')
 * ```
 *
 * Usage in API Routes:
 * ```tsx
 * export async function GET(request: Request) {
 *   const supabase = await createServerSupabaseClient()
 *   const { data, error } = await supabase.from('User').select('*')
 *   return Response.json({ data, error })
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
  })
}

/**
 * Admin Supabase client that bypasses Row-Level Security (RLS)
 *
 * ⚠️ WARNING: Use this ONLY for administrative operations
 * This client bypasses all RLS policies and has full database access
 *
 * Usage:
 * ```tsx
 * import { getSupabaseAdminClient } from '@/lib/supabase'
 *
 * const supabaseAdmin = getSupabaseAdminClient()
 * // Create user bypassing RLS
 * const { data, error } = await supabaseAdmin.from('User').insert({ ... })
 * ```
 */
export function getSupabaseAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Helper function to get the current authenticated user from the session
 *
 * Usage in Server Components:
 * ```tsx
 * import { getCurrentUser } from '@/lib/supabase'
 *
 * const user = await getCurrentUser()
 * if (!user) {
 *   redirect('/auth/signin')
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Helper function to get the current user's session
 *
 * Usage:
 * ```tsx
 * import { getSession } from '@/lib/supabase'
 *
 * const session = await getSession()
 * if (!session) {
 *   redirect('/auth/signin')
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
