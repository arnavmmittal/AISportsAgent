'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import EnhancedDashboard from '@/components/coach/EnhancedDashboard';
import { Loader2 } from 'lucide-react';

export default function CoachDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a coach
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/signin?callbackUrl=/coach/dashboard');
      return;
    }

    if (user?.role !== 'COACH' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authorized - show nothing while redirecting
  if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN')) {
    return null;
  }

  return <EnhancedDashboard userId={user.id} />;
}
