# Flow Sports Coach V1 — Clean Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing scattered codebase into a focused, shippable B2B product — AI mental performance coaching for athletes (Claude-primary), with a real analytics dashboard for coaches, RAG-grounded knowledge base, performance correlation engine, and a professional UI that signals trust to university buyers.

**Architecture:** Keep the existing Next.js + Prisma + Supabase + LangGraph stack. Switch LLM priority to Claude (Anthropic) primary / GPT-4o fallback (model node already supports both). Add pgvector for RAG knowledge base. Strip all non-V1 pages/routes. Rebuild coach dashboard with real data. Professional, minimal UI throughout.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL (Supabase + pgvector), LangGraph, Claude Sonnet (primary), GPT-4o (fallback), Whisper (STT), ElevenLabs (TTS), Expo/React Native (mobile)

**Branch:** `v1/rebuild-clean` (created from `staging`)

---

## Phase Overview

| Phase | Name | Purpose | Depends On |
|-------|------|---------|------------|
| 1 | Foundation Reset | Strip non-V1 code, flip LLM to Claude-primary, verify core flows | — |
| 2 | UI Overhaul | Professional, trust-signaling UI for both portals | Phase 1 |
| 3 | Knowledge Base (RAG) | Ground AI responses in real sports psychology | Phase 1 |
| 4 | Coach Dashboard (Real Data) | Working roster, heatmap, alerts, nudges | Phase 1 |
| 5 | Performance Correlation | Game logging + correlation engine + AI insights | Phase 4 |
| 6 | Mobile Polish | Strip to 3 tabs, professional UI, working flows | Phases 1-2 |
| 7 | Trust & Ship | Audit trail, privacy controls, security review, deploy | All |

**Phases 2, 3, 4 can run in parallel after Phase 1.**

---

## Phase 1: Foundation Reset

**Goal:** Remove all non-V1 code, flip LLM to Anthropic-primary, verify that auth + chat + mood + crisis detection + WHOOP all work end-to-end.

### Task 1.1: Strip Non-V1 Web Pages

**Files to DELETE:**

```
# Athlete portal — remove scaffolding pages
apps/web/src/app/student/visualization/page.tsx
apps/web/src/app/student/schedule/page.tsx
apps/web/src/app/student/progress/page.tsx
apps/web/src/app/student/chat/page.tsx          # duplicate of ai-coach
apps/web/src/app/student/readiness/page.tsx      # merged into wellness
apps/web/src/app/student/mood/page.tsx           # merged into wellness
apps/web/src/app/student/goals/page.tsx          # not in V1 scope

# Coach portal — remove scaffolding pages
apps/web/src/app/coach/roi/page.tsx
apps/web/src/app/coach/predictions/page.tsx
apps/web/src/app/coach/analytics/page.tsx        # redirects to ai-insights anyway
apps/web/src/app/coach/insights/page.tsx         # redirects to ai-insights anyway
apps/web/src/app/coach/command-center/page.tsx
apps/web/src/app/coach/team-overview/page.tsx
apps/web/src/app/coach/team/page.tsx             # redirects to athletes
apps/web/src/app/coach/outcomes/page.tsx
apps/web/src/app/coach/performance/page.tsx
apps/web/src/app/coach/performance/import/page.tsx
apps/web/src/app/coach/performance/record/page.tsx
apps/web/src/app/coach/reports/page.tsx

# Root-level orphan pages
apps/web/src/app/dashboard/page.tsx
apps/web/src/app/goals/page.tsx
apps/web/src/app/chat/page.tsx
apps/web/src/app/interventions/page.tsx
apps/web/src/app/wearables/page.tsx
apps/web/src/app/mood/page.tsx
apps/web/src/app/settings/page.tsx

# (coach) route group — duplicate of /coach/
apps/web/src/app/(coach)/analytics/page.tsx
apps/web/src/app/(coach)/command-center/page.tsx
apps/web/src/app/(coach)/insights/page.tsx
apps/web/src/app/(coach)/readiness/page.tsx
apps/web/src/app/(coach)/roster/page.tsx

# Admin pages — not V1
apps/web/src/app/admin/ (entire directory if exists)
```

**Files to DELETE (components):**

```
# Unused/scaffolding components
apps/web/src/components/admin/CostMonitoringDashboard.tsx
apps/web/src/components/athlete/EnergyStatusCard.tsx
apps/web/src/components/athlete/ForecastWidget.tsx
apps/web/src/components/coach/readiness/LineupOptimizer.tsx
apps/web/src/components/coach/readiness/ReadinessForecast.tsx
apps/web/src/components/coach/readiness/RecoveryDashboard.tsx
apps/web/src/components/coach/biometrics/BiometricOverview.tsx
apps/web/src/components/coach/biometrics/HRVChart.tsx
apps/web/src/components/coach/command-center/ (entire directory)
apps/web/src/components/coach/digest/ (entire directory)
apps/web/src/components/coach/weekly-summary/
apps/web/src/components/coach/settings/AIConfiguration.tsx
apps/web/src/components/coach/settings/UserManagement.tsx
apps/web/src/components/coach/touchpoints/ (entire directory)
apps/web/src/components/student/pre-game/ (entire directory)
apps/web/src/components/student/performance/ (entire directory)
apps/web/src/components/visualizations/ (entire directory)
apps/web/src/components/SportFilter.tsx
```

**Files to DELETE (unused lib):**

