# Development Guide

**Complete technical reference for AI Sports Agent developers**

## Quick Start

```bash
# Install dependencies
cd apps/web && pnpm install
cd apps/mobile && pnpm install

# Run dev servers
pnpm dev          # Web (http://localhost:3000)
pnpm dev:mobile   # Mobile (Expo)

# Database
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations
pnpm prisma:studio      # Database GUI

# Code quality
pnpm lint               # ESLint
pnpm type-check         # TypeScript
pnpm test               # Run tests
```

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────┐
│   Web App (Next.js) + Mobile (RN)      │
│   - Chat interface                      │
│   - Mood tracking                       │
│   - Analytics dashboards                │
└──────────────┬──────────────────────────┘
               │
               │ API Routes + Prisma
               ↓
┌──────────────────────────────────────────┐
│   Database (PostgreSQL/Supabase)        │
│   - RLS policies                        │
│   - Multi-tenant (schoolId)             │
└──────────────┬───────────────────────────┘
               │
               │ Vector search
               ↓
┌──────────────────────────────────────────┐
│   AI Services                            │
│   - OpenAI GPT-4 (chat)                 │
│   - Embeddings (RAG)                    │
│   - MCP Server (FastAPI - optional)     │
└──────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
- **Framework**: Next.js 15 (App Router) + React Native (Expo)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + NativeWind
- **State**: Zustand
- **Forms**: React Hook Form + Zod

**Backend**
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **AI**: OpenAI GPT-4 + Vercel AI SDK
- **MCP Server**: Python FastAPI (optional advanced features)

---

## Project Structure

### Monorepo Layout

```
AISportsAgent/
├── apps/
│   ├── web/                      # Next.js web application
│   │   ├── src/
│   │   │   ├── app/              # App Router pages + API routes
│   │   │   ├── components/       # UI components
│   │   │   │   ├── shared/       # Used by both portals
│   │   │   │   ├── coach/        # Coach portal only
│   │   │   │   └── student/      # Student portal only
│   │   │   ├── lib/              # Utilities + algorithms
│   │   │   │   ├── algorithms/   # 6 custom algorithms (4,301 LOC)
│   │   │   │   └── analytics/    # Analytics systems (1,642 LOC)
│   │   │   ├── agents/           # TypeScript agent runtime
│   │   │   └── types/            # TypeScript types
│   │   └── prisma/               # Database schema
│   │
│   └── mobile/                   # React Native Expo app
│       ├── app/                  # Expo Router
│       └── components/           # Mobile UI
│           ├── shared/
│           └── coach/
│
├── services/
│   └── mcp-server/               # Python FastAPI (optional)
│       ├── app/
│       │   ├── agents/           # Python agents
│       │   ├── core/             # RAG, prompts, security
│       │   └── api/              # FastAPI routes
│       └── requirements.txt
│
└── docs/                         # Documentation archive
```

### Component Organization (Three-Tier)

**Shared Components** (`apps/web/src/components/shared/`)
- Used by both coach and student portals
- Examples: UI primitives (Button, Card), Chat interface, Mood logger

**Coach Components** (`apps/web/src/components/coach/`)
- Coach-only features
- Examples: Team analytics, Athlete roster, Weekly summaries

**Student Components** (`apps/web/src/components/student/`)
- Student athlete features
- Examples: Performance tracking, Consent settings

### Import Paths

```typescript
// Shared components
import { Button } from '@/components/shared/ui/button';
import { ChatInterface } from '@/components/shared/chat/ChatInterface';

// Coach-only
import { StatCard } from '@/components/coach/ui/StatCard';
import { TeamAnalytics } from '@/components/coach/team-analytics/TeamAnalytics';

// Student-only
import { PerformanceChart } from '@/components/student/performance/PerformanceChart';
```

---

## Database Schema

### Core Models

