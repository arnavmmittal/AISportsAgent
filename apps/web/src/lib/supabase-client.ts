import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for client-side operations (browser)
 * This is for use in Client Components only
 * @returns Supabase client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
