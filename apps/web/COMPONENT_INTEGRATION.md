# Component Integration Guide

## Components Created (Not Yet Integrated)

These components have been created but need to be added to the actual pages for testing:

### Week 3-4: Biometric Components

**Location**: `/src/components/biometrics/`

1. **BiometricOverview.tsx** → Should be added to:
   - `/src/app/student/dashboard/page.tsx`
   - Usage: `<BiometricOverview athleteId={user.id} />`

2. **HRVChart.tsx** → Should be added to:
   - `/src/app/student/dashboard/page.tsx` (below BiometricOverview)
   - `/src/app/coach/athletes/[id]/page.tsx` (athlete detail page)
   - Usage: `<HRVChart athleteId={athleteId} days={30} />`

### Week 5: Analytics Components

**Location**: `/src/components/coach/analytics/`

3. **PerformanceCorrelationMatrix.tsx** → Should be added to:
   - `/src/app/coach/analytics/page.tsx` (create if doesn't exist)
   - OR `/src/app/coach/athletes/[id]/page.tsx`
   - Usage: `<PerformanceCorrelationMatrix athleteId={athleteId} days={90} />`

4. **TeamHeatmap.tsx** → Should be added to:
   - `/src/app/coach/dashboard/page.tsx`
   - OR `/src/app/coach/analytics/page.tsx`
   - Usage: `<TeamHeatmap coachId={user.id} days={14} />`

### Week 6: Forecasting & Intervention Components

**Location**: `/src/components/coach/analytics/` and `/src/components/coach/insights/`

5. **ReadinessForecastChart.tsx** → Should be added to:
   - `/src/app/coach/athletes/[id]/page.tsx` (athlete detail page)
   - Usage: `<ReadinessForecastChart athleteId={athleteId} days={30} />`

6. **InterventionQueue.tsx** → Should be added to:
   - `/src/app/coach/insights/page.tsx`
   - Usage: `<InterventionQueueComponent coachId={user.id} />`

## Quick Integration Example

### Example 1: Add to Student Dashboard

```tsx
// src/app/student/dashboard/page.tsx

import { BiometricOverview } from '@/components/biometrics/BiometricOverview';
import { HRVChart } from '@/components/biometrics/HRVChart';

export default function StudentDashboard() {
  // ... existing code ...

  return (
    <div>
      {/* Existing dashboard content */}

      {/* Add biometric section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Biometric Insights</h2>
        <BiometricOverview athleteId={user.id} />

        <div className="mt-6">
          <HRVChart athleteId={user.id} days={30} />
        </div>
      </section>
    </div>
  );
}
```

### Example 2: Add to Coach Insights Page

```tsx
// src/app/coach/insights/page.tsx

import { InterventionQueueComponent } from '@/components/coach/insights/InterventionQueue';

export default function CoachInsightsPage() {
  // ... existing code ...

  return (
    <div>
      {/* Existing insights content */}

      {/* Add intervention queue */}
      <section className="mt-8">
        <InterventionQueueComponent coachId={user.id} />
      </section>
    </div>
  );
}
```

## Testing Without Full Integration

You can test components individually by creating temporary test pages:

### Create Test Page

```tsx
// src/app/test-biometrics/page.tsx

'use client';

import { BiometricOverview } from '@/components/biometrics/BiometricOverview';
import { HRVChart } from '@/components/biometrics/HRVChart';

export default function TestBiometrics() {
  // Use a test athlete ID from your seed data
  const testAthleteId = 'test-athlete-id'; // Replace with actual ID

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Biometric Components Test</h1>

      <div className="space-y-8">
        <BiometricOverview athleteId={testAthleteId} />
        <HRVChart athleteId={testAthleteId} days={30} />
      </div>
    </div>
  );
}
```

Then visit: `http://localhost:3000/test-biometrics`

## API Testing (Bypass UI)

You can test the APIs directly without UI integration:

### Get Athlete IDs from Database

```bash
pnpm prisma:studio
# Opens Prisma Studio in browser
# Navigate to "Athlete" table
# Copy a userId to use for testing
```

### Test APIs with curl

```bash
# Replace ATHLETE_ID with actual ID from database
ATHLETE_ID="actual-athlete-user-id"

# Test biometrics endpoint
curl "http://localhost:3000/api/biometrics?athleteId=$ATHLETE_ID&metricType=hrv&days=30" | jq

# Test correlation endpoint
curl "http://localhost:3000/api/analytics/performance-correlation?athleteId=$ATHLETE_ID&days=90" | jq

# Test forecast endpoint
curl "http://localhost:3000/api/analytics/readiness-forecast?athleteId=$ATHLETE_ID&days=30" | jq
```

## Priority for Testing

Given time constraints, test in this order:

1. **API Endpoints First** (fastest to verify)
   - Run curl commands to verify data is generated correctly
   - Check JSON responses have expected structure

2. **Create Simple Test Pages** (medium effort)
   - Create test pages as shown above
   - Verify components render without errors

3. **Full Integration** (Week 7-8 task)
   - Integrate components into production pages
   - Ensure proper auth context and user IDs
   - Polish UI/UX

## Current Status

- ✅ All components created
- ✅ All API endpoints created
- ✅ All analytics modules created
- ⏳ Components NOT YET integrated into pages (Week 7-8 task)
- ⏳ Testing infrastructure ready (seed scripts available)

## Next Steps

1. Run seed scripts (`pnpm db:seed` + `pnpm db:seed-biometrics`)
2. Test APIs directly with curl
3. Create test pages for quick visual verification
4. Week 7-8: Full integration + UI polish
