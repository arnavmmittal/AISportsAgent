import { redirect } from 'next/navigation';

/**
 * Student dashboard redirect
 *
 * Redirects to /student/ai-coach which is the main dashboard in the navigation.
 * This ensures consistency when users navigate to /student/dashboard.
 */
export default function StudentDashboardRedirect() {
  redirect('/student/ai-coach');
}
