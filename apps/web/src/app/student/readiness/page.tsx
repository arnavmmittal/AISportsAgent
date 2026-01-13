import { redirect } from 'next/navigation';

/**
 * Readiness redirect (v2.1 Navigation Consolidation)
 *
 * The Readiness feature has been merged into the Wellness page.
 * This redirect ensures old bookmarks and links continue to work.
 */
export default function ReadinessRedirect() {
  redirect('/student/wellness');
}
