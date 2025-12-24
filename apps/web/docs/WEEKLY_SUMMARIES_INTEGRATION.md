# Weekly Chat Summaries - Integration Guide

This guide shows how to integrate the weekly chat summary feature into existing coach and athlete views.

## Table of Contents
1. [Overview](#overview)
2. [Coach Integration](#coach-integration)
3. [Athlete Integration](#athlete-integration)
4. [API Usage](#api-usage)
5. [Database Migration](#database-migration)
6. [Environment Setup](#environment-setup)

## Overview

The weekly chat summary system consists of:
- **Backend**: API endpoints, cron jobs, encryption, audit logging
- **Coach UI**: `WeeklySummaryDrawer` component for viewing summaries
- **Athlete UI**: `ConsentSettingsModal` component for managing consent
- **Database**: Row-level security policies for privacy enforcement

## Coach Integration

### Using WeeklySummaryDrawer in Athlete Views

```typescript
// src/components/coach/AthleteDetailView.tsx (or similar)
import WeeklySummaryDrawer from '@/components/coach/weekly-summary/WeeklySummaryDrawer';

export default function AthleteDetailView({ athleteId }: { athleteId: string }) {
  const [athleteData, setAthleteData] = useState<any>(null);

  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* Existing athlete info cards */}
      <div>...</div>

      {/* Weekly Summary Section - Add this */}
      <WeeklySummaryDrawer
        athleteId={athleteId}
        athleteName={athleteData?.athlete?.name || 'Athlete'}
        consentGranted={athleteData?.athlete?.consentChatSummaries || false}
      />

      {/* Rest of athlete details */}
      <div>...</div>
    </div>
  );
}
```

## Athlete Integration

### Using ConsentSettingsModal in Settings Page

```typescript
// src/app/(athlete)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ConsentSettingsModal from '@/components/athlete/settings/ConsentSettingsModal';

export default function SettingsPage() {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);

  const handleConsentChange = async (newConsent: boolean) => {
    const res = await fetch('/api/athlete/consent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentChatSummaries: newConsent }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update consent');
    }

    setConsentGranted(newConsent);
  };

  return (
    <div className="p-6">
      <button onClick={() => setShowConsentModal(true)}>
        Change Privacy Settings
      </button>

      <ConsentSettingsModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        currentConsent={consentGranted}
        onConsentChange={handleConsentChange}
      />
    </div>
  );
}
```

## API Usage

### Fetching Weekly Summaries (Coach)

```typescript
const response = await fetch(
  \`/api/coach/weekly-summaries?athleteId=\${athleteId}&limit=4\`
);
const data = await response.json();

if (response.ok) {
  console.log('Summaries:', data.summaries);
} else {
  console.error('Error:', data.error);
}
```

### Managing Consent (Athlete)

```typescript
// Update consent
const updateRes = await fetch('/api/athlete/consent', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ consentChatSummaries: true }),
});
```

## Database Migration

```bash
# Apply schema migration
npx prisma generate
npx prisma migrate deploy

# Apply RLS policies (optional)
psql $DATABASE_URL < prisma/migrations/add_weekly_summary_rls.sql
```

## Environment Setup

Add to `.env.local`:

```bash
# Generate with: openssl rand -base64 32
CRON_SECRET="your-cron-secret"

# Generate with: openssl rand -hex 32
SUMMARY_ENCRYPTION_KEY="your-encryption-key-64-hex-chars"
```

## Troubleshooting

### Summaries Not Appearing

1. Check `consentChatSummaries = true` for athlete
2. Check `consentGranted = true` in CoachAthleteRelation
3. Verify summaries exist and not revoked

### Cron Jobs Not Running

1. Check Vercel cron logs
2. Verify CRON_SECRET is set
3. Test endpoint manually

For detailed documentation, see `docs/coach_weekly_chat_summaries.md`
