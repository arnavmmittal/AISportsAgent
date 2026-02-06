import { redirect } from 'next/navigation';

/**
 * Team Redirect (v3.0 Navigation Consolidation)
 *
 * The Team page has been renamed to Athletes for clearer purpose.
 * "Athletes" = "Deep dive on INDIVIDUALS"
 *
 * This redirect ensures old bookmarks and links continue to work.
 */
export default function TeamRedirect() {
  redirect('/coach/athletes');
}
