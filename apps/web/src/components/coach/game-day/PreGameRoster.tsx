'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { ReadinessRing } from '@/components/shared/viz/ReadinessRing';
import { Sparkline } from '@/components/shared/viz/Sparkline';
import { AnimatedNumber } from '@/components/shared/ui/animated-number';
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RosterAthlete {
  athleteId: string;
  name: string;
  position?: string;
  readiness: number;
  level: 'GREEN' | 'YELLOW' | 'RED';
  trend: number[];
  mood?: number;
  stress?: number;
  sleep?: number;
  confidence?: number;
  lastCheckIn?: string;
}

interface PreGameRosterProps {
  sport: string;
  schoolId: string;
  gameDate: string;
  gameName?: string;
  opponent?: string;
}

type ViewMode = 'readiness' | 'position' | 'name';

function getCountdown(gameDate: string): string {
  const now = new Date();
  const game = new Date(gameDate + 'T12:00:00');
  const diff = game.getTime() - now.getTime();
  if (diff <= 0) return 'Game day';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours} hours`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days !== 1 ? 's' : ''}`;
}

function getTierBorder(level: string): string {
  switch (level) {
    case 'RED': return 'border-l-4 border-destructive';
    case 'YELLOW': return 'border-l-4 border-chart-3';
    default: return '';
  }
}

export function PreGameRoster({
  sport,
  schoolId,
  gameDate,
  gameName,
  opponent,
}: PreGameRosterProps) {
  const [athletes, setAthletes] = useState<RosterAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('readiness');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoster() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          sport,
          school_id: schoolId,
          game_date: gameDate,
        });
        const res = await fetch('/api/coach/dashboard');
        if (!res.ok) throw new Error('Failed to fetch roster data');
        const result = await res.json();

        // Dashboard API returns { data: { athleteReadiness: [...] } }
        const athleteData = result.data?.athleteReadiness || result.athletes || [];

        const mapped: RosterAthlete[] = athleteData.map((a: any) => {
          const readiness = a.readiness || a.readinessScore || 0;
          let level: 'GREEN' | 'YELLOW' | 'RED' = 'YELLOW';
          if (readiness >= 85) level = 'GREEN';
          else if (readiness < 50) level = 'RED';

          return {
            athleteId: a.athlete?.id || a.athleteId || a.id,
            name: a.athlete?.name || a.name || a.athleteName || 'Unknown',
            position: a.athlete?.teamPosition || a.position,
            readiness,
            level: a.level || level,
            trend: a.trend || a.recentScores || [],
            mood: a.mood,
            stress: a.stress,
            sleep: a.sleep,
            confidence: a.confidence,
            lastCheckIn: a.lastCheckIn,
          };
        });

        setAthletes(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roster');
      } finally {
        setLoading(false);
      }
    }
    fetchRoster();
  }, [sport, schoolId, gameDate]);

  const sorted = useMemo(() => {
    const copy = [...athletes];
    switch (viewMode) {
      case 'readiness':
        return copy.sort((a, b) => a.readiness - b.readiness);
      case 'position':
        return copy.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      case 'name':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return copy;
    }
  }, [athletes, viewMode]);

  const counts = useMemo(() => {
    const green = athletes.filter(a => a.level === 'GREEN').length;
    const yellow = athletes.filter(a => a.level === 'YELLOW').length;
    const red = athletes.filter(a => a.level === 'RED').length;
    return { green, yellow, red, total: athletes.length };
  }, [athletes]);

  const grouped = useMemo(() => {
    if (viewMode !== 'readiness') return null;
    return {
      red: sorted.filter(a => a.level === 'RED'),
      yellow: sorted.filter(a => a.level === 'YELLOW'),
      green: sorted.filter(a => a.level === 'GREEN'),
    };
  }, [sorted, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game day roster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const renderAthleteCard = (athlete: RosterAthlete) => {
    const isExpanded = expandedId === athlete.athleteId;

    return (
      <div
        key={athlete.athleteId}
        className={cn(
          'bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30',
          getTierBorder(athlete.level),
        )}
        onClick={() => setExpandedId(isExpanded ? null : athlete.athleteId)}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <ReadinessRing score={athlete.readiness} size="md" />
          <p className="text-sm font-medium text-foreground truncate w-full">{athlete.name}</p>
          {athlete.position && (
            <Badge variant="outline" className="text-[10px]">{athlete.position}</Badge>
          )}
          {athlete.trend.length > 1 && (
            <Sparkline data={athlete.trend} autoColor showDot height={20} width={72} />
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs">
            {athlete.mood !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mood</span>
                <span className="font-medium">{athlete.mood.toFixed(1)}/10</span>
              </div>
            )}
            {athlete.stress !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stress</span>
                <span className="font-medium">{athlete.stress.toFixed(1)}/10</span>
              </div>
            )}
            {athlete.sleep !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sleep</span>
                <span className="font-medium">{athlete.sleep.toFixed(1)}/10</span>
              </div>
            )}
            {athlete.confidence !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">{athlete.confidence.toFixed(1)}/10</span>
              </div>
            )}
            {athlete.lastCheckIn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last check-in</span>
                <span className="font-medium">{new Date(athlete.lastCheckIn).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTierGroup = (label: string, athletes: RosterAthlete[], icon: React.ReactNode) => {
    if (athletes.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <Badge variant="outline" className="text-xs">{athletes.length}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {athletes.map(renderAthleteCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 print:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {gameName || 'Pre-Game Readiness'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
            {opponent && <span>vs {opponent}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(gameDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <Badge variant="outline">{getCountdown(gameDate)}</Badge>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['readiness', 'position', 'name'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="text-xs capitalize"
            >
              {mode === 'readiness' ? 'By Readiness' : mode === 'position' ? 'By Position' : 'By Name'}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      <Card className="print:border-0">
        <CardContent className="py-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                <AnimatedNumber value={counts.total} className="text-foreground text-sm" /> athletes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">
                <span className="font-bold text-accent">{counts.green}</span> ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-3" />
              <span className="text-sm">
                <span className="font-bold text-chart-3">{counts.yellow}</span> monitor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm">
                <span className="font-bold text-destructive">{counts.red}</span> intervention
              </span>
            </div>

            {/* Proportional bar */}
            <div className="flex-1 min-w-[120px]">
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                {counts.green > 0 && (
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(counts.green / counts.total) * 100}%` }}
                  />
                )}
                {counts.yellow > 0 && (
                  <div
                    className="h-full bg-chart-3"
                    style={{ width: `${(counts.yellow / counts.total) * 100}%` }}
                  />
                )}
                {counts.red > 0 && (
                  <div
                    className="h-full bg-destructive"
                    style={{ width: `${(counts.red / counts.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Grid */}
      {viewMode === 'readiness' && grouped ? (
        <div className="space-y-8">
          {renderTierGroup(
            'Intervention Needed',
            grouped.red,
            <AlertTriangle className="w-4 h-4 text-destructive" />,
          )}
          {renderTierGroup(
            'Monitor Closely',
            grouped.yellow,
            <TrendingUp className="w-4 h-4 text-chart-3" />,
          )}
          {renderTierGroup(
            'Ready to Compete',
            grouped.green,
            <CheckCircle className="w-4 h-4 text-accent" />,
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sorted.map(renderAthleteCard)}
        </div>
      )}
    </div>
  );
}
