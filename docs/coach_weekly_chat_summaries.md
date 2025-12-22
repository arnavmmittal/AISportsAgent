# Weekly Chat Summaries for Coaches - Implementation Plan

## Overview

This plan implements a privacy-first "Last Week Summary" feature that shows AI-generated weekly summaries of athlete chats to coaches (ONLY with athlete consent). These summaries feed structured signals into the readiness scoring algorithm and analytics pipeline.

**Key Requirements**:
- ✅ Requires explicit athlete opt-in (default OFF)
- ✅ Enforces multi-layer consent checks (athlete + relationship + tenant)
- ✅ Never exposes raw chat content to coaches
- ✅ Uses structured AI-derived signals for readiness scoring
- ✅ Encrypts sensitive qualitative fields at rest
- ✅ Logs all data access for compliance
- ✅ Implements 12-week data retention with revocation support
- ✅ Provides clear UI for consent management and summary display
- ✅ Integrates cleanly with existing infrastructure

---

## Architecture & Data Flow

### High-Level System Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 1: WEEKLY AGGREGATION (Automated - Sunday 11:59 PM)           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Cron Job (/api/cron/generate-weekly-summaries)                     │
│      ↓                                                               │
│  1. Fetch athletes WHERE consentChatSummaries = true                │
│      ↓                                                               │
│  2. For each athlete:                                               │
│     → Get ChatSessions from past 7 days                             │
│     → Extract Message.metadata (mood_score, stress_score, etc.)     │
│     → NO RAW CHAT CONTENT sent to AI                                │
│      ↓                                                               │
│  3. OpenAI Summarizer Agent:                                        │
│     Input:  Aggregated metadata only                                │
│     Output: Structured WeeklySummary JSON                           │
│      ↓                                                               │
│  4. Store in ChatSummary table:                                     │
│     - summaryType = 'WEEKLY'                                        │
│     - weekStart, weekEnd timestamps                                 │
│     - moodScore, stressScore, sleepQualityScore, etc.               │
│     - keyThemes[], riskFlags[], recommendedActions[]                │
│     - redactedContent = true (always)                               │
│     - expiresAt = now + 12 weeks                                    │
│      ↓                                                               │
│  5. Audit log: GENERATE_WEEKLY_SUMMARY                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 2: COACH ACCESS (On-Demand via Dashboard)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Coach views dashboard → AthleteCard component                      │
│      ↓                                                               │
│  API: GET /api/coach/weekly-summaries?athleteId=X&weekStart=Y       │
│      ↓                                                               │
│  Privacy Gates (ALL must pass):                                     │
│  ✓ CoachAthleteRelation.consentGranted = true                       │
│  ✓ Athlete.consentChatSummaries = true                              │
│  ✓ Coach.schoolId = Athlete.schoolId (tenant boundary)              │
│  ✓ RLS policy enforcement (database level)                          │
│  ✓ Summary.revokedAt IS NULL                                        │
│  ✓ Summary.expiresAt > NOW()                                        │
│      ↓                                                               │
│  If ALL gates pass:                                                 │
│  → Return WeeklySummary data                                        │
│  → Update viewedByCoach = true, viewedAt = NOW()                    │
│  → Update coachId = requesting coach                                │
│  → Audit log: VIEW_WEEKLY_SUMMARY                                   │
│      ↓                                                               │
│  AthleteCard displays:                                              │
│  [Expand Weekly Summary ▼] button                                   │
│   → Shows structured summary (NO raw chat)                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 3: READINESS SCORE INTEGRATION                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  calculateReadinessScore({ moodLog, weeklySummary, activity })      │
│      ↓                                                               │
│  Strategy: BLEND daily MoodLog + weekly trend                       │
│  - MoodLog (if exists): 70% weight (short-term state)               │
│  - WeeklySummary (if consented): 30% weight (long-term trend)       │
│  - If no MoodLog: 100% WeeklySummary                                │
│      ↓                                                               │
│  Readiness Formula (Enhanced):                                      │
│  rawScore = (                                                        │
│    0.30 × blended_mood +                                            │
│    0.25 × (10 - blended_stress) +                                   │
│    0.20 × blended_confidence +                                      │
│    0.15 × blended_sleep +                                           │
│    0.10 × engagement                                                │
│  ) × 10                                                             │
│      ↓                                                               │
│  Apply Risk Penalties:                                              │
│  - "elevated stress" → -5 points                                    │
│  - "sleep disruption" → -8 points                                   │
│  - "injury concern" → -10 points                                    │
│  - "burnout indicators" → -12 points                                │
│      ↓                                                               │
│  finalScore = max(0, rawScore - riskPenalty)                        │
│      ↓                                                               │
│  Return:                                                             │
│  - score: 0-100                                                     │
│  - level: OPTIMAL | GOOD | MODERATE | LOW | POOR                    │
│  - confidence: 0.0-1.0 (data quality indicator)                     │
│  - signals: breakdown by source (daily vs weekly)                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
apps/web/
├── prisma/
│   ├── schema.prisma                          [MODIFY] Extend ChatSummary model
│   └── migrations/
│       └── add_weekly_summary_fields/         [CREATE] Migration
├── src/
│   ├── app/api/
│   │   ├── coach/
│   │   │   ├── weekly-summaries/route.ts      [CREATE] Fetch summaries
│   │   │   └── dashboard/route.ts             [MODIFY] Include summary in response
│   │   ├── athlete/
│   │   │   └── consent/route.ts               [MODIFY] Handle consent updates
│   │   └── cron/
│   │       ├── generate-weekly-summaries/     [CREATE] Weekly aggregation
│   │       └── cleanup-summaries/             [CREATE] Retention cleanup
│   ├── components/coach/
│   │   ├── roster/
│   │   │   └── AthleteCard.tsx                [MODIFY] Add summary section
│   │   └── WeeklySummaryDrawer.tsx            [CREATE] Expandable summary view
│   ├── lib/
│   │   ├── summarizer.ts                      [CREATE] AI summarization logic
│   │   ├── readiness-score.ts                 [CREATE] Enhanced readiness calc
│   │   ├── encryption.ts                      [CREATE] Field encryption
│   │   └── audit.ts                           [CREATE] Audit logging utilities
│   └── types/
│       └── coach-portal.ts                    [MODIFY] Add WeeklySummary types
└── docs/
    └── coach_weekly_chat_summaries.md         [CREATE] This document
