'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import {
  Brain,
  LogOut,
  Settings,
  ChevronDown,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileBottomNav } from '@/components/shared/layout/MobileBottomNav';
import { ATHLETE_NAV } from '@/config/navigation';

const mobileNavItems = ATHLETE_NAV.filter(
  (item) => item.href !== '/student/settings'
);

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setUserName(
          user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete'
        );
      }
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  const navItems = ATHLETE_NAV.filter((item) => item.href !== '/student/settings');

  const isActive = (href: string) => {
    if (href === '/student/ai-coach')
      return pathname === '/student/ai-coach' || pathname === '/student';
    return pathname.startsWith(href);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Tablet/Desktop: Icon Sidebar + Content ── */}
      <div className="hidden md:flex min-h-screen">
        {/* Icon-Only Left Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-[hsl(var(--sidebar))] flex flex-col items-center py-5 z-50">
          {/* Brand */}
          <div
            className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center cursor-pointer mb-8 transition-all hover:scale-110"
            onClick={() => router.push('/student/ai-coach')}
          >
            <Brain className="w-6 h-6 text-white" />
          </div>

          {/* Nav Icons */}
          <nav className="flex flex-col items-center gap-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative group">
                  <button
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                      active
                        ? 'bg-[hsl(var(--sidebar-accent))] text-white shadow-lg shadow-[hsl(var(--sidebar-accent))]/25'
                        : 'text-[hsl(var(--sidebar-foreground))] hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Settings */}
          <button
            onClick={() => router.push('/student/settings')}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all group relative',
              pathname.startsWith('/student/settings')
                ? 'bg-[hsl(var(--sidebar-accent))] text-white'
                : 'text-[hsl(var(--sidebar-foreground))] hover:text-white hover:bg-white/10'
            )}
          >
            <Settings className="w-5 h-5" />
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Settings
            </div>
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 ml-[72px] relative">
          {/* Floating Profile — top-right of content area */}
          <div
            className="fixed top-4 right-6 z-40"
            ref={profileRef}
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:border-border shadow-subtle transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {getInitials(userName || 'A')}
                </span>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {userName}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-muted-foreground transition-transform',
                  profileOpen && 'rotate-180'
                )}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card shadow-elevated overflow-hidden animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/student/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Page Content */}
          <main className="min-h-screen">{children}</main>
        </div>
      </div>

      {/* ── Mobile: Header + Content + Bottom Nav ── */}
      <div className="md:hidden">
        <header className="fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4">
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

        <main className="pt-14 pb-20">{children}</main>

        <MobileBottomNav items={mobileNavItems} />
      </div>
    </div>
  );
}
