'use client';

// Force dynamic rendering for all coach pages
export const dynamic = 'force-dynamic';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { LogOut, ChevronLeft, ChevronRight, Brain, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { COACH_NAV } from '@/config/navigation';

/**
 * Coach Portal Layout - Unified Navigation (v3.0)
 *
 * Uses centralized navigation config for consistency.
 *
 * 6 primary navigation items with clear purposes:
 * 1. Dashboard - "What's happening RIGHT NOW?"
 * 2. AI Insights - "What should I KNOW and DO?" (THE SHOWCASE)
 * 3. Athletes - "Deep dive on INDIVIDUALS"
 * 4. Readiness - "Who's READY today?"
 * 5. Data Hub - "Manage my DATA"
 * 6. Settings - "Configure my ACCOUNT"
 */

export default function CoachLayout({ children }: { children: React.ReactNode }) {
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
    const savedState = localStorage.getItem('coach-sidebar-open');
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('coach-sidebar-open', String(newState));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hamburger Menu Button */}
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
                  AI Sports Agent
                </h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Coach Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {COACH_NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + '/') ||
                  // Handle /coach root path
                  (item.href === '/coach/dashboard' && pathname === '/coach');

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.href);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap group',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : item.highlight
                          ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm flex-1">{item.label}</span>
                      {item.badge && !isActive && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                          <Sparkles className="w-3 h-3" />
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Actions */}
          <div className="p-4 border-t border-border">
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