**User** - Base authentication
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         Role     @default(ATHLETE)
  schoolId     String

  athlete      Athlete?
  coach        Coach?
  sessions     ChatSession[]
  moodLogs     MoodLog[]
}
```

**Athlete** - Extended profile
```prisma
model Athlete {
  id           String   @id @default(cuid())
  userId       String   @unique
  sport        String
  year         String   // Freshman, Sophomore, etc.
  position     String?

  user         User     @relation(fields: [userId], references: [id])
  goals        Goal[]
  performances Performance[]
}
```

**ChatSession** - Conversation tracking
```prisma
model ChatSession {
  id           String   @id @default(cuid())
  athleteId    String
  schoolId     String   // Multi-tenant boundary
  startedAt    DateTime @default(now())

  messages     Message[]
  summaries    ChatSummary[]
}
```

**MoodLog** - Daily tracking
```prisma
model MoodLog {
  id           String   @id @default(cuid())
  athleteId    String
  schoolId     String
  date         DateTime

  mood         Int      @db.SmallInt  // 1-10
  stress       Int      @db.SmallInt
  anxiety      Int      @db.SmallInt
  confidence   Int      @db.SmallInt
  sleep        Float?   // hours
  sleepQuality Int?     @db.SmallInt
}
```

### Multi-Tenancy

**Every table MUST include `schoolId`:**
```typescript
// ✅ Correct - always filter by tenant
const sessions = await prisma.chatSession.findMany({
  where: {
    athleteId: user.id,
    schoolId: user.schoolId,  // REQUIRED
  },
});

// ❌ Incorrect - missing tenant filter
const sessions = await prisma.chatSession.findMany({
  where: { athleteId: user.id },
});
```

**Row-Level Security (RLS)**
- Every table has Supabase RLS policies
- Defense in depth: RLS + application filters
- Test RLS: Try accessing other school's data (must fail)

---

## AI & Algorithms

### 6 Custom Algorithms (4,301 Lines)

**1. Archetype Classification** (`lib/algorithms/archetype.ts` - 635 lines)
- Classifies athletes into 8 psychological profiles
- Archetypes: Overthinker, Burnout Risk, Momentum Builder, Perfectionist, Resilient Warrior, Anxious Achiever, Steady Performer, Disengaged
- Scoring: Weighted multi-factor analysis
- Output: Primary + secondary archetype with coaching strategies

**2. Burnout Prediction** (`lib/algorithms/burnout.ts` - 572 lines)
- 30-day forecast using 6 indicators
- Indicators: Readiness decline, chronic stress, emotional exhaustion, reduced recovery, declining motivation, reduced accomplishment
- Stages: Healthy → Early Warning → Developing → Advanced → Critical
- Linear trend projection with confidence decay

**3. Performance Prediction** (`lib/algorithms/performance.ts` - 643 lines)
- Predicts game-day performance (1-10 scale)
- Multi-factor regression with athlete-specific calibration
- Factors: Readiness, event importance, taper, psychological state, home/away, momentum
- Confidence intervals from historical standard deviation

**4. Risk Assessment** (`lib/algorithms/risk.ts` - 749 lines)
- Comprehensive wellbeing risk scoring
- 6 weighted factors: Readiness trend (30%), stress (25%), sleep debt (20%), physical load (15%), mental health (10%), crisis language (100% override)
- Risk levels: Critical, High, Moderate, Low
- Urgency: Immediate, Soon (24-48h), Monitor, None

**5. Pattern Detection** (`lib/algorithms/patterns.ts` - 702 lines)
- Anomaly detection (Z-score method)
- Trend detection (Mann-Kendall test)
- Cyclic patterns (autocorrelation)
- Correlation analysis (Pearson)
- Event-response patterns

**6. Enhanced Readiness** (`lib/analytics/readiness.ts` - 591 lines)
- Multi-dimensional scoring (Physical, Mental, Cognitive)
- Sport-specific weighting (endurance, precision, strategy, power)
- Temporal aggregation: today (50%), yesterday (30%), week avg (20%)
- Risk classification: Optimal (≥85), Good (≥75), Moderate (≥65), Caution (≥55), Critical (<55)

### OpenAI Integration

**Models Used:**
- **GPT-4 Turbo**: Primary conversational agent
- **text-embedding-3-small**: Vector embeddings for RAG (1536 dims)

**Configuration** (`lib/openai.ts`):
```typescript
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = 'gpt-4-turbo-preview';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
```

**System Prompt** (5-Step Discovery Protocol):
```typescript
const SYSTEM_PROMPT = `You are a sports psychology AI assistant following the Discovery-First Protocol:

1. DISCOVERY: Ask open-ended questions to understand the athlete
2. UNDERSTANDING: Reflect and validate their experience
3. FRAMEWORK: Introduce evidence-based techniques (CBT, mindfulness)
4. ACTION: Provide specific, actionable strategies
5. FOLLOW-UP: Check understanding and commitment

Evidence-based frameworks:
- Cognitive Behavioral Therapy (CBT)
- Mindfulness and acceptance
- Flow state cultivation
- Goal setting (SMART)

Always: Be supportive, cite research when relevant, detect crisis language.`;
```

### RAG System (Knowledge Agent)

**Vector Search** (`agents/knowledge/KnowledgeAgent.ts`):
```typescript
class KnowledgeAgent extends BaseAgent {
  async retrieveRelevantContext(query: string, sport: string) {
    // 1. Generate query embedding
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    // 2. Cosine similarity search (threshold: 0.7)
    const results = await vectorSearch(embedding.data[0].embedding, {
      sport,
      threshold: 0.7,
      topK: 2,
    });

    // 3. Return top 2 chunks
    return results.map(r => r.content);
  }
}
```

**Cosine Similarity Formula:**
```
similarity = (vecA · vecB) / (||vecA|| × ||vecB||)
```

---

## API Routes

### Chat Endpoint

**`/app/api/chat/route.ts`** (Streaming)
```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai';

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();

  // 1. Validate auth
  const session = await getServerSession();
  if (!session?.user) return unauthorized();

  // 2. Get chat history
  const history = await prisma.message.findMany({
    where: { sessionId, schoolId: session.user.schoolId },
    orderBy: { createdAt: 'asc' },
  });

  // 3. Stream response
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

