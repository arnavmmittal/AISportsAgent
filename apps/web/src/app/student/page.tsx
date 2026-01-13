import { redirect } from 'next/navigation';

/**
 * Student root page - redirects to dashboard
 *
 * This page exists to handle direct navigation to /student
 * by redirecting to the main student dashboard at /student/home
 */
export default function StudentPage() {
  redirect('/student/home');
}
