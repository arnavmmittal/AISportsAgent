import { redirect } from 'next/navigation';

/**
 * Analytics redirect (v2.1 Navigation Consolidation)
 *
 * Analytics has been merged into the Insights page.
 * The Insights page has tabs for Analytics and Reports.
 * This redirect ensures old bookmarks and links continue to work.
 */
export default function AnalyticsRedirect() {
  redirect('/coach/insights');
}
