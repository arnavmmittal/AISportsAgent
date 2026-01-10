'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Authentication failed');
        setIsLoading(false);
        return;
      }

      // Get user role from database to determine redirect
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user role:', userError);
        setError('Failed to load user profile');
        setIsLoading(false);
        return;
      }

      // Redirect based on role
      if (userData.role === 'COACH' || userData.role === 'ADMIN') {
        router.push('/coach/dashboard');
      } else {
        router.push('/student/home');
      }

      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-primary-600 dark:bg-primary-500">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/90 font-body">Sign in to continue your journey</p>
          </div>

          <div className="px-8 py-6">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 border-l-4 border-success-600 dark:border-success-500 rounded-r">
                <p className="text-sm text-success-700 dark:text-success-300 flex items-center font-body">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border-l-4 border-danger-600 dark:border-danger-500 rounded-r">
                <p className="text-sm text-danger-700 dark:text-danger-300 flex items-center font-body">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-body">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
                  placeholder="athlete@university.edu"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-body">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-display"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">New to AI Sports Agent?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              href="/auth/signup"
              className="block w-full text-center py-3 px-4 chrome-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
