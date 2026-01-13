import { redirect } from 'next/navigation';

/**
 * Progress redirect (v2.1 Navigation Consolidation)
 *
 * Progress tracking has been consolidated:
 * - Goal progress statistics are now in the Goals page header
 * - Mood/wellness tracking is in the Wellness page
 *
 * This redirect ensures old bookmarks and links continue to work.
 */
export default function ProgressRedirect() {
  redirect('/student/goals');
}
