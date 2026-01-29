'use client';

/**
 * AthleteActivityMonitor
 *
 * Real-time view of which athletes are currently using the chat.
 * Helps coaches know when athletes are engaged and might need follow-up.
 *
 * Privacy note: Only shows activity status, not chat content.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Users,
  MessageCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

interface AthleteActivity {
  athleteId: string;
  athleteName: string;
  status: 'active' | 'inactive' | 'offline';
  sessionId?: string;
  lastHeartbeat?: string;
  chatDuration?: number;
}

interface ActivitySummary {
  totalAthletes: number;
  activeNow: number;
  recentlyActive: number;
}

interface AthleteActivityMonitorProps {
  demo?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}

export default function AthleteActivityMonitor({
  demo = false,
  compact = false,
  refreshInterval = 30000, // 30 seconds
}: AthleteActivityMonitorProps) {
  const [activities, setActivities] = useState<AthleteActivity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({
    totalAthletes: 0,
    activeNow: 0,
    recentlyActive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchActivity = useCallback(async () => {
    if (demo) {
      setActivities([
        {
          athleteId: 'demo-1',
          athleteName: 'Jordan Martinez',
          status: 'active',
          sessionId: 'session-1',
          chatDuration: 12,
        },
        {
          athleteId: 'demo-2',
          athleteName: 'Alex Chen',
          status: 'active',
          sessionId: 'session-2',
          chatDuration: 3,
        },
        {
          athleteId: 'demo-3',
          athleteName: 'Taylor Williams',
          status: 'inactive',
          lastHeartbeat: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ]);
      setSummary({
        totalAthletes: 24,
        activeNow: 2,
        recentlyActive: 1,
      });
      setIsLoading(false);
      setLastRefresh(new Date());
      return;
    }

    try {
      const response = await fetch('/api/athlete/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setSummary(data.summary || { totalAthletes: 0, activeNow: 0, recentlyActive: 0 });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  }, [demo]);

  // Initial fetch and polling
  useEffect(() => {
    fetchActivity();

    const interval = setInterval(fetchActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchActivity, refreshInterval]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const formatTimeAgo = (isoString?: string): string => {
    if (!isoString) return '-';
    const ms = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const activeAthletes = activities.filter((a) => a.status === 'active');
  const recentAthletes = activities.filter((a) => a.status === 'inactive');

  return (
    <div className="card-elevated overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'p-4 flex items-center justify-between cursor-pointer',
          compact && 'py-3'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-lg flex items-center justify-center',
            summary.activeNow > 0 ? 'bg-success/10' : 'bg-muted',
            compact ? 'w-8 h-8' : 'w-10 h-10'
          )}>
            <Activity className={cn(
              summary.activeNow > 0 ? 'text-success' : 'text-muted-foreground',
              compact ? 'w-4 h-4' : 'w-5 h-5'
            )} />
          </div>
          <div>
            <h3 className={cn('font-medium text-foreground', compact && 'text-sm')}>
              Live Activity
            </h3>
            <p className="text-xs text-muted-foreground">
              {summary.activeNow > 0 ? (
                <span className="text-success font-medium">{summary.activeNow} chatting now</span>
              ) : (
                'No active chats'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fetchActivity();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
          {compact && (
            isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-muted/30">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{summary.totalAthletes}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">{summary.activeNow}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">{summary.recentlyActive}</div>
              <div className="text-xs text-muted-foreground">Recent</div>
            </div>
          </div>

          {/* Active Athletes */}
          {activeAthletes.length > 0 && (
            <div className="p-4 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-3 h-3 text-success" />
                Currently Chatting
              </h4>
              <div className="space-y-2">
                {activeAthletes.map((athlete) => (
                  <div
                    key={athlete.athleteId}
                    className="flex items-center justify-between p-2 bg-success/5 border border-success/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-sm font-medium">{athlete.athleteName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{athlete.chatDuration ? formatDuration(athlete.chatDuration) : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Active Athletes */}
          {recentAthletes.length > 0 && (
            <div className="p-4 pt-0 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <WifiOff className="w-3 h-3" />
                Recently Active
              </h4>
              <div className="space-y-2">
                {recentAthletes.map((athlete) => (
                  <div
                    key={athlete.athleteId}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="text-sm text-muted-foreground">{athlete.athleteName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(athlete.lastHeartbeat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activities.length === 0 && !isLoading && (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent chat activity</p>
            </div>
          )}

          {/* Last Updated */}
          {lastRefresh && (
            <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
              Updated {formatTimeAgo(lastRefresh.toISOString())}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
