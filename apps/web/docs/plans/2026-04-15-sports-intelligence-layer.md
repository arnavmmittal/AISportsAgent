# Sports Intelligence Layer — Expert Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Flow Coach from a data dashboard into an actionable sports intelligence platform by (1) making AI insights visually dominant, (2) building a comprehensive multi-source readiness model, and (3) redesigning mood logs for D1 athletic performance optimization.

**Architecture:** Three interconnected upgrades — a dual-source readiness engine that blends MoodLog + ChatSummary data, a visual insight system replacing text lists with scatterplots/heatmaps/priority cards, and a D1-optimized subjective monitoring form with RPE, soreness mapping, and context tags.

**Tech Stack:** Prisma schema changes, Next.js API routes, React visualization components (SVG-based, no framer-motion), existing analytics pipeline integration.

---

## Background: Sports Analytics Expert Assessment

### What D1 Programs Actually Need

Having assessed the current system from the perspective of a sports analytics and sports psychology professional:

1. **Readiness scores are incomplete.** The current formula uses only MoodLog data (mood, stress, confidence, sleep hours, engagement). Meanwhile, ChatSummary — the primary athlete touchpoint — extracts moodScore, stressScore, sleepQualityScore, confidenceScore, sorenessScore, engagementScore, and riskFlags. None of this flows into readiness. This is like having a GPS tracker on every athlete but only reading the pedometer.

2. **Insights are invisible.** Seven insight components exist (InsightCard, ChatInsightsPanel, IndividualInsights, PatternDetection, TeamSummaries, PredictionsForecasts, InterventionQueue) but all render as text lists inside uniform cards. Correlation coefficients, pattern detections, and intervention results get the same visual weight as "3 athletes checked in today." A head coach glancing at their phone between film sessions can't extract signal from noise.

3. **Mood logs miss critical D1 metrics.** No RPE (Rate of Perceived Exertion), no muscle soreness tracking, no sleep quality (only hours), no context tags. The `energy` field correlates >0.85 with mood+sleep in sports literature — it's friction without signal. Meanwhile, the notes field (freeform text) gets ~5% completion rates in D1 programs because athletes won't type paragraphs on their phones.

---

## Area 1: Comprehensive Readiness Score

### Task 1: Schema — Add MoodLog Physical Fields

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Changes:**
```prisma
model MoodLog {
  // EXISTING fields stay
  mood          Float
  stress        Float
  confidence    Float?       // Make nullable — only prompt during game week

  // RENAME for clarity
  sleepHours    Float?       // Was: sleep (ambiguous)
  sleepQuality  Float?       // NEW: 1-10 subjective quality

  // NEW physical readiness fields
  soreness      Float?       // 1-10 overall body soreness
  sorenessMap   Json?        // { "shoulder": 7, "knee": 4, "hamstring": 8 }
  rpe           Float?       // 1-10 Borg scale, post-session

  // NEW context
  tags          String[]     // ["Travel", "Exam Week", "Pre-Game", "Injury Recovery"]

  // REMOVE: energy (redundant with mood + sleep, r > 0.85)
  // Keep energy column for backward compat but stop collecting
}
```

**Migration notes:**
- `sleep` → `sleepHours` rename via Prisma `@map("sleep")` to avoid data loss
- Add columns as nullable — no breaking change
- `energy` field kept in schema but removed from UI forms
- Run: `npx prisma migrate dev --name add-physical-readiness-fields`

**Step 1:** Update schema.prisma with new fields
**Step 2:** Generate migration
**Step 3:** Update Prisma client generation
**Step 4:** Verify with `npx prisma studio`

---

### Task 2: Dual-Source Readiness Calculator

**Files:**
- Modify: `packages/analytics/src/readiness/calculator.ts`
- Create: `packages/analytics/src/readiness/chat-readiness-bridge.ts`

**The Formula:**

