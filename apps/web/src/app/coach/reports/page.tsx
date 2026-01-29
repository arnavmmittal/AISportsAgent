import { redirect } from 'next/navigation';

/**
 * Reports Redirect (v3.0 Navigation Consolidation)
 *
 * Reports are now in the Data Hub under the Reports tab.
 * "Data Hub" = "Manage my DATA"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function ReportsRedirect() {
  redirect('/coach/data?tab=reports');
}
