'use client';

import { useState, useEffect } from 'react';
import { Search, User, Calendar, TrendingDown, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type RiskLevel = 'critical' | 'warning' | 'good' | 'no-data';

interface Athlete {
  id: string;
  name: string;
  sport: string;
  year: string;
  riskLevel: RiskLevel;
  lastCheckIn: Date | null;
  moodScore: number | null;
  concern: string;
  missedCheckIns: number;
}

export default function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');

  // Mock data - will be replaced with API call
  const [athletes] = useState<Athlete[]>([
    {
      id: 'alex-martinez',
      name: 'Alex Martinez',
      sport: 'Basketball',
      year: 'Junior',
      riskLevel: 'critical',
      lastCheckIn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      moodScore: null,
      concern: 'Missed 3 check-ins consecutively',
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
      concern: 'Stress 9/10, Sleep 4hrs',
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
      concern: 'Sleep average 5.2hrs over 7 days',
      missedCheckIns: 0,
    },
  ]);

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

  const filteredAthletes = athletes
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

  const criticalCount = athletes.filter(a => a.riskLevel === 'critical').length;
  const warningCount = athletes.filter(a => a.riskLevel === 'warning').length;
  const goodCount = athletes.filter(a => a.riskLevel === 'good').length;

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
                <div className="text-5xl font-black mb-2">{athletes.length}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Active roster</div>
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
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({athletes.length})
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
        {filteredAthletes.length === 0 ? (
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
                    {athlete.moodScore !== null && (
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Mental health: {athlete.moodScore.toFixed(1)}/10
                      </div>
                    )}
                    {athlete.concern && (
                      <div className={`text-sm ${athlete.riskLevel === 'critical' ? 'text-red-700 dark:text-red-300' : athlete.riskLevel === 'warning' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}`}>
                        {athlete.concern}
                      </div>
                    )}
                    {!athlete.concern && athlete.riskLevel === 'good' && (
                      <div className="text-sm text-green-700 dark:text-green-300">All indicators healthy</div>
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
