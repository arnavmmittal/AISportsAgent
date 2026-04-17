'use client';

/**
 * Global Error Boundary
 *
 * Catches errors in the application and reports them to Sentry.
 * Displays a user-friendly error message with retry option.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-muted-foreground mb-6">
              We encountered an unexpected error. Our team has been notified and is
              working on a fix.
            </p>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-3 bg-muted rounded-md text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
              >
                Try again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
