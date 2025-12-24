'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  // Profile settings
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    phone: '(555) 123-4567',
    sport: 'Basketball',
    team: 'Varsity',
    year: 'Junior',
    position: 'Point Guard',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    assignmentReminders: true,
    goalMilestones: true,
    coachMessages: true,
    weeklyReports: false,
    emailDigest: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    shareWithCoach: true,
    anonymousData: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      // await apiClient.updateProfile(profile);

      // Simulate API delay
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
      // TODO: Replace with actual API call
      // await apiClient.updateNotificationPreferences(notifications);

      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.updatePrivacySettings(privacy);

      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout
    toast.success('Logged out successfully');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-purple-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal and athletic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input
                id="year"
                value={profile.year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, year: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="sport"
                  value={profile.sport}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, sport: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={profile.team}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, team: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={profile.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, position: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose what updates you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="assignment-reminders" className="text-base font-medium">
                  Assignment Reminders
                </Label>
                <p className="text-sm text-gray-500">
                  Get notified about upcoming assignment due dates
                </p>
              </div>
              <Switch
                id="assignment-reminders"
                checked={notifications.assignmentReminders}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, assignmentReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="goal-milestones" className="text-base font-medium">
                  Goal Milestones
                </Label>
                <p className="text-sm text-gray-500">
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="coach-messages" className="text-base font-medium">
                  Coach Messages
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications for messages from your coach
                </p>
              </div>
              <Switch
                id="coach-messages"
                checked={notifications.coachMessages}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, coachMessages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports" className="text-base font-medium">
                  Weekly Progress Reports
                </Label>
                <p className="text-sm text-gray-500">
                  Get a summary of your weekly mood and goal progress
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={notifications.weeklyReports}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, weeklyReports: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest" className="text-base font-medium">
                  Email Digest
                </Label>
                <p className="text-sm text-gray-500">
                  Receive daily email summaries of your activity
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={notifications.emailDigest}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, emailDigest: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveNotifications}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data Sharing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <CardTitle>Privacy & Data Sharing</CardTitle>
          </div>
          <CardDescription>Control how your data is used and shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-coach" className="text-base font-medium">
                  Share Data with Coach
                </Label>
                <p className="text-sm text-gray-500">
                  Allow your coach to view your mood logs, goals, and progress
                </p>
              </div>
              <Switch
                id="share-coach"
                checked={privacy.shareWithCoach}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, shareWithCoach: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous-data" className="text-base font-medium">
                  Anonymous Research Data
                </Label>
                <p className="text-sm text-gray-500">
                  Contribute anonymized data for sports psychology research
                </p>
              </div>
              <Switch
                id="anonymous-data"
                checked={privacy.anonymousData}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, anonymousData: checked })
                }
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-900">Your Data is Protected</h4>
                <p className="text-xs text-blue-800">
                  All data is encrypted and stored securely. Your coach only sees aggregated trends
                  unless you explicitly share specific information. You can revoke access at any
                  time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSavePrivacy}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-600 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
