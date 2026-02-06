import { redirect } from 'next/navigation';

/**
 * Performance Redirect (v3.0 Navigation Consolidation)
 *
 * Performance data management is now in the Data Hub.
 * "Data Hub" = "Manage my DATA"
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function PerformanceRedirect() {
  redirect('/coach/data');
}
