import { redirect } from 'next/navigation';

/**
 * Coach root page - redirects to dashboard
 *
 * This page exists to handle direct navigation to /coach
 * by redirecting to the main coach dashboard at /coach/dashboard
 */
export default function CoachPage() {
  redirect('/coach/dashboard');
}
