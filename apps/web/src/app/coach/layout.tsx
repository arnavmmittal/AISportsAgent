'use client';

// Force dynamic rendering for all coach pages
export const dynamic = 'force-dynamic';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/coach/team-overview', label: 'Team Overview', icon: LayoutDashboard },
  { href: '/coach/athletes', label: 'Athletes', icon: Users },
  { href: '/coach/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/coach/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/coach/reports', label: 'Reports', icon: FileText },
  { href: '/coach/settings', label: 'Settings', icon: Settings },
];

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hamburger Menu Button - Visible on all screen sizes */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        ) : (
          <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 shadow-2xl z-40 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 mt-16">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              Coach Portal
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-nowrap font-body">AI Sports Agent</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
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
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap font-body
                        ${isActive
                          ? 'bg-secondary-600 dark:bg-secondary-500 text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-danger-600 dark:hover:text-danger-400 rounded-lg font-medium transition-all whitespace-nowrap font-body"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
