/**
 * LoadingState Component
 *
 * Displays loading skeletons while data is being fetched.
 */

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/design-system/components';

interface LoadingStateProps {
  /**
   * Loading variant
   */
  variant?: 'spinner' | 'skeleton-cards' | 'skeleton-list' | 'skeleton-page';
  /**
   * Number of skeleton items to show
   */
  count?: number;
  /**
   * Loading message
   */
  message?: string;
}

export function LoadingState({
  variant = 'spinner',
  count = 3,
  message = 'Loading...',
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 lg:w-16 lg:h-16 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 font-body">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'skeleton-cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex items-start gap-4"
          >
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-page') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
