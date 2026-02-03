/**
 * DashboardGrid Component
 * Responsive grid system for dashboard widgets and content areas
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DashboardGridProps {
  children: ReactNode;
  variant?: 'default' | 'compact' | 'wide';
  className?: string;
}

export default function DashboardGrid({
  children,
  variant = 'default',
  className,
}: DashboardGridProps) {
  const gridClasses = {
    default: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
    compact: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    wide: 'grid grid-cols-1 gap-6',
  };

  return (
    <div className={cn(gridClasses[variant], className)}>
      {children}
    </div>
  );
}

// Grid cell components for different span sizes
export function GridCell({
  children,
  span = 1,
  className,
}: {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 lg:col-span-2',
    3: 'col-span-1 lg:col-span-3',
    4: 'col-span-1 lg:col-span-4',
  };

  return <div className={cn(spanClasses[span], className)}>{children}</div>;
}

// Two-column layout (main content + sidebar)
export function TwoColumnLayout({
  main,
  sidebar,
  sidebarPosition = 'right',
  className,
}: {
  main: ReactNode;
  sidebar: ReactNode;
  sidebarPosition?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-3 gap-6',
        className
      )}
    >
      {sidebarPosition === 'left' && (
        <aside className="lg:col-span-1 space-y-6">{sidebar}</aside>
      )}
      <main className="lg:col-span-2 space-y-6">{main}</main>
      {sidebarPosition === 'right' && (
        <aside className="lg:col-span-1 space-y-6">{sidebar}</aside>
      )}
    </div>
  );
}

// Three-column layout
export function ThreeColumnLayout({
  left,
  center,
  right,
  className,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
        className
      )}
    >
      <aside className="md:col-span-1 lg:col-span-1 space-y-6">{left}</aside>
      <main className="md:col-span-2 lg:col-span-2 space-y-6">{center}</main>
      <aside className="md:col-span-1 lg:col-span-1 space-y-6">{right}</aside>
    </div>
  );
}

// Masonry-style grid for cards of varying heights
export function MasonryGrid({
  children,
  columns = 3,
  gap = 6,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
  className?: string;
}) {
  const columnClasses = {
    1: 'columns-1',
    2: 'columns-1 md:columns-2',
    3: 'columns-1 md:columns-2 lg:columns-3',
    4: 'columns-1 md:columns-2 lg:columns-4',
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={cn(columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// Stats grid - specifically for stat cards
export function StatsGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// Widget container with standard padding and styling
export function DashboardWidget({
  title,
  subtitle,
  action,
  children,
  variant = 'default',
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'compact' | 'glass';
  className?: string;
}) {
  const variantStyles = {
    default: 'bg-slate-800/50 border border-slate-700',
    compact: 'bg-slate-800/30 border border-slate-700/50',
    glass: 'bg-slate-900/30 backdrop-blur-sm border border-slate-700/30',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-6',
        variantStyles[variant],
        className
      )}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

// Section divider with optional title
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-white">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// Responsive container with max width
export function DashboardContainer({
  children,
  maxWidth = '7xl',
  className,
}: {
  children: ReactNode;
  maxWidth?: 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  className?: string;
}) {
  const maxWidthClasses = {
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto w-full', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}

// Spacer for vertical spacing between sections
export function DashboardSpacer({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  };

  return <div className={sizeClasses[size]} />;
}
