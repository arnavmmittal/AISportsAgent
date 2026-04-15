'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, signOut } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { COACH_NAV, ATHLETE_NAV } from '@/config/navigation';
import { cn } from '@/lib/utils';

/**
 * Shared Navigation Component
 *
 * Uses centralized navigation config for consistency.
 * Renders appropriate nav items based on user role.
 */
export function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const navItems = user?.role === 'COACH' || user?.role === 'ADMIN' ? COACH_NAV : ATHLETE_NAV;

  if (!user) return null;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                Flow Sports Coach
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors gap-2',
                      active
                        ? 'bg-primary/10 text-primary'
                        : item.highlight
                        ? 'text-accent hover:bg-accent/10'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge && !active && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent">
                        <Sparkles className="w-3 h-3" />
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-muted"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium',
                    active
                      ? 'bg-primary/10 text-primary'
                      : item.highlight
                      ? 'text-accent'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.badge && !active && (
                    <span className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent">
                      <Sparkles className="w-3 h-3" />
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="px-4 mb-3">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full text-left px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted-foreground/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