```

## Database Schema: Extended ChatSummary Model

### Current Schema (Existing)

```prisma
model ChatSummary {
  id             String      @id @default(cuid())
  sessionId      String
  athleteId      String
  coachId        String?
  summary        String
  keyThemes      Json
  emotionalState String?
  actionItems    Json?
  messageCount   Int
  generatedAt    DateTime    @default(now())
  viewedByCoach  Boolean     @default(false)
  viewedAt       DateTime?
  Athlete        Athlete     @relation(fields: [athleteId], references: [userId])
  ChatSession    ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([athleteId, generatedAt])
  @@index([sessionId])
  @@index([viewedByCoach])
}
```

### Enhanced Schema (Proposed)

**Strategy**: Extend existing `ChatSummary` model to support both session-level and weekly summaries.

```prisma
model ChatSummary {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  athleteId String
  athlete   Athlete      @relation(fields: [athleteId], references: [userId], onDelete: Cascade)

  sessionId String?      // NULL for weekly summaries
  session   ChatSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  coachId   String?
  coach     Coach?       @relation(fields: [coachId], references: [userId])

  // Summary Type & Period [NEW]
  summaryType SummaryType @default(SESSION) // SESSION | WEEKLY
  weekStart   DateTime?   // Start of week (Monday 00:00) - for weekly summaries
  weekEnd     DateTime?   // End of week (Sunday 23:59) - for weekly summaries

  // Existing qualitative fields
  summary        String   // Human-readable summary text
  keyThemes      Json     // String[] - encrypted for weekly summaries
  emotionalState String?
  actionItems    Json?
  messageCount   Int

  // Structured Numeric Scores [NEW] - NOT encrypted (needed for aggregation)
  moodScore          Float? // 1-10 average for week
  stressScore        Float? // 1-10 average for week
  sleepQualityScore  Float? // 1-10 average for week
  confidenceScore    Float? // 1-10 average for week
  sorenessScore      Float? // 0-10 average for week
  workloadPerception Float? // 1-10 average for week

  // Qualitative Insights [NEW] - encrypted
  riskFlags            String[] // ["elevated stress", "sleep disruption"]
  recommendedActions   String[] // ["breathing exercises", "sleep hygiene"]
  athleteGoalsProgress Json?    // { "goal_id": { "status": "on_track" } }
  adherenceNotes       String?  // "Engaged in 3/4 suggested exercises"

  // Summary Metadata [NEW]
  totalMessages   Int?   // Number of messages in aggregation period
  sessionCount    Int?   // Number of sessions in week
  avgResponseTime Float? // Average time between messages (seconds)
  engagementScore Float? // 1-10 based on frequency/depth

  // Privacy & Redaction [NEW]
  redactedContent Boolean @default(false) // Always true for weekly summaries
  redactionReason String? // "Contains sensitive health info"

  // Existing audit fields
  generatedAt   DateTime @default(now())
  viewedByCoach Boolean  @default(false)
  viewedAt      DateTime?

  // Data Retention [NEW]
  expiresAt DateTime? // Auto-delete after 12 weeks
  revokedAt DateTime? // When athlete revokes consent

  @@index([athleteId, weekStart, summaryType])
  @@index([athleteId, generatedAt])
  @@index([sessionId])
  @@index([viewedByCoach])
  @@index([expiresAt]) // For cleanup jobs
  @@index([summaryType, weekStart])
  @@map("chat_summaries")
}

enum SummaryType {
  SESSION // Existing per-session summaries
  WEEKLY  // New weekly aggregated summaries
}
```

### Why Extend vs. Create New?

✅ **Advantages**:
- Reuse audit infrastructure (`viewedByCoach`, `viewedAt`, `coachId`)
- Unified access control (same RLS policies)
- Backward compatible (`sessionId` optional, `summaryType` discriminator)
- Simpler queries (single table for all summary types)
- Shared consent checks and privacy controls

❌ **Not creating separate table** because:
- Would duplicate audit logic
- Would require separate RLS policies
- More complex joins for coach dashboard
- Harder to maintain consistency

## WeeklySummary Schema (Structured Output)

### JSON Structure Example

```typescript
interface WeeklySummaryOutput {
  // Numeric Scores (1-10 scale, derived from message metadata)
  moodScore: number;          // 7.2 - weekly average
  stressScore: number;        // 5.8 - weekly average
  sleepQualityScore: number;  // 6.5 - weekly average
  confidenceScore: number;    // 8.1 - weekly average
  sorenessScore: number;      // 3.2 - injury/soreness mentions
  workloadPerception: number; // 7.0 - perceived training load

  // Qualitative Insights (AI-extracted themes)
  keyThemes: string[];
  // Example: [
  //   "Pre-game anxiety management",
  //   "Time management (final exams)",
  //   "Team communication dynamics"
  // ]

  riskFlags: string[];
  // Example: [
  //   "Elevated stress (finals week)",
  //   "Sleep disruption patterns"
  // ]

  recommendedActions: string[];
  // Example: [
  //   "Breathing exercises before games",
  //   "Sleep hygiene check-in",
  //   "Academic workload discussion"
  // ]

  // Goal Progress (linked to Goal model)
  athleteGoalsProgress: {
    [goalId: string]: {
      status: 'on_track' | 'struggling' | 'achieved';
      notes: string;
      confidence: number; // AI confidence in assessment
    };
  };
  // Example: {
  //   "goal_123": {
  //     "status": "on_track",
  //     "notes": "Athlete practicing visualization daily",
  //     "confidence": 0.85
  //   }
  // }

  adherenceNotes: string;
  // Example: "Athlete engaged in 3 of 4 suggested mindfulness exercises.
  //           Strong commitment to pre-game routines."

  // Engagement Metrics
  totalMessages: number;      // 47 - messages sent this week
  sessionCount: number;       // 3 - chat sessions initiated
  avgResponseTime: number;    // 180 - seconds between messages
  engagementScore: number;    // 8.5/10 - derived from frequency + depth

