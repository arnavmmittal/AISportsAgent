'use client';

/**
 * ReadinessDashboard - Main coach dashboard for team readiness
 *
 * Features:
 * - Team overview cards (GREEN/YELLOW/RED counts)
 * - Game date selector (for pre-game readiness 24-48hrs before)
 * - Real-time data fetching from MCP backend
 * - TeamReadinessTable with all athletes
 * - At-risk athlete highlights
 * - Auto-refresh every 5 minutes
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamReadinessTable } from './TeamReadinessTable';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import {
  Calendar,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface TeamReadinessResponse {
  sport: string;
  gameDate: string;
  totalAthletes: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  athletes: any[];
}

interface ReadinessDashboardProps {
  sport: string;
  schoolId: string;
  initialGameDate?: string;
}

export function ReadinessDashboard({
  sport,
  schoolId,
  initialGameDate
}: ReadinessDashboardProps) {
  const [gameDate, setGameDate] = useState<string>(
    initialGameDate || format(addDays(new Date(), 2), 'yyyy-MM-dd')
  );
  const [data, setData] = useState<TeamReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch team readiness data from MCP backend
  const fetchReadinessData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('http://localhost:8000/api/analytics/readiness/team');
      url.searchParams.set('sport', sport);
      url.searchParams.set('school_id', schoolId);
      url.searchParams.set('game_date', gameDate);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch readiness data');
      }

      const responseData = await response.json();
      setData(responseData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load readiness data');
      console.error('Error fetching readiness data:', err);
    } finally {
      setLoading(false);
    }
  }, [sport, schoolId, gameDate]);

  // Initial fetch and game date change
  useEffect(() => {
    fetchReadinessData();
  }, [fetchReadinessData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchReadinessData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchReadinessData]);

  const handleGameDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameDate(e.target.value);
  };

  const handleManualRefresh = () => {
    fetchReadinessData();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team readiness data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleManualRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No readiness data available</p>
      </div>
    );
  }

  const atRiskAthletes = data.athletes.filter(a => a.level === 'RED');
  const monitorAthletes = data.athletes.filter(a => a.level === 'YELLOW');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pre-Game Readiness</h1>
          <p className="text-gray-600 mt-1">
            {data.sport} • {data.totalAthletes} athletes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Game Date Selector */}
          <div className="flex items-center gap-2 bg-card border border-gray-300 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={gameDate}
              onChange={handleGameDateChange}
              className="border-none focus:outline-none text-sm font-medium"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              autoRefresh
                ? 'bg-secondary/20 text-secondary hover:bg-secondary/30'
                : 'bg-muted text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Last updated timestamp */}
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Green (Ready) */}
        <Card className="border-l-4 border-secondary bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Ready to Compete
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {data.greenCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {((data.greenCount / data.totalAthletes) * 100).toFixed(0)}% of team
            </p>
            <div className="mt-3 w-full bg-secondary/30 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-secondary"
                style={{ width: `${(data.greenCount / data.totalAthletes) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Yellow (Monitor) */}
        <Card className="border-l-4 border-muted-foreground bg-muted/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Monitor Closely
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {data.yellowCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {((data.yellowCount / data.totalAthletes) * 100).toFixed(0)}% of team
            </p>
            <div className="mt-3 w-full bg-muted/30 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-muted-foreground"
                style={{ width: `${(data.yellowCount / data.totalAthletes) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Red (At-Risk) */}
        <Card className="border-l-4 border-muted-foreground bg-muted-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Intervention Needed
            </CardTitle>
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {data.redCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {((data.redCount / data.totalAthletes) * 100).toFixed(0)}% of team
            </p>
            <div className="mt-3 w-full bg-muted-foreground/30 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-muted-foreground/30"
                style={{ width: `${(data.redCount / data.totalAthletes) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Athletes Alert */}
      {atRiskAthletes.length > 0 && (
        <Card className="border-l-4 border-muted-foreground bg-muted-foreground/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="w-5 h-5" />
              {atRiskAthletes.length} Athlete{atRiskAthletes.length > 1 ? 's' : ''} Need Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {atRiskAthletes.slice(0, 4).map((athlete: any) => (
                <ReadinessScoreCard
                  key={athlete.athleteId}
                  data={athlete}
                  compact
                />
              ))}
            </div>
            {atRiskAthletes.length > 4 && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                + {atRiskAthletes.length - 4} more athletes shown in table below
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full Team Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Full Team Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamReadinessTable
            athletes={data.athletes}
            gameDate={data.gameDate}
            onAthleteClick={(athleteId) => {
              console.log('Athlete clicked:', athleteId);
              // TODO: Navigate to athlete detail page or open modal
            }}
          />
        </CardContent>
      </Card>

      {/* Recommendations */}
      {(atRiskAthletes.length > 0 || monitorAthletes.length > 0) && (
        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRiskAthletes.length > 0 && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">High Priority</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Schedule 1-on-1 conversations with {atRiskAthletes.length} at-risk athlete
                    {atRiskAthletes.length > 1 ? 's' : ''} before game day. Focus on stress management
                    and sleep optimization.
                  </p>
                </div>
              </div>
            )}
            {monitorAthletes.length > 0 && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Monitor</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Check in with {monitorAthletes.length} athlete
                    {monitorAthletes.length > 1 ? 's' : ''} in yellow status during warm-up.
                    Quick mental state assessment recommended.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-secondary mt-0.5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Team Preparation</h4>
                <p className="text-sm text-gray-700 mt-1">
                  {data.greenCount} athletes are mentally ready. Focus team meeting on maintaining
                  positive momentum and executing game plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
