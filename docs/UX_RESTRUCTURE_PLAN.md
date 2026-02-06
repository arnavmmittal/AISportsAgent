# UX Restructure Plan - Coach & Athlete Portals

> **Goal**: Clear purpose for every page, smooth flow, showcase the ML/analytics backend work
> **Created**: 2026-01-28
> **Status**: ✅ COMPLETED 2026-01-28

## Implementation Summary

All phases completed successfully:

1. **Unified Navigation** - Single source of truth in `/config/navigation.ts`
2. **Data Hub** - New consolidated page at `/coach/data` with Import, Outcomes, Reports tabs
3. **All Redirects** - 10+ old URLs redirect to new locations
4. **AI Transparency** - Coach and athlete portals now clearly show AI-powered features

---

## The Problem

User feedback: *"Everything looked good but they didn't see what they were getting out of it because it was all scattered and not clear."*

### Current Issues Identified:

1. **Navigation Chaos (Coach Side)**
   - 3 different navigation configurations (`Navigation.tsx`, `CoachPortalLayout.tsx`, `coach/layout.tsx`)
   - Different pages listed in each
   - Users don't know where to go

2. **Page Redundancy**
   | Overlapping Areas | Pages Involved |
   |-------------------|----------------|
   | Insights/Analytics | `/coach/insights`, `/coach/ai-insights`, `/coach/analytics`, `/coach/predictions` |
   | Readiness Data | `/coach/team-overview`, `/coach/readiness`, dashboard |
   | Performance Data | `/coach/outcomes`, `/coach/performance/import`, `/coach/team?tab=performance` |

3. **Unclear Purpose**
   - What's "Insights" vs "AI Insights" vs "Analytics"?
   - What's "Predictions" vs "AI Insights"?
   - Users can't articulate what each page gives them

4. **Backend Value Hidden**
   - Pearson correlation, ML risk models, intervention tracking, pattern detection
   - All this work is scattered and not prominently showcased

---

## The Solution: Simplified 6-Page Architecture

### Coach Portal (6 Primary Pages)

| # | Page | Route | Purpose (User Thinks) | What It Contains |
|---|------|-------|----------------------|------------------|
| 1 | **Dashboard** | `/coach/dashboard` | "What's happening RIGHT NOW?" | At-a-glance stats, urgent alerts, team health, quick actions |
| 2 | **AI Insights** ⭐ | `/coach/ai-insights` | "What should I KNOW and DO?" | ML correlations, predictions, intervention recommendations, alerts. **THE SHOWCASE** |
| 3 | **Athletes** | `/coach/athletes` | "Deep dive on INDIVIDUALS" | Roster list, individual profiles, athlete-specific analytics |
| 4 | **Readiness** | `/coach/readiness` | "Who's READY today?" | Team heatmap, intervention queue, daily wellness |
| 5 | **Data Hub** | `/coach/data` | "Manage my DATA" | ESPN import, CSV upload, export reports, game outcomes |
| 6 | **Settings** | `/coach/settings` | "Configure my ACCOUNT" | Profile, notifications, team invite code |

### Athlete Portal (6 Primary Pages) - Already Good!

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 1 | **Home** | `/student/home` | Daily landing, readiness score, quick actions |
| 2 | **AI Coach** ⭐ | `/student/ai-coach` | Chat with AI (replaces Zoom meetings) |
| 3 | **Wellness** | `/student/wellness` | Readiness + mood check-in (tabbed) |
| 4 | **Goals** | `/student/goals` | Set and track goals |
| 5 | **Assignments** | `/student/assignments` | Coach-assigned tasks |
| 6 | **Settings** | `/student/settings` | Profile, notifications, privacy |

---

## Page-by-Page Design

### 1. DASHBOARD (`/coach/dashboard`)

