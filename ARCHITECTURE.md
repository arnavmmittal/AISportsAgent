# Flow Sports Coach — System Architecture

**Last Updated:** April 2026 | **Branch:** v1/rebuild-clean

---

## System Overview

Full-stack mental performance platform for collegiate athletics. Two portals (coach + student athlete), mobile-first for athletes, web-first for coaches.

```
┌──────────────────────────────────────────────────────────────────┐
│                      FLOW SPORTS COACH                           │
├──────────────┬──────────────┬────────────────────────────────────┤
│   Web App    │  Mobile App  │       Coach Portal                 │
│  (Next.js 16)│ (Expo SDK 54)│  (Next.js — same codebase)        │
└──────┬───────┴──────┬───────┴──────────────┬─────────────────────┘
       │              │                      │
       └──────────────┼──────────────────────┘
                      ▼
       ┌──────────────────────────────────────┐
       │     Next.js API Routes + LangGraph   │
       │   /api/chat  /api/mood-logs  /api/   │
       │   athlete/insights  /api/coach       │
       └──────────┬──────────┬────────────────┘
                  │          │
       ┌──────────▼──┐  ┌───▼────────────┐
       │  Anthropic   │  │   Supabase     │
       │  Claude      │  │  PostgreSQL    │
       │ (+ OpenAI    │  │  + Auth + RLS  │
       │  fallback)   │  │                │
       └─────────────┘  └────────────────┘
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Web Framework** | Next.js 16 (App Router) | TypeScript, Tailwind CSS |
| **Mobile** | Expo SDK 54, React Native 0.81 | Expo Router 6 |
| **Database** | PostgreSQL 15+ (Supabase) | Prisma ORM, 46 tables, 103 RLS policies |
| **Auth** | NextAuth.js v5 | JWT (mobile) + Supabase session (web) |
| **AI — Primary** | Anthropic Claude | maxRetries: 0, 15s timeout |
| **AI — Fallback** | OpenAI GPT-4 | maxRetries: 1, 30s timeout |
| **Agent Orchestration** | LangGraph | State graph, PostgresSaver checkpointing |
| **Embeddings** | OpenAI text-embedding-3-small | Knowledge base RAG |
| **State** | Zustand | Client-side |
| **UI Components** | shadcn/ui + Radix | Obsidian design system |
| **Build** | Turborepo + pnpm | Monorepo |
| **Deployment** | Vercel (web), EAS (mobile) | Staging → Production |
| **Monitoring** | Sentry | Error tracking |

---

## Folder Structure

```
FlowSportsCoach/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/              # API routes (25+)
│   │   │   │   │   ├── athlete/      # insights, toolkit endpoints
│   │   │   │   │   ├── chat/         # AI chat streaming (SSE)
│   │   │   │   │   ├── coach/        # Coach dashboard APIs
│   │   │   │   │   ├── mood-logs/    # Check-in logging
│   │   │   │   │   ├── cron/         # Scheduled tasks
│   │   │   │   │   └── ...           # auth, goals, assignments, etc.
│   │   │   │   ├── student/          # Student portal
│   │   │   │   │   ├── wellness/     # Wellness center (3-zone)
│   │   │   │   │   ├── ai-coach/     # Chat interface
│   │   │   │   │   ├── dashboard/    # Student dashboard
│   │   │   │   │   └── ...
│   │   │   │   └── coach/            # Coach portal
│   │   │   │       ├── dashboard/    # Obsidian triage dashboard
│   │   │   │       ├── athletes/     # Roster management
│   │   │   │       ├── readiness/    # Team readiness view
│   │   │   │       ├── data/         # Analytics
│   │   │   │       └── ...
│   │   │   ├── agents/               # AI agent system
│   │   │   │   ├── langgraph/        # LangGraph state machine
│   │   │   │   │   ├── graph.ts      # State graph definition
│   │   │   │   │   ├── nodes/        # safety, context, model, tools
│   │   │   │   │   ├── tools/        # Agent tools
│   │   │   │   │   └── checkpointer.ts
│   │   │   │   ├── knowledge/        # RAG knowledge base
│   │   │   │   │   ├── retrieval.ts  # Vector search
│   │   │   │   │   ├── embedding.ts  # OpenAI embeddings
│   │   │   │   │   └── ingest.ts     # PDF ingestion
│   │   │   │   └── core/             # Orchestrator
│   │   │   ├── components/
│   │   │   │   ├── coach/            # Coach portal components
│   │   │   │   ├── student/          # Student portal components
│   │   │   │   ├── shared/           # Cross-portal shared
│   │   │   │   └── ui/              # shadcn/ui primitives
│   │   │   └── lib/                  # Core utilities (20+ modules)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 46 models, 29 enums, 1400 lines
│   │   │   └── migrations/
│   │   └── tests/
│   └── mobile/                       # React Native Expo app
│       ├── app/
│       │   ├── (auth)/               # Login, signup, welcome
│       │   └── (tabs)/              # Main tabs
│       │       ├── checkin.tsx       # Wellness center
│       │       ├── chat.tsx          # AI coach chat
│       │       ├── assignments.tsx
│       │       └── settings.tsx
│       └── components/
│           ├── student/wellness/     # Native wellness components
│           └── chat/                 # Smart empty state, context banner
├── packages/
│   ├── types/                        # Shared TypeScript types
│   └── api-client/                   # Shared API client
├── config/environments/              # .env files per environment
├── docs/plans/                       # Active implementation plans
└── tasks/                            # Sprint tracking + lessons
```

---

## Core Data Flows

### AI Chat (Core Product)

```
Athlete message → Zod validation → Crisis detection → Cost check
    → LangGraph state graph:
        ├── Parallel init: safety node + context node
        ├── Context: athlete history, goals, mood, RAG knowledge
        └── Model invocation: Claude (primary) → OpenAI (fallback)
    → streamEvents → SSE → React useStreamBuffer
    → Save message + update insights
