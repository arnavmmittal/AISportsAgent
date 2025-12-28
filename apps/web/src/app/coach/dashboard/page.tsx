// TODO: Re-implement auth after Supabase migration
// import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EnhancedDashboard from '@/components/coach/EnhancedDashboard';

export default async function CoachDashboardPage() {
  // TODO: Re-implement auth check after Supabase migration
  // const session = await auth();
  // if (!session) {
  //   redirect('/auth/signin?callbackUrl=/coach/dashboard');
  // }
  // if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
  //   redirect('/dashboard');
  // }

  // Temporary: Use first coach until auth is implemented
  const tempCoachId = 'temp-coach-id';

  return <EnhancedDashboard userId={tempCoachId} />;
}