  // Metadata
  weekStart: Date;            // 2024-12-16T00:00:00Z
  weekEnd: Date;              // 2024-12-22T23:59:59Z
  generatedAt: Date;          // 2024-12-22T23:59:30Z
  confidence: number;         // 0.82 - AI confidence in summary accuracy
}
```

### Signal Extraction from Chat Metadata

**How signals are derived** (NO raw chat content used):

```typescript
// Message.metadata already contains structured data from AI agent:
interface MessageMetadata {
  mood_score?: number;        // 1-10 from AthleteAgent
  stress_score?: number;      // 1-10 from conversation context
  confidence_score?: number;  // 1-10 from athlete's language
  sleep_quality?: number;     // 1-10 from sleep mentions
  soreness_score?: number;    // 0-10 from injury/pain mentions
  themes?: string[];          // Topics discussed
  risk_flags?: string[];      // Detected concerns
  session_stage?: string;     // check_in | explore | clarify | plan
}

// Weekly aggregation process:
1. Fetch all Messages where sessionId IN (sessions from past 7 days)
2. Extract metadata from assistant messages (AI responses)
3. Calculate averages for numeric scores
4. Count frequency of themes and flags
5. Send aggregated metadata to OpenAI (NOT raw content)
6. OpenAI synthesizes high-level insights
```

## Consent & Privacy Model

### Two-Tier Consent System

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Athlete-Level Consent (Global Settings)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Athlete.consentChatSummaries (boolean, default: false)     │
│                                                             │
│ Controls: Whether ANY coach can see weekly summaries       │
│ Scope:    All coaches assigned to this athlete             │
│ UI:       Dashboard → Settings → Privacy → Toggle          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ∩ (AND)
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Relationship-Level Consent                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CoachAthleteRelation.consentGranted (boolean)              │
│                                                             │
│ Controls: Which specific coaches have access               │
│ Scope:    Per coach-athlete relationship                   │
│ UI:       Set when athlete joins via invite code           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Both must be TRUE for coach to see summaries.**

### Athlete-Side Consent UX

**Location**: `/dashboard/settings` → Privacy tab

```
┌────────────────────────────────────────────────────────────────┐
│ Privacy Settings                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 📊 Weekly Chat Summaries                                      │
│                                                                │
│ Allow coaches to see weekly summaries of your conversations   │
│ with the AI coach.                                            │
│                                                                │
│ ✅ What coaches WILL see:                                     │
│   • Average mood and confidence scores (e.g., 7/10)           │
│   • Key themes discussed (e.g., "pre-game anxiety")           │
│   • Suggested techniques practiced                            │
│   • Overall engagement level                                  │
│                                                                │
│ ❌ What coaches will NOT see:                                 │
│   • Your actual chat messages                                 │
│   • Personal details shared in conversations                  │
│   • Specific examples or stories                              │
│                                                                │
│ [Toggle: OFF] Enable Weekly Summaries                         │
│                                                                │
│ ℹ️  Data retention: Summaries are kept for 12 weeks and can  │
│    be revoked at any time.                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Flow**:
1. User clicks toggle → Confirmation modal appears
2. Modal shows clear examples of what data is shared
3. User confirms → API call to `/api/athlete/consent`
4. Backend updates `Athlete.consentChatSummaries = true`
5. Audit log created: `CONSENT_UPDATE`

**Revocation Flow**:
1. User toggles OFF → Confirmation modal
2. User confirms → API call to `/api/athlete/consent`
3. Backend:
   - Sets `Athlete.consentChatSummaries = false`
   - Updates all existing summaries: `revokedAt = NOW()`
   - Updates all existing summaries: `expiresAt = NOW()` (immediate deletion)
4. Cleanup cron job deletes revoked summaries within 24 hours

### Coach-Side Display Behavior

**AthleteCard Component** (modified):

```tsx
// BEFORE (current):
┌─────────────────────────────────┐
│ Jane Doe - Women's Soccer       │
│ Readiness: 78 (GOOD) 🟢         │
│ Risk: LOW                       │
│ Archetype: Resilient Warrior    │
│                                 │
│ [View Profile →]                │
└─────────────────────────────────┘

// AFTER (with weekly summary):
┌─────────────────────────────────────────────────────┐
│ Jane Doe - Women's Soccer                           │
│ Readiness: 78 (GOOD) 🟢 | Risk: LOW                 │
│                                                     │
│ ╔═══════════════════════════════════════════════╗   │
│ ║ 📊 Weekly Summary (Dec 16-22)            [▼] ║   │ ← NEW
│ ╚═══════════════════════════════════════════════╝   │
│                                                     │
│ Archetype: Resilient Warrior                        │
│ [View Profile →]                                    │
└─────────────────────────────────────────────────────┘

// When EXPANDED:
┌─────────────────────────────────────────────────────┐
│ Jane Doe - Women's Soccer                           │
│ Readiness: 78 (GOOD) 🟢 | Risk: LOW                 │
│                                                     │
│ ╔═══════════════════════════════════════════════╗   │
│ ║ 📊 Weekly Summary (Dec 16-22)            [▲] ║   │
│ ╠═══════════════════════════════════════════════╣   │
│ ║                                               ║   │
│ ║ Scores (1-10 scale):                          ║   │
│ ║ Mood: 7.2  Stress: 5.8  Sleep: 6.5           ║   │
│ ║ Confidence: 8.1  Engagement: 8.5             ║   │
│ ║                                               ║   │
│ ║ Key Themes:                                   ║   │
│ ║ • Pre-game anxiety management                 ║   │
│ ║ • Time management (exams)                     ║   │
│ ║                                               ║   │
│ ║ ⚠️  Risk Flags:                               ║   │
│ ║ • Elevated stress (finals week)               ║   │
│ ║                                               ║   │
│ ║ 💡 Recommended Actions:                       ║   │
│ ║ • Breathing exercises before games            ║   │
│ ║ • Sleep hygiene check-in                      ║   │
│ ║                                               ║   │
│ ║ Activity: 3 sessions • 47 messages            ║   │
│ ║                                               ║   │
│ ╚═══════════════════════════════════════════════╝   │
│                                                     │
│ [View Profile →]                                    │
└─────────────────────────────────────────────────────┘

// If consent NOT granted:
┌─────────────────────────────────────────────────────┐
│ Jane Doe - Women's Soccer                           │
│ Readiness: -- | Risk: --                            │
│                                                     │
│ ╔═══════════════════════════════════════════════╗   │
│ ║ 🔒 Weekly Summary Not Available               ║   │
│ ╠═══════════════════════════════════════════════╣   │
│ ║ Athlete has not enabled weekly summaries      ║   │
│ ╚═══════════════════════════════════════════════╝   │
│                                                     │
│ [View Profile] (limited access)                     │
└─────────────────────────────────────────────────────┘
```