```
apps/web/src/lib/algorithms/archetype.ts
apps/web/src/lib/algorithms/burnout.ts
apps/web/src/lib/algorithms/patterns.ts
apps/web/src/lib/analytics/deep-insights.ts
apps/web/src/lib/analytics/enhanced-readiness.ts
apps/web/src/lib/analytics/forecasting.ts
apps/web/src/lib/analytics/multi-modal-correlation.ts
apps/web/src/lib/demo-data.ts
apps/web/src/lib/digest/ (entire directory)
apps/web/src/lib/sports-data/ (entire directory)
apps/web/src/lib/summaries/
apps/web/src/lib/redis.ts                # if not used by anything remaining
```

**Files to DELETE (unused API routes):**

```
apps/web/src/app/api/admin/ (entire directory)
apps/web/src/app/api/analytics/multi-modal/route.ts
apps/web/src/app/api/analytics/readiness-forecast/route.ts
apps/web/src/app/api/athlete/pre-game/route.ts
apps/web/src/app/api/athlete/schedule/route.ts
apps/web/src/app/api/biometrics/ (entire directory)
apps/web/src/app/api/coach/command-center/route.ts
apps/web/src/app/api/coach/digest/route.ts
apps/web/src/app/api/coach/import-games/route.ts
apps/web/src/app/api/coach/predictions/route.ts
apps/web/src/app/api/coach/roi/route.ts
apps/web/src/app/api/coach/touchpoints/route.ts
apps/web/src/app/api/coach/weekly-summaries/route.ts
apps/web/src/app/api/cron/cleanup-summaries/route.ts
apps/web/src/app/api/cron/generate-weekly-summaries/route.ts
apps/web/src/app/api/goals/ (entire directory)
apps/web/src/app/api/interventions/ (entire directory)
apps/web/src/app/api/performance/ (entire directory)
apps/web/src/app/api/predictions/ (entire directory)
apps/web/src/app/api/reports/ (entire directory)
apps/web/src/app/api/summaries/ (entire directory)
```

**Step 1:** Delete all files listed above.

