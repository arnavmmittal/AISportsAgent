/**
 * Assignments & Habits - Mental Skills Development
 * Assign evidence-based exercises and track habit formation
 */

'use client';

import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import TabNavigation from '@/components/coach/layouts/TabNavigation';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import AssignmentLibrary from '@/components/coach/assignments/AssignmentLibrary';
import ActiveAssignments from '@/components/coach/assignments/ActiveAssignments';
import SubmissionReview from '@/components/coach/assignments/SubmissionReview';
import HabitTracker from '@/components/coach/assignments/HabitTracker';

export default function AssignmentsPage() {
  const tabs = [
    {
      id: 'library',
      label: 'Assignment Library',
      icon: '📚',
      content: <AssignmentLibrary />,
    },
    {
      id: 'active',
      label: 'Active Assignments',
      icon: '📋',
      content: <ActiveAssignments />,
    },
    {
      id: 'submissions',
      label: 'Submission Review',
      icon: '✅',
      content: <SubmissionReview />,
    },
    {
      id: 'habits',
      label: 'Habit Tracker',
      icon: '🔄',
      content: <HabitTracker />,
    },
  ];

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Assignments & Habits"
          description="Structured mental skills development & habit formation"
        >
          <TabNavigation tabs={tabs} variant="default" />
        </DashboardSection>
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