## Algorithmic Integration: Readiness Score

### Current Readiness Formula (From Exploration)

```typescript
// Existing formula (in coach dashboard):
readinessScore = (
  0.30 × mood +
  0.25 × (10 - stress) +  // stress inverted
  0.20 × confidence +
  0.15 × sleep +
  0.10 × engagement
) × 10

// Levels:
// OPTIMAL:  90-100
// GOOD:     75-89
// MODERATE: 60-74
// LOW:      45-59
// POOR:     0-44
```

### Enhanced Formula with Weekly Summary Signals

```typescript
// src/lib/readiness-score.ts (NEW FILE)

export interface ReadinessInputs {
  // Daily snapshot (from MoodLog)
  moodLog?: {
    mood: number;          // 1-10
    stress: number;        // 1-10
    confidence: number;    // 1-10
    sleepQuality: number;  // 1-10
  };

  // Weekly trend (from WeeklySummary, if consent granted)
  weeklySummary?: {
    moodScore: number;
    stressScore: number;
    confidenceScore: number;
    sleepQualityScore: number;
    engagementScore: number;
    sorenessScore: number;
    riskFlags: string[];
  };

  // Platform activity
  recentActivity: {
    messageCount: number;      // Last 7 days
    sessionCount: number;      // Last 7 days
    goalCompletionRate: number; // 0.0-1.0
  };
}

export interface ReadinessOutput {
  score: number;             // 0-100
  level: ReadinessLevel;     // OPTIMAL | GOOD | MODERATE | LOW | POOR
  confidence: number;        // 0.0-1.0 (data quality indicator)
  signals: SignalBreakdown;  // Details of what contributed
}

export function calculateReadinessScore(inputs: ReadinessInputs): ReadinessOutput {
  const { moodLog, weeklySummary, recentActivity } = inputs;

  // Initialize with neutral defaults
  let mood = 5, stress = 5, confidence = 5, sleep = 5, engagement = 5;
  let confidenceLevel = 0.3; // Low confidence with defaults

  // STRATEGY: Blend daily MoodLog (short-term) + WeeklySummary (long-term trend)

  // Phase 1: Use MoodLog if available (today's state)
  if (moodLog) {
    mood = moodLog.mood;
    stress = moodLog.stress;
    confidence = moodLog.confidence;
    sleep = moodLog.sleepQuality;
    confidenceLevel += 0.4; // High confidence (explicit athlete input)
  }

  // Phase 2: Blend with WeeklySummary (past week trend)
  if (weeklySummary) {
    const weeklyWeight = moodLog ? 0.3 : 1.0; // 30% if MoodLog exists, 100% if not

    // Blend scores using weighted average
    mood = blend(mood, weeklySummary.moodScore, weeklyWeight);
    stress = blend(stress, weeklySummary.stressScore, weeklyWeight);
    confidence = blend(confidence, weeklySummary.confidenceScore, weeklyWeight);
    sleep = blend(sleep, weeklySummary.sleepQualityScore, weeklyWeight);
    engagement = weeklySummary.engagementScore;

    confidenceLevel += 0.3; // Moderate confidence (AI-derived)
  }

  // Phase 3: Incorporate platform activity
  engagement = calculateEngagement(recentActivity);

  // Calculate base score (same formula as before)
  const rawScore = (
    0.30 * mood +
    0.25 * (10 - stress) +
    0.20 * confidence +
    0.15 * sleep +
    0.10 * engagement
  ) * 10;

  // Phase 4: Apply risk flag penalties
  let riskPenalty = 0;
  if (weeklySummary?.riskFlags) {
    riskPenalty = calculateRiskPenalty(weeklySummary.riskFlags);
    confidenceLevel += 0.1; // Risk detection adds signal
  }

  const finalScore = Math.max(0, Math.min(100, rawScore - riskPenalty));

  return {
    score: Math.round(finalScore),
    level: getReadinessLevel(finalScore),
    confidence: Math.min(1.0, confidenceLevel),
    signals: {
      mood: { value: mood, source: moodLog ? 'daily' : 'weekly', weight: 0.30 },
      stress: { value: stress, source: moodLog ? 'daily' : 'weekly', weight: 0.25 },
      confidence: { value: confidence, source: moodLog ? 'daily' : 'weekly', weight: 0.20 },
      sleep: { value: sleep, source: moodLog ? 'daily' : 'weekly', weight: 0.15 },
      engagement: { value: engagement, source: 'activity', weight: 0.10 },
      riskPenalty: riskPenalty,
      rawScore: rawScore,
      finalScore: finalScore
    }
  };
}

function blend(current: number, weekly: number, weight: number): number {
  // Weighted average: current gets (1-weight), weekly gets weight
  return current * (1 - weight) + weekly * weight;
}

function calculateRiskPenalty(riskFlags: string[]): number {
  // Risk flag severity mapping
  const severityMap: Record<string, number> = {
    'elevated stress': 5,
    'sleep disruption': 8,
    'injury concern': 10,
    'burnout indicators': 12,
    'low motivation': 6,
    'academic stress': 4,
    'team conflict': 7
  };

  return riskFlags.reduce((penalty, flag) => {
    const normalizedFlag = flag.toLowerCase();
    return penalty + (severityMap[normalizedFlag] || 3); // Default 3 points
  }, 0);
}

function calculateEngagement(activity: ReadinessInputs['recentActivity']): number {
  const { messageCount, sessionCount, goalCompletionRate } = activity;

  // Normalize to 1-10 scale
  const messageScore = Math.min(10, messageCount / 5); // 50 msgs = 10
  const sessionScore = Math.min(10, sessionCount * 2); // 5 sessions = 10
  const goalScore = goalCompletionRate * 10;

  return (messageScore * 0.3 + sessionScore * 0.3 + goalScore * 0.4);
}

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return 'OPTIMAL';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'MODERATE';
  if (score >= 45) return 'LOW';
  return 'POOR';
}
```

### Integration Example in Coach Dashboard API

