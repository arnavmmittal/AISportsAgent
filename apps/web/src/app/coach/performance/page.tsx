import { redirect } from 'next/navigation';

/**
 * Performance redirect (v2.1 Navigation Consolidation)
 *
 * Performance has been merged into the Team page.
 * The Team page has tabs for Roster and Performance.
 * This redirect ensures old bookmarks and links continue to work.
 *
 * Users can access performance tools via the "Performance" tab in Team.
 */
export default function PerformanceRedirect() {
  redirect('/coach/team?tab=performance');
}
