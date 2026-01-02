'use client';

import { useState, useEffect } from 'react';
import { Search, User, Calendar, TrendingDown, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { SportFilter } from '@/components/SportFilter';

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

  // Keep mock data as fallback (remove these when API is working)
  const mockAthletes: Athlete[] = [
    {
      id: 'alex-martinez',
      name: 'Alex Martinez',
      sport: 'Basketball',
      year: 'Junior',
      riskLevel: 'critical',
      lastCheckIn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      moodScore: null,
      readinessScore: 42,
      baseReadiness: 48,
      chatContribution: -6,
      chatInsights: {
        sentiment: 'declining',
        themes: ['performance-anxiety', 'team-conflict'],
        risks: ['Performance anxiety detected in recent conversations'],
      },
      concern: 'Performance anxiety detected in recent conversations',
      missedCheckIns: 3,
    },
    {
      id: 'jordan-lee',
      name: 'Jordan Lee',
      sport: 'Soccer',
      year: 'Sophomore',
      riskLevel: 'warning',
      lastCheckIn: new Date(),
      moodScore: 5.0,
      readinessScore: 64,
      baseReadiness: 62,
      chatContribution: 2,
      chatInsights: {
        sentiment: 'stable',
        themes: ['academic-stress', 'recovery-rest'],
        risks: ['Academic stress affecting mental bandwidth'],
      },
      concern: 'Academic stress affecting mental bandwidth',
      missedCheckIns: 0,
    },
    {
      id: 'morgan-davis',
      name: 'Morgan Davis',
      sport: 'Track',
      year: 'Senior',
      riskLevel: 'warning',
      lastCheckIn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      moodScore: 4.5,
      readinessScore: 58,
      baseReadiness: 54,
      chatContribution: 4,
      chatInsights: {
        sentiment: 'improving',
        themes: ['mindset-mental', 'goal-setting'],
        risks: [],
      },
      concern: 'Mood declining (8.5 → 4.5 in 3 days)',
      missedCheckIns: 0,
    },
    {
      id: 'sarah-johnson',
      name: 'Sarah Johnson',
      sport: 'Swimming',
      year: 'Freshman',
      riskLevel: 'good',
      lastCheckIn: new Date(),
      moodScore: 8.5,
      readinessScore: 88,
      baseReadiness: 84,
      chatContribution: 4,
      chatInsights: {
        sentiment: 'improving',
        themes: ['competition-preparation', 'mindset-mental'],
        risks: [],
      },
      concern: null,
      missedCheckIns: 0,
    },
    {
      id: 'taylor-brown',
      name: 'Taylor Brown',
      sport: 'Volleyball',
      year: 'Junior',
      riskLevel: 'good',
      lastCheckIn: new Date(Date.now() - 2 * 60 * 60 * 1000),
      moodScore: 7.8,
      readinessScore: 82,
      baseReadiness: 82,
      chatContribution: 0,
      chatInsights: null,
      concern: null,
      missedCheckIns: 0,
    },
    {
      id: 'casey-wilson',
      name: 'Casey Wilson',
      sport: 'Tennis',
      year: 'Sophomore',
      riskLevel: 'warning',
      lastCheckIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      moodScore: 6.2,
      readinessScore: 68,
      baseReadiness: 72,
      chatContribution: -4,
      chatInsights: {
        sentiment: 'stable',
        themes: ['recovery-rest', 'injury-concern'],
        risks: ['Injury concerns mentioned - monitor physical readiness'],
      },
      concern: 'Injury concerns mentioned - monitor physical readiness',
      missedCheckIns: 0,
    },
  ];

  // ALWAYS use real data from API (no mock fallback)
  const displayAthletes = athletes;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          dot: 'bg-red-500',
          text: 'text-red-900 dark:text-red-200',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          dot: 'bg-orange-500',
          text: 'text-orange-900 dark:text-orange-200',
          badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200',
        };
      case 'good':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          dot: 'bg-green-500',
          text: 'text-green-900 dark:text-green-200',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200',
        };
      case 'no-data':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-700',
          dot: 'bg-gray-400',
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Athletes
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Quick status overview with readiness tracking</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Total Athletes</div>
                <div className="text-5xl font-black mb-2">{displayAthletes.length}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  {selectedSports.length > 0 ? `Filtered` : 'Active roster'}
                </div>
              </div>
              <div className="text-6xl opacity-20">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">Critical</div>
                <div className="text-5xl font-black mb-2">{criticalCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Immediate attention</div>
              </div>
              <div className="text-6xl opacity-20">🚨</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Warning</div>
                <div className="text-5xl font-black mb-2">{warningCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Monitor closely</div>
              </div>
              <div className="text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Good</div>
                <div className="text-5xl font-black mb-2">{goodCount}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Doing well</div>
              </div>
              <div className="text-6xl opacity-20">✅</div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-foreground dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Sport Filter */}
          <SportFilter selectedSports={selectedSports} onSportsChange={setSelectedSports} />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({displayAthletes.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔴 Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'warning'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🟡 Warning
            </button>
            <button
              onClick={() => setFilter('good')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'good'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🟢 Good
            </button>
          </div>
        </div>
      </div>

      {/* Athletes List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading athletes...</h3>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow border-2 border-red-200 dark:border-red-800 p-12 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Athletes</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => loadAthletes()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No athletes found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
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
                        <AlertTriangle className="w-4 h-4 text-red-600" />
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
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
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
                        className={`text-sm ${
                          athlete.riskLevel === 'critical'
                            ? 'text-red-700 dark:text-red-300'
                            : athlete.riskLevel === 'warning'
                            ? 'text-orange-700 dark:text-orange-300'
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
                            className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {theme.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {!athlete.concern && athlete.riskLevel === 'good' && (
                      <div className="text-sm text-green-700 dark:text-green-300">
                        All indicators healthy
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {athlete.riskLevel === 'critical' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm whitespace-nowrap">
                      Reach Out
                    </button>
                  )}
                  {athlete.riskLevel === 'warning' && (
                    <Link
                      href={`/coach/athletes/${athlete.id}`}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm text-center whitespace-nowrap"
                    >
                      View Details
                    </Link>
                  )}
                  {athlete.riskLevel === 'good' && (
                    <Link
                      href={`/coach/athletes/${athlete.id}`}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium text-sm text-center whitespace-nowrap"
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
