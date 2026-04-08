/**
 * Navigation Configuration
 *
 * Single source of truth for all navigation across the app.
 * This ensures consistency between different navigation components.
 */

import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Home,
  MessageCircle,
  Heart,
  ClipboardList,
  BarChart3,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  highlight?: boolean;
}

export const COACH_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/coach/dashboard',
    icon: LayoutDashboard,
    description: 'Team overview and alerts',
  },
  {
    label: 'Athletes',
    href: '/coach/athletes',
    icon: Users,
    description: 'Roster and individual profiles',
  },
  {
    label: 'Readiness',
    href: '/coach/readiness',
    icon: Activity,
    description: 'Team readiness heatmap',
  },
  {
    label: 'Performance',
    href: '/coach/data',
    icon: BarChart3,
    description: 'Game outcomes and correlations',
  },
  {
    label: 'Assignments',
    href: '/coach/assignments',
    icon: ClipboardList,
    description: 'Tasks for your athletes',
  },
  {
    label: 'Settings',
    href: '/coach/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

export const ATHLETE_NAV: NavItem[] = [
  {
    label: 'Home',
    href: '/student/home',
    icon: Home,
    description: 'Your daily overview',
  },
  {
    label: 'AI Coach',
    href: '/student/ai-coach',
    icon: MessageCircle,
    description: '24/7 mental performance support',
    badge: 'AI',
    highlight: true,
  },
  {
    label: 'Check-in',
    href: '/student/wellness',
    icon: Heart,
    description: 'Daily mood and readiness',
  },
  {
    label: 'Assignments',
    href: '/student/assignments',
    icon: ClipboardList,
    description: 'Tasks from your coach',
  },
];

/**
 * Get navigation items based on user role
 */
export function getNavForRole(role: 'COACH' | 'ADMIN' | 'ATHLETE' | string): NavItem[] {
  if (role === 'COACH' || role === 'ADMIN') {
    return COACH_NAV;
  }
  return ATHLETE_NAV;
}

/**
 * Coach page redirects - maps old URLs to new locations
 */
export const COACH_REDIRECTS: Record<string, string> = {
  '/coach': '/coach/dashboard',
  '/coach/team-overview': '/coach/dashboard',
  '/coach/team': '/coach/athletes',
  '/coach/predictions': '/coach/dashboard',
  '/coach/analytics': '/coach/dashboard',
  '/coach/insights': '/coach/dashboard',
  '/coach/command-center': '/coach/dashboard',
  '/coach/roster': '/coach/athletes',
  '/coach/roi': '/coach/dashboard',
  '/coach/outcomes': '/coach/data',
  '/coach/performance/import': '/coach/data',
};

/**
 * Athlete page redirects - maps old URLs to new locations
 */
export const ATHLETE_REDIRECTS: Record<string, string> = {
  '/student/dashboard': '/student/home',
  '/student/chat': '/student/ai-coach',
  '/student/mood': '/student/wellness',
  '/student/readiness': '/student/wellness',
  '/student/progress': '/student/home',
  '/student/goals': '/student/home',
  '/student/visualization': '/student/home',
  '/student/schedule': '/student/home',
};
