/**
 * Coach Readiness Dashboard Page
 *
 * Protected route for coaches to view team readiness scores
 * Displays pre-competition mental readiness for all athletes
 */

import { redirect } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ReadinessDashboard } from '@/components/analytics/ReadinessDashboard';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata = {
  title: 'Team Readiness | AI Sports Agent',
  description: 'Pre-competition readiness scores for your team',
};

export default async function CoachReadinessPage() {
  // Check authentication
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/readiness');
  }

  // Verify user is a coach
  if (session.user?.role !== 'COACH') {
    redirect('/dashboard');
  }

  // Get coach data
  const { user } = session;
  const schoolId = user.schoolId || 'demo-school-123';
  const sport = user.coach?.sport || 'Basketball';

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <ReadinessDashboard
          sport={sport}
          schoolId={schoolId}
        />
      </div>
    </SessionProvider>
  );
}