```typescript
// READINESS = (0.7 × DailySignal) + (0.3 × WeeklyTrend) - RiskPenalty

interface ReadinessInputs {
  moodLog?: {
    mood: number;          // 1-10
    stress: number;        // 1-10
    confidence?: number;   // 1-10, nullable
    sleepQuality?: number; // 1-10, new
    sleepHours?: number;   // hours
    soreness?: number;     // 1-10, new
    rpe?: number;          // 1-10, new
  };
  chatSummary?: {
    moodScore: number;
    stressScore: number;
    confidenceScore: number;
    sleepQualityScore: number;
    sorenessScore: number;
    engagementScore: number;
    riskFlags: string[];
    sentiment: string;     // "positive" | "neutral" | "negative"
  };
  previousDayScore?: number;
}

function computeDailySignal(inputs: ReadinessInputs): number {
  const { moodLog, chatSummary } = inputs;

  // Source blending: 40% chat (richer, passive) + 60% self-report (intentional)
  // Falls back to single source if only one available
  const hasBoth = moodLog && chatSummary;
  const chatWeight = hasBoth ? 0.4 : (chatSummary ? 1.0 : 0);
  const logWeight = hasBoth ? 0.6 : (moodLog ? 1.0 : 0);

  // Dimension weights (must sum to 1.0)
  const WEIGHTS = {
    mood:       0.25,
    stress:     0.20,  // inverted: 10 - stress
    sleep:      0.20,  // quality, not just hours
    confidence: 0.15,
    physical:   0.10,  // soreness inverted + RPE inverted
    engagement: 0.10,
  };

  // ... merge each dimension using chatWeight/logWeight ...
  // Score = sum of (dimension_value * dimension_weight) * 10
  // Clamp to 0-100
}

function computeRiskPenalty(chatSummary?: ChatSummary): number {
  if (!chatSummary) return 0;
  let penalty = 0;

  if (chatSummary.riskFlags?.includes('crisis'))        penalty += 30;
  if (chatSummary.riskFlags?.includes('self_harm'))     penalty += 30;
  if (chatSummary.sentiment === 'negative' /* 3+ consecutive */) penalty += 15;
  if (chatSummary.sleepQualityScore < 4)                penalty += 10;
  if (chatSummary.riskFlags?.includes('avoidance'))     penalty += 10;

  return Math.min(penalty, 50); // Cap at -50
}
```

**Why 40/60 chat/self-report blend?**
- Chat captures what athletes reveal *naturally* (often more honest than forms)
- Self-report is a deliberate act of self-awareness — the reflective act itself has therapeutic value in sports psych
- If an athlete says "I'm fine" on the form but discusses sleep problems in chat, the blend catches it

**Step 1:** Create `chat-readiness-bridge.ts` that fetches latest ChatSummary scores for an athlete
**Step 2:** Modify `calculator.ts` to accept dual inputs
**Step 3:** Update the readiness API route to pass ChatSummary data
**Step 4:** Write tests for: both sources, chat-only, log-only, neither (decay), risk penalties
**Step 5:** Verify readiness scores change when chat data is present

---

### Task 3: Sleep Data Normalization

**Files:**
- Create: `packages/analytics/src/readiness/normalizers.ts`

**Problem:** MoodLog.sleep = hours (0-12), ChatSummary.sleepQualityScore = quality (1-10), new MoodLog.sleepQuality = quality (1-10). Need consistent 1-10 scale.

```typescript
function normalizeSleepHoursToQuality(hours: number): number {
  // Based on NCAA sleep research: 7-9 hours optimal for D1 athletes
  if (hours >= 7 && hours <= 9) return 8 + (hours - 7) * 0.5; // 8-9
  if (hours >= 6) return 5 + (hours - 6) * 3;                  // 5-8
  if (hours >= 5) return 3 + (hours - 5) * 2;                  // 3-5
  return Math.max(1, hours);                                     // 1-3
}

function mergeScore(
  logValue: number | undefined,
  chatValue: number | undefined,
  logWeight: number,
  chatWeight: number,
): number {
  if (logValue !== undefined && chatValue !== undefined) {
    return logValue * logWeight + chatValue * chatWeight;
  }
  return logValue ?? chatValue ?? 5; // 5 = neutral default
}
```

**Step 1:** Create normalizers with unit tests
**Step 2:** Integrate into readiness calculator

---

## Area 2: AI Insights Visibility

### Task 4: Correlation Scatterplot Component

**Files:**
- Create: `apps/web/src/components/shared/viz/CorrelationScatter.tsx`

**Purpose:** Replace text-only correlation insights with interactive inline scatterplots.

