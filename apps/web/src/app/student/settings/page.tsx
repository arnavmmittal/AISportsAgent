'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';
import {
  Settings,
  User,
  Bell,
  Shield,
  LogOut,
  Save,
  Mail,
  Phone,
  Trophy,
  Moon,
  Sun,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Student Settings Page - Updated with Design System v2.0
 *
 * Features:
 * - Profile information editing (fetched from API)
 * - Notification preferences
 * - Privacy settings
 * - Theme toggle
 * - Account actions
 */

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  sport: string;
  team: string;
  year: string;
  position: string;
}

export default function StudentSettingsPage() {
  const { toggleTheme, isDarkMode } = useTheme();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings (fetched from API)
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    sport: '',
    team: '',
    year: '',
    position: '',
  });

  // Notification preferences (matches API field names)
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    taskReminders: true,
    assignmentNotifs: true,
    chatMessages: false,
    goalMilestones: true,
  });

  // Privacy settings (consentChatSummaries from API)
  const [privacy, setPrivacy] = useState({
    consentChatSummaries: true,
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch athlete profile
        const profileRes = await fetch('/api/athlete/profile');
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          if (profileJson.profile) {
            setProfile({
              name: profileJson.profile.name || '',
              email: profileJson.profile.email || '',
              phone: profileJson.profile.phone || '',
              sport: profileJson.profile.sport || '',
              team: profileJson.profile.team || '',
              year: profileJson.profile.year || '',
              position: profileJson.profile.position || '',
            });
          }
        }

        // Fetch notification preferences
        const notifRes = await fetch('/api/athlete/notifications');
        if (notifRes.ok) {
          const notifJson = await notifRes.json();
          if (notifJson.notifications) {
            setNotifications({
              pushEnabled: notifJson.notifications.pushEnabled ?? true,
              taskReminders: notifJson.notifications.taskReminders ?? true,
              assignmentNotifs: notifJson.notifications.assignmentNotifs ?? true,
              chatMessages: notifJson.notifications.chatMessages ?? false,
              goalMilestones: notifJson.notifications.goalMilestones ?? true,
            });
          }
        }

        // Fetch consent/privacy settings
        const consentRes = await fetch('/api/athlete/consent');
        if (consentRes.ok) {
          const consentJson = await consentRes.json();
          setPrivacy({
            consentChatSummaries: consentJson.consentChatSummaries ?? true,
          });
        }
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
      const response = await fetch('/api/athlete/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch('/api/athlete/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });

      if (response.ok) {
        toast.success('Notification preferences saved!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const response = await fetch('/api/athlete/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentChatSummaries: privacy.consentChatSummaries,
        }),
      });

      if (response.ok) {
        toast.success('Privacy settings saved!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // TODO: Implement proper logout via Supabase auth
      toast.success('Logged out successfully');
      window.location.href = '/auth/signin';
    } catch (error) {
      toast.error('Failed to log out');
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
              <p className="text-sm text-muted-foreground">Update your personal and athletic information</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, email: e.target.value })}
                    className="pl-10"
                    placeholder="your.email@university.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, phone: e.target.value })}
                    className="pl-10"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <select
                  id="year"
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    id="sport"
                    value={profile.sport}
                    onChange={(e) => setProfile({ ...profile, sport: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  >
                    <option value="">Select sport</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Football">Football</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Track & Field">Track & Field</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Tennis">Tennis</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <select
                  id="team"
                  value={profile.team}
                  onChange={(e) => setProfile({ ...profile, team: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="">Select team</option>
                  <option value="Varsity">Varsity</option>
                  <option value="JV">JV</option>
                  <option value="Club">Club</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profile.position}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, position: e.target.value })}
                  placeholder="e.g., Point Guard, Midfielder, etc."
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
                  <Label htmlFor="push-enabled" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable push notifications for updates
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={notifications.pushEnabled}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, pushEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-reminders" className="text-sm font-medium">
                    Task Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminded about pending tasks and activities
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={notifications.taskReminders}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, taskReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="assignment-notifs" className="text-sm font-medium">
                    Assignment Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about upcoming assignment due dates
                  </p>
                </div>
                <Switch
                  id="assignment-notifs"
                  checked={notifications.assignmentNotifs}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, assignmentNotifs: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chat-messages" className="text-sm font-medium">
                    Chat Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications for new chat messages
                  </p>
                </div>
                <Switch
                  id="chat-messages"
                  checked={notifications.chatMessages}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, chatMessages: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goal-milestones" className="text-sm font-medium">
                    Goal Milestones
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Celebrate when you reach goal progress milestones
                  </p>
                </div>
                <Switch
                  id="goal-milestones"
                  checked={notifications.goalMilestones}
                  onCheckedChange={(checked: boolean) =>
                    setNotifications({ ...notifications, goalMilestones: checked })
                  }
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

        {/* Privacy & Data Sharing */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Privacy & Data Sharing</h2>
              <p className="text-sm text-muted-foreground">Control how your data is used and shared</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="consent-summaries" className="text-sm font-medium">
                    Share Weekly Chat Summaries
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow your sports psychologist to view anonymized weekly summaries of your chat sessions
                  </p>
                </div>
                <Switch
                  id="consent-summaries"
                  checked={privacy.consentChatSummaries}
                  onCheckedChange={(checked: boolean) =>
                    setPrivacy({ ...privacy, consentChatSummaries: checked })
                  }
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-info/5 border border-info/10">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your Data is Protected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All data is encrypted and stored securely. Your sports psychologist only sees weekly chat summaries
                    (not individual messages) when you grant consent. You can revoke access at any time and all summaries will be deleted.
                  </p>
                </div>
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

        {/* Appearance & Theme */}
        <section className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              {isDarkMode ? <Moon className="w-5 h-5 text-warning" /> : <Sun className="w-5 h-5 text-warning" />}
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
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="card-elevated overflow-hidden animate-slide-up border-destructive/20">
          <div className="p-4 border-b border-border">
            <h2 className="font-medium text-foreground">Account Actions</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
          </div>
          <div className="p-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
