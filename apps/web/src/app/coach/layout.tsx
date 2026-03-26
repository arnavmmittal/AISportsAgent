'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Brain, LogOut, Settings } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/AppSidebar';
import { MobileBottomNav } from '@/components/shared/layout/MobileBottomNav';
import { COACH_NAV } from '@/config/navigation';

/**
 * Coach Portal Layout - v4.0 with shadcn Sidebar
 *
 * Desktop: Collapsible sidebar (icon mode) with keyboard shortcut (Ctrl+B)
 * Mobile: Fixed bottom tab bar + header (previously had no mobile support!)
 *
 * 7 navigation items with clear purposes:
 * 1. Dashboard - "What's happening RIGHT NOW?"
 * 2. AI Insights - "What should I KNOW and DO?" (THE SHOWCASE)
 * 3. ROI Dashboard - "Demonstrate value to ADs"
 * 4. Athletes - "Deep dive on INDIVIDUALS"
 * 5. Readiness - "Who's READY today?"
 * 6. Data Hub - "Manage my DATA"
 * 7. Settings - "Configure my ACCOUNT"
 */

// Mobile bottom nav: show top 5 items (most important), exclude Settings and Data Hub
const mobileNavItems = COACH_NAV.filter(
  item => item.href !== '/coach/settings' && item.href !== '/coach/data'
);

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  return (
    <SidebarProvider>
      <AppSidebar
        navItems={COACH_NAV}
        portalLabel="Coach Portal"
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header — NEW for coach portal (previously had none!) */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Flow Coach</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push('/coach/settings')}
              className="p-2.5 text-muted-foreground hover:text-foreground active:bg-muted/50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2.5 text-muted-foreground hover:text-foreground active:bg-muted/50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Sidebar Trigger */}
        <div className="hidden md:flex items-center h-12 px-2 border-b border-border">
          <SidebarTrigger />
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-14 pb-20 md:pt-0 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar — NEW for coach portal */}
        <MobileBottomNav items={mobileNavItems} />
      </div>
    </SidebarProvider>
  );
}
