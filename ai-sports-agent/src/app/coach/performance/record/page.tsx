/**
 * Record Game Performance Page
 *
 * Protected route for coaches to enter post-game performance stats
 * Enables mental state → performance correlation analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GameStatsForm } from '@/components/performance/GameStatsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  name: string;
  position?: string;
}

export default function RecordPerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not a coach
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/coach/performance/record');
      return;
    }

    if (session.user?.role !== 'COACH') {
      router.push('/dashboard');
      return;
    }

    fetchAthletes();
  }, [session, status, router]);

  const fetchAthletes = async () => {
    try {
      // TODO: Replace with actual API endpoint to fetch team athletes
      // For now, using mock data
      const mockAthletes: Athlete[] = [
        { id: 'athlete-1', name: 'John Smith', position: 'Point Guard' },
        { id: 'athlete-2', name: 'Sarah Johnson', position: 'Shooting Guard' },
        { id: 'athlete-3', name: 'Mike Davis', position: 'Center' },
        { id: 'athlete-4', name: 'Emily Brown', position: 'Forward' },
        { id: 'athlete-5', name: 'Chris Lee', position: 'Power Forward' },
      ];

      setAthletes(mockAthletes);
    } catch (error) {
      console.error('Failed to fetch athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/performance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save game stats');
    }

    const result = await response.json();
    console.log('Performance saved:', result);

    // Redirect to success page or back to dashboard
    router.push('/coach/readiness');
  };

  const handleCancel = () => {
    router.push('/coach/dashboard');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'COACH') {
    return null;
  }

  const sport = session.user.coach?.sport || 'Basketball';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/coach/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Record Game Performance</h1>
          <p className="text-gray-600 mt-2">
            Enter post-game stats to track mental state → performance correlations
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Building Your Proprietary Dataset
                </h3>
                <p className="text-sm text-blue-800 mt-1">
                  By recording game stats, you're building a proprietary mental performance dataset.
                  The system will automatically link these stats to the athlete's mental state data
                  (mood, stress, sleep) to prove the ROI of mental performance optimization.
                </p>
                <div className="mt-3 text-sm text-blue-700">
                  <strong>Example insights you'll get:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>"Athletes with mood &gt;7 have +15% better shooting percentage"</li>
                    <li>"Sleep &lt;6 hours correlates with 20% more turnovers"</li>
                    <li>"High stress before games reduces assists by 25%"</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <GameStatsForm
          sport={sport}
          athletes={athletes}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {/* Help Text */}
        <Card className="mt-6 bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Need bulk import?</h3>
            <p className="text-sm text-gray-700 mb-3">
              If you have historical game data in a spreadsheet, you can use the bulk import feature
              to upload multiple games at once.
            </p>
            <Button variant="outline" disabled>
              Bulk Import CSV (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
