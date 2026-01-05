/**
 * Team Readiness Heatmap Component
 *
 * Displays 14-day × athletes heatmap of readiness scores:
 * - Color coding: GREEN (85+), YELLOW (70-84), ORANGE (50-69), RED (<50)
 * - Interactive cells with athlete name + score tooltip
 * - Click cell → drill down to athlete detail
 * - Identifies patterns across team (e.g., Monday dips, pre-game anxiety)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface HeatmapCell {
  athleteId: string;
  athleteName: string;
  date: string; // YYYY-MM-DD
  score: number | null; // 0-100 readiness score
  level: 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'LOW' | 'POOR' | 'NO_DATA';
}

interface TeamHeatmapProps {
  coachId: string;
  days?: number; // Default 14
}

export function TeamHeatmap({ coachId, days = 14 }: TeamHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[][]>([]);
  const [athletes, setAthletes] = useState<{ id: string; name: string }[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTeamReadiness() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/coach/analytics/team-heatmap?coachId=${coachId}&days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch team readiness data');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load heatmap');
        }

        const { athletes: athleteList, dates: dateList, data } = result.data;

        setAthletes(athleteList);
        setDates(dateList);
        setHeatmapData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching team heatmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team heatmap');
        setIsLoading(false);
      }
    }

    fetchTeamReadiness();
  }, [coachId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Readiness Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading team data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || heatmapData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Readiness Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{error || 'No team data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCellColor = (level: string) => {
    switch (level) {
      case 'OPTIMAL':
        return 'bg-secondary/100';
      case 'GOOD':
        return 'bg-blue-500';
      case 'MODERATE':
        return 'bg-muted/100';
      case 'LOW':
        return 'bg-muted/100';
      case 'POOR':
        return 'bg-muted-foreground/100';
      default:
        return 'bg-gray-200';
    }
  };

  const getCellTextColor = (level: string) => {
    return level === 'NO_DATA' ? 'text-gray-400' : 'text-white';
  };

  const handleCellClick = (athleteId: string, date: string) => {
    // Navigate to athlete detail page
    router.push(`/coach/athletes/${athleteId}?date=${date}`);
  };

  // Calculate team stats
  const totalCells = heatmapData.reduce((sum, row) => sum + row.length, 0);
  const cellsWithData = heatmapData.reduce(
    (sum, row) => sum + row.filter((cell) => cell.score !== null).length,
    0
  );
  const avgScore =
    heatmapData.reduce((sum, row) => {
      return (
        sum +
        row.reduce((rowSum, cell) => rowSum + (cell.score || 0), 0) / (row.filter((c) => c.score !== null).length || 1)
      );
    }, 0) / (heatmapData.length || 1);

  const lowReadinessCells = heatmapData.reduce(
    (sum, row) => sum + row.filter((cell) => cell.score !== null && cell.score < 60).length,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Readiness Heatmap (Past {days} Days)</CardTitle>
        <CardDescription>
          Team avg: {avgScore.toFixed(1)}/100
          {lowReadinessCells > 0 && (
            <span className="ml-4 text-destructive flex items-center inline-flex">
              <TrendingDown className="h-4 w-4 mr-1" />
              {lowReadinessCells} cells below 60
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-background">
                  Athlete
                </th>
                {dates.map((date) => (
                  <th key={date} className="p-2 text-center text-xs font-medium text-muted-foreground min-w-[50px]">
                    {new Date(date).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, rowIdx) => (
                <tr key={athletes[rowIdx]?.id || rowIdx} className="border-t border-border">
                  <td className="p-2 text-xs font-medium sticky left-0 bg-background">
                    {athletes[rowIdx]?.name || 'Unknown'}
                  </td>
                  {row.map((cell, cellIdx) => (
                    <td key={`${rowIdx}-${cellIdx}`} className="p-1">
                      <div
                        className={`
                          ${getCellColor(cell.level)}
                          ${getCellTextColor(cell.level)}
                          rounded
                          h-10
                          flex
                          items-center
                          justify-center
                          text-xs
                          font-semibold
                          cursor-pointer
                          hover:opacity-80
                          hover:ring-2
                          hover:ring-primary
                          transition-all
                        `}
                        onClick={() => handleCellClick(cell.athleteId, cell.date)}
                        title={`${cell.athleteName}\n${cell.date}\n${cell.score !== null ? `Score: ${cell.score}` : 'No data'}`}
                      >
                        {cell.score !== null ? cell.score : '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-secondary/100 mr-2"></div>
            <span>Optimal (85-100)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
            <span>Good (70-84)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-muted/100 mr-2"></div>
            <span>Moderate (60-69)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-muted/100 mr-2"></div>
            <span>Low (45-59)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-muted-foreground/100 mr-2"></div>
            <span>Poor (&lt;45)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
            <span>No data</span>
          </div>
        </div>

        {/* Team Insights */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">Team Insights</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Data coverage: {cellsWithData}/{totalCells} ({Math.round((cellsWithData / totalCells) * 100)}%)</li>
            <li>• Team average: {avgScore.toFixed(1)}/100</li>
            {lowReadinessCells > 0 && (
              <li className="text-destructive">
                • {lowReadinessCells} instances of low readiness (&lt;60) - Consider adjusting training load
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
