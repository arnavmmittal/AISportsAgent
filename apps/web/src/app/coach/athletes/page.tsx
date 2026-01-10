'use client';

import { useState, useEffect } from 'react';
import { Search, User, Calendar, TrendingDown, MessageSquare, AlertTriangle, Users, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SportFilter } from '@/components/SportFilter';
import { Card } from '@/design-system/components';
import { AnimatedCounter } from '@/design-system/components';

type RiskLevel = 'critical' | 'warning' | 'good' | 'no-data';

interface Athlete {
  id: string;
  name: string;
  sport: string;
  year: string;
  riskLevel: RiskLevel;
  lastCheckIn: Date | null;
  moodScore: number | null;
  readinessScore: number | null;
  baseReadiness: number | null;
  chatContribution: number;
  chatInsights: {
    sentiment: 'improving' | 'stable' | 'declining';
    themes: string[];
    risks: string[];
  } | null;
  concern: string | null;
  missedCheckIns: number;
}

export default function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch athletes from API
  useEffect(() => {
    loadAthletes();
  }, [selectedSports]);

  const loadAthletes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedSports.length > 0) {
        params.set('sports', selectedSports.join(','));
      }

      const response = await fetch(`/api/athletes?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch athletes');
      }

      const data = await response.json();

      // Transform dates
      const transformedAthletes = data.athletes.map((a: any) => ({
        ...a,
        lastCheckIn: a.lastCheckIn ? new Date(a.lastCheckIn) : null,
      }));

      setAthletes(transformedAthletes);
      console.log(`Loaded ${transformedAthletes.length} athletes from API`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load athletes';
      console.error('Error loading athletes:', error);
      setError(message);
      setAthletes([]); // Clear athletes on error
    } finally {
      setIsLoading(false);
    }
  };

  // Use real data from API
  const displayAthletes = athletes;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-danger-50 dark:bg-danger-900/20',
          border: 'border-danger-200 dark:border-danger-800',
          dot: 'bg-danger-600',
          text: 'text-danger-700 dark:text-danger-300',
          badge: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
        };
      case 'warning':
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/20',
          border: 'border-warning-200 dark:border-warning-800',
          dot: 'bg-warning-600',
          text: 'text-warning-700 dark:text-warning-300',
          badge: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
        };
      case 'good':
        return {
          bg: 'bg-success-50 dark:bg-success-900/20',
          border: 'border-success-200 dark:border-success-800',
          dot: 'bg-success-600',
          text: 'text-success-700 dark:text-success-300',
          badge: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
        };
      case 'no-data':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-700',
          dot: 'bg-gray-400 dark:bg-gray-500',
          text: 'text-gray-900 dark:text-gray-200',
          badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        };
    }
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 172800) return 'Yesterday';
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredAthletes = displayAthletes
    .filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          athlete.sport.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || athlete.riskLevel === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by risk level: critical > warning > good > no-data
      const riskOrder = { critical: 0, warning: 1, good: 2, 'no-data': 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

  const criticalCount = displayAthletes.filter(a => a.riskLevel === 'critical').length;
  const warningCount = displayAthletes.filter(a => a.riskLevel === 'warning').length;
  const goodCount = displayAthletes.filter(a => a.riskLevel === 'good').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Athletes
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">Quick status overview with readiness tracking</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card variant="elevated" padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Total Athletes</div>
                <div className="text-4xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <AnimatedCounter value={displayAthletes.length} decimals={0} />
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-medium font-body">
                  {selectedSports.length > 0 ? `Filtered` : 'Active roster'}
                </div>
              </div>
              <Users className="w-12 h-12 text-primary-600 dark:text-primary-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-danger-200 dark:border-danger-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-danger-600 dark:text-danger-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Critical</div>
                <div className="text-4xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">
                  <AnimatedCounter value={criticalCount} decimals={0} />
                </div>
                <div className="text-sm text-danger-600 dark:text-danger-400 font-medium font-body">Immediate attention</div>
              </div>
              <AlertTriangle className="w-12 h-12 text-danger-600 dark:text-danger-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-warning-200 dark:border-warning-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-warning-600 dark:text-warning-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Warning</div>
                <div className="text-4xl font-display font-bold text-warning-700 dark:text-warning-300 mb-2">
                  <AnimatedCounter value={warningCount} decimals={0} />
                </div>
                <div className="text-sm text-warning-600 dark:text-warning-400 font-medium font-body">Monitor closely</div>
              </div>
              <Activity className="w-12 h-12 text-warning-600 dark:text-warning-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-success-200 dark:border-success-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-success-600 dark:text-success-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Good</div>
                <div className="text-4xl font-display font-bold text-success-700 dark:text-success-300 mb-2">
                  <AnimatedCounter value={goodCount} decimals={0} />
                </div>
                <div className="text-sm text-success-600 dark:text-success-400 font-medium font-body">Doing well</div>
              </div>
              <CheckCircle2 className="w-12 h-12 text-success-600 dark:text-success-400 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card variant="elevated" padding="lg" className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-body"
            />
          </div>

          {/* Sport Filter */}
          <SportFilter selectedSports={selectedSports} onSportsChange={setSelectedSports} />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap font-body ${
                filter === 'all'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({displayAthletes.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap font-body ${
                filter === 'critical'
                  ? 'bg-danger-600 dark:bg-danger-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap font-body ${
                filter === 'warning'
                  ? 'bg-warning-600 dark:bg-warning-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('good')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap font-body ${
                filter === 'good'
                  ? 'bg-success-600 dark:bg-success-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Good
            </button>
          </div>
        </div>
      </Card>

      {/* Athletes List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">Loading athletes...</h3>
          </Card>
        ) : error ? (
          <Card variant="elevated" padding="lg" className="border-danger-200 dark:border-danger-800 text-center">
            <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-danger-700 dark:text-danger-300 mb-2">Error Loading Athletes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-body mb-4">{error}</p>
            <button
              onClick={() => loadAthletes()}
              className="px-6 py-2 bg-danger-600 dark:bg-danger-500 text-white rounded-lg hover:bg-danger-700 dark:hover:bg-danger-600 transition-colors font-medium font-body"
            >
              Retry
            </button>
          </Card>
        ) : filteredAthletes.length === 0 ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">No athletes found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-body">Try adjusting your search or filter</p>
          </Card>
        ) : (
          filteredAthletes.map((athlete) => {
            const colors = getRiskColor(athlete.riskLevel);
            return (
              <div
                key={athlete.id}
                className={`${colors.bg} border ${colors.border} rounded-lg p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Dot */}
                  <div className={`w-3 h-3 ${colors.dot} rounded-full flex-shrink-0`}></div>

                  {/* Athlete Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${colors.text}`}>{athlete.name}</h3>
                      {athlete.riskLevel === 'critical' && (
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>{athlete.sport}</span>
                      <span>•</span>
                      <span>{athlete.year}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Last check-in: {getTimeAgo(athlete.lastCheckIn)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="hidden md:block text-right min-w-[200px]">
                    {athlete.readinessScore !== null && (
                      <div className="mb-2">
                        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          <span>Readiness: {athlete.readinessScore}/100</span>
                          {athlete.chatContribution !== 0 && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                athlete.chatContribution > 0
                                  ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                                  : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
                              }`}
                            >
                              Chat: {athlete.chatContribution > 0 ? '+' : ''}
                              {athlete.chatContribution}
                            </span>
                          )}
                        </div>
                        {athlete.chatInsights && athlete.chatInsights.sentiment && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Sentiment: {athlete.chatInsights.sentiment}
                          </div>
                        )}
                      </div>
                    )}
                    {athlete.concern && (
                      <div
                        className={`text-sm font-body ${
                          athlete.riskLevel === 'critical'
                            ? 'text-danger-700 dark:text-danger-300'
                            : athlete.riskLevel === 'warning'
                            ? 'text-warning-700 dark:text-warning-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {athlete.concern}
                      </div>
                    )}
                    {athlete.chatInsights && athlete.chatInsights.themes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        {athlete.chatInsights.themes.slice(0, 2).map((theme) => (
                          <span
                            key={theme}
                            className="text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-body"
                          >
                            {theme.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {!athlete.concern && athlete.riskLevel === 'good' && (
                      <div className="text-sm text-success-700 dark:text-success-300 font-body">
                        All indicators healthy
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {athlete.riskLevel === 'critical' && (
                    <button className="px-4 py-2 bg-danger-600 dark:bg-danger-500 text-white rounded-lg hover:bg-danger-700 dark:hover:bg-danger-600 transition-colors font-medium text-sm whitespace-nowrap font-body">
                      Reach Out
                    </button>
                  )}
                  {athlete.riskLevel === 'warning' && (
                    <Link
                      href={`/coach/athletes/${athlete.id}`}
                      className="px-4 py-2 bg-warning-600 dark:bg-warning-500 text-white rounded-lg hover:bg-warning-700 dark:hover:bg-warning-600 transition-colors font-medium text-sm text-center whitespace-nowrap font-body"
                    >
                      View Details
                    </Link>
                  )}
                  {athlete.riskLevel === 'good' && (
                    <Link
                      href={`/coach/athletes/${athlete.id}`}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium text-sm text-center whitespace-nowrap font-body"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Mobile Concern Display */}
        {filteredAthletes.some(a => a.concern) && (
          <div className="md:hidden bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 mt-8">
            <h3 className="text-xl font-black text-foreground dark:text-gray-100 mb-4">Recent Concerns</h3>
            <div className="space-y-3">
              {filteredAthletes
                .filter(a => a.concern)
                .map(athlete => (
                  <div key={athlete.id} className="text-sm">
                    <span className="font-bold text-foreground dark:text-gray-100">{athlete.name}:</span>{' '}
                    <span className="text-muted-foreground dark:text-gray-400">{athlete.concern}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
