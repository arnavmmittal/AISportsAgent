import { redirect } from 'next/navigation';

/**
 * Athletes redirect (v2.1 Navigation Consolidation)
 *
 * Athletes has been merged into the Team page.
 * The Team page has tabs for Roster (athletes) and Performance.
 * This redirect ensures old bookmarks and links continue to work.
 *
 * Users can access the roster via the "Roster" tab in Team.
 */
export default function AthletesRedirect() {
  redirect('/coach/team');
}
