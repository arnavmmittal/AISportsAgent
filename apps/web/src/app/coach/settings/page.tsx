'use client';

import { useState } from 'react';
import { User, Bell, Shield, Key, AlertTriangle, Save, Copy, RefreshCw, Trash2, Moon, Sun, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Coach Settings Page - Updated with Design System v2.0
 *
 * Features:
 * - Profile information editing
 * - Notification preferences
 * - Privacy & data settings
 * - Team invite code management
 * - Theme toggle
 */

export const dynamic = 'force-dynamic';

export default function CoachSettingsPage() {
  const { toggleTheme, isDarkMode } = useTheme();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    sport: 'Basketball',
    teamName: 'Demo University Basketball',
  });

  const [notifications, setNotifications] = useState({
    crisisAlerts: true,
    dailySummary: true,
    athleteCheckIns: false,
    weeklyReports: true,
  });

  const [privacy, setPrivacy] = useState({
    dataRetention: '90 days',
    shareMoodLogs: true,
    shareGoalProgress: true,
    shareChatSummaries: false,
  });

  const [inviteCode] = useState('DEMO-COACH-2024');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const handleGenerateNewCode = () => {
    toast.success('New invite code generated!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your coach profile and preferences</p>
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
                <Label htmlFor="sport">Sport</Label>
                <select
                  id="sport"
                  value={profile.sport}
                  onChange={(e) => setProfile({ ...profile, sport: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option>Basketball</option>
                  <option>Football</option>
                  <option>Soccer</option>
                  <option>Baseball</option>
                  <option>Volleyball</option>
                  <option>Track & Field</option>
                  <option>Swimming</option>
                  <option>Tennis</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={profile.teamName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, teamName: e.target.value })}
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

        {/* Notification Preferences */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground">Choose what updates you want to receive</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crisis-alerts" className="text-sm font-medium">Crisis Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified immediately for crisis situations</p>
                </div>
                <Switch
                  id="crisis-alerts"
                  checked={notifications.crisisAlerts}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, crisisAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-summary" className="text-sm font-medium">Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">Receive daily email summaries of team activity</p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={notifications.dailySummary}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, dailySummary: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="athlete-checkins" className="text-sm font-medium">Athlete Check-ins</Label>
                  <p className="text-xs text-muted-foreground">Notify when athletes complete mood logs</p>
                </div>
                <Switch
                  id="athlete-checkins"
                  checked={notifications.athleteCheckIns}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, athleteCheckIns: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-reports" className="text-sm font-medium">Weekly Reports</Label>
                  <p className="text-xs text-muted-foreground">Get comprehensive weekly performance reports</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleSaveNotifications}>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
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
            <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg font-bold text-foreground">
                  {inviteCode}
                </code>
                <Button variant="outline" onClick={handleCopyInviteCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={handleGenerateNewCode} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Code
            </Button>
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