```typescript
// src/app/api/coach/dashboard/route.ts (MODIFY)

const athletes = await prisma.athlete.findMany({
  where: {
    CoachAthlete: {
      some: { coachId: coach.userId }
    }
  },
  include: {
    moodLogs: {
      where: { createdAt: { gte: oneDayAgo } },
      orderBy: { createdAt: 'desc' },
      take: 1
    },
    chatSummaries: {
      where: {
        summaryType: 'WEEKLY',
        weekStart: { gte: oneWeekAgo },
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { weekStart: 'desc' },
      take: 1
    },
    chatSessions: {
      where: { createdAt: { gte: oneWeekAgo } }
    },
    goals: {
      where: { status: 'IN_PROGRESS' }
    }
  }
});

const athleteData = athletes.map(athlete => {
  const latestMoodLog = athlete.moodLogs[0];
  const latestWeeklySummary = athlete.chatSummaries[0];

  // Calculate readiness with enhanced algorithm
  const readiness = calculateReadinessScore({
    moodLog: latestMoodLog ? {
      mood: latestMoodLog.mood,
      stress: latestMoodLog.stress,
      confidence: latestMoodLog.confidence,
      sleepQuality: latestMoodLog.sleepQuality
    } : undefined,

    weeklySummary: latestWeeklySummary && athlete.consentChatSummaries ? {
      moodScore: latestWeeklySummary.moodScore!,
      stressScore: latestWeeklySummary.stressScore!,
      confidenceScore: latestWeeklySummary.confidenceScore!,
      sleepQualityScore: latestWeeklySummary.sleepQualityScore!,
      engagementScore: latestWeeklySummary.engagementScore!,
      sorenessScore: latestWeeklySummary.sorenessScore!,
      riskFlags: latestWeeklySummary.riskFlags
    } : undefined,

    recentActivity: {
      messageCount: athlete.chatSessions.reduce(
        (sum, s) => sum + (s.messageCount || 0), 0
      ),
      sessionCount: athlete.chatSessions.length,
      goalCompletionRate: calculateGoalCompletionRate(athlete.goals)
    }
  });

  return {
    ...athlete,
    readinessScore: readiness.score,
    readinessLevel: readiness.level,
    readinessConfidence: readiness.confidence,
    readinessSignals: readiness.signals,
    weeklySummary: athlete.consentChatSummaries ? latestWeeklySummary : null
  };
});
```

## Security Controls

### 1. Encryption (Field-Level)

```typescript
// src/lib/encryption.ts (NEW FILE)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.SUMMARY_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptField(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptField(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Apply to**:
- `adherenceNotes` (encrypted)
- `keyThemes` array elements (encrypted)
- `recommendedActions` array elements (encrypted)
- NOT applied to numeric scores (needed for queries)

### 2. Row-Level Security (RLS) Policies

```sql
-- Migration: prisma/migrations/add_weekly_summary_rls/migration.sql

-- Policy 1: Athletes can read their own summaries
CREATE POLICY athlete_read_own_summaries ON chat_summaries
  FOR SELECT
  USING (
    athlete_id = auth.uid()
  );

-- Policy 2: Coaches can read summaries ONLY if ALL conditions met:
CREATE POLICY coach_read_consented_summaries ON chat_summaries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM coach_athlete_relations car
      JOIN athletes a ON a.id = car.athlete_id
      JOIN coaches c ON c.id = car.coach_id
      WHERE c.user_id = auth.uid()
        AND car.athlete_id = chat_summaries.athlete_id
        AND car.consent_granted = true              -- Relationship consent
        AND a.consent_chat_summaries = true         -- Global consent
        AND a.school_id = c.school_id               -- Tenant boundary
        AND chat_summaries.revoked_at IS NULL       -- Not revoked
        AND (chat_summaries.expires_at IS NULL
             OR chat_summaries.expires_at > NOW())  -- Not expired
    )
  );

-- Policy 3: System (cron job) can INSERT weekly summaries
CREATE POLICY system_create_weekly_summaries ON chat_summaries
  FOR INSERT
  WITH CHECK (
    summary_type = 'WEEKLY'
    AND auth.uid() = 'system'
  );

-- Policy 4: Athletes can UPDATE (revoke) their summaries
CREATE POLICY athlete_revoke_summaries ON chat_summaries
  FOR UPDATE
  USING (athlete_id = auth.uid())
  WITH CHECK (
    -- Only allow updating revoked_at field
    (NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL)
  );
```

### 3. Audit Logging

```typescript
// src/lib/audit.ts (NEW FILE)

export enum AuditAction {
  VIEW_WEEKLY_SUMMARY = 'VIEW_WEEKLY_SUMMARY',
  GENERATE_WEEKLY_SUMMARY = 'GENERATE_WEEKLY_SUMMARY',
  CONSENT_UPDATE = 'CONSENT_UPDATE',
  REVOKE_SUMMARY = 'REVOKE_SUMMARY',
  DELETE_EXPIRED_SUMMARY = 'DELETE_EXPIRED_SUMMARY'
}

export async function logAudit(params: {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  athleteId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      userRole: await getUserRole(params.userId),
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      athleteId: params.athleteId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date()
    }
  });
}
```

**Log all**:
- Coach views summary → `VIEW_WEEKLY_SUMMARY` (with athleteId, coachId, timestamp, IP)
- Cron generates summary → `GENERATE_WEEKLY_SUMMARY` (with athleteId, sessionCount)
- Athlete updates consent → `CONSENT_UPDATE` (with new value)
- Athlete revokes access → `REVOKE_SUMMARY` (with athleteId)
- System deletes expired → `DELETE_EXPIRED_SUMMARY` (with count)

### 4. Data Retention Policy

```typescript
// src/app/api/cron/cleanup-summaries/route.ts (NEW FILE)

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();

  // Delete summaries that are:
  // 1. Expired (expiresAt < now)
  // 2. Revoked (revokedAt IS NOT NULL)
  // 3. Older than 12 weeks
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.chatSummary.deleteMany({
    where: {
      summaryType: 'WEEKLY',
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { not: null } },
        { createdAt: { lt: twelveWeeksAgo } }
      ]
    }
  });

  await logAudit({
    userId: 'system',
    action: AuditAction.DELETE_EXPIRED_SUMMARY,
    resourceType: 'chat_summaries',
    details: { deletedCount: deleted.count }
  });

  return NextResponse.json({ deleted: deleted.count });
}
```

**Vercel Cron Schedule** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-weekly-summaries",
      "schedule": "59 23 * * 0"
    },
    {
      "path": "/api/cron/cleanup-summaries",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Implementation Plan (Phased Milestones)

### Phase 0: Documentation + Schema Design (Week 1)

**Goal**: Design and validate all data structures before implementation.

**Tasks**:
- [ ] Finalize `ChatSummary` schema extension
- [ ] Write Prisma migration for new fields
- [ ] Create this comprehensive documentation file
- [ ] Design API endpoint specifications
- [ ] Create UI mockups for consent flow and summary display
- [ ] Review with team and stakeholders

**Files to Create**:
- `prisma/migrations/add_weekly_summary_fields/migration.sql`
- `docs/coach_weekly_chat_summaries.md` (this file)
- `docs/mockups/consent_flow.png`
- `docs/mockups/weekly_summary_ui.png`

**Files to Modify**:
- `prisma/schema.prisma` (extend ChatSummary model)

**Testing**:
- [ ] Validate schema with `npx prisma validate`
- [ ] Test migration on dev database
- [ ] Verify backward compatibility with existing ChatSummary records

**Git Workflow**:
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-weekly-chat-summaries
# Make schema changes
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: extend ChatSummary model for weekly aggregation"
# Create documentation
git add docs/coach_weekly_chat_summaries.md
git commit -m "docs: add weekly summary feature specification"
git push -u origin feature/coach-weekly-chat-summaries
```

