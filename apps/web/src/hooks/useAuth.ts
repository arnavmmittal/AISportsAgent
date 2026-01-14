'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

/**
 * Extended user profile with role and profile data from database
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  schoolId: string | null;
  athlete?: {
    userId: string;
    sport: string;
    year: string;
    teamPosition?: string | null;
  } | null;
  coach?: {
    userId: string;
    sport: string;
    title?: string | null;
  } | null;
}

interface AuthState {
  /** Raw Supabase auth user */
  authUser: User | null;
  /** Extended user profile from database */
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Refresh user profile from database */
  refreshProfile: () => Promise<void>;
}

/**
 * Custom hook for Supabase authentication with full user profile
 *
 * Usage:
 *   const { user, isLoading, isAuthenticated } = useAuth();
 *   // user includes: id, email, name, role, schoolId, athlete, coach
 */
export function useAuth(): AuthState {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile from database
  // Don't pass userId - let server get it from session to avoid race conditions
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const profile = await response.json();
        setUser(profile);
      } else if (response.status === 401) {
        // Not authenticated yet - session might be loading
        setUser(null);
      } else {
        console.error('Failed to fetch user profile');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser?.id) {
      await fetchUserProfile();
    }
  }, [authUser?.id, fetchUserProfile]);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        setAuthUser(supabaseUser);
        if (supabaseUser?.id) {
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setAuthUser(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthUser(session?.user ?? null);
        if (session?.user?.id) {
          await fetchUserProfile();
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchUserProfile]);

  return {
    authUser,
    user,
    isLoading,
    isAuthenticated: !!authUser,
    refreshProfile,
  };
}

/**
 * Sign out helper function
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/auth/signin';
}
