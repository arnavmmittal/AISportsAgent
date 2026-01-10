/**
 * Skeleton Component - AI Sports Agent
 *
 * Professional loading states for athletic minimalist design
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, style, ...props }, ref) => {
    const variantStyles = {
      default: 'rounded-md',
      text: 'rounded h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'shimmer bg-gray-200 dark:bg-gray-800',
          variantStyles[variant],
          className
        )}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Specialized skeleton components
const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('p-6 border border-gray-200 dark:border-gray-800 rounded-lg space-y-4', className)}>
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

const SkeletonStat = ({ className }: { className?: string }) => (
  <div className={cn('space-y-2', className)}>
    <Skeleton variant="text" width="40%" />
    <Skeleton width="80%" height={32} />
  </div>
);

export { Skeleton, SkeletonText, SkeletonCard, SkeletonStat };
