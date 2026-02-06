import { redirect } from 'next/navigation';

/**
 * Performance Import Redirect (v3.0 Navigation Consolidation)
 *
 * Data import is now in the Data Hub under the Import tab.
 * "Data Hub" = "Manage my DATA"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function PerformanceImportRedirect() {
  redirect('/coach/data?tab=import');
}
