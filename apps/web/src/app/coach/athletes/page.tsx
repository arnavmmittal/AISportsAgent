'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

function AthletesPageContent() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/athletes');
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

  const filteredAthletes = athletes
    .filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          athlete.sport.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || athlete.riskLevel === filter;
      const matchesSport = selectedSports.length === 0 || selectedSports.includes(athlete.sport);
      return matchesSearch && matchesFilter && matchesSport;
    })
    .sort((a, b) => {
      const riskOrder = { critical: 0, warning: 1, good: 2, 'no-data': 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

  const criticalCount = athletes.filter(a => a.riskLevel === 'critical').length;
  const warningCount = athletes.filter(a => a.riskLevel === 'warning').length;
  const goodCount = athletes.filter(a => a.riskLevel === 'good').length;

  const availableSports = Array.from(
    new Set(athletes.map((a) => a.sport).filter(Boolean))
  ).sort();

  const athletesWithConcerns = filteredAthletes.filter(a => a.concern);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Athletes
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="relative animate-slide-up">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or sport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-shadow"
              />
            </div>

            <div className="flex gap-2 flex-wrap animate-slide-up">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap text-sm',
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                All ({athletes.length})
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap text-sm',
                  filter === 'critical'
                    ? 'bg-risk-red text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                Critical ({criticalCount})
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap text-sm',
                  filter === 'warning'
                    ? 'bg-risk-yellow text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                Warning ({warningCount})
              </button>
              <button
                onClick={() => setFilter('good')}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap text-sm',
                  filter === 'good'
                    ? 'bg-risk-green text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                Good ({goodCount})
              </button>
            </div>

            {availableSports.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border animate-slide-up">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sport:</span>
                <button
                  onClick={() => setSelectedSports([])}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                    selectedSports.length === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  All
                </button>
                {availableSports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => {
                      setSelectedSports((prev) =>
                        prev.includes(sport)
                          ? prev.filter((s) => s !== sport)
                          : [...prev, sport]
                      );
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                      selectedSports.includes(sport)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 animate-slide-up">
              {isLoading ? (
                <div className="rounded-xl border bg-card p-12 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="font-medium text-foreground">Loading athletes...</h3>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-risk-red/30 bg-risk-red-bg p-12 text-center">
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
                <div className="rounded-xl border bg-card p-12 text-center">
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
                        'rounded-xl border p-4 flex items-center justify-between gap-4 transition-shadow hover:shadow-md',
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
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{athletes.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className={cn(
                'rounded-xl border bg-card p-4 text-center',
                criticalCount > 0 && 'border-risk-red/30'
              )}>
                <p className="text-3xl font-bold text-risk-red">{criticalCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Critical</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-risk-yellow">{warningCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Warning</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-risk-green">{goodCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Good</p>
              </div>
            </div>

            {athletesWithConcerns.length > 0 && (
              <div className="rounded-xl border bg-card p-4 animate-slide-up">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-risk-yellow" />
                  Recent Concerns
                </h3>
                <div className="space-y-3">
                  {athletesWithConcerns.map(athlete => (
                    <div key={athlete.id} className="text-sm">
                      <span className="font-medium text-foreground">{athlete.name}</span>
                      <p className="text-muted-foreground mt-0.5">{athlete.concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="animate-slide-up">
              <Link
                href="/coach/readiness"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                View Team Readiness
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
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

export default function AthletesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AthletesPageContent />
    </Suspense>
  );
}
