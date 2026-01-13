import { redirect } from 'next/navigation';

/**
 * Student dashboard redirect
 *
 * Redirects to /student/home which is the main dashboard in the navigation.
 * This ensures consistency when users navigate to /student/dashboard.
 */
export default function StudentDashboardRedirect() {
  redirect('/student/home');
}