---

### Phase 1: Storage + Consent + Weekly Aggregation (Week 2-3)

**Goal**: Build core backend infrastructure for summary generation and storage.

**Tasks**:
- [ ] Implement athlete consent API endpoint
- [ ] Build weekly summarizer logic (AI aggregation)
- [ ] Create cron job for automated weekly generation
- [ ] Add RLS policies for ChatSummary table
- [ ] Implement encryption utilities
- [ ] Implement audit logging utilities
- [ ] Add data retention cleanup job

**Files to Create**:
- `src/app/api/athlete/consent/route.ts` - Consent management endpoint
- `src/app/api/cron/generate-weekly-summaries/route.ts` - Weekly aggregation
- `src/app/api/cron/cleanup-summaries/route.ts` - Retention cleanup
- `src/lib/summarizer.ts` - AI summarization logic
- `src/lib/encryption.ts` - Field encryption utilities
- `src/lib/audit.ts` - Audit logging helpers
- `prisma/migrations/add_weekly_summary_rls/migration.sql` - RLS policies

**Files to Modify**:
- `.env.example` (add `CRON_SECRET`, `SUMMARY_ENCRYPTION_KEY`)
- `vercel.json` (add cron job schedules)

**Testing**:
- [ ] Unit test: `summarizer.ts` with mock session data
- [ ] Unit test: Encryption/decryption utilities
- [ ] Integration test: End-to-end cron job execution
- [ ] Privacy test: Verify no raw chat content in summaries
- [ ] Consent test: Revoke consent, verify summaries marked as revoked
- [ ] API test: Consent update endpoint (enable/disable)

**Git Workflow**:
```bash
git add src/lib/summarizer.ts src/lib/encryption.ts src/lib/audit.ts
git commit -m "feat: add weekly summary generation logic"

git add src/app/api/cron/generate-weekly-summaries/
git commit -m "feat: add cron job for weekly summary aggregation"

git add src/app/api/athlete/consent/
git commit -m "feat: add athlete consent management endpoint"

git add prisma/migrations/add_weekly_summary_rls/
git commit -m "feat: add row-level security for weekly summaries"
```

---

### Phase 2: Coach UI Integration (Week 4)

**Goal**: Surface weekly summaries in coach dashboard with full privacy controls.

**Tasks**:
- [ ] Create `WeeklySummaryDrawer` component
- [ ] Modify `AthleteCard` to show summary section
- [ ] Build `/api/coach/weekly-summaries` endpoint
- [ ] Add audit logging to all coach views
- [ ] Implement consent indicator in UI
- [ ] Add "no consent" state messaging
- [ ] Create athlete consent settings modal

**Files to Create**:
- `src/components/coach/WeeklySummaryDrawer.tsx` - Expandable summary view
- `src/components/athlete/ConsentSettingsModal.tsx` - Athlete consent UI
- `src/app/api/coach/weekly-summaries/route.ts` - Fetch summaries endpoint

**Files to Modify**:
- `src/components/coach/roster/AthleteCard.tsx` - Add summary section
- `src/app/api/coach/dashboard/route.ts` - Include summary in response
- `src/types/coach-portal.ts` - Add WeeklySummary types

**Testing**:
- [ ] E2E test: Coach views summary for consented athlete
- [ ] E2E test: Coach cannot view summary without consent
- [ ] E2E test: Tenant boundary check (different schools)
- [ ] UI test: Verify "consent not granted" message
- [ ] UI test: Verify expand/collapse behavior
- [ ] Audit test: Verify all coach views logged with IP/timestamp

**Git Workflow**:
```bash
git add src/components/coach/WeeklySummaryDrawer.tsx
git commit -m "feat: add weekly summary drawer component"

git add src/components/coach/roster/AthleteCard.tsx
git commit -m "feat: integrate weekly summary into athlete card"

git add src/app/api/coach/weekly-summaries/
git commit -m "feat: add coach weekly summaries API endpoint"
```

---

### Phase 3: Readiness Score Integration (Week 5)

**Goal**: Feed weekly summary signals into readiness algorithm.

**Tasks**:
- [ ] Create `readiness-score.ts` with enhanced algorithm
- [ ] Modify coach dashboard API to use new calculation
- [ ] Add confidence score to readiness display
- [ ] Implement risk flag penalty logic
- [ ] Create signal breakdown UI component
- [ ] Add unit tests for blending logic

**Files to Create**:
- `src/lib/readiness-score.ts` - Enhanced readiness calculation
- `src/components/coach/ReadinessBreakdown.tsx` - Signal details view

**Files to Modify**:
- `src/app/api/coach/dashboard/route.ts` - Use enhanced readiness calc
- `src/components/coach/roster/AthleteCard.tsx` - Show confidence score
- `src/types/coach-portal.ts` - Add ReadinessInputs/Output types

**Testing**:
- [ ] Unit test: Readiness score with only MoodLog
- [ ] Unit test: Readiness score with only WeeklySummary
- [ ] Unit test: Readiness score with both (blending)
- [ ] Unit test: Risk flag penalty calculation
- [ ] Integration test: End-to-end readiness calculation
- [ ] Regression test: Ensure backward compatibility (no summary = works)

