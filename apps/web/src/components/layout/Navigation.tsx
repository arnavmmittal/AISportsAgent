'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const athleteLinks = [
    { href: '/dashboard', label: 'Chat', icon: '💬' },
    { href: '/mood', label: 'Mood Check-In', icon: '📊' },
    { href: '/goals', label: 'Goals', icon: '🎯' },
    { href: '/history', label: 'History', icon: '📜' },
  ];

  const coachLinks = [
    { href: '/coach/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/coach/athletes', label: 'Athletes', icon: '👥' },
    { href: '/coach/analytics', label: 'Analytics', icon: '📈' },
    { href: '/coach/readiness', label: 'Readiness', icon: '⚡' },
    { href: '/coach/insights', label: 'AI Insights', icon: '💡' },
    { href: '/coach/assignments', label: 'Assignments', icon: '📋' },
    { href: '/coach/settings', label: 'Settings', icon: '⚙️' },
  ];

  const links = session?.user?.role === 'COACH' ? coachLinks : athleteLinks;

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                AI Sports Coach
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <p className="font-medium text-gray-900">{session.user.name}</p>
                <p className="text-gray-500 capitalize">{session.user.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
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
        <div className="sm:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 mb-3">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-sm text-gray-500 capitalize">{session.user.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
