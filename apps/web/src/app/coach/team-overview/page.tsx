import { redirect } from 'next/navigation';

/**
 * Team Overview Redirect (v3.0 Navigation Consolidation)
 *
 * Team overview is now the Dashboard.
 * "Dashboard" = "What's happening RIGHT NOW?"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function TeamOverviewRedirect() {
  redirect('/coach/dashboard');
}
