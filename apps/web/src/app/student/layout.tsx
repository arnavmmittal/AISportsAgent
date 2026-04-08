'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Brain, LogOut, Settings } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/AppSidebar';
import { MobileBottomNav } from '@/components/shared/layout/MobileBottomNav';
import { ATHLETE_NAV } from '@/config/navigation';

// Bottom nav shows first 5 items (excludes Settings)
const mobileNavItems = ATHLETE_NAV.filter(item => item.href !== '/student/settings');

export default function StudentLayout({ children }: { children: React.ReactNode }) {
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
        navItems={ATHLETE_NAV}
        portalLabel="Athlete Portal"
        onSignOut={handleSignOut}
        aiCoachHref="/student/ai-coach"
      />

      <div className="flex-1 flex flex-col min-h-screen w-full overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Flow Coach</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push('/student/settings')}
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

        {/* Main Content — trigger floats top-left on desktop */}
        <main className="flex-1 relative pt-14 pb-20 md:pt-0 md:pb-0">
          <div className="hidden md:block absolute top-2 left-2 z-10">
            <SidebarTrigger />
          </div>
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <MobileBottomNav items={mobileNavItems} />
      </div>
    </SidebarProvider>
  );
}
