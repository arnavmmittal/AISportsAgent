/**
 * Settings & Admin - System Configuration
 * Team settings, notifications, AI tuning, and privacy management
 */

'use client';

import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import TabNavigation from '@/components/coach/layouts/TabNavigation';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import TeamSettings from '@/components/coach/settings/TeamSettings';
import NotificationPreferences from '@/components/coach/settings/NotificationPreferences';
import AIConfiguration from '@/components/coach/settings/AIConfiguration';
import PrivacyConsent from '@/components/coach/settings/PrivacyConsent';
import UserManagement from '@/components/coach/settings/UserManagement';

export default function SettingsPage() {
  const tabs = [
    {
      id: 'team',
      label: 'Team Settings',
      icon: '⚙️',
      content: <TeamSettings />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      content: <NotificationPreferences />,
    },
    {
      id: 'ai-config',
      label: 'AI Configuration',
      icon: '🤖',
      content: <AIConfiguration />,
    },
    {
      id: 'privacy',
      label: 'Privacy & Consent',
      icon: '🔒',
      content: <PrivacyConsent />,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: '👥',
      content: <UserManagement />,
    },
  ];

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Settings & Administration"
          description="Configure team, notifications, AI behavior & privacy"
        >
          <TabNavigation tabs={tabs} variant="default" />
        </DashboardSection>
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
