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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Student Portal Layout - Consolidated Navigation (v2.1)
 *
 * Streamlined to 6 primary navigation items:
 * - Home (Dashboard) - Overview and quick stats
 * - AI Coach - Chat interface with integrated Chat History
 * - Wellness - Combined Readiness + Mood logging
 * - Goals - Goal setting with integrated Progress tracking
 * - Assignments - Coach-assigned tasks
 * - Settings - Account preferences
 *
 * Consolidated features:
 * - Chat History → accessible within AI Coach page
 * - Mood Log → merged into Wellness page
 * - Progress → integrated into Goals page
 */

const navItems = [
  { href: '/student/home', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/ai-coach', label: 'AI Coach', icon: Brain, primary: true },
  { href: '/student/wellness', label: 'Wellness', icon: Activity },
  { href: '/student/goals', label: 'Goals', icon: Target },
  { href: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/student/settings', label: 'Settings', icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('student-sidebar-open');
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('student-sidebar-open', String(newState));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hamburger Menu Button - Visible on all screen sizes */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-4 z-50 p-2.5 bg-card rounded-lg shadow-md hover:shadow-lg transition-all',
          'border border-border hover:border-primary/30',
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

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 ease-in-out',
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

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        {children}
      </main>
    </div>
  );
}
