'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Clock,
  Calendar,
  Eye,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  TrendingUp,
  Users,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shared/ui/button';
import { Switch } from '@/components/shared/ui/switch';
import { Label } from '@/components/shared/ui/label';
import { cn } from '@/lib/utils';

interface DigestPreferences {
  weeklyDigestEnabled: boolean;
  dailySummaryEnabled: boolean;
  crisisAlertsEnabled: boolean;
  athleteCheckInsEnabled: boolean;
  digestDay: number;
  digestHour: number;
  digestTimezone: string;
  lastDigestSentAt: string | null;
}

interface RecentDigest {
  id: string;
  periodStart: string;
  periodEnd: string;
  digestType: string;
  status: string;
  sentAt: string | null;
  athleteCount: number | null;
  highlightsCount: number | null;
  alertsCount: number | null;
}

interface DigestData {
  period: { label: string };
  summary: {
    totalAthletes: number;
    activeAthletes: number;
    engagementRate: number;
  };
  highlights: Array<{
    type: string;
    title: string;
    description: string;
    metric?: string;
  }>;
  alerts: Array<{
    athleteName: string;
    message: string;
  }>;
  athletesNeedingAttention: Array<{
    athleteName: string;
    priority: string;
    reasons: string[];
  }>;
}

interface WeeklyDigestPanelProps {
  demo?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WeeklyDigestPanel({ demo = false }: WeeklyDigestPanelProps) {
  const [preferences, setPreferences] = useState<DigestPreferences | null>(null);
  const [recentDigests, setRecentDigests] = useState<RecentDigest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<DigestData | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (demo) {
      setPreferences({
        weeklyDigestEnabled: true,
        dailySummaryEnabled: false,
        crisisAlertsEnabled: true,
        athleteCheckInsEnabled: false,
        digestDay: 1,
        digestHour: 8,
        digestTimezone: 'America/Los_Angeles',
        lastDigestSentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setRecentDigests([
        {
          id: 'demo-1',
          periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          digestType: 'WEEKLY',
          status: 'SENT',
          sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          athleteCount: 24,
          highlightsCount: 5,
          alertsCount: 2,
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/coach/digest');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setRecentDigests(data.recentDigests || []);
      }
    } catch (error) {
      console.error('Error fetching digest preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof DigestPreferences, value: unknown) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    if (demo) {
      toast.success('Preferences updated (demo mode)');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/coach/digest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        toast.success('Preferences updated');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      // Revert
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreview = async () => {
    if (demo) {
      setPreviewData({
        period: { label: 'Jan 22 - Jan 29' },
        summary: {
          totalAthletes: 24,
          activeAthletes: 18,
          engagementRate: 75,
        },
        highlights: [
          { type: 'positive', title: 'Strong Team Engagement', description: '75% of athletes active this week', metric: '18/24' },
          { type: 'neutral', title: 'AI Coaching Sessions', description: '42 sessions with 286 messages', metric: '42' },
          { type: 'concern', title: 'Low Mood Athletes', description: '3 athletes showing consistently low mood', metric: '3' },
        ],
        alerts: [
          { athleteName: 'Alex R.', message: 'Crisis alert detected' },
        ],
        athletesNeedingAttention: [
          { athleteName: 'Jordan M.', priority: 'high', reasons: ['Consistently low mood', 'No check-ins this week'] },
          { athleteName: 'Taylor S.', priority: 'medium', reasons: ['Low readiness scores'] },
        ],
      });
      setShowPreview(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/coach/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview' }),
      });

      if (response.ok) {
        const result = await response.json();
        setPreviewData(result.data);
        setPreviewHtml(result.html);
        setShowPreview(true);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendDigest = async () => {
    if (demo) {
      toast.success('Digest sent! (demo mode)');
      setShowPreview(false);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/coach/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.emailSent ? 'Digest sent!' : 'Digest generated (email not configured)');
        setShowPreview(false);
        fetchPreferences(); // Refresh to get updated history
      } else {
        throw new Error('Failed to send digest');
      }
    } catch (error) {
      console.error('Error sending digest:', error);
      toast.error('Failed to send digest');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load preferences
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Weekly Digest</h3>
            <p className="text-sm text-muted-foreground">Automated team summary emails</p>
          </div>
        </div>
        <Switch
          checked={preferences.weeklyDigestEnabled}
          onCheckedChange={(checked) => updatePreference('weeklyDigestEnabled', checked)}
          disabled={isSaving}
        />
      </div>

      {preferences.weeklyDigestEnabled && (
        <>
          {/* Schedule Settings */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4" />
              Delivery Schedule
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="digest-day" className="text-xs">Day of Week</Label>
                <select
                  id="digest-day"
                  value={preferences.digestDay}
                  onChange={(e) => updatePreference('digestDay', parseInt(e.target.value))}
                  className="w-full h-9 px-3 py-1 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSaving}
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="digest-hour" className="text-xs">Time</Label>
                <select
                  id="digest-hour"
                  value={preferences.digestHour}
                  onChange={(e) => updatePreference('digestHour', parseInt(e.target.value))}
                  className="w-full h-9 px-3 py-1 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSaving}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    const period = i < 12 ? 'AM' : 'PM';
                    return (
                      <option key={i} value={i}>{hour}:00 {period}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {preferences.lastDigestSentAt && (
              <p className="text-xs text-muted-foreground">
                Last sent: {new Date(preferences.lastDigestSentAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Preview / Send Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={generatePreview}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Preview This Week's Digest
            </Button>
          </div>

          {/* Preview Modal/Section */}
          {showPreview && previewData && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary/5 px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-sm">Digest Preview: {previewData.period.label}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-bold">{previewData.summary.activeAthletes}</div>
                    <div className="text-xs text-muted-foreground">Active Athletes</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
                    <div className="text-lg font-bold">{previewData.summary.engagementRate}%</div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MessageCircle className="w-5 h-5 mx-auto mb-1 text-info" />
                    <div className="text-lg font-bold">{previewData.highlights.find(h => h.title.includes('Session'))?.metric || '-'}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Highlights</h4>
                  {previewData.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg text-sm',
                        highlight.type === 'positive' && 'bg-success/10 text-success',
                        highlight.type === 'neutral' && 'bg-muted',
                        highlight.type === 'concern' && 'bg-destructive/10 text-destructive'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{highlight.title}</span>
                        {highlight.metric && (
                          <span className="font-bold">{highlight.metric}</span>
                        )}
                      </div>
                      <p className="text-xs opacity-80 mt-1">{highlight.description}</p>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {previewData.alerts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-destructive">Alerts</h4>
                    {previewData.alerts.map((alert, idx) => (
                      <div key={idx} className="bg-destructive/10 border-l-2 border-destructive p-3 rounded-r-lg">
                        <span className="font-medium">{alert.athleteName}</span>
                        <span className="text-sm text-muted-foreground"> - {alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Athletes Needing Attention */}
                {previewData.athletesNeedingAttention.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Athletes Needing Attention</h4>
                    {previewData.athletesNeedingAttention.slice(0, 3).map((athlete, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{athlete.athleteName}</span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full uppercase font-medium',
                            athlete.priority === 'urgent' && 'bg-destructive text-destructive-foreground',
                            athlete.priority === 'high' && 'bg-warning text-warning-foreground',
                            athlete.priority === 'medium' && 'bg-muted text-muted-foreground'
                          )}>
                            {athlete.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {athlete.reasons.join(' • ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4 bg-muted/30 flex gap-3">
                <Button
                  onClick={sendDigest}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Now
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Recent Digests ({recentDigests.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* History */}
          {showHistory && recentDigests.length > 0 && (
            <div className="space-y-2">
              {recentDigests.map((digest) => (
                <div key={digest.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(digest.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(digest.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {digest.athleteCount} athletes • {digest.highlightsCount} highlights • {digest.alertsCount} alerts
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {digest.status === 'SENT' && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="w-3 h-3" /> Sent
                      </span>
                    )}
                    {digest.status === 'FAILED' && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Other Notification Options */}
      <div className="border-t border-border pt-4 space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Other Notifications</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Crisis Alerts</Label>
            <p className="text-xs text-muted-foreground">Immediate notifications for crisis situations</p>
          </div>
          <Switch
            checked={preferences.crisisAlertsEnabled}
            onCheckedChange={(checked) => updatePreference('crisisAlertsEnabled', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Daily Summary</Label>
            <p className="text-xs text-muted-foreground">Brief daily overview of team activity</p>
          </div>
          <Switch
            checked={preferences.dailySummaryEnabled}
            onCheckedChange={(checked) => updatePreference('dailySummaryEnabled', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Athlete Check-ins</Label>
            <p className="text-xs text-muted-foreground">Notify when athletes log mood</p>
          </div>
          <Switch
            checked={preferences.athleteCheckInsEnabled}
            onCheckedChange={(checked) => updatePreference('athleteCheckInsEnabled', checked)}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
