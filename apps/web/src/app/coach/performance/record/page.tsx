import { redirect } from 'next/navigation';

/**
 * Performance Record Redirect (v3.0 Navigation Consolidation)
 *
 * Manual game recording is now part of the Data Hub.
 * "Data Hub" = "Manage my DATA"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function PerformanceRecordRedirect() {
  redirect('/coach/data?tab=outcomes');
}
