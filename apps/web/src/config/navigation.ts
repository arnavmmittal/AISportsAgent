/**
 * Navigation Configuration
 *
 * Single source of truth for all navigation across the app.
 * This ensures consistency between different navigation components.
 */

import {
  LayoutDashboard,
  Brain,
  Users,
  Activity,
  Database,
  Settings,
  Home,
  MessageCircle,
  Heart,
  Target,
  ClipboardList,
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

/**
 * Coach Portal Navigation
 *
 * 6 primary pages with clear purposes:
 * 1. Dashboard - "What's happening RIGHT NOW?"
 * 2. AI Insights - "What should I KNOW and DO?" (THE SHOWCASE)
 * 3. Athletes - "Deep dive on INDIVIDUALS"
 * 4. Readiness - "Who's READY today?"
 * 5. Data Hub - "Manage my DATA"
 * 6. Settings - "Configure my ACCOUNT"
 */
export const COACH_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/coach/dashboard',
    icon: LayoutDashboard,
    description: "What's happening right now",
  },
  {
    label: 'AI Insights',
    href: '/coach/ai-insights',
    icon: Brain,
    description: 'ML-powered analytics & recommendations',
    badge: 'AI',
    highlight: true,
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
    description: "Who's ready to perform today",
  },
  {
    label: 'Data Hub',
    href: '/coach/data',
    icon: Database,
    description: 'Import, export, and manage data',
  },
  {
    label: 'Settings',
    href: '/coach/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

/**
 * Athlete/Student Portal Navigation
 *
 * 6 primary pages with clear purposes:
 * 1. Home - Daily landing with readiness
 * 2. AI Coach - Chat (replaces Zoom meetings)
 * 3. Wellness - Readiness + mood check-in
 * 4. Goals - Track goals
 * 5. Assignments - Coach tasks
 * 6. Settings - Profile and privacy
 */
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
    label: 'Wellness',
    href: '/student/wellness',
    icon: Heart,
    description: 'Readiness and mood tracking',
  },
  {
    label: 'Goals',
    href: '/student/goals',
    icon: Target,
    description: 'Set and track your goals',
  },
  {
    label: 'Assignments',
    href: '/student/assignments',
    icon: ClipboardList,
    description: 'Tasks from your coach',
  },
  {
    label: 'Settings',
    href: '/student/settings',
    icon: Settings,
    description: 'Profile and preferences',
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
  '/coach/predictions': '/coach/ai-insights',
  '/coach/analytics': '/coach/ai-insights',
  '/coach/insights': '/coach/ai-insights',
  '/coach/outcomes': '/coach/data?tab=outcomes',
  '/coach/performance/import': '/coach/data?tab=import',
  '/coach/command-center': '/coach/dashboard',
  '/coach/roster': '/coach/athletes',
};

/**
 * Athlete page redirects - maps old URLs to new locations
 */
export const ATHLETE_REDIRECTS: Record<string, string> = {
  '/student/dashboard': '/student/home',
  '/student/chat': '/student/ai-coach',
  '/student/mood': '/student/wellness?tab=checkin',
  '/student/readiness': '/student/wellness?tab=readiness',
  '/student/progress': '/student/goals',
};
