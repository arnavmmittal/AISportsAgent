'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MoodLogger } from '@/components/mood/MoodLogger';

export default function MoodPage() {
  return (
    <DashboardLayout>
      <div className="py-8">
        <MoodLogger />
      </div>
    </DashboardLayout>
  );
}
