'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, signOut } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/coach/NotificationBell';

export function Header() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  // Links for authenticated athletes
  const athleteLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/chat', label: 'AI Coach', icon: '💬' },
    { href: '/mood', label: 'Mood', icon: '📊' },
    { href: '/goals', label: 'Goals', icon: '🎯' },
    { href: '/assignments', label: 'Tasks', icon: '📋' },
  ];

  // Links for authenticated coaches
  const coachLinks = [
    { href: '/coach/dashboard', label: 'Dashboard', icon: '📈' },
    { href: '/coach/readiness', label: 'Readiness', icon: '🎯' },
    { href: '/coach/performance/record', label: 'Record Stats', icon: '📊' },
    { href: '/coach/athletes', label: 'Athletes', icon: '👥' },
    { href: '/coach/insights', label: 'Insights', icon: '💡' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDashboardRedirect = () => {
    if (user?.role === 'COACH') {
      router.push('/coach/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  // For authenticated users
  if (user) {
    const links = user.role === 'COACH' ? coachLinks : athleteLinks;
    const roleDisplay = user.role === 'COACH' ? 'Coach' : 'Athlete';

    return (
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex">
              <button
                onClick={handleDashboardRedirect}
                className="flex-shrink-0 flex items-center group"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
                  AI Sports Agent
                </span>
              </button>
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="mr-2 text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {/* Notification Bell (Coach Only) */}
              {user?.role === 'COACH' && <NotificationBell />}

              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{roleDisplay}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass rounded-lg shadow-lg border border-border py-1">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href={user?.role === 'COACH' ? '/coach/settings' : '/settings'}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted-foreground/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-muted transition-colors"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{roleDisplay}</p>
                </div>
              </div>
              <Link
                href={user?.role === 'COACH' ? '/coach/settings' : '/settings'}
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted-foreground/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // For non-authenticated users (landing page, auth pages)
  const isAuthPage = pathname.startsWith('/auth');

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
              AI Sports Agent
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {!isAuthPage ? (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            ) : pathname === '/auth/signin' ? (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-foreground transition-colors"
                >
                  ← Back
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-foreground transition-colors"
                >
                  ← Back
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
