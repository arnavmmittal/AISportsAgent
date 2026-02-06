import { redirect } from 'next/navigation';

/**
 * Alerts redirect (v2.1 Navigation Consolidation)
 *
 * Alerts has been merged into the Readiness page.
 * The Readiness page has tabs for Team Readiness and Alerts.
 * This redirect ensures old bookmarks and links continue to work.
 *
 * Users can access alerts via the "Alerts" tab in Readiness.
 */
export default function AlertsRedirect() {
  redirect('/coach/readiness?tab=alerts');
}
