import { redirect } from 'next/navigation';

/**
 * Reports redirect (v2.1 Navigation Consolidation)
 *
 * Reports has been merged into the Insights page.
 * The Insights page has tabs for Analytics and Reports.
 * This redirect ensures old bookmarks and links continue to work.
 *
 * Users can access Reports via the "Reports" tab in Insights.
 */
export default function ReportsRedirect() {
  redirect('/coach/insights?tab=reports');
}
