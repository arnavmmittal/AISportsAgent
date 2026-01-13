'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  User,
  Calendar,
  AlertTriangle,
  Users,
  ChevronRight,
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Upload,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { SportFilter } from '@/components/SportFilter';
import { cn } from '@/lib/utils';

/**
 * Team Page (v2.1 Navigation Consolidation)
 *
 * Combines Athletes + Performance into a unified Team view:
 * - Roster tab: Athlete listing with risk prioritization
 * - Performance tab: Stats recording and data import options
 *
 * This consolidation reduces coach portal from 8→6 primary tabs.
 */

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

function TeamPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'roster' | 'performance'>(
    (searchParams.get('tab') as 'roster' | 'performance') || 'roster'
  );

  // Handle tab changes with URL sync
  const handleTabChange = (tab: 'roster' | 'performance') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'roster') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/coach/team${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Team
          </h1>
          <p className="text-muted-foreground mt-1">Manage athletes and track performance</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit animate-slide-up">
          <button
            onClick={() => handleTabChange('roster')}
            className={cn(
              'px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2',
              activeTab === 'roster'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            Roster
          </button>
          <button
            onClick={() => handleTabChange('performance')}
            className={cn(
              'px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2',
              activeTab === 'performance'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Performance
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'roster' ? <RosterTab /> : <PerformanceTab />}
      </div>
    </div>
  );
}

// ============================================
// ROSTER TAB (from Athletes page)
// ============================================
function RosterTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const transformedAthletes = data.athletes.map((a: any) => ({
        ...a,
        lastCheckIn: a.lastCheckIn ? new Date(a.lastCheckIn) : null,
      }));

      setAthletes(transformedAthletes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load athletes';
      console.error('Error loading athletes:', error);
      setError(message);
      setAthletes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayAthletes = athletes;

  const getRiskStyles = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          card: 'bg-risk-red-bg border-risk-red/30',
          dot: 'bg-risk-red',
          text: 'text-risk-red',
          badge: 'bg-risk-red/10 text-risk-red',
          button: 'bg-risk-red text-white hover:bg-risk-red/90',
        };
      case 'warning':
        return {
          card: 'bg-risk-yellow-bg border-risk-yellow/30',
          dot: 'bg-risk-yellow',
          text: 'text-risk-yellow',
          badge: 'bg-risk-yellow/10 text-risk-yellow',
          button: 'bg-risk-yellow text-white hover:bg-risk-yellow/90',
        };
      case 'good':
        return {
          card: 'bg-risk-green-bg border-risk-green/30',
          dot: 'bg-risk-green',
          text: 'text-risk-green',
          badge: 'bg-risk-green/10 text-risk-green',
          button: 'bg-muted text-foreground hover:bg-muted/80',
        };
      case 'no-data':
        return {
          card: 'bg-muted/50 border-border',
          dot: 'bg-muted-foreground',
          text: 'text-muted-foreground',
          badge: 'bg-muted text-muted-foreground',
          button: 'bg-muted text-foreground hover:bg-muted/80',
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
      const riskOrder = { critical: 0, warning: 1, good: 2, 'no-data': 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

  const criticalCount = displayAthletes.filter(a => a.riskLevel === 'critical').length;
  const warningCount = displayAthletes.filter(a => a.riskLevel === 'warning').length;
  const goodCount = displayAthletes.filter(a => a.riskLevel === 'good').length;

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-foreground">{displayAthletes.length}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-red/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-risk-red" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-risk-red">{criticalCount}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-yellow/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-risk-yellow" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Warning</p>
              <p className="text-2xl font-bold text-risk-yellow">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-risk-green" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Good</p>
              <p className="text-2xl font-bold text-risk-green">{goodCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card-elevated p-4 animate-slide-up">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-shadow"
            />
          </div>

          <SportFilter selectedSports={selectedSports} onSportsChange={setSelectedSports} />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              All ({displayAthletes.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'critical'
                  ? 'bg-risk-red text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'warning'
                  ? 'bg-risk-yellow text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter('good')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === 'good'
                  ? 'bg-risk-green text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Good
            </button>
          </div>
        </div>
      </div>

      {/* Athletes List */}
      <div className="space-y-3 animate-slide-up">
        {isLoading ? (
          <div className="card-elevated p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-medium text-foreground">Loading athletes...</h3>
          </div>
        ) : error ? (
          <div className="card-elevated p-12 text-center border-risk-red/30 bg-risk-red-bg">
            <AlertCircle className="w-12 h-12 text-risk-red mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Error Loading Athletes</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => loadAthletes()}
              className="px-6 py-2 bg-risk-red text-white rounded-lg hover:bg-risk-red/90 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No athletes found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          filteredAthletes.map((athlete) => {
            const styles = getRiskStyles(athlete.riskLevel);
            return (
              <div
                key={athlete.id}
                className={cn(
                  'rounded-lg border p-4 flex items-center justify-between gap-4 transition-shadow hover:shadow-md',
                  styles.card
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn('w-3 h-3 rounded-full flex-shrink-0', styles.dot)} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{athlete.name}</h3>
                      {athlete.riskLevel === 'critical' && (
                        <AlertTriangle className="w-4 h-4 text-risk-red" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{athlete.sport}</span>
                      <span>-</span>
                      <span>{athlete.year}</span>
                      <span>-</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{getTimeAgo(athlete.lastCheckIn)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block text-right min-w-[200px]">
                    {athlete.readinessScore !== null && (
                      <div className="mb-2">
                        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-foreground mb-1">
                          <Activity className="w-4 h-4" />
                          <span>Readiness: {athlete.readinessScore}/100</span>
                          {athlete.chatContribution !== 0 && (
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                athlete.chatContribution > 0
                                  ? 'bg-risk-green/10 text-risk-green'
                                  : 'bg-risk-red/10 text-risk-red'
                              )}
                            >
                              Chat: {athlete.chatContribution > 0 ? '+' : ''}
                              {athlete.chatContribution}
                            </span>
                          )}
                        </div>
                        {athlete.chatInsights?.sentiment && (
                          <div className="text-xs text-muted-foreground">
                            Sentiment: {athlete.chatInsights.sentiment}
                          </div>
                        )}
                      </div>
                    )}
                    {athlete.concern && (
                      <div className={cn('text-sm', styles.text)}>
                        {athlete.concern}
                      </div>
                    )}
                    {athlete.chatInsights?.themes && athlete.chatInsights.themes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        {athlete.chatInsights.themes.slice(0, 2).map((theme) => (
                          <span
                            key={theme}
                            className="text-xs px-2 py-0.5 rounded bg-info/10 text-info"
                          >
                            {theme.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {!athlete.concern && athlete.riskLevel === 'good' && (
                      <div className="text-sm text-risk-green">
                        All indicators healthy
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/coach/athletes/${athlete.id}`}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm text-center whitespace-nowrap transition-colors flex items-center gap-2',
                    styles.button
                  )}
                >
                  {athlete.riskLevel === 'critical' ? 'Reach Out' : 'View'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Concern Display */}
      {filteredAthletes.some(a => a.concern) && (
        <div className="md:hidden card-elevated p-4">
          <h3 className="font-medium text-foreground mb-3">Recent Concerns</h3>
          <div className="space-y-2">
            {filteredAthletes
              .filter(a => a.concern)
              .map(athlete => (
                <div key={athlete.id} className="text-sm">
                  <span className="font-medium text-foreground">{athlete.name}:</span>{' '}
                  <span className="text-muted-foreground">{athlete.concern}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// PERFORMANCE TAB (from Performance page)
// ============================================
function PerformanceTab() {
  const router = useRouter();

  const performanceOptions = [
    {
      title: 'Record Performance',
      description: 'Log athlete performance metrics and game statistics',
      icon: Activity,
      href: '/coach/performance/record',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Import Data',
      description: 'Bulk import performance data from CSV or other sources',
      icon: Upload,
      href: '/coach/performance/import',
      iconBg: 'bg-risk-green/10',
      iconColor: 'text-risk-green',
    },
    {
      title: 'Analytics',
      description: 'View performance trends and insights',
      icon: BarChart3,
      href: '/coach/insights',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {performanceOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.href}
              onClick={() => router.push(option.href)}
              className="card-interactive p-6 text-left group"
            >
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                option.iconBg
              )}>
                <Icon className={cn("w-7 h-7", option.iconColor)} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {option.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TeamPageContent />
    </Suspense>
  );
}