**User Question**: "What's happening RIGHT NOW?"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [AI Insights Banner - Prominent CTA]                        │
│ "🧠 Discover what's driving performance → AI Insights"      │
├─────────────────────────────────────────────────────────────┤
│ Quick Stats (4 cards)                                       │
│ [Total Athletes] [Avg Readiness] [At-Risk] [Crisis Alerts]  │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Needs Attention (if any)                                 │
│ - Crisis alerts requiring action                            │
│ - Athletes with declining trends                            │
├─────────────────────────────────────────────────────────────┤
│ Team Mood Trend (7-day chart)                               │
├─────────────────────────────────────────────────────────────┤
│ Quick Links: [Readiness Heatmap] [Import Data] [Settings]   │
└─────────────────────────────────────────────────────────────┘
```

**What's NOT here** (moved elsewhere):
- Detailed analytics → AI Insights
- Individual athlete details → Athletes
- Full heatmap → Readiness
- Data import → Data Hub

---

### 2. AI INSIGHTS (`/coach/ai-insights`) ⭐ THE SHOWCASE

**User Question**: "What should I KNOW and DO based on our data?"

**This is WHERE THE MAGIC IS** - must prominently feature backend work.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 AI Insights                                              │
│ "Machine learning-powered analytics for your team"          │
├─────────────────────────────────────────────────────────────┤
│ ⚡ POWERED BY (always visible)                              │
│ • Pearson Correlation (statistical significance p<0.05)     │
│ • ML Risk Models (predictive performance & burnout)         │
│ • Intervention Tracking (per-athlete effectiveness)         │
│ • Pattern Detection (slump detection & trend analysis)      │
├─────────────────────────────────────────────────────────────┤
│ Summary Bar                                                 │
│ [X correlations] [Y athletes analyzed] [Z at-risk] [W int.] │
├─────────────────────────────────────────────────────────────┤
│ 🌟 TOP INSIGHT (Featured card - largest)                    │
│ "Sleep quality is 72% correlated with performance..."       │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All] [Correlations] [Predictions] [What Works]     │
│         [Patterns] [Alerts]                                 │
├─────────────────────────────────────────────────────────────┤
│ Insights Grid (3 columns)                                   │
│ [Card] [Card] [Card]                                        │
│ [Card] [Card] [Card]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Consolidates**:
- `/coach/predictions` → Predictions tab/filter here
- `/coach/analytics` → Correlations shown here
- `/coach/insights` analytics tab → Merged here

**Each Insight Card Shows**:
- Category badge (Correlation/Prediction/Intervention/Pattern/Alert)
- Plain-English headline
- Key metric with value
- Confidence score + evidence
- Actionable recommendation

---

### 3. ATHLETES (`/coach/athletes`)

**User Question**: "Deep dive on INDIVIDUAL athletes"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Athletes (X total)                                          │
│ [Search...] [Filter: Sport ▼] [Filter: Risk ▼]              │
├─────────────────────────────────────────────────────────────┤
│ Risk Summary: [X Critical] [Y Warning] [Z Good]             │
├─────────────────────────────────────────────────────────────┤
│ Athlete Cards (sorted by risk)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Sarah Johnson     Basketball    Readiness: 72  │ │
│ │          Last check-in: 2h ago           [View →]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Mike Chen         Football      Readiness: 45  │ │
│ │          ⚠️ Declining trend              [View →]       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Athlete Detail View** (`/coach/athletes/[id]`):
- Individual stats, mood history, performance correlation
- Effective interventions for THIS athlete
- Chat sentiment trends
- Goals and assignments

---

### 4. READINESS (`/coach/readiness`)

**User Question**: "Who's READY to perform today?"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Team Readiness                                              │
│ "Daily wellness snapshot"                                   │
├─────────────────────────────────────────────────────────────┤
│ Quick Stats                                                 │
│ [Avg Readiness: 78] [High-Risk: 3] [Declining: 5]           │
├─────────────────────────────────────────────────────────────┤
│ 🔥 Intervention Queue (AI-prioritized)                      │
│ Athletes needing attention, sorted by urgency               │
├─────────────────────────────────────────────────────────────┤
│ 14-Day Heatmap + 7-Day Forecast                             │
│ Color-coded grid showing all athletes' readiness            │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Alerts Tab (integrated)                                  │
│ Crisis alerts, severity levels, resolution tracking         │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. DATA HUB (`/coach/data`) - NEW CONSOLIDATED PAGE

**User Question**: "Manage all my performance DATA"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Data Hub                                                    │
│ "Import, export, and manage your team's data"               │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Import] [Outcomes] [Reports]                         │
├─────────────────────────────────────────────────────────────┤
│ TAB: IMPORT                                                 │
│ ┌─────────────────────┐  ┌─────────────────────┐            │
│ │ 🏈 ESPN Auto-Sync   │  │ 📄 CSV Upload       │            │
│ │ Sync game data      │  │ Bulk import stats   │            │
│ │ [Sync Now]          │  │ [Upload File]       │            │
│ └─────────────────────┘  └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ TAB: OUTCOMES                                               │
│ Recent games/practices with results and mood correlations   │
├─────────────────────────────────────────────────────────────┤
│ TAB: REPORTS                                                │
│ Generate and export custom reports (weekly, monthly, PDF)   │
└─────────────────────────────────────────────────────────────┘
```

