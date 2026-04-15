import { Suspense } from 'react';
import { Activity } from 'lucide-react';
import { WellnessPage } from '@/components/student/wellness/WellnessPage';

export default function WellnessRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading wellness...</p>
        </div>
      </div>
    }>
      <WellnessPage />
    </Suspense>
  );
}
