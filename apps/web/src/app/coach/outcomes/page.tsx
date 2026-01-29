import { redirect } from 'next/navigation';

/**
 * Outcomes Redirect (v3.0 Navigation Consolidation)
 *
 * Game outcomes are now in the Data Hub under the Outcomes tab.
 * "Data Hub" = "Manage my DATA"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function OutcomesRedirect() {
  redirect('/coach/data?tab=outcomes');
}
