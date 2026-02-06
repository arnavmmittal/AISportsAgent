'use client';

/**
 * Session Provider - Wrapper for auth context
 * Previously used NextAuth, now using Supabase Auth
 *
 * Components should use the useAuth() hook from @/hooks/useAuth
 * to access authentication state and user data.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Supabase auth is handled via the useAuth() hook which creates its own client
  // This provider is kept for backwards compatibility with the layout structure
  return <>{children}</>;
}
