import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AthleteDetailView from '@/components/coach/AthleteDetailView';

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/athletes');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;

  return <AthleteDetailView athleteId={id} />;
}