**Step 2:** Run `pnpm build` in `apps/web/` to find broken imports. Fix each by removing the import (don't re-add deleted code).

**Step 3:** Verify no remaining imports reference deleted files:
```bash
cd apps/web && grep -r "from.*coach/roi\|from.*command-center\|from.*predictions\|from.*lineup\|from.*forecast\|from.*archetype\|from.*burnout\|from.*deep-insights\|from.*demo-data" src/ --include="*.ts" --include="*.tsx" -l
```

**Step 4:** Commit.
```bash
git add -A && git commit -m "chore: strip non-V1 pages, components, APIs, and lib code

Remove ~60 scaffolding files: admin dashboard, ROI page, predictions,
forecasting, burnout detection, command center, lineup optimizer,
visualization, goal management, and unused analytics.

Keeps: chat, mood, readiness, assignments, crisis detection, WHOOP,
auth, cost controls, coach dashboard/athletes/heatmap/alerts."
```

---

### Task 1.2: Flip LLM to Claude-Primary

**File:** `apps/web/src/agents/langgraph/nodes/model.ts`

The file already has both `ChatOpenAI` and `ChatAnthropic` implementations. Current flow: OpenAI first → Anthropic fallback. We need to flip this.

**Step 1:** Modify `callModelNode` (line 301) to try Anthropic first, OpenAI as fallback.

Change:
```typescript
// Current: Try OpenAI first
try {
  const openaiModel = getModelWithTools('openai');
  ...
} catch (openaiError) {
  // fallback to anthropic
```

To:
```typescript
// New: Try Anthropic first, OpenAI as fallback
const hasAnthropic = hasAnthropicKey();
const hasOpenAI = !!process.env.OPENAI_API_KEY;

if (hasAnthropic) {
  try {
    const anthropicModel = getModelWithTools('anthropic');
    const { response } = await tryInvokeModel(anthropicModel, messagesForModel, 'Anthropic');
    return {
      messages: [response],
      turnCountInPhase: state.turnCountInPhase + 1,
    };
  } catch (anthropicError) {
    console.error('[LANGGRAPH:MODEL] Anthropic failed:', anthropicError);
    // Fall through to OpenAI
  }
}

if (hasOpenAI) {
  try {
    const openaiModel = getModelWithTools('openai');
    const { response } = await tryInvokeModel(openaiModel, messagesForModel, 'OpenAI');
    return {
      messages: [response],
      turnCountInPhase: state.turnCountInPhase + 1,
    };
  } catch (openaiError) {
    console.error('[LANGGRAPH:MODEL] OpenAI also failed:', openaiError);
  }
}

// Both failed
return {
  messages: [
    new AIMessage({
      content: "I'm here to help, but I'm having a technical issue right now. Please try again in a moment, or if this is urgent, reach out to your coach directly.",
    }),
  ],
  error: 'All model providers failed',
};
```

**Step 2:** Update the default model in `getAnthropicModel`:
```typescript
model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
```

**Step 3:** Update `apps/web/src/app/api/chat/stream/route.ts` to check for EITHER key, not require OpenAI:

Find the `OPENAI_API_KEY` check and change to:
```typescript
if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
  return new Response('No LLM API key configured', { status: 500 });
}
```

**Step 4:** Update cost tracking in `apps/web/src/lib/cost-tracking.ts`:
- Add Anthropic pricing: Sonnet = $3/MTok input, $15/MTok output
- Keep OpenAI pricing for fallback tracking

**Step 5:** Commit.
```bash
git commit -m "feat: switch to Claude (Anthropic) as primary LLM

Anthropic tried first, OpenAI as fallback. Stream route accepts
either key. Cost tracking updated with Anthropic Sonnet pricing."
```

---

### Task 1.3: Update Navigation Config

**File:** `apps/web/src/config/navigation.ts`

**Step 1:** Trim COACH_NAV to V1 scope:
```typescript
export const COACH_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/coach/dashboard',
    icon: LayoutDashboard,
    description: "Team overview and alerts",
  },
  {
    label: 'Athletes',
    href: '/coach/athletes',
    icon: Users,
    description: 'Roster and individual profiles',
  },
  {
    label: 'Readiness',
    href: '/coach/readiness',
    icon: Activity,
    description: "Team readiness heatmap",
  },
  {
    label: 'Performance',
    href: '/coach/data',
    icon: BarChart3,
    description: 'Game outcomes and correlations',
  },
  {
    label: 'Assignments',
    href: '/coach/assignments',
    icon: ClipboardList,
    description: 'Tasks for your athletes',
  },
  {
    label: 'Settings',
    href: '/coach/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];
```

**Step 2:** Trim ATHLETE_NAV to V1 scope (4 items — simpler):
```typescript
export const ATHLETE_NAV: NavItem[] = [
  {
    label: 'Home',
    href: '/student/home',
    icon: Home,
    description: 'Your daily overview',
  },
  {
    label: 'AI Coach',
    href: '/student/ai-coach',
    icon: MessageCircle,
    description: '24/7 mental performance support',
    badge: 'AI',
    highlight: true,
  },
  {
    label: 'Check-in',
    href: '/student/wellness',
    icon: Heart,
    description: 'Daily mood and readiness',
  },
  {
    label: 'Assignments',
    href: '/student/assignments',
    icon: ClipboardList,
    description: 'Tasks from your coach',
  },
];
```

**Step 3:** Update redirects to match trimmed nav. Remove references to deleted pages.

**Step 4:** Commit.

---

### Task 1.4: Verify Core Flows

**Step 1:** Run `pnpm build` — must pass with zero errors.

**Step 2:** Run `pnpm dev` — verify these routes load without errors:
- `/` (landing page)
- `/auth/signin`
- `/student/home`
- `/student/ai-coach`
- `/student/wellness`
- `/student/assignments`
- `/coach/dashboard`
- `/coach/athletes`
- `/coach/readiness`
- `/coach/assignments`
- `/coach/settings`

**Step 3:** Run existing tests:
```bash
cd apps/web && pnpm test
```

**Step 4:** Fix any broken tests due to deleted code. If a test references deleted functionality, delete the test.

**Step 5:** Commit all fixes.

---

## Phase 2: UI Overhaul

**Goal:** Replace the "childish, over-animated" look with a professional, data-focused aesthetic that signals trust to university buyers. Fewer colors. More whitespace. Minimal animation. Clean typography.

### Task 2.1: Design Token Refinement

**File:** `apps/web/src/app/globals.css`

The design token system is already good. Refinements:

**Step 1:** Remove all gratuitous animation classes:
- Remove `.animate-float` (the floating badge)
- Remove `.animate-bounce` usage everywhere
- Keep only meaningful transitions: `transition-colors`, `transition-opacity`

**Step 2:** Reduce animation classes to essentials only:
```css
/* Only these animations allowed in V1 */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 50% { opacity: .5; } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

/* No bouncing, floating, sliding, or decorative animations */
```

**Step 3:** Audit all `bg-gradient-*` usage — replace with flat colors. Gradients look "AI slop." Flat looks professional.

**Step 4:** Commit.

---

### Task 2.2: Landing Page Redesign

**File:** `apps/web/src/app/page.tsx`

**Goal:** Professional B2B SaaS landing page. Think Linear, Vercel, Stripe — not Calm or Headspace.

**Step 1:** Simplify hero section:
- Remove animated gauges and floating badges
- Clean headline: "Mental Performance Intelligence for Athletic Programs"
- Subheadline: "Your athletes get 24/7 AI coaching. You get the data."
- Two CTAs: "Start Free Trial" → `/auth/signup` and "See Demo" → scroll to features

**Step 2:** Features section (4 cards, no animations):
1. "AI Coach for Athletes" — 24/7 evidence-based mental performance support
2. "Team Readiness Dashboard" — See who's struggling at a glance
3. "Performance Correlation" — Connect mental readiness to game-day outcomes
4. "Crisis Detection" — Three-layer safety system with documented audit trail

**Step 3:** Social proof section:
- "Built on peer-reviewed sports psychology" with framework logos/names
- "Trusted by collegiate athletic programs" (placeholder for future logos)

**Step 4:** Remove all decorative elements: animated icons, gradient text, floating badges, parallax effects.

**Step 5:** Commit.

---

### Task 2.3: Coach Portal UI

**Files:** `apps/web/src/app/coach/layout.tsx`, all coach pages

**Design principles for coach portal:**
- Data-dense but clean (think Grafana/Datadog aesthetic)
- White/light background with navy accents
- Cards for data groupings, tables for lists
- Status indicators: green/yellow/red dots (already in design tokens)
- No decorative illustrations or animations
- Loading: skeleton shimmer only (no spinner text)

**Step 1:** Ensure coach layout uses `AppSidebar` with clean styling. No gradient headers, no decorative borders.

**Step 2:** Dashboard page (`/coach/dashboard`):
- Top row: 4 stat cards (Total Athletes, Average Readiness, Active Alerts, Check-in Rate)
- Middle: At-risk athletes list (red/yellow indicators with name, sport, readiness, last check-in)
- Bottom: 7-day team mood trend (simple line chart, no gradient fills)

**Step 3:** Athletes page (`/coach/athletes`):
- Clean table: Name | Sport | Readiness | Last Check-in | Mood Trend | Status
- Search bar at top
- Click row → detail view
- No cards, no grid — just a table

**Step 4:** All pages: remove gradient backgrounds, gradient text, decorative icons. Use flat colors from design tokens only.

**Step 5:** Commit.

---

### Task 2.4: Athlete Portal UI

**Files:** `apps/web/src/app/student/layout.tsx`, athlete pages

**Design principles for athlete portal:**
- Warm but clean (not clinical, not childish)
- Mobile-first — everything works at 375px
- Large touch targets (44px minimum)
- Chat is the hero — takes up most of the screen
- Check-in is fast — 3 taps maximum

**Step 1:** Home page (`/student/home`):
- Greeting: "Good morning, [Name]" with current readiness score (large number, color-coded)
- Quick actions: "Talk to Coach" (primary CTA), "Daily Check-in"
- Recent assignment (if any)
- No charts, no analytics, no complexity

**Step 2:** AI Coach page (`/student/ai-coach`):
- Full-height chat interface
- Clean message bubbles (no gradients, no shadows)
- Input at bottom with voice button
- No decorative elements — the conversation IS the UI

**Step 3:** Wellness/Check-in page (`/student/wellness`):
- 5 sliders: Mood, Confidence, Energy, Stress, Sleep (1-10)
- Optional text note
- "Submit" button
- 30-day trend chart below (simple, small)
- Must complete in <30 seconds

**Step 4:** Commit.

---

### Task 2.5: Shared Component Cleanup

**Step 1:** Audit all components in `apps/web/src/components/shared/` and `apps/web/src/components/ui/`:
- Remove duplicate UI components (there are TWO `ui/` directories)
- Consolidate into single `apps/web/src/components/ui/` directory
- Delete any component not imported by a remaining page

**Step 2:** Chat components cleanup:
- `ChatInterface.tsx` — keep, but audit for removed widget references
- `ChatBubble.tsx` — simplify: no gradient backgrounds
- `ChatInputDock.tsx` — keep, clean styling
- `ChatEmptyState.tsx` — keep, simplify copy
- `CrisisResourcesModal.tsx` — keep as-is (critical safety feature)
- Remove references to any deleted widget components

**Step 3:** Remove `apps/web/src/components/coach/layouts/CoachPortalLayout.tsx` (replaced by AppSidebar-based layout).

**Step 4:** Commit.

---

## Phase 3: Knowledge Base (RAG)

**Goal:** Ground AI responses in real sports psychology literature so the chat isn't a generic GPT wrapper. This is a core differentiator for coach trust.

### Task 3.1: Set Up pgvector

**Step 1:** Enable pgvector extension in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Step 2:** Add Prisma migration for knowledge base embeddings. Update `KnowledgeBase` model:
```prisma
model KnowledgeBase {
  id         String   @id @default(cuid())
  title      String
  content    String   // chunk text
  source     String   // document title / author
  sourceUrl  String?
  category   KnowledgeCategory
  tags       String[]
  chunkIndex Int      // position in source document
  schoolId   String?  // null = global (ships with product), non-null = team-specific
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  School     School?  @relation(fields: [schoolId], references: [id])

  @@index([category])
  @@index([schoolId])
  @@index([isActive])
}
```

**Step 3:** Create raw SQL migration for vector column (Prisma doesn't support vector type natively):
```sql
ALTER TABLE "KnowledgeBase" ADD COLUMN "embedding" vector(1536);
CREATE INDEX ON "KnowledgeBase" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Step 4:** Run migration: `pnpm prisma migrate dev --name add-knowledge-vectors`

**Step 5:** Commit.

---

### Task 3.2: Build Embedding Pipeline

**File to create:** `apps/web/src/lib/knowledge/embedding.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI(); // Keep OpenAI for embeddings (cheaper, well-tested)

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export function chunkDocument(text: string, maxTokens = 500, overlap = 50): string[] {
  // Split by paragraphs first, then merge small paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > maxTokens * 4) { // rough char-to-token ratio
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
```

**File to create:** `apps/web/src/lib/knowledge/ingest.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { generateEmbedding, chunkDocument } from './embedding';

export async function ingestDocument(opts: {
  title: string;
  content: string;
  source: string;
  category: KnowledgeCategory;
  tags: string[];
  schoolId?: string; // null = global
}): Promise<number> {
  const chunks = chunkDocument(opts.content);
  let count = 0;

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    const id = `${opts.title.toLowerCase().replace(/\s+/g, '-')}-${i}`;

    // Use raw SQL for vector insert (Prisma can't handle vector type)
    await prisma.$executeRaw`
      INSERT INTO "KnowledgeBase" (id, title, content, source, category, tags, "chunkIndex", "schoolId", "isActive", "createdAt", "updatedAt", embedding)
      VALUES (${id}, ${opts.title}, ${chunks[i]}, ${opts.source}, ${opts.category}::text::"KnowledgeCategory", ${opts.tags}, ${i}, ${opts.schoolId}, true, NOW(), NOW(), ${embedding}::vector)
      ON CONFLICT (id) DO UPDATE SET content = ${chunks[i]}, embedding = ${embedding}::vector, "updatedAt" = NOW()
    `;
    count++;
  }
  return count;
}
```

**File to create:** `apps/web/src/lib/knowledge/retrieval.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from './embedding';

export interface RetrievedChunk {
  content: string;
  source: string;
  title: string;
  category: string;
  similarity: number;
}

export async function retrieveRelevantKnowledge(
  query: string,
  opts: { topK?: number; schoolId?: string; category?: string } = {}
): Promise<RetrievedChunk[]> {
  const { topK = 5, schoolId, category } = opts;
  const queryEmbedding = await generateEmbedding(query);

  // Retrieve from global + team-specific knowledge
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT content, source, title, category,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "KnowledgeBase"
    WHERE "isActive" = true
      AND ("schoolId" IS NULL ${schoolId ? prisma.$queryRaw`OR "schoolId" = ${schoolId}` : prisma.$queryRaw``})
      ${category ? prisma.$queryRaw`AND category = ${category}::"KnowledgeCategory"` : prisma.$queryRaw``}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${topK}
  `;

  return results.filter(r => r.similarity > 0.3); // minimum relevance threshold
}
```

**Step:** Commit.

---

### Task 3.3: Integrate RAG into Chat Pipeline

**File:** `apps/web/src/agents/langgraph/nodes/context.ts`

**Step 1:** Import `retrieveRelevantKnowledge` and call it during context loading.

In the context loading node (runs in parallel with safety check), add:
```typescript
// Retrieve relevant sports psych knowledge based on latest user message
const lastUserMessage = state.messages.filter(m => m._getType() === 'human').pop();
if (lastUserMessage) {
  const knowledge = await retrieveRelevantKnowledge(
    lastUserMessage.content as string,
    { schoolId: state.schoolId, topK: 5 }
  );
  state.ragContext = knowledge;
}
```

**Step 2:** In `apps/web/src/agents/langgraph/nodes/model.ts`, inject RAG context into system prompt:

In `buildSystemPrompt`, after the athlete context section, add:
```typescript
// Add sports psychology knowledge (RAG)
if (state.ragContext && state.ragContext.length > 0) {
  parts.push('');
  parts.push('# Sports Psychology Reference Material');
  parts.push('Use the following evidence-based knowledge to ground your response. Cite the source when referencing specific techniques or frameworks.');
  parts.push('');
  for (const chunk of state.ragContext) {
    parts.push(`## [${chunk.source}] — ${chunk.title}`);
    parts.push(chunk.content);
    parts.push('');
  }
}
```

**Step 3:** Update `ConversationState` in `apps/web/src/agents/langgraph/state.ts`:
```typescript
ragContext?: RetrievedChunk[];
```

**Step 4:** Commit.

---

### Task 3.4: Curate Initial Knowledge Base

**File to create:** `apps/web/src/lib/knowledge/seed-data.ts`

Create a seed script with 20-30 foundational sports psychology chunks. These are NOT full papers — they're concise summaries of key frameworks that the AI can reference.

Categories to cover:
1. **ACT for athletes** — Acceptance and Commitment Therapy applied to sport
2. **Mindfulness-based performance** — MSPE protocol, present-moment awareness
3. **Pre-performance routines** — Singer model, Cotterill's 5-step approach
4. **Imagery/visualization** — PETTLEP model (Holmes & Collins, 2001)
5. **Self-talk** — Instructional vs. motivational self-talk frameworks
6. **Arousal regulation** — Centering, progressive relaxation, energizing
7. **Confidence building** — Vealey's model, Bandura's self-efficacy sources
8. **Goal setting** — Process/performance/outcome goals hierarchy
9. **Flow state** — Csikszentmihalyi's model, challenge-skill balance
10. **Sleep hygiene for athletes** — Evidence-based sleep optimization
11. **Injury rehabilitation psychology** — Grief models, mental recovery strategies
12. **Team cohesion** — Carron's conceptual model

**Step 1:** Write seed data file with structured chunks.

**Step 2:** Create seed API route or script:
```bash
pnpm tsx apps/web/src/lib/knowledge/seed-data.ts
```

**Step 3:** Test RAG: send a chat message about "pre-game anxiety" and verify the response references specific frameworks from the knowledge base.

**Step 4:** Commit.

---

### Task 3.5: Coach Knowledge Upload API

**File to create:** `apps/web/src/app/api/knowledge/upload/route.ts`

**Step 1:** POST endpoint that:
- Accepts multipart form data (PDF or text file)
- Requires COACH role
- Extracts text from PDF (use `pdf-parse` library)
- Chunks and embeds the document
- Stores with the coach's `schoolId` (team-specific namespace)

**Step 2:** GET endpoint at `apps/web/src/app/api/knowledge/route.ts`:
- Returns list of knowledge base entries for coach's school
- Includes global entries + school-specific entries

**Step 3:** Add simple UI in coach settings page for uploading team documents.

**Step 4:** Commit.

---

## Phase 4: Coach Dashboard (Real Data)

**Goal:** Every data point the coach sees must come from real database queries, not mock data. Four views: Roster, Heatmap, Alerts, Nudges.

### Task 4.1: Team Roster with Real Data

**File:** `apps/web/src/app/coach/athletes/page.tsx`

**Step 1:** Replace any demo data generation with real Prisma queries:
```typescript
// Fetch athletes with latest mood, readiness, and engagement
const athletes = await prisma.athlete.findMany({
  where: {
    coachRelations: { some: { coachId: user.id } }
  },
  include: {
    user: { select: { id: true, name: true, email: true } },
    moodLogs: { orderBy: { createdAt: 'desc' }, take: 7 },
    crisisAlerts: { where: { status: 'ACTIVE' }, take: 1 },
  }
});
```

**Step 2:** For each athlete, compute:
- Current readiness (from latest mood log via `calculateReadiness()`)
- 7-day mood trend (compare avg of last 3 days vs prior 4 days)
- Last check-in timestamp
- Active crisis flag

**Step 3:** Render as clean table with status indicators.

**Step 4:** Individual athlete detail view (`/coach/athletes/[id]`):
- 30-day mood chart (line chart, each dimension)
- Readiness trend line
- Chat engagement (messages per week)
- Wearable data trends (if WHOOP connected)
- Topic summaries (if athlete consented to sharing)

**Step 5:** Commit.

---

### Task 4.2: Readiness Heatmap with Real Data

**File:** `apps/web/src/app/coach/readiness/page.tsx`

**Step 1:** API endpoint `apps/web/src/app/api/coach/analytics/team-heatmap/route.ts` already exists. Verify it queries real `MoodLog` data and returns grid format.

**Step 2:** Frontend: render a grid (athletes × last 30 days). Each cell is color-coded:
- Green (readiness >= 75)
- Yellow (60-74)
- Red (< 60)
- Gray (no data for that day)

**Step 3:** Use existing `HeatMap.tsx` component in `apps/web/src/components/coach/charts/` or build a simple one with CSS grid.

**Step 4:** Add filters: by sport, by date range.

**Step 5:** Commit.

---

### Task 4.3: Alert Feed with Real Data

**File:** `apps/web/src/app/coach/dashboard/page.tsx` (alerts section) and `/coach/alerts/page.tsx` if separate

**Step 1:** Query `CrisisAlert` table:
```typescript
const alerts = await prisma.crisisAlert.findMany({
  where: {
    athlete: {
      coachRelations: { some: { coachId: user.id } }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  include: {
    athlete: { include: { user: { select: { name: true } } } }
  }
});
```

**Step 2:** Display chronologically: Name | Timestamp | Severity | Status (New/Acknowledged/Resolved)

**Step 3:** Coach can click "Acknowledge" → updates status with timestamp and coachId. Click "Resolve" → marks resolved with optional note.

**Step 4:** Commit.

---

### Task 4.4: AI Nudges (Daily Briefing)

**File to create:** `apps/web/src/lib/analytics/coach-nudges.ts`

**Step 1:** Create a function that analyzes team data and generates nudges:
```typescript
export async function generateCoachNudges(coachId: string): Promise<Nudge[]> {
  const nudges: Nudge[] = [];

  // 1. Athletes who haven't checked in for 5+ days
  const inactive = await prisma.athlete.findMany({
    where: {
      coachRelations: { some: { coachId } },
      moodLogs: { none: { createdAt: { gte: subDays(new Date(), 5) } } }
    },
    include: { user: { select: { name: true } } }
  });
  if (inactive.length > 0) {
    nudges.push({
      type: 'engagement',
      priority: 'medium',
      message: `${inactive.length} athlete(s) haven't checked in for 5+ days`,
      athletes: inactive.map(a => a.user.name),
    });
  }

  // 2. Team readiness trend (compare this week vs last week)
  // 3. Athletes with declining readiness
  // 4. Upcoming game day alerts (if GameSchedule populated)
  // 5. Unacknowledged crisis alerts

  return nudges;
}
```

**Step 2:** Display nudges at the top of coach dashboard in a clean card layout.

**Step 3:** Nudges are computed on dashboard load (real-time, not batch). If performance becomes an issue, move to a cron job later.

**Step 4:** Commit.

---

## Phase 5: Performance Correlation Engine

**Goal:** Coaches log game outcomes. System correlates mental readiness data with performance. Claude generates plain-English insights.

### Task 5.1: Game Outcome Logging

**File:** `apps/web/src/app/coach/data/page.tsx` (rename to Performance page)

**Step 1:** Create game logging form:
- Date picker
- Select athlete(s) — multi-select from roster
- Sport (auto-filled from athlete profile)
- Opponent (text)
- Result: W / L / T
- Performance rating: 1-10 slider (coach's subjective rating)
- Optional sport-specific metrics (JSON — flexible key-value pairs)
- Notes (text area)

**Step 2:** API endpoint `apps/web/src/app/api/performance-outcomes/route.ts`:
- POST: Create `PerformanceOutcome` record
- GET: List outcomes for coach's athletes with filters (date range, athlete, sport)
- Auto-populate: query `ReadinessScore` and `MoodLog` for game day to attach to record

**Step 3:** Display logged outcomes in a table below the form.

**Step 4:** Commit.

---

### Task 5.2: Correlation Engine

**File to create:** `apps/web/src/lib/analytics/performance-correlation.ts`

**Step 1:** Core correlation function:
```typescript
export async function calculateCorrelations(
  athleteId: string,
  opts?: { startDate?: Date; endDate?: Date }
): Promise<CorrelationResult> {
  // Fetch performance outcomes + readiness data
  const outcomes = await prisma.performanceOutcome.findMany({
    where: { athleteId, date: { gte: opts?.startDate, lte: opts?.endDate } },
    orderBy: { date: 'asc' },
  });

  // For each outcome, get the mood/readiness from that day
  const dataPoints = await Promise.all(outcomes.map(async (o) => {
    const moodLog = await prisma.moodLog.findFirst({
      where: {
        athleteId,
        createdAt: { gte: startOfDay(o.date), lte: endOfDay(o.date) }
      }
    });
    return {
      date: o.date,
      performance: o.overallRating,
      mood: moodLog?.mood,
      confidence: moodLog?.confidence,
      stress: moodLog?.stress,
      sleep: moodLog?.sleep,
      energy: moodLog?.energy,
    };
  }));

  // Calculate Pearson correlations
  return {
    moodVsPerformance: pearsonCorrelation(dataPoints, 'mood', 'performance'),
    confidenceVsPerformance: pearsonCorrelation(dataPoints, 'confidence', 'performance'),
    sleepVsPerformance: pearsonCorrelation(dataPoints, 'sleep', 'performance'),
    stressVsPerformance: pearsonCorrelation(dataPoints, 'stress', 'performance'),
    sampleSize: dataPoints.length,
  };
}

function pearsonCorrelation(data: any[], xKey: string, yKey: string): number {
  const pairs = data.filter(d => d[xKey] != null && d[yKey] != null);
  if (pairs.length < 3) return 0; // not enough data
  // Standard Pearson r calculation...
}
```

**Step 2:** Team-level correlation:
```typescript
export async function calculateTeamCorrelations(coachId: string): Promise<TeamCorrelationResult> {
  // Aggregate correlations across all athletes
  // Also: win rate by readiness bucket (above 75, 60-75, below 60)
}
```

**Step 3:** Commit.

---

### Task 5.3: AI Insight Generation

**File to create:** `apps/web/src/lib/analytics/insight-generator.ts`

**Step 1:** Take correlation results + raw data → generate plain-English insights via Claude:
```typescript
export async function generatePerformanceInsights(
  correlations: CorrelationResult,
  teamCorrelations: TeamCorrelationResult,
  coachId: string
): Promise<string[]> {
  const anthropic = new Anthropic();

  const prompt = `You are a sports performance analyst. Based on the following correlation data, generate 3-5 concise, actionable insights for a coach. Use specific numbers. Be direct.

Correlation Data:
${JSON.stringify(correlations, null, 2)}

Team-Level Data:
${JSON.stringify(teamCorrelations, null, 2)}

Generate insights as a JSON array of strings. Each insight should be one sentence.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(response.content[0].text);
}
```

**Step 2:** Cache insights per coach per day (regenerate daily or on new game data).

**Step 3:** Commit.

---

### Task 5.4: Correlation Dashboard UI

**File:** `apps/web/src/app/coach/data/page.tsx`

**Step 1:** Two tabs: "Log Game" and "Insights"

**Step 2:** Insights tab:
- Top: AI-generated insights (3-5 bullet points in a card)
- Middle: Correlation matrix (simple table: Factor | Correlation | Strength)
  - Mood → Performance: r=0.72 (Strong)
  - Sleep → Performance: r=0.58 (Moderate)
  - etc.
- Bottom: Win rate by readiness bucket (bar chart)
  - Readiness > 75: 78% win rate
  - Readiness 60-75: 52% win rate
  - Readiness < 60: 31% win rate

**Step 3:** Individual athlete view: show same correlations filtered to one athlete.

**Step 4:** Export button: generate PDF summary for athletic director presentations.

**Step 5:** Commit.

---

## Phase 6: Mobile Polish

**Goal:** Strip mobile to 3 tabs (Chat, Check-in, Profile). Professional UI matching web design tokens. Working chat + mood flows.

### Task 6.1: Strip Mobile to V1 Scope

**Files to DELETE from `apps/mobile/app/`:**
```
(admin)/ (entire directory)
(coach)/ (entire directory)
(tabs)/goals.tsx
(tabs)/assignments.tsx
(tabs)/dashboard.tsx
(tabs)/dashboard.tsx.bak
schedule.tsx
```

**Step 1:** Delete listed files.

**Step 2:** Update `(tabs)/_layout.tsx` to only have 3 tabs:
- Chat (`chat.tsx`)
- Check-in (`mood.tsx`)
- Settings (`settings.tsx`)

**Step 3:** Rename `mood.tsx` to `checkin.tsx` for clarity.

**Step 4:** Commit.

---

### Task 6.2: Mobile Theme Sync

**File:** `apps/mobile/constants/theme.ts`

**Step 1:** Verify mobile theme matches web design tokens (already synced in previous work — navy primary, teal accent). Confirm:
- Primary: `#1A3A6B`
- Accent: `#14B8A6`
- Success: `#22C55E`
- Warning: `#EAB308`
- Error: `#EF4444`

**Step 2:** Remove any purple/blue references that may have survived.

**Step 3:** Commit.

---

### Task 6.3: Mobile Chat Screen

**File:** `apps/mobile/app/(tabs)/chat.tsx`

**Step 1:** Verify chat connects to API and streams responses correctly.

**Step 2:** Clean UI:
- Simple message bubbles (navy for AI, light gray for user)
- Voice button (microphone icon, teal accent)
- No decorative elements

**Step 3:** Verify crisis detection works on mobile (resources displayed, push notification sent to coach).

**Step 4:** Commit.

---

### Task 6.4: Mobile Check-in Screen

**File:** `apps/mobile/app/(tabs)/checkin.tsx`

**Step 1:** 5 sliders (same as web): Mood, Confidence, Energy, Stress, Sleep.

**Step 2:** Optional note field.

**Step 3:** Submit → POST to `/api/mood-logs`.

**Step 4:** Below form: 7-day trend sparkline.

**Step 5:** Commit.

---

## Phase 7: Trust & Ship

**Goal:** Audit trail, privacy controls, security review, final deploy.

### Task 7.1: Audit Trail Verification

**Step 1:** Verify all crisis detections are logged with:
- Detection timestamp
- Severity level
- Resources shown to athlete
- Coach notification timestamp
- Coach acknowledgment timestamp (when they click "Acknowledge")

**Step 2:** Verify all mood log accesses by coaches are audited (already have `AuditLog` table).

**Step 3:** Create API endpoint for coach to export audit trail (PDF/CSV) for compliance.

**Step 4:** Commit.

---

### Task 7.2: Privacy Controls

**File:** `apps/web/src/app/student/settings/page.tsx` (or new privacy section)

**Step 1:** Athlete sees exactly what data is shared with coach:
- Always shared: Readiness score, mood trends, crisis alerts (explain why)
- Optional: Chat topic summaries (toggle)
- Never shared: Chat transcripts (display this explicitly)

**Step 2:** Consent toggle persists to database. Coach dashboard respects these settings.

**Step 3:** Commit.

---

### Task 7.3: Security Review

**Step 1:** Verify RLS policies on all tables used in V1.

**Step 2:** Run existing security tests:
```bash
pnpm test -- --grep "rls\|security\|auth"
```

**Step 3:** Verify: no service role key used on client-side. No API keys in NEXT_PUBLIC_ vars.

**Step 4:** Verify multi-tenant isolation: Coach A cannot see Coach B's athletes.

**Step 5:** Commit.

---

### Task 7.4: Build and Deploy

**Step 1:** `pnpm build` — zero errors.

**Step 2:** Run all tests: `pnpm test` — zero failures.

**Step 3:** Merge `v1/rebuild-clean` → `staging`:
```bash
git checkout staging
git merge v1/rebuild-clean
git push origin staging
```

**Step 4:** Verify Vercel staging deployment works end-to-end.

**Step 5:** Build mobile:
```bash
cd apps/mobile
eas build --profile ios-simulator --platform ios
eas build --profile staging --platform android
```

**Step 6:** Install both builds and verify.

---

## File Summary

### Files to CREATE (new):
| File | Phase | Purpose |
|------|-------|---------|
| `src/lib/knowledge/embedding.ts` | 3 | Embedding generation + chunking |
| `src/lib/knowledge/ingest.ts` | 3 | Document ingestion pipeline |
| `src/lib/knowledge/retrieval.ts` | 3 | RAG query with pgvector |
| `src/lib/knowledge/seed-data.ts` | 3 | Initial sports psych knowledge |
| `src/app/api/knowledge/upload/route.ts` | 3 | Coach document upload |
| `src/app/api/knowledge/route.ts` | 3 | List knowledge entries |
| `src/lib/analytics/coach-nudges.ts` | 4 | AI-generated coach action items |
| `src/lib/analytics/performance-correlation.ts` | 5 | Pearson correlation engine |
| `src/lib/analytics/insight-generator.ts` | 5 | Claude-powered insight generation |

### Files to MODIFY (key changes):
| File | Phase | Change |
|------|-------|--------|
| `agents/langgraph/nodes/model.ts` | 1 | Anthropic-primary, OpenAI-fallback |
| `app/api/chat/stream/route.ts` | 1 | Accept either LLM key |
| `config/navigation.ts` | 1 | Trim to V1 nav items |
| `app/globals.css` | 2 | Remove gratuitous animations |
| `app/page.tsx` | 2 | Professional landing page |
| `agents/langgraph/nodes/context.ts` | 3 | Add RAG retrieval |
| `agents/langgraph/state.ts` | 3 | Add ragContext field |
| `app/coach/athletes/page.tsx` | 4 | Real Prisma data |
| `app/coach/readiness/page.tsx` | 4 | Real heatmap |
| `app/coach/data/page.tsx` | 5 | Game logging + correlations |

### Files to DELETE: ~60 files (see Task 1.1 for complete list)

---

## Verification Checklist (Before Merge)

- [ ] `pnpm build` passes with zero errors
- [ ] All remaining tests pass
- [ ] Chat sends message → Claude responds (streaming) → grounded in RAG
- [ ] Voice: speak → Whisper transcribes → Claude responds → ElevenLabs speaks
- [ ] Crisis keyword triggers: alert created, coach notified, resources shown
- [ ] Mood check-in submits and shows in coach dashboard
- [ ] Coach roster shows real athlete data with readiness indicators
- [ ] Readiness heatmap renders with real mood data
- [ ] Game outcome logged → correlation appears in insights
- [ ] Claude generates plain-English performance insights
- [ ] Mobile chat works end-to-end
- [ ] Mobile check-in submits successfully
- [ ] Coach cannot see other school's data (multi-tenant)
- [ ] Athlete consent toggle respected in coach views
- [ ] Audit trail logs all crisis events with timestamps
- [ ] No hardcoded colors outside design tokens
- [ ] No gratuitous animations
- [ ] All pages work at 375px (mobile) and 1440px (desktop)
