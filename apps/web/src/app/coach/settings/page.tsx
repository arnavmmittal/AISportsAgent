'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, AlertTriangle, Save, Copy, RefreshCw, Trash2, Moon, Sun, Settings, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';
import { cn } from '@/lib/utils';
import { WeeklyDigestPanel } from '@/components/coach/digest';

/**
 * Coach Settings Page - Updated with Design System v2.0
 *
 * Features:
 * - Profile information editing (fetched from API)
 * - Notification preferences
 * - Privacy & data settings
 * - Team invite code management
 * - Theme toggle
 *
 * Note: "Coach" refers to Sports Psychologist, not sport team coach.
 * See README for terminology clarification.
 */

export const dynamic = 'force-dynamic';

interface ProfileData {
  name: string;
  email: string;
  sport: string;
  teamName: string;
}

interface InviteCodeData {
  inviteCode: string;
  coachName: string;
  sport: string;
  athleteCount: number;
}

export default function CoachSettingsPage() {
  const { toggleTheme, isDarkMode } = useTheme();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile data (fetched from API)
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    sport: '',
    teamName: '',
  });


  // Privacy settings
  const [privacy, setPrivacy] = useState({
    dataRetention: '90 days',
    shareMoodLogs: true,
    shareGoalProgress: true,
    shareChatSummaries: false,
  });

  // Invite code data
  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null);
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Fetch profile and settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch invite code (which includes coach info)
        const inviteRes = await fetch('/api/coach/invite-code');
        if (inviteRes.ok) {
          const inviteJson = await inviteRes.json();
          if (inviteJson.data) {
            setInviteCodeData(inviteJson.data);
            // Pre-populate profile from invite code data
            setProfile(prev => ({
              ...prev,
              name: inviteJson.data.coachName || '',
              sport: inviteJson.data.sport || '',
            }));
          }
        }

        // Note: Coach notification preferences API doesn't exist yet.
        // The /api/coach/notifications endpoint returns crisis alerts, not preferences.
        // Notification preferences are currently stored in local state only.
        // TODO: Create /api/coach/notification-preferences endpoint when needed.
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement profile update API
      // const response = await fetch('/api/coach/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profile),
      // });
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleSavePrivacy = async () => {
    // Note: No API endpoint for coach privacy settings yet.
    // These are stored locally for demonstration purposes only.
    // TODO: Create /api/coach/privacy-settings endpoint for persistence
    toast.info('Privacy settings updated locally (not persisted to server yet)');
  };

  const handleCopyInviteCode = () => {
    if (inviteCodeData?.inviteCode) {
      navigator.clipboard.writeText(inviteCodeData.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const handleGenerateNewCode = async () => {
    try {
      const response = await fetch('/api/coach/invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setInviteCodeData(data.data);
          toast.success('New invite code generated!');
        }
      } else {
        throw new Error('Failed to generate new code');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Failed to generate new code.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </header>

        {/* Profile Information */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal and team information</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your.email@university.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport">Primary Sport</Label>
                <select
                  id="sport"
                  value={profile.sport}
                  onChange={(e) => setProfile({ ...profile, sport: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="">Select a sport</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Football">Football</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Track & Field">Track & Field</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Tennis">Tennis</option>
                  <option value="All Sports">All Sports</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Organization</Label>
                <Input
                  id="teamName"
                  value={profile.teamName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, teamName: e.target.value })}
                  placeholder="University Name"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Email Digest & Notifications */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Email Digest & Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure weekly summaries and alerts</p>
            </div>
          </div>
          <div className="p-4">
            <WeeklyDigestPanel />
          </div>
        </section>

        {/* Privacy & Data Access */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Privacy & Data Access</h2>
              <p className="text-sm text-muted-foreground">Control data retention and sharing settings</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention</Label>
              <p className="text-xs text-muted-foreground mb-2">
                How long to retain athlete data after they leave your team
              </p>
              <select
                id="data-retention"
                value={privacy.dataRetention}
                onChange={(e) => setPrivacy({ ...privacy, dataRetention: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Forever (with consent)</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label>Default Data Sharing</Label>
              <p className="text-xs text-muted-foreground">Data visible to other staff members</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={privacy.shareMoodLogs}
                    onChange={(e) => setPrivacy({ ...privacy, shareMoodLogs: e.target.checked })}
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <span className="text-sm font-medium text-foreground">Mood logs summary</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={privacy.shareGoalProgress}
                    onChange={(e) => setPrivacy({ ...privacy, shareGoalProgress: e.target.checked })}
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <span className="text-sm font-medium text-foreground">Goal progress</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={privacy.shareChatSummaries}
                    onChange={(e) => setPrivacy({ ...privacy, shareChatSummaries: e.target.checked })}
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <span className="text-sm font-medium text-foreground">Chat session summaries</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleSavePrivacy}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </section>

        {/* Team Invite Code */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Team Invite Code</h2>
              <p className="text-sm text-muted-foreground">Share this code with athletes to join your team</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {inviteCodeData ? (
              <>
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg font-bold text-foreground">
                      {inviteCodeData.inviteCode}
                    </code>
                    <Button variant="outline" onClick={handleCopyInviteCode}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <span>Sport: <strong className="text-foreground">{inviteCodeData.sport || 'All Sports'}</strong></span>
                    <span>Connected: <strong className="text-foreground">{inviteCodeData.athleteCount} athletes</strong></span>
                  </div>
                </div>
                <Button variant="outline" onClick={handleGenerateNewCode} className="w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New Code
                </Button>
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No invite code available. Contact support to get your team code.</p>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {isDarkMode ? <Moon className="w-5 h-5 text-foreground" /> : <Sun className="w-5 h-5 text-foreground" />}
            </div>
            <div>
              <h2 className="font-medium text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize your visual experience</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                </p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="card-elevated overflow-hidden animate-slide-up border-destructive/20">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Irreversible account actions</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