```

### Wellness Check-In

```
3-tap check-in (mood, stress, sleep) + optional details
    → POST /api/mood-logs
    → Readiness score recalculated
    → Dashboard + insights update
    → Toolkit recommendations refreshed (knowledge base RAG)
```

### Coach Dashboard

```
Coach login → Fetch athletes with consent
    → Aggregate: readiness scores, mood trends, risk levels
    → Triage: crisis alerts (CRITICAL first)
    → Obsidian design: heatmap, sparklines, animated numbers
```

---

## Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Dual LLM | Claude primary, OpenAI fallback | Reliability — if one provider is down, chat still works |
| LangGraph over simple chains | State graph with checkpointing | Supports parallel node execution, tool use, conversation recovery |
| Prisma over raw SQL | ORM with typed queries | Type safety, migration management, schema as source of truth |
| SSE over WebSockets | Server-Sent Events for streaming | Simpler, works with Vercel serverless, sufficient for one-way streaming |
| Knowledge base RAG | OpenAI embeddings + vector retrieval | Sports psychology PDF ingested → evidence-based recommendations |
| RLS everywhere | 103 policies across 46 tables | Multi-tenant security — athletes only see own data, coaches need consent |

---

## Database (46 Models)

| Domain | Key Tables |
|--------|-----------|
| **Users** | User, Athlete, Coach, School |
| **Chat** | ChatSession, Message, ChatInsight, ChatSummary |
| **Safety** | CrisisAlert (→ coach notification) |
| **Tracking** | MoodLog, Goal, ReadinessScore |
| **Performance** | GameResult, PerformanceMetric, GameSchedule |
| **Coach** | CoachAthleteRelation, CoachNote, Assignment, AlertRule |
| **ML** | AthleteModel, PredictionLog, Intervention |
| **Audit** | AuditLog, TokenUsage, ErrorLog |

Key relationship: `Athlete.userId` is the `@id` (primary key). All child tables reference `athleteId → Athlete.userId`.

---

## Security

| Layer | Implementation |
|-------|---------------|
| **Auth** | NextAuth v5 — JWT for mobile, session for web |
| **Database** | RLS on all 46 tables (103 policies) |
| **API** | Zod validation on every route, rate limiting (60/min user) |
| **Multi-tenant** | schoolId filter on all queries |
| **Secrets** | Environment variables only, never NEXT_PUBLIC for keys |
| **Crisis** | Keyword + pattern detection → coach alert → crisis resources |
| **Cost** | Circuit breakers: $500/day per tenant, $10K/month total |
| **PII** | Redacted before LLM calls |

---

## Environments

| Environment | Branch | Deployment |
|-------------|--------|-----------|
| Development | feature/* | localhost:3000 |
| Staging | staging | Auto-deploy on merge (Vercel) |
| Production | main | Manual approval required |
