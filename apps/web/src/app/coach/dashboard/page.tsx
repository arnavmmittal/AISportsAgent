import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EnhancedDashboard from '@/components/coach/EnhancedDashboard';

export default async function CoachDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/dashboard');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <EnhancedDashboard userId={session.user.id} />;
}