**Git Workflow**:
```bash
git add src/lib/readiness-score.ts
git commit -m "feat: add enhanced readiness score algorithm"

git add src/app/api/coach/dashboard/route.ts
git commit -m "feat: integrate weekly summary signals into readiness"

git add src/components/coach/ReadinessBreakdown.tsx
git commit -m "feat: add readiness signal breakdown component"
```

---

### Phase 4: Monitoring + Audits + Production Hardening (Week 6)

**Goal**: Production-ready with monitoring, compliance, and incident response.

**Tasks**:
- [ ] Set up cron job monitoring (alerts on failure)
- [ ] Create admin audit dashboard
- [ ] Implement data retention verification
- [ ] Add metrics: summary generation rate, coach view rate
- [ ] Write privacy incident response runbook
- [ ] Load testing (100+ athletes)
- [ ] Security audit and penetration testing
- [ ] Documentation for support team

**Files to Create**:
- `src/app/(admin)/audit-logs/page.tsx` - Admin audit dashboard
- `docs/PRIVACY_INCIDENT_RUNBOOK.md` - Incident response procedures
- `docs/WEEKLY_SUMMARY_SUPPORT.md` - Support team guide

**Files to Modify**:
- `src/app/api/cron/generate-weekly-summaries/route.ts` - Add monitoring
- `src/app/api/cron/cleanup-summaries/route.ts` - Add monitoring

**Testing**:
- [ ] Load test: 100+ athletes, weekly summary generation time
- [ ] Load test: 50+ concurrent coach dashboard loads
- [ ] Security test: Attempt to access summary without consent (should fail)
- [ ] Security test: Cross-tenant access attempt (should fail)
- [ ] Retention test: Verify summaries deleted after 12 weeks
- [ ] Retention test: Verify revoked summaries deleted immediately
- [ ] Audit test: Generate compliance report for last 30 days

**Git Workflow**:
```bash
git add src/app/(admin)/audit-logs/
git commit -m "feat: add admin audit log dashboard"

git add docs/PRIVACY_INCIDENT_RUNBOOK.md
git commit -m "docs: add privacy incident response runbook"

# Final cleanup and testing
git add .
git commit -m "chore: add monitoring and production hardening"

# Create PR
gh pr create --title "feat: Weekly Chat Summaries for Coaches" \
  --body "Implements privacy-first weekly chat summaries with consent, encryption, and readiness integration. See docs/coach_weekly_chat_summaries.md for full specification."
```

---

## Testing Plan

### Unit Tests

**File**: `tests/lib/summarizer.test.ts`

```typescript
describe('generateWeeklySummary', () => {
  it('should extract average scores from message metadata', async () => {
    const mockSessions = [
      {
        id: '1',
        messages: [
          { role: 'assistant', metadata: { mood_score: 8, stress_score: 4 } },
          { role: 'assistant', metadata: { mood_score: 7, stress_score: 5 } }
        ]
      }
    ];

    const summary = await generateWeeklySummary({
      athleteId: 'athlete1',
      weekStart: new Date('2024-01-01'),
      weekEnd: new Date('2024-01-07'),
      sessions: mockSessions
    });

    expect(summary.moodScore).toBe(7.5);
    expect(summary.stressScore).toBe(4.5);
  });

  it('should NOT include raw chat content in summary', async () => {
    const summary = await generateWeeklySummary({ /* ... */ });

    expect(summary).not.toHaveProperty('rawMessages');
    expect(summary).not.toHaveProperty('chatTranscript');
    expect(summary).not.toHaveProperty('messageContent');
  });

  it('should handle empty session data gracefully', async () => {
    const summary = await generateWeeklySummary({
      athleteId: 'athlete1',
      weekStart: new Date(),
      weekEnd: new Date(),
      sessions: []
    });

    expect(summary.moodScore).toBe(null);
    expect(summary.sessionCount).toBe(0);
  });
});
```

**File**: `tests/lib/readiness-score.test.ts`

```typescript
describe('calculateReadinessScore', () => {
  it('should use 70% MoodLog + 30% WeeklySummary when both exist', () => {
    const result = calculateReadinessScore({
      moodLog: { mood: 8, stress: 4, confidence: 9, sleepQuality: 7 },
      weeklySummary: { moodScore: 6, stressScore: 6, confidenceScore: 6, sleepQualityScore: 6, engagementScore: 8, sorenessScore: 2, riskFlags: [] },
      recentActivity: { messageCount: 30, sessionCount: 4, goalCompletionRate: 0.8 }
    });

    // mood should be: 8 * 0.7 + 6 * 0.3 = 7.4
    expect(result.signals.mood.value).toBeCloseTo(7.4, 1);
    expect(result.confidence).toBeGreaterThan(0.7); // High confidence with both sources
  });

  it('should apply risk penalties correctly', () => {
    const withRisks = calculateReadinessScore({
      moodLog: { mood: 8, stress: 5, confidence: 8, sleepQuality: 7 },
      weeklySummary: {
        moodScore: 7, stressScore: 6, confidenceScore: 8, sleepQualityScore: 6,
        engagementScore: 8, sorenessScore: 0,
        riskFlags: ['elevated stress', 'sleep disruption'] // -5 and -8 points
      },
      recentActivity: { messageCount: 30, sessionCount: 4, goalCompletionRate: 0.8 }
    });

    const withoutRisks = calculateReadinessScore({
      moodLog: { mood: 8, stress: 5, confidence: 8, sleepQuality: 7 },
      weeklySummary: {
        moodScore: 7, stressScore: 6, confidenceScore: 8, sleepQualityScore: 6,
        engagementScore: 8, sorenessScore: 0,
        riskFlags: []
      },
      recentActivity: { messageCount: 30, sessionCount: 4, goalCompletionRate: 0.8 }
    });

    expect(withRisks.score).toBe(withoutRisks.score - 13); // -5 + -8 = -13
  });
});
```

### Integration Tests

**File**: `tests/api/coach/weekly-summaries.test.ts`