```
┌─────────────────────────────────────┐
│  Sleep Quality → Game Confidence    │
│  r = 0.73  ●●●●○  Strong           │
│                                     │
│  8│       ●  ●●                     │
│  6│    ● ●● ●                       │
│  4│  ●  ●                           │
│  2│●                                │
│   └──────────────                   │
│    2   4   6   8  Sleep             │
│                                     │
│  💡 Athletes sleeping >7hr score    │
│     23% higher confidence           │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface CorrelationScatterProps {
  xLabel: string;
  yLabel: string;
  points: { x: number; y: number; name: string; tier: 'GREEN' | 'YELLOW' | 'RED' }[];
  correlation: number;        // -1 to 1
  insight?: string;           // auto-generated actionable takeaway
  width?: number;
  height?: number;
}
```

**Key details:**
- Pure SVG, no external charting library
- Points colored by athlete tier (uses design token colors)
- Least-squares trendline overlay
- Correlation strength indicator (●●●●○ = strong)
- CSS transition on mount (no framer-motion — iPad compatibility)
- Responsive: scales to container width

**Step 1:** Build CorrelationScatter with SVG scatter + trendline
**Step 2:** Add tooltip on hover (athlete name + values)
**Step 3:** Add correlation strength badge
**Step 4:** Test with mock data, verify iPad Safari

---

### Task 5: Team Pulse Heatmap (Week-over-Week)

**Files:**
- Create: `apps/web/src/components/shared/viz/TeamPulseHeatmap.tsx`

**Purpose:** Replace athlete readiness table with a dense week-over-week heatmap showing patterns at a glance.

```
          Mon  Tue  Wed  Thu  Fri  Sat  Sun
Player1   [█]  [█]  [▓]  [▓]  [█]  [░]  [█]
Player2   [░]  [░]  [▓]  [▓]  [░]  [░]  [░]  ← declining
Player3   [█]  [█]  [█]  [█]  [█]  [█]  [█]
```

**Props:**
```typescript
interface TeamPulseHeatmapProps {
  athletes: {
    id: string;
    name: string;
    dailyScores: { date: string; score: number; level: 'GREEN' | 'YELLOW' | 'RED' }[];
    trend: number[];
  }[];
  weeks?: number;            // default 2
  onAthleteClick?: (id: string) => void;
}
```

**Key details:**
- Grid of colored cells (green/amber/red opacity mapped to score)
- Row-level Sparkline on right edge
- Click row → navigate to individual athlete view
- Sort by: worst first (default), best first, alphabetical
- Responsive: horizontal scroll on mobile for >7 columns
- Missing days shown as gray/hatched (not zero)

**Step 1:** Build heatmap grid with SVG rects
**Step 2:** Add row sparklines
**Step 3:** Add sort controls
**Step 4:** Add click-to-drill interaction

---

### Task 6: Insight Priority Cards (Visual Tiers)

**Files:**
- Modify: `apps/web/src/components/coach/insights/InsightCard.tsx`
- Create: `apps/web/src/components/coach/insights/AlertInsightCard.tsx`
- Create: `apps/web/src/components/coach/insights/TrendInsightCard.tsx`

**Purpose:** Replace uniform InsightCards with three visual tiers based on urgency.

**Tier 1: Alert Card** (needs action today)
- Red left border + subtle pulse animation
- Shows: athlete name, critical metric, recommended action
- One-tap "Intervene" button → opens intervention flow
- Auto-surfaces: crisis flags, readiness drops >15 points, 3+ day inactivity

**Tier 2: Trend Card** (pattern emerging, watch this week)
- Amber left border + inline Sparkline
- Shows: metric trend, affected athletes count, correlation if found
- Auto-surfaces: declining trends (z-score > 1.5), emerging patterns, pre-game stress

**Tier 3: Info Card** (FYI for coaching strategy)
- Subtle border, low visual weight
- Shows: finding text, confidence level, link to deeper data
- Auto-surfaces: positive trends, team-level observations, weekly summaries

**Key detail:** The existing analytics pipeline (`packages/analytics/src/patterns/`) already computes severity. Map `severity: 'high'` → Alert, `severity: 'medium'` → Trend, `severity: 'low'` → Info.

**Step 1:** Create AlertInsightCard with pulse animation and action button
**Step 2:** Create TrendInsightCard with embedded Sparkline
**Step 3:** Modify InsightCard to auto-select tier based on severity
**Step 4:** Update insight list components to render in priority order (alerts first)

---

