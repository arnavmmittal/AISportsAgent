'use client';

// Force dynamic rendering for all student pages
export const dynamic = 'force-dynamic';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Activity,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Home,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Student Portal Layout - v2.2 with Mobile Bottom Tabs
 *
 * Desktop: Collapsible sidebar navigation
 * Mobile: Fixed bottom tab bar (like native apps)
 *
 * Navigation items:
 * - Home (Dashboard) - Overview and quick stats
 * - AI Coach - Chat interface (PRIMARY)
 * - Wellness - Readiness + Mood logging
 * - Goals - Goal setting with progress tracking
 * - Assignments - Coach-assigned tasks
 * - Settings - Account preferences (sidebar only)
 */

const navItems = [
  { href: '/student/home', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, showInMobile: true },
  { href: '/student/ai-coach', label: 'AI Coach', shortLabel: 'Coach', icon: Brain, primary: true, showInMobile: true },
  { href: '/student/wellness', label: 'Wellness', shortLabel: 'Wellness', icon: Activity, showInMobile: true },
  { href: '/student/goals', label: 'Goals', shortLabel: 'Goals', icon: Target, showInMobile: true },
  { href: '/student/assignments', label: 'Assignments', shortLabel: 'Tasks', icon: ClipboardList, showInMobile: true },
  { href: '/student/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings, showInMobile: false },
];

// Mobile bottom tabs (max 5 for usability)
const mobileNavItems = navItems.filter(item => item.showInMobile);

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load sidebar state from localStorage on mount (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem('student-sidebar-open');
      if (savedState !== null) {
        setIsSidebarOpen(savedState === 'true');
      }
    }
  }, [isMobile]);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (!isMobile) {
      localStorage.setItem('student-sidebar-open', String(newState));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Toggle Button - Hidden on mobile */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-4 z-50 p-2.5 bg-card rounded-lg shadow-md hover:shadow-lg transition-all',
          'border border-border hover:border-primary/30',
          'hidden md:block', // Hide on mobile
          isSidebarOpen ? 'left-[17rem]' : 'left-4'
        )}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 ease-in-out',
          'hidden md:block', // Hide on mobile
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo/Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground whitespace-nowrap">
                  Flow Sports Coach
                </h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Athlete Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.href);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : item.primary
                          ? 'text-primary hover:bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                      {item.primary && !isActive && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded">
                          NEW
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {/* Quick Help */}
            <a
              href="/student/ai-coach"
              onClick={(e) => {
                e.preventDefault();
                router.push('/student/ai-coach');
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all whitespace-nowrap"
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span>Talk to AI Coach</span>
            </a>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all whitespace-nowrap"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Shows on mobile only */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Flow Coach</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Bottom Tab Bar - Shows on mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className={cn(
                  'w-6 h-6 mb-0.5',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.shortLabel}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Main content - Adjusted for mobile header and bottom tabs */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          // Desktop: margin for sidebar
          'md:ml-0',
          isSidebarOpen && 'md:ml-64',
          // Mobile: padding for header and bottom tabs
          'pt-14 pb-16 md:pt-0 md:pb-0'
        )}
      >
        {children}
      </main>
    </div>
  );
}