```typescript
describe('GET /api/coach/weekly-summaries', () => {
  it('should return summary for consented athlete', async () => {
    const athlete = await createTestAthlete({ consentChatSummaries: true });
    const coach = await createTestCoach({ schoolId: athlete.schoolId });
    await createCoachAthleteRelation({
      coachId: coach.userId,
      athleteId: athlete.userId,
      consentGranted: true
    });

    const summary = await createWeeklySummary({ athleteId: athlete.userId });

    const response = await fetch(
      `/api/coach/weekly-summaries?athleteId=${athlete.userId}&weekStart=${summary.weekStart}`,
      { headers: { Authorization: `Bearer ${coachToken}` } }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.summary.id).toBe(summary.id);
  });

  it('should return 403 if athlete has not granted consent', async () => {
    const athlete = await createTestAthlete({ consentChatSummaries: false });
    const coach = await createTestCoach({ schoolId: athlete.schoolId });

    const response = await fetch(`/api/coach/weekly-summaries?athleteId=${athlete.userId}`, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'Chat summaries not enabled' });
  });

  it('should log audit trail when coach views summary', async () => {
    // ... test setup

    await fetch(`/api/coach/weekly-summaries?athleteId=${athlete.userId}`, { /* ... */ });

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'VIEW_WEEKLY_SUMMARY',
        userId: coach.userId,
        athleteId: athlete.userId
      }
    });

    expect(auditLog).toBeTruthy();
    expect(auditLog?.ipAddress).toBeTruthy();
    expect(auditLog?.timestamp).toBeInstanceOf(Date);
  });

  it('should prevent cross-tenant access', async () => {
    const schoolA = await createTestSchool();
    const schoolB = await createTestSchool();

    const athleteA = await createTestAthlete({ schoolId: schoolA.id, consentChatSummaries: true });
    const coachB = await createTestCoach({ schoolId: schoolB.id });

    const response = await fetch(`/api/coach/weekly-summaries?athleteId=${athleteA.userId}`, {
      headers: { Authorization: `Bearer ${coachBToken}` }
    });

    expect(response.status).toBe(403);
  });
});
```

### Privacy Tests

**File**: `tests/privacy/consent-enforcement.test.ts`

```typescript
describe('Consent Enforcement', () => {
  it('should mark summaries as revoked when consent withdrawn', async () => {
    const athlete = await createTestAthlete({ consentChatSummaries: true });
    const summary = await createWeeklySummary({ athleteId: athlete.userId });

    // Revoke consent
    await fetch('/api/athlete/consent', {
      method: 'PUT',
      body: JSON.stringify({ consentChatSummaries: false }),
      headers: { Authorization: `Bearer ${athleteToken}` }
    });

    const updatedSummary = await prisma.chatSummary.findUnique({
      where: { id: summary.id }
    });

    expect(updatedSummary?.revokedAt).toBeTruthy();
    expect(updatedSummary?.expiresAt).toBeTruthy();
    expect(updatedSummary?.expiresAt).toBeLessThanOrEqual(new Date());
  });

  it('should delete revoked summaries in cleanup job', async () => {
    const summary = await createWeeklySummary({
      revokedAt: new Date(),
      expiresAt: new Date()
    });

    // Run cleanup
    await fetch('/api/cron/cleanup-summaries', {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
    });

    const deletedSummary = await prisma.chatSummary.findUnique({
      where: { id: summary.id }
    });

    expect(deletedSummary).toBeNull();
  });
});
```

### Security Tests

**File**: `tests/security/encryption.test.ts`

```typescript
describe('Encryption', () => {
  it('should encrypt/decrypt sensitive fields correctly', () => {
    const original = 'Athlete struggling with anxiety about upcoming game';
    const encrypted = encryptField(original);
    const decrypted = decryptField(encrypted);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/); // iv:authTag:encrypted
    expect(decrypted).toBe(original);
  });

  it('should use unique IVs for each encryption', () => {
    const text = 'Same text';
    const encrypted1 = encryptField(text);
    const encrypted2 = encryptField(text);

    expect(encrypted1).not.toBe(encrypted2); // Different IVs
    expect(decryptField(encrypted1)).toBe(decryptField(encrypted2)); // Same plaintext
  });
});
```

---

## Critical Files Reference

### 1. Database Schema
**File**: `apps/web/prisma/schema.prisma`
**Action**: MODIFY - Extend ChatSummary model with weekly aggregation fields

### 2. Weekly Summarizer
**File**: `apps/web/src/lib/summarizer.ts`
**Action**: CREATE - AI summarization logic that extracts metadata and generates structured output

### 3. Cron Job (Generation)
**File**: `apps/web/src/app/api/cron/generate-weekly-summaries/route.ts`
**Action**: CREATE - Automated weekly aggregation job

### 4. Cron Job (Cleanup)
**File**: `apps/web/src/app/api/cron/cleanup-summaries/route.ts`
**Action**: CREATE - Data retention cleanup job

### 5. Readiness Score Algorithm
**File**: `apps/web/src/lib/readiness-score.ts`
**Action**: CREATE - Enhanced readiness calculation with weekly summary integration

### 6. Coach API Endpoint
**File**: `apps/web/src/app/api/coach/weekly-summaries/route.ts`
**Action**: CREATE - Fetch weekly summaries with privacy gates

### 7. Athlete Card UI
**File**: `apps/web/src/components/coach/roster/AthleteCard.tsx`
**Action**: MODIFY - Add weekly summary section

### 8. Weekly Summary Component
**File**: `apps/web/src/components/coach/WeeklySummaryDrawer.tsx`
**Action**: CREATE - Expandable summary view

### 9. Consent Endpoint
**File**: `apps/web/src/app/api/athlete/consent/route.ts`
**Action**: MODIFY - Handle chat summary consent updates

### 10. Encryption Utilities
**File**: `apps/web/src/lib/encryption.ts`
**Action**: CREATE - Field-level encryption for sensitive data

---

## Summary

This implementation plan provides a **privacy-first, consent-driven weekly chat summary system** that:

✅ Requires explicit athlete opt-in (default OFF)
✅ Enforces multi-layer consent checks (athlete + relationship + tenant)
✅ Never exposes raw chat content to coaches
✅ Uses structured AI-derived signals for readiness scoring
✅ Encrypts sensitive qualitative fields at rest
✅ Logs all data access for compliance
✅ Implements 12-week data retention with revocation support
✅ Provides clear UI for consent management and summary display
✅ Integrates cleanly with existing infrastructure

The phased approach ensures incremental delivery with validation at each step, minimizing risk while building production-ready functionality.