### Analytics Endpoint

**`/app/api/analytics/readiness/route.ts`**
```typescript
export async function GET(req: Request) {
  const { athleteId, days } = parseQuery(req.url);

  // Fetch mood logs
  const logs = await prisma.moodLog.findMany({
    where: {
      athleteId,
      date: { gte: subDays(new Date(), days) },
    },
  });

  // Calculate readiness
  const readiness = calculateEnhancedReadiness(logs);

  return NextResponse.json({ readiness });
}
```

---

## Testing

### Test Structure

```
apps/web/
├── __tests__/
│   ├── lib/
│   │   ├── algorithms/       # Algorithm unit tests
│   │   └── analytics/        # Analytics tests
│   ├── components/           # Component tests
│   └── api/                  # API route tests
```

### Running Tests

```bash
# All tests
pnpm test

# Specific algorithm
pnpm test algorithms/archetype

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Algorithm Testing Guide

**Example: Testing Burnout Prediction**
```typescript
import { predictBurnout } from '@/lib/algorithms/burnout';

describe('Burnout Prediction', () => {
  it('detects critical burnout from high stress + low readiness', () => {
    const logs = generateMockLogs({
      stress: [8, 9, 8, 9, 9],      // Chronic high stress
      readiness: [50, 48, 45, 42],  // Declining
      mood: [4, 3, 4, 3],           // Low
    });

    const result = predictBurnout('athlete-1', logs);

    expect(result.stage).toBe('CRITICAL');
    expect(result.criticalSigns).toBeGreaterThanOrEqual(2);
  });

  it('healthy athlete returns no warnings', () => {
    const logs = generateMockLogs({
      stress: [5, 4, 5, 6],
      readiness: [80, 82, 85, 83],
      mood: [7, 8, 7, 8],
    });

    const result = predictBurnout('athlete-2', logs);

    expect(result.stage).toBe('HEALTHY');
    expect(result.signs).toHaveLength(0);
  });
});
```

### Analytics Testing

**Test Multi-Modal Correlation**
```typescript
it('returns null when insufficient data (<5 games)', async () => {
  const analysis = await analyzeMultiModalCorrelation(
    'athlete-id',
    new Date('2025-01-01'),
    new Date('2025-01-10')
  );

  expect(analysis).toBeNull();
});
```

---

## Development Workflow

### Git Branch Strategy

**CRITICAL: NEVER work directly on main branch**

**Workflow:**
```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Develop and commit
git add .
git commit -m "feat: description"

# 3. Push to remote
git push -u origin feature/your-feature-name

# 4. Create PR to main
# Review, test, merge

# 5. Clean up
git branch -d feature/your-feature-name
```

**Branch Naming:**
- ✅ `feature/voice-integration`, `fix/auth-redirect`
- ❌ `dev`, `develop`, `wip`, `testing`

### Code Style

**TypeScript:**
- Use functional components with hooks
- Server components by default, client only when needed
- Type everything (no `any`)
- Use Prisma for all DB operations

**React:**
```typescript
// ✅ Server component (default)
export default async function DashboardPage() {
  const athletes = await prisma.athlete.findMany();
  return <AthleteList athletes={athletes} />;
}

// ✅ Client component (when needed)
'use client';
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  // ...
}
```

**Imports:**
```typescript
// Use @ alias for absolute imports
import { Button } from '@/components/shared/ui/button';
import { calculateReadiness } from '@/lib/analytics/readiness';
```

### Environment Variables

**`.env.local` (never commit):**
```bash
# Database
DATABASE_URL="postgresql://..."
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# Feature flags
ENABLE_VOICE="false"
ENABLE_ADVANCED_ANALYTICS="true"
```

**Validation:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  NEXTAUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

---

## Common Tasks

### Adding a New Algorithm

**1. Create file** (`lib/algorithms/your-algorithm.ts`)
```typescript
import { MoodLog } from '@prisma/client';