### Task 7: Intervention Effectiveness Tracker

**Files:**
- Create: `apps/web/src/components/coach/insights/InterventionTracker.tsx`

**Purpose:** The analytics system already runs N-of-1 effectiveness trials but results only render as text. Add visual progress bars.

```
┌─────────────────────────────────────┐
│  "Breathing exercises" for Alex     │
│  ████████░░  +18% stress reduction  │
│  Week 1→3: trending effective ✓     │
│  [Continue] [Modify] [Stop]         │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface InterventionTrackerProps {
  interventions: {
    id: string;
    athleteName: string;
    type: string;
    metric: string;
    baselineValue: number;
    currentValue: number;
    percentChange: number;
    trend: 'improving' | 'stable' | 'declining';
    weeksActive: number;
    dataPoints: number[];
  }[];
  onAction?: (id: string, action: 'continue' | 'modify' | 'stop') => void;
}
```

**Step 1:** Build tracker card with progress bar + Sparkline
**Step 2:** Add action buttons (continue/modify/stop)
**Step 3:** Connect to existing intervention data from analytics pipeline

---

### Task 8: Dashboard Integration — Insights-First Layout

**Files:**
- Modify: `apps/web/src/components/coach/EnhancedDashboard.tsx`
- Modify: `apps/web/src/components/coach/dashboard/CoachDashboard.tsx`

**Purpose:** Restructure dashboard so AI insights are the *first* thing coaches see, not buried below athlete lists.

**New layout order:**
1. **Weekly Pulse Card** (existing — already at top, keep)
2. **Alert Cards** (NEW — red-tier insights, 0-3 cards max)
3. **Correlation Spotlight** (NEW — top 2 strongest correlations as scatterplots)
4. **Team Pulse Heatmap** (NEW — replaces or supplements readiness table)
5. **Trend Cards** (NEW — amber-tier emerging patterns)
6. **Athlete Readiness Grid** (existing — moved lower, still accessible)
7. **Intervention Tracker** (NEW — active interventions with effectiveness)
8. **Info Insights** (existing InsightCards — lowest priority)

**Key detail:** This is a layout reorder + component insertion, not a rewrite. Existing components stay; new components slot in above them.

**Step 1:** Add Alert section at top of dashboard
**Step 2:** Add Correlation Spotlight section (2 scatterplots side by side)
**Step 3:** Add TeamPulseHeatmap section
**Step 4:** Move existing readiness grid below new components
**Step 5:** Add InterventionTracker section

---

## Area 3: D1-Optimized Mood Logs

### Task 9: Mood Log Form Redesign — Student Side

**Files:**
- Modify: `apps/web/src/components/student/mood/MoodLogForm.tsx` (or equivalent)
- Create: `apps/web/src/components/shared/ui/EmojiSlider.tsx`
- Create: `apps/web/src/components/shared/ui/ContextTags.tsx`

**Target:** 30-second completion, 7 fields max, zero typing required.

**Form layout (mobile-first):**
```
┌─────────────────────────────────────┐
│  How are you feeling?               │
│  😞 ─────●───── 😊                  │
│                                     │
│  Stress level                       │
│  🟢 ─────────●─ 🔴                  │
│                                     │
│  Sleep quality last night           │
│  🌑 ───●─────── 🌕                  │
│                                     │
│  Body soreness                      │
│  [Tap areas]  Overall: ───●──── 7   │
│                                     │
│  What's going on? (tap all that fit)│
│  [Travel] [Exam Week] [Pre-Game]    │
│  [Injury] [Personal] [Great Day]    │
│                                     │
│  [Submit ✓]                         │
└─────────────────────────────────────┘
```

**Conditional fields (not always shown):**
- **Confidence:** Only during game week (coach-configurable game schedule)
- **RPE:** Auto-prompted after practice/game window (e.g., 4-8 PM)

**EmojiSlider component:**
- Native range input styled with emoji endpoints
- Haptic feedback on iOS (via `navigator.vibrate` where available)
- Shows numeric value on thumb
- 44px minimum touch target

**ContextTags component:**
- Pill-shaped toggle chips, multi-select
- 8-12 predefined tags (coach can customize per sport)
- Replaces freeform notes textarea
- Tags are stored as `String[]` — queryable and correlatable

