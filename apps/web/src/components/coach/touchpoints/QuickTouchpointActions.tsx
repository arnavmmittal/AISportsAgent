/**
 * Quick Touchpoint Actions Component
 *
 * Enables coaches to quickly check in with athletes, send encouragement,
 * and schedule follow-ups. Designed for efficient outreach at scale.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Calendar,
  Heart,
  AlertCircle,
  Clock,
  Check,
  X,
  ChevronRight,
  User,
  Plus,
} from 'lucide-react';
import { DashboardSection } from '../layouts/DashboardGrid';

interface Touchpoint {
  id: string;
  athleteId: string;
  athleteName: string | null;
  type: 'QUICK_CHECKIN' | 'SCHEDULED_FOLLOW_UP' | 'ENCOURAGEMENT' | 'CONCERN_FOLLOW_UP';
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';
  message: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface TouchpointStats {
  pending: number;
  completed: number;
  overdue: number;
  todayScheduled: number;
}

interface QuickTouchpointActionsProps {
  athleteId?: string;
  athleteName?: string;
  onTouchpointSent?: () => void;
  compact?: boolean;
}

const QUICK_MESSAGES = [
  { label: 'Quick Check-in', message: "Hey, just checking in! How are you feeling today?", type: 'QUICK_CHECKIN' as const, icon: MessageSquare },
  { label: 'Encouragement', message: "Keep up the great work! Your effort is showing.", type: 'ENCOURAGEMENT' as const, icon: Heart },
  { label: 'Concern Follow-up', message: "I noticed you might be going through something. I'm here if you want to talk.", type: 'CONCERN_FOLLOW_UP' as const, icon: AlertCircle },
];

export default function QuickTouchpointActions({
  athleteId,
  athleteName,
  onTouchpointSent,
  compact = false,
}: QuickTouchpointActionsProps) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [stats, setStats] = useState<TouchpointStats>({ pending: 0, completed: 0, overdue: 0, todayScheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    const fetchTouchpoints = async () => {
      if (isDemo) {
        // Demo data
        setTouchpoints([
          {
            id: 'tp-1',
            athleteId: 'demo-1',
            athleteName: 'James Garcia',
            type: 'SCHEDULED_FOLLOW_UP',
            status: 'PENDING',
            message: 'Follow up on performance anxiety discussion',
            scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            completedAt: null,
            notes: null,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'tp-2',
            athleteId: 'demo-2',
            athleteName: 'Sarah Johnson',
            type: 'CONCERN_FOLLOW_UP',
            status: 'OVERDUE',
            message: 'Check in after low readiness score',
            scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completedAt: null,
            notes: null,
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          },
        ]);
        setStats({ pending: 3, completed: 12, overdue: 1, todayScheduled: 2 });
        setLoading(false);
        return;
      }

      try {
        const url = athleteId
          ? `/api/coach/touchpoints?athleteId=${athleteId}`
          : '/api/coach/touchpoints?status=PENDING';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setTouchpoints(data.touchpoints);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch touchpoints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTouchpoints();
  }, [isDemo, athleteId]);

  const handleQuickAction = async (type: Touchpoint['type'], message: string) => {
    if (!athleteId) return;

    setSending(type);

    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSending(null);
      onTouchpointSent?.();
      return;
    }

    try {
      const response = await fetch('/api/coach/touchpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          type,
          message,
        }),
      });

      if (response.ok) {
        onTouchpointSent?.();
      }
    } catch (error) {
      console.error('Failed to send touchpoint:', error);
    } finally {
      setSending(null);
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!athleteId || !scheduleDate) return;

    setSending('SCHEDULED_FOLLOW_UP');

    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSending(null);
      setShowScheduleModal(false);
      setCustomMessage('');
      setScheduleDate('');
      onTouchpointSent?.();
      return;
    }

    try {
      const response = await fetch('/api/coach/touchpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          type: 'SCHEDULED_FOLLOW_UP',
          message: customMessage || 'Scheduled follow-up',
          scheduledFor: new Date(scheduleDate).toISOString(),
        }),
      });

      if (response.ok) {
        setShowScheduleModal(false);
        setCustomMessage('');
        setScheduleDate('');
        onTouchpointSent?.();
      }
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
    } finally {
      setSending(null);
    }
  };

  const handleCompleteTouchpoint = async (touchpointId: string) => {
    if (isDemo) {
      setTouchpoints(prev => prev.filter(tp => tp.id !== touchpointId));
      return;
    }

    try {
      const response = await fetch('/api/coach/touchpoints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touchpointId,
          action: 'complete',
        }),
      });

      if (response.ok) {
        setTouchpoints(prev => prev.filter(tp => tp.id !== touchpointId));
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          completed: prev.completed + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to complete touchpoint:', error);
    }
  };

  const handleSkipTouchpoint = async (touchpointId: string) => {
    if (isDemo) {
      setTouchpoints(prev => prev.filter(tp => tp.id !== touchpointId));
      return;
    }

    try {
      const response = await fetch('/api/coach/touchpoints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touchpointId,
          action: 'skip',
        }),
      });

      if (response.ok) {
        setTouchpoints(prev => prev.filter(tp => tp.id !== touchpointId));
      }
    } catch (error) {
      console.error('Failed to skip touchpoint:', error);
    }
  };

  const getTypeIcon = (type: Touchpoint['type']) => {
    switch (type) {
      case 'QUICK_CHECKIN': return <MessageSquare className="w-4 h-4" />;
      case 'ENCOURAGEMENT': return <Heart className="w-4 h-4" />;
      case 'CONCERN_FOLLOW_UP': return <AlertCircle className="w-4 h-4" />;
      case 'SCHEDULED_FOLLOW_UP': return <Calendar className="w-4 h-4" />;
    }
  };

  const formatScheduledTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return 'Overdue';
    if (diffHours < 1) return 'Soon';
    if (diffHours < 24) return `In ${diffHours}h`;
    return `In ${diffDays}d`;
  };

  // If showing for a specific athlete - show quick action buttons
  if (athleteId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
          <Send className="w-4 h-4" />
          <span>Quick Actions for {athleteName || 'Athlete'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_MESSAGES.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.type}
                onClick={() => handleQuickAction(action.type, action.message)}
                disabled={sending !== null}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  sending === action.type
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white'
                } disabled:opacity-50`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{action.label}</span>
                {sending === action.type && (
                  <span className="ml-auto text-xs">Sending...</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Schedule Follow-up</span>
        </button>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Schedule Follow-up</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Reminder note for this follow-up..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setCustomMessage('');
                    setScheduleDate('');
                  }}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleFollowUp}
                  disabled={!scheduleDate || sending !== null}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard view - show pending touchpoints
  if (loading) {
    return (
      <DashboardSection title="Scheduled Touchpoints">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      title={
        <div className="flex items-center gap-2">
          <span>Touchpoints</span>
          {stats.overdue > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
              {stats.overdue} overdue
            </span>
          )}
        </div>
      }
    >
      {/* Stats Row */}
      {!compact && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-white">{stats.todayScheduled}</div>
            <div className="text-xs text-slate-400">Today</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-slate-400">Pending</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-red-400">{stats.overdue}</div>
            <div className="text-xs text-slate-400">Overdue</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-bold text-green-400">{stats.completed}</div>
            <div className="text-xs text-slate-400">Done</div>
          </div>
        </div>
      )}

      {/* Touchpoint List */}
      {touchpoints.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No scheduled touchpoints</p>
          <p className="text-xs text-slate-500 mt-1">
            Visit an athlete's profile to schedule a follow-up
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {touchpoints.slice(0, compact ? 3 : 10).map(tp => (
            <div
              key={tp.id}
              className={`p-3 rounded-lg border ${
                tp.status === 'OVERDUE'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${
                  tp.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {getTypeIcon(tp.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="text-sm font-medium text-white">{tp.athleteName}</span>
                    <span className={`text-xs ${
                      tp.status === 'OVERDUE' ? 'text-red-400' : 'text-slate-500'
                    }`}>
                      {formatScheduledTime(tp.scheduledFor)}
                    </span>
                  </div>
                  {tp.message && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{tp.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCompleteTouchpoint(tp.id)}
                    className="p-1.5 hover:bg-green-500/20 rounded text-slate-400 hover:text-green-400"
                    title="Mark complete"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSkipTouchpoint(tp.id)}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Skip"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-500 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
