/**
 * CoachPortalLayout Component
 * Main layout for coach portal with sidebar navigation
 */

'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface CoachPortalLayoutProps {
  children: ReactNode;
  className?: string;
}

const NAVIGATION: NavItem[] = [
  {
    label: 'Command Center',
    href: '/coach/command-center',
    icon: '🎯',
  },
  {
    label: 'Roster',
    href: '/coach/roster',
    icon: '👥',
  },
  {
    label: 'Analytics Hub',
    href: '/coach/analytics',
    icon: '📊',
  },
  {
    label: 'Readiness Command',
    href: '/coach/readiness',
    icon: '⚡',
  },
  {
    label: 'Assignments & Habits',
    href: '/coach/assignments',
    icon: '📝',
  },
  {
    label: 'AI Insights',
    href: '/coach/insights',
    icon: '🤖',
  },
  {
    label: 'Settings & Admin',
    href: '/coach/settings',
    icon: '⚙️',
  },
];

export default function CoachPortalLayout({
  children,
  className,
}: CoachPortalLayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50',
          isSidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Coach Portal</h1>
              <p className="text-xs text-slate-400">Elite Performance</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 bg-muted-foreground/100 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                C
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Coach Name</p>
                <p className="text-xs text-slate-400 truncate">Head Coach</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold mx-auto">
              C
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={cn(
          'transition-all duration-300',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Breadcrumbs or page title */}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {NAVIGATION.find((item) => pathname === item.href)?.label || 'Dashboard'}
              </h2>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                <span className="text-xl">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-muted-foreground/100 rounded-full" />
              </button>

              {/* Help */}
              <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                <span className="text-xl">❓</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={cn('p-6', className)}>{children}</div>
      </main>
    </div>
  );
}

// Simplified layout for pages that don't need sidebar (like fullscreen modals)
export function CoachPortalSimpleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-6">{children}</div>
    </div>
  );
}