**Consolidates**:
- `/coach/performance/import`
- `/coach/outcomes`
- `/coach/insights?tab=reports`

---

### 6. SETTINGS (`/coach/settings`)

**User Question**: "Configure my ACCOUNT"

Keep as-is, it's well structured.

---

## Redirects to Implement

| Old Route | New Route | Reason |
|-----------|-----------|--------|
| `/coach` | `/coach/dashboard` | Main entry point |
| `/coach/team-overview` | `/coach/dashboard` | Consolidated into dashboard |
| `/coach/team` | `/coach/athletes` | Renamed for clarity |
| `/coach/predictions` | `/coach/ai-insights?filter=prediction` | Consolidated |
| `/coach/analytics` | `/coach/ai-insights` | Consolidated |
| `/coach/insights` | `/coach/ai-insights` | Consolidated (or keep for reports) |
| `/coach/outcomes` | `/coach/data?tab=outcomes` | Consolidated |
| `/coach/performance/import` | `/coach/data?tab=import` | Consolidated |

---

## Navigation Updates

### Single Source of Truth

All 3 navigation files should reference THE SAME 6 items:

```typescript
const COACH_NAV = [
  { label: 'Dashboard', href: '/coach/dashboard', icon: LayoutDashboard },
  { label: 'AI Insights', href: '/coach/ai-insights', icon: Brain, badge: '✨' },
  { label: 'Athletes', href: '/coach/athletes', icon: Users },
  { label: 'Readiness', href: '/coach/readiness', icon: Activity },
  { label: 'Data Hub', href: '/coach/data', icon: Database },
  { label: 'Settings', href: '/coach/settings', icon: Settings },
];
```

### AI Insights Should Stand Out
- Use a special icon (Brain)
- Add sparkle/badge indicator
- Position second (right after Dashboard)
- Prominent banner on Dashboard linking to it

---

## Athlete Portal Enhancements

The athlete side is well-structured. Minor enhancements:

1. **Add "Powered by AI" badges** where ML is used:
   - Dashboard readiness score: "AI-calculated"
   - AI Coach: "GPT-4 with sports psychology training"
   - Goals suggestions: "AI-suggested based on your patterns"

2. **Wellness Page**: Add brief explanation of what powers readiness calculation

3. **Consistency**: Use same design language as coach portal for ML badges

---

## Implementation Order

### Phase 1: Foundation ✅ COMPLETED
1. ✅ Create unified navigation config (`/config/navigation.ts`)
2. ✅ Update all navigation components to use it
3. ✅ Commit: "refactor: unify coach navigation"

### Phase 2: Page Consolidation ✅ COMPLETED
1. ✅ Create `/coach/data` page (new Data Hub with Import, Outcomes, Reports tabs)
2. ✅ Update `/coach/athletes` to be the main roster page
3. ✅ Set up all redirects
4. ✅ Commit: "feat: Data Hub consolidation + navigation redirects"

### Phase 3: AI Insights Enhancement ✅ COMPLETED
1. ✅ Filter tabs for categories already present
2. ✅ "Powered by" section already present
3. ✅ Fixed broken link to use new Data Hub route
4. ✅ Commit: "feat: AI transparency improvements"

### Phase 4: Athlete Polish ✅ COMPLETED
1. ✅ Added AI badges to home page insight card
2. ✅ Added "Calculated from your daily check-ins" to readiness
3. ✅ Enhanced chat CTA with AI badge
4. ✅ Commit: "feat: AI transparency improvements"

### Phase 5: Documentation ✅ COMPLETED
1. ✅ Updated this plan file with completion status
2. ✅ All commits made with proper messages

---

## Success Metrics

After this restructure, users should be able to answer:

**Coach asks**: "Where do I see what the AI figured out?" → **AI Insights**
**Coach asks**: "How's my team doing right now?" → **Dashboard**
**Coach asks**: "Who needs attention today?" → **Readiness**
**Coach asks**: "Tell me about Sarah specifically" → **Athletes → Sarah**
**Coach asks**: "How do I import game data?" → **Data Hub**

**Athlete asks**: "Where do I talk to the AI?" → **AI Coach**
**Athlete asks**: "Am I ready for my game?" → **Wellness (Readiness tab)**
**Athlete asks**: "What are my goals?" → **Goals**

---

## Notes

- Don't delete old page files immediately - set up redirects first
- Test each redirect before moving to next
- Commit frequently to allow easy rollback
- Don't push to staging until all changes are complete and tested locally
