/**
 * Command Center - Coach Mission Control Dashboard
 * Real-time AI-powered athlete monitoring and intervention hub
 */

'use client';

import { useState, useEffect } from 'react';
import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import { TwoColumnLayout } from '@/components/coach/layouts/DashboardGrid';
import { DashboardSection, StatsGrid } from '@/components/coach/layouts/DashboardGrid';
import StatCard from '@/components/coach/ui/StatCard';
import { SkeletonStatCard, SkeletonDashboard } from '@/components/coach/ui/Skeleton';
import { CommandCenterData } from '@/types/coach-portal';
import PriorityAthleteList from '@/components/coach/command-center/PriorityAthleteList';
import QuickStatsGrid from '@/components/coach/command-center/QuickStatsGrid';
import ActionFeed from '@/components/coach/command-center/ActionFeed';
import InterventionTracker from '@/components/coach/command-center/InterventionTracker';

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/coach/command-center');

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <CoachPortalLayout>
        <SkeletonDashboard />
      </CoachPortalLayout>
    );
  }

  if (error) {
    return (
      <CoachPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </CoachPortalLayout>
    );
  }

  return (
    <CoachPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-slate-400 mt-1">
              AI-powered mission control • Last updated{' '}
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Quick Stats */}
        <QuickStatsGrid data={data} />

        {/* Main Content: Priority Athletes + Action Feed */}
        <TwoColumnLayout
          main={
            <DashboardSection
              title="Priority Athletes"
              description="AI-sorted by urgency and risk level"
            >
              <PriorityAthleteList athletes={data?.priorityAthletes || []} />
            </DashboardSection>
          }
          sidebar={
            <div className="space-y-6">
              {/* Action Feed */}
              <DashboardSection title="Action Feed" description="Real-time flags">
                <ActionFeed items={data?.actionFeed || []} />
              </DashboardSection>

              {/* Recent Interventions */}
              <DashboardSection
                title="Recent Interventions"
                description="Your last 5 actions"
              >
                <InterventionTracker interventions={data?.recentInterventions || []} />
              </DashboardSection>
            </div>
          }
        />
      </div>
    </CoachPortalLayout>
  );
}