export interface YourAlgorithmResult {
  score: number;
  interpretation: string;
}

export function yourAlgorithm(
  athleteId: string,
  logs: MoodLog[]
): YourAlgorithmResult {
  // Your logic here
  return { score: 75, interpretation: 'Moderate' };
}
```

**2. Write tests** (`__tests__/lib/algorithms/your-algorithm.test.ts`)

**3. Add to analytics API** (`app/api/analytics/your-feature/route.ts`)

**4. Use in dashboard** (`components/coach/your-feature/YourChart.tsx`)

### Adding a New Component

**1. Determine tier** (shared/coach/student)

**2. Create component**
```typescript
// components/coach/new-feature/NewFeature.tsx
export function NewFeature({ athleteId }: { athleteId: string }) {
  return <div>...</div>;
}
```

**3. Add to barrel export** (if applicable)
```typescript
// components/coach/index.ts
export { NewFeature } from './new-feature/NewFeature';
```

### Database Migration

**1. Modify schema** (`prisma/schema.prisma`)
```prisma
model NewTable {
  id        String   @id @default(cuid())
  schoolId  String   // ALWAYS include for multi-tenancy
  // ...
}
```

**2. Generate migration**
```bash
pnpm prisma migrate dev --name add_new_table
```

**3. Update TypeScript types**
```bash
pnpm prisma:generate
```

**4. Add RLS policies** (in Supabase SQL editor)
```sql
CREATE POLICY "Users can only access own school data"
ON new_table FOR SELECT
USING (school_id IN (
  SELECT school_id FROM users WHERE id = auth.uid()
));
```

---

## Troubleshooting

### Build Errors

**"supabaseUrl is required"**
```typescript
// ❌ Module-level evaluation (fails at build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabase = createClient(supabaseUrl, anonKey);

// ✅ Runtime evaluation (works)
export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createClient(supabaseUrl, anonKey);
}
```

**"Insufficient data for analysis"**
- Not an error - graceful degradation
- API returns 200 with `success: false`
- Check: Need ≥5 games for correlation analysis

### Import Errors After Reorganization

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
pnpm dev
```

### Colors Not Updating

```bash
# Clear Next.js cache
rm -rf .next

# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R
```

---

## Performance Optimization

### Database Queries

**Use Prisma's include/select:**
```typescript
// ✅ Only fetch needed fields
const athletes = await prisma.athlete.findMany({
  select: {
    id: true,
    name: true,
    sport: true,
  },
});

// ❌ Fetches everything
const athletes = await prisma.athlete.findMany();
```

**Batch queries:**
```typescript
// ✅ Single query
const [athletes, logs] = await Promise.all([
  prisma.athlete.findMany(),
  prisma.moodLog.findMany(),
]);

// ❌ Sequential queries
const athletes = await prisma.athlete.findMany();
const logs = await prisma.moodLog.findMany();
```

### React Performance

**Memoization:**
```typescript
import { useMemo } from 'react';

export function AnalyticsChart({ logs }: { logs: MoodLog[] }) {
  const chartData = useMemo(() => {
    return processLogs(logs);  // Expensive computation
  }, [logs]);

  return <Chart data={chartData} />;
}
```

**Code splitting:**
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/coach/charts/HeavyChart'),
  { ssr: false }
);
```

---

## Security Guidelines

### Input Validation

**ALWAYS use Zod:**
```typescript
import { z } from 'zod';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().cuid(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { message, sessionId } = chatRequestSchema.parse(body);
  // ...
}
```

### Crisis Detection

**Keywords:**
```typescript
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all',
  'hurt myself', 'self-harm', 'can\'t go on',
  'no point', 'worthless'
];

export function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}
```

**Immediate escalation:**
```typescript
if (detectCrisis(message)) {
  await escalateCrisisAlert({
    athleteId,
    message,
    timestamp: new Date(),
    severity: 'CRITICAL',
  });

  return {
    response: 'I'm concerned about what you shared. Please reach out to a crisis counselor immediately: 988 Suicide & Crisis Lifeline.',
  };
}
```

---

## Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js 15**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs

---

**Last Updated**: 2026-01-05
**Total Custom Code**: 7,824+ lines (algorithms + analytics + agents)
**Algorithms**: 6 advanced statistical/ML algorithms
**Component Organization**: Three-tier (shared/coach/student)
