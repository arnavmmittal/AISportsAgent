import { redirect } from 'next/navigation';

/**
 * Mood Log redirect (v2.1 Navigation Consolidation)
 *
 * The Mood Log feature has been merged into the Wellness page.
 * This redirect ensures old bookmarks and links continue to work.
 *
 * The Wellness page opens to the Check-In tab which contains
 * all the mood logging functionality.
 */
export default function MoodRedirect() {
  redirect('/student/wellness');
}