**Step 1:** Create EmojiSlider component
**Step 2:** Create ContextTags component
**Step 3:** Redesign MoodLogForm with new layout
**Step 4:** Update form submission to include new fields
**Step 5:** Test on mobile viewport (375px)

---

### Task 10: Mood Log API Updates

**Files:**
- Modify: `apps/web/src/app/api/mood/route.ts` (or equivalent mood submission endpoint)
- Modify: Zod validation schemas

**Changes:**
- Accept new fields: `sleepQuality`, `soreness`, `sorenessMap`, `rpe`, `tags`
- Make `confidence` optional (only required during game week)
- Make `energy` deprecated (accept but don't require)
- `sleepHours` stays optional
- Validate: all numeric fields 1-10, tags from allowed list

**Step 1:** Update Zod schema
**Step 2:** Update API route handler
**Step 3:** Test submission with new fields

---

### Task 11: Context Tag Correlation Pipeline

**Files:**
- Modify: `packages/analytics/src/patterns/detector.ts` (or equivalent)

**Purpose:** Make context tags queryable for pattern detection. Example insights:
- "Athletes tagged [Travel] show 22% lower readiness the next day"
- "Players who tag [Exam Week] have 3× higher stress scores"
- "[Pre-Game] + sleep < 6hr → readiness drops 31% on average"

**Implementation:**
- Group MoodLogs by tag
- Compute mean readiness delta for each tag vs. no-tag baseline
- Surface top 3 tag correlations as Trend insights
- Include in correlation scatter data (tag as category variable)

**Step 1:** Add tag-based grouping to pattern detector
**Step 2:** Compute tag ↔ readiness correlations
**Step 3:** Surface as insight cards on dashboard

---

## Implementation Sequence

```
Task 1 (Schema) → Task 2 (Calculator) → Task 3 (Normalizers)
                                              ↓
Task 9 (Form UI) → Task 10 (API) ──────→ Task 11 (Tag Correlations)
                                              ↓
Task 4 (Scatterplot) ─┐                      ↓
Task 5 (Heatmap) ─────┼→ Task 8 (Dashboard Layout)
Task 6 (Priority Cards)┤
Task 7 (Intervention) ─┘
```

**Parallelizable groups:**
- Group A: Tasks 1-3 (readiness model)
- Group B: Tasks 4-7 (visualization components — independent of each other)
- Group C: Tasks 9-10 (mood log form)
- Sequencing: Task 1 before Task 2, Task 2 before Task 3, all groups before Task 8, Task 10 before Task 11

---

## Verification Plan

1. **Readiness accuracy:** Create test athlete with both MoodLog and ChatSummary data → verify blended score differs from log-only score → verify risk penalty applies for crisis flags
2. **Insight visibility:** Dashboard shows Alert cards above athlete list → scatterplots render with real correlation data → priority ordering correct
3. **Mood form speed:** Complete full form (all 7 fields) in under 30 seconds on mobile viewport
4. **Tag correlations:** Submit 10+ mood logs with [Travel] tag → verify pattern detector surfaces travel correlation
5. **iPad Safari:** All new SVG components (scatterplot, heatmap) render correctly — no framer-motion
6. **Dark mode:** All new components use design tokens, not hardcoded colors
7. **Build:** `pnpm build` passes with no errors
8. **Backward compatibility:** Athletes with old-format MoodLogs (sleep as hours, no soreness) still get valid readiness scores

---

## Expert Rationale

### Why These Three Changes Together?

These aren't independent improvements — they form a **closed intelligence loop**:

1. **Better inputs** (D1-optimized mood logs with RPE, soreness, context tags) produce...
2. **Better readiness scores** (dual-source model incorporating chat + enhanced self-report) which enable...
3. **Better insights** (more dimensions to correlate, more patterns to detect, visualized at a glance)

The loop feeds itself: coaches who *see* actionable insights are more likely to intervene → athletes who receive interventions are more engaged → engagement produces more data → more data produces better insights.

### What Sets This Apart from Catapult/Teamworks

- **Chat-derived readiness:** No other platform passively extracts psychological readiness from natural conversation. This is your moat.
- **Context-tagged correlations:** Tags like [Travel], [Exam Week] create sport-specific intelligence that generic wellness platforms miss.
- **Visual priority system:** Alert/Trend/Info tiers match how coaches actually think — "what do I do today?" not "show me all the data."
