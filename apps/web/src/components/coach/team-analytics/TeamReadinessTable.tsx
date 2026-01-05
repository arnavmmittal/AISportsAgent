'use client';

/**
 * TeamReadinessTable - Sortable table of all athlete readiness scores
 *
 * Features:
 * - Sortable columns (name, position, score, level)
 * - Filter by readiness level (GREEN/YELLOW/RED)
 * - Export to CSV functionality
 * - Responsive design with mobile view
 * - Click row to view athlete details
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  X
} from 'lucide-react';
import type { ReadinessScoreData } from './ReadinessScoreCard';

interface TeamReadinessTableProps {
  athletes: ReadinessScoreData[];
  onAthleteClick?: (athleteId: string) => void;
  gameDate: string;
}

type SortField = 'name' | 'position' | 'score' | 'level';
type SortDirection = 'asc' | 'desc';
type LevelFilter = 'ALL' | 'GREEN' | 'YELLOW' | 'RED';

const levelOrder = { GREEN: 1, YELLOW: 2, RED: 3 };

const levelConfig = {
  GREEN: {
    badgeBg: 'bg-secondary/20',
    badgeText: 'text-secondary',
    rowBg: 'bg-secondary/10',
  },
  YELLOW: {
    badgeBg: 'bg-muted/20',
    badgeText: 'text-muted-foreground',
    rowBg: 'bg-muted/10',
  },
  RED: {
    badgeBg: 'bg-muted-foreground/20',
    badgeText: 'text-muted-foreground',
    rowBg: 'bg-muted-foreground/10',
  },
};

export function TeamReadinessTable({
  athletes,
  onAthleteClick,
  gameDate
}: TeamReadinessTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL');

  // Sorting and filtering logic
  const sortedAndFilteredAthletes = useMemo(() => {
    let filtered = athletes;

    // Apply level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(athlete => athlete.level === levelFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.athleteName.localeCompare(b.athleteName);
          break;
        case 'position':
          comparison = (a.position || '').localeCompare(b.position || '');
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'level':
          comparison = levelOrder[a.level] - levelOrder[b.level];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [athletes, sortField, sortDirection, levelFilter]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-gray-700" />
      : <ArrowDown className="w-4 h-4 text-gray-700" />;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Position', 'Score', 'Level', 'Top Factors', 'Game Date'];
    const rows = sortedAndFilteredAthletes.map(athlete => [
      athlete.athleteName,
      athlete.position || 'N/A',
      athlete.score.toString(),
      athlete.level,
      athlete.factors.slice(0, 3).map(f => `${f.label}: ${f.value.toFixed(1)}`).join('; '),
      new Date(gameDate).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `team-readiness-${new Date(gameDate).toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Count by level
  const counts = {
    GREEN: athletes.filter(a => a.level === 'GREEN').length,
    YELLOW: athletes.filter(a => a.level === 'YELLOW').length,
    RED: athletes.filter(a => a.level === 'RED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Team Readiness Overview
          </h3>
          <p className="text-sm text-gray-600">
            {sortedAndFilteredAthletes.length} of {athletes.length} athletes shown
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Level filter buttons */}
          <div className="flex gap-1 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <button
              onClick={() => setLevelFilter('ALL')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                levelFilter === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-muted text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({athletes.length})
            </button>
            <button
              onClick={() => setLevelFilter('GREEN')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                levelFilter === 'GREEN'
                  ? 'bg-secondary text-white'
                  : 'bg-secondary/20 text-secondary hover:bg-secondary/30'
              }`}
            >
              Green ({counts.GREEN})
            </button>
            <button
              onClick={() => setLevelFilter('YELLOW')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                levelFilter === 'YELLOW'
                  ? 'bg-muted-foreground text-white'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              Yellow ({counts.YELLOW})
            </button>
            <button
              onClick={() => setLevelFilter('RED')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                levelFilter === 'RED'
                  ? 'bg-muted-foreground/30 text-white'
                  : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
              }`}
            >
              Red ({counts.RED})
            </button>
            {levelFilter !== 'ALL' && (
              <button
                onClick={() => setLevelFilter('ALL')}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-muted rounded-md"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead
                className="cursor-pointer hover:bg-muted select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Athlete</span>
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted select-none"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Position</span>
                  {getSortIcon('position')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted select-none text-center"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold">Score</span>
                  {getSortIcon('score')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted select-none text-center"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold">Level</span>
                  {getSortIcon('level')}
                </div>
              </TableHead>
              <TableHead>
                <span className="font-semibold">Top Factors</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredAthletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No athletes match the selected filter
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredAthletes.map((athlete) => {
                const config = levelConfig[athlete.level];
                const topFactors = athlete.factors.slice(0, 3);

                return (
                  <TableRow
                    key={athlete.athleteId}
                    className={`${config.rowBg} hover:opacity-80 transition-opacity ${
                      onAthleteClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onAthleteClick?.(athlete.athleteId)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {athlete.athleteName}
                        </div>
                        {athlete.trend && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {athlete.trend === 'improving' && '↑ Improving'}
                            {athlete.trend === 'declining' && '↓ Declining'}
                            {athlete.trend === 'stable' && '→ Stable'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{athlete.position || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {athlete.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${config.badgeBg} ${config.badgeText}`}>
                        {athlete.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {topFactors.map((factor, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{factor.label}:</span>{' '}
                            {factor.value.toFixed(1)} (+{factor.impact.toFixed(1)})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-2">
        <div>
          Game Date: <span className="font-medium">{new Date(gameDate).toLocaleDateString()}</span>
        </div>
        <div>
          {counts.GREEN} ready • {counts.YELLOW} monitor • {counts.RED} at-risk
        </div>
      </div>
    </div>
  );
}
