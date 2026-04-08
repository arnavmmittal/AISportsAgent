'use client';

/**
 * Coach dashboard with team analytics and insights
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { type TeamAnalytics, type Recommendation } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard, EngagementStat } from '@/components/shared/ui/stat-card';

export function CoachDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    if (user?.id && user?.role === 'COACH') {
      loadDashboardData();
    }
  }, [user?.id, selectedPeriod]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coach/dashboard?days=${selectedPeriod}`);

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();

      setAnalytics({
        period_days: selectedPeriod,
        team_size: data.summary?.totalAthletes || 0,
        total_mood_logs: 0,
        averages: {
          mood: data.summary?.averageMood || 0,
          confidence: data.summary?.averageConfidence || 0,
          stress: data.summary?.averageStress || 0,
        },
        trends: {},
        at_risk_athletes: data.atRiskAthletes || [],
        engagement: {
          athletes_using_platform: data.summary?.activeAthletes || 0,
          engagement_rate: 0,
          total_chat_sessions: 0,
        },
        sport: '',
      });
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'COACH') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">This dashboard is only available for coaches</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Mental Performance</h1>
          <p className="text-muted-foreground">{analytics.sport} • {analytics.team_size} athletes</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Mood"
          value={analytics.averages.mood}
          trend={analytics.trends.mood_trend}
          color="primary"
        />
        <StatCard
          title="Average Confidence"
          value={analytics.averages.confidence}
          color="success"
        />
        <StatCard
          title="Average Stress"
          value={analytics.averages.stress}
          trend={analytics.trends.stress_trend === 'decreasing' ? 'improving' : 'declining'}
          color="warning"
          inverse
        />
        <StatCard
          title="Engagement Rate"
          value={analytics.engagement.engagement_rate}
          max={100}
          suffix="%"
          color="accent"
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-red-500/10 border-red-500'
                    : rec.priority === 'medium'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-primary/10 border-primary'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    <p className="text-sm text-foreground mt-2 font-medium">
                      Action: {rec.action}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-500/20 text-red-500'
                        : rec.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* At-Risk Athletes */}
      {analytics.at_risk_athletes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Athletes Needing Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.at_risk_athletes.map((athlete) => (
              <div
                key={athlete.athlete_id}
                className="p-4 bg-red-500/5 rounded-lg border border-red-500/20"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{athlete.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Avg Mood: <span className="font-medium text-foreground">{athlete.avg_mood}/10</span>
                      </span>
                      <span className="text-muted-foreground">
                        Avg Stress: <span className="font-medium text-foreground">{athlete.avg_stress}/10</span>
                      </span>
                      <span className="text-muted-foreground">
                        Logs: <span className="font-medium text-foreground">{athlete.logs_count}</span>
                      </span>
                    </div>
                  </div>
                  <Button variant="default" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Engagement Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EngagementStat
              value={analytics.engagement.athletes_using_platform}
              label="Active Athletes"
            />
            <EngagementStat
              value={`${analytics.engagement.engagement_rate}%`}
              label="Engagement Rate"
            />
            <EngagementStat
              value={analytics.engagement.total_chat_sessions}
              label="Total Sessions"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
