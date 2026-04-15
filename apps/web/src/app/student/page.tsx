import { redirect } from 'next/navigation';

/**
 * Student root page - redirects to AI Coach
 *
 * This page exists to handle direct navigation to /student
 * by redirecting to the main student page at /student/ai-coach
 */
export default function StudentPage() {
  redirect('/student/ai-coach');
}
