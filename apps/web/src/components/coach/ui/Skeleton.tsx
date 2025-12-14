/**
 * Skeleton Component
 * Loading state placeholders with pulse animation
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle' | 'avatar';
  rows?: number;
  height?: string;
}

export default function Skeleton({
  className,
  variant = 'default',
  rows,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-slate-700/50';

  if (variant === 'text' && rows) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              'h-4 rounded',
              i === rows - 1 && 'w-4/5', // Last row slightly shorter
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle' || variant === 'avatar') {
    return (
      <div
        className={cn(
          baseStyles,
          'rounded-full',
          variant === 'avatar' ? 'w-10 h-10' : 'w-12 h-12',
          className
        )}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border border-slate-700 bg-slate-800/50 p-6 space-y-4',
          className
        )}
      >
        <div className={cn(baseStyles, 'h-4 w-1/3 rounded')} />
        <div className={cn(baseStyles, 'h-8 w-1/2 rounded')} />
        <div className={cn(baseStyles, 'h-3 w-2/3 rounded')} />
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, 'rounded', className)}
      style={height ? { height } : undefined}
    />
  );
}

// Skeleton for athlete card
export function SkeletonAthleteCard() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-4">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-12 flex-1 rounded-md" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}

// Skeleton for stat card
export function SkeletonStatCard() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
      <Skeleton className="h-9 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Skeleton for table row
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-700">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-1/4' : i === columns - 1 ? 'w-16' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

// Skeleton for table
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-800/70">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-3',
              i === 0 ? 'w-1/4' : i === columns - 1 ? 'w-16' : 'flex-1'
            )}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

// Skeleton for chart
export function SkeletonChart({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className={cn('w-full rounded', height)} />
    </div>
  );
}

// Skeleton for dashboard grid
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - athlete list */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48" />
          <SkeletonAthleteCard />
          <SkeletonAthleteCard />
          <SkeletonAthleteCard />
        </div>

        {/* Right column - chart */}
        <div>
          <SkeletonChart height="h-96" />
        </div>
      </div>
    </div>
  );
}
