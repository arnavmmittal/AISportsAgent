# Flow Sports Coach - System Architecture

**Complete technical architecture document** for the Flow Sports Coach platform.

> **Last Updated:** February 2026
> **Version:** 2.0
> **Branch:** staging

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Folder Structure](#3-folder-structure)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [API Architecture](#6-api-architecture)
7. [Frontend Routes](#7-frontend-routes)
8. [Core Services](#8-core-services)
9. [AI/ML Components](#9-aiml-components)
10. [Voice Integration](#10-voice-integration)
11. [Authentication & Security](#11-authentication--security)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Environment Configuration](#13-environment-configuration)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Data Flows](#15-data-flows)
16. [Production Checklist](#16-production-checklist)

---

## 1. Executive Summary

**Flow Sports Coach** is a full-stack mental performance platform for collegiate athletics:

| Capability | Description |
|------------|-------------|
| **AI Chat Interface** | 24/7 mental performance coaching via voice + text (replaces 1-on-1 Zoom meetings) |
| **Performance Analytics** | Mental readiness ↔ game performance correlations with predictive modeling |
| **Coach Dashboard** | Triage-first monitoring for sports psychologists managing 150+ athletes |
| **Mobile App** | React Native iOS/Android apps with voice support |

**Target Users:**
- **Athletes**: Student-athletes seeking immediate mental performance support
- **Coaches**: Sports psychologists (NOT team coaches) managing 150+ athletes
- **Institutions**: D1+ universities wanting data-driven competitive advantage

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLOW SPORTS COACH                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────┐ │
│  │   Web App    │   │  Mobile App  │   │      Coach Portal            │ │
│  │  (Next.js)   │   │ (React Native)│   │  (Next.js - same codebase)  │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┬───────────────┘ │
│         │                  │                          │                 │
│         └──────────────────┼──────────────────────────┘                 │
│                            │                                            │
│                            ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes (25+)                      │   │
│  │  /api/chat  /api/mood-logs  /api/goals  /api/coach  /api/auth   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         ▼                  ▼                  ▼                         │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐                 │
│  │  OpenAI    │    │  Supabase  │    │   ChromaDB     │                 │
│  │  GPT-4     │    │ PostgreSQL │    │ (Vector Store) │                 │
│  │  Whisper   │    │   + Auth   │    │                │                 │
│  └────────────┘    └────────────┘    └────────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
FlowSportsCoach/
│
├── apps/                              # Application tier
│   ├── web/                           # Next.js 14 web application
│   │   ├── src/
│   │   │   ├── app/                   # Next.js App Router
│   │   │   │   ├── (coach)/           # Coach portal routes (grouped)
│   │   │   │   │   ├── dashboard/     # Coach dashboard
│   │   │   │   │   ├── athletes/      # Athlete roster
│   │   │   │   │   ├── assignments/   # Assignment management
│   │   │   │   │   └── alerts/        # Alert configuration
│   │   │   │   ├── api/               # API endpoints (25+)
│   │   │   │   │   ├── auth/          # Authentication
│   │   │   │   │   ├── chat/          # AI chat (core feature)
│   │   │   │   │   ├── mood-logs/     # Mood tracking
│   │   │   │   │   ├── goals/         # Goal management
│   │   │   │   │   ├── coach/         # Coach-specific APIs
│   │   │   │   │   ├── assignments/   # Assignments CRUD
│   │   │   │   │   ├── performance/   # Analytics
│   │   │   │   │   ├── wearables/     # Device integration
│   │   │   │   │   └── cron/          # Scheduled tasks
│   │   │   │   ├── chat/              # Athlete chat interface
│   │   │   │   ├── dashboard/         # Athlete dashboard
│   │   │   │   ├── goals/             # Goals page
│   │   │   │   ├── mood/              # Mood tracking
│   │   │   │   └── assignments/       # Athlete assignments
│   │   │   │
│   │   │   ├── components/            # React components
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── chat/              # Chat-specific components
│   │   │   │   ├── coach/             # Coach dashboard components
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── lib/                   # Core utilities
│   │   │   │   ├── prisma.ts          # Prisma client singleton
│   │   │   │   ├── openai.ts          # OpenAI integration
│   │   │   │   ├── cost-tracking.ts   # Budget controls
│   │   │   │   ├── crisis-escalation.ts # Safety features
│   │   │   │   ├── readiness-score.ts # Readiness calculation
│   │   │   │   ├── summarizer.ts      # Chat summarization
│   │   │   │   └── auth-helpers.ts    # Auth utilities
│   │   │   │
│   │   │   ├── services/              # Business logic layer
│   │   │   ├── agents/                # LangChain agents
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── contexts/              # React Context providers
│   │   │   ├── types/                 # TypeScript definitions
│   │   │   └── middleware/            # Request middleware
│   │   │
│   │   ├── prisma/                    # Database
│   │   │   ├── schema.prisma          # 40+ tables, 1400 lines
│   │   │   ├── migrations/            # SQL migrations
│   │   │   └── seed.ts                # Demo data seeding
│   │   │
│   │   ├── supabase/                  # Supabase config
│   │   │   └── migrations/            # RLS policies
│   │   │
│   │   └── tests/                     # Vitest unit tests
│   │
│   └── mobile/                        # React Native Expo app
│       ├── app/                       # Expo Router screens
│       ├── components/                # RN components
│       ├── lib/                       # Business logic
│       ├── hooks/                     # React hooks
│       └── eas.json                   # Expo build config
│
├── packages/                          # Shared code (monorepo)
│   ├── types/                         # Shared TypeScript types
│   │   └── src/
│   │       ├── chat.ts
│   │       ├── goal.ts
│   │       ├── mood.ts
│   │       └── user.ts
│   │
│   └── api-client/                    # Shared API client
│
├── services/                          # Backend services
│   └── _deprecated/                   # Python MCP server (not active)
│       └── mcp-server/
│
├── config/                            # Environment configs
│   └── environments/
│       ├── .env.development
│       ├── .env.staging
│       └── .env.production
│
├── docs/                              # Documentation
│   ├── VISION_ARCHITECTURE.md
│   └── coach_weekly_chat_summaries.md
│
├── infra/                             # Infrastructure
│   └── docker/
│
└── Root Files
    ├── package.json                   # Monorepo root
    ├── pnpm-workspace.yaml            # pnpm workspaces
    ├── turbo.json                     # Turborepo config
    ├── README.md                      # Project overview
    ├── CLAUDE.md                      # AI context
    ├── SETUP.md                       # Setup guide
    ├── ARCHITECTURE.md                # This file
    └── COMPONENT_STATUS.md            # Component breakdown
```

---

## 4. Technology Stack

### Frontend (Web)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 14.2.35 | App Router, SSR, API routes |
| Language | TypeScript | 5.x | Type safety |
| UI Library | shadcn/ui + Radix | Latest | Accessible components |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| State | Zustand | 5.0 | Client state management |
| Forms | React Hook Form + Zod | 7.54 / 3.24 | Validation |
| Charts | Recharts | 3.5 | Data visualization |

### Mobile

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Expo SDK | 54 | Cross-platform development |
| Runtime | React Native | 0.81 | iOS + Android |
| Navigation | Expo Router | 6.0 | File-based routing |
| Voice STT | Whisper API | - | Speech-to-text |
| Voice TTS | ElevenLabs | - | Text-to-speech |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API Framework | Next.js API Routes | 25+ RESTful endpoints |
| ORM | Prisma | 6.0 | Database abstraction |
| AI/LLM | OpenAI GPT-4 | Language models |
| Streaming | Server-Sent Events (SSE) | Real-time chat |
| Build System | Turborepo | 2.0 | Monorepo caching |
| Package Manager | pnpm | 8.15 | Fast installs |

### Database & Storage

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Primary DB | PostgreSQL 15+ (Supabase) | Data storage |
| Auth | Supabase Auth / NextAuth.js | Authentication |
| Security | Supabase RLS | Row-level security |
| Vector DB | ChromaDB | RAG knowledge base |

### Deployment

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Web | Vercel | Next.js hosting |
| Mobile | EAS (Expo) | iOS/Android builds |
| Monitoring | Sentry | Error tracking |

---

## 5. Database Schema

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE USER DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐               │
│   │   User   │◄────────│  School  │────────►│  Coach   │               │
│   └────┬─────┘         └──────────┘         └────┬─────┘               │
│        │                                         │                      │
│        │ 1:1                                     │ 1:N                  │
│        ▼                                         ▼                      │
│   ┌──────────┐                          ┌─────────────────┐            │
│   │ Athlete  │◄─────────────────────────│CoachAthleteRelation│         │
│   └────┬─────┘                          └─────────────────┘            │
│        │                                                                │
└────────┼────────────────────────────────────────────────────────────────┘
         │
         │ 1:N for all below
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ATHLETE DATA DOMAIN                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │ ChatSession │  │   MoodLog   │  │    Goal     │  │    Task     │   │
│   │  + Message  │  │             │  │             │  │             │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │ChatInsight  │  │ReadinessScore│ │Intervention │  │ CrisisAlert │   │
│   │             │  │             │  │             │  │             │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       PERFORMANCE ANALYTICS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │ GameResult  │  │PerformanceMetric│GameSchedule│  │PredictionLog│   │
│   │             │  │             │  │             │  │             │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐                                     │
│   │PreGameSession│ │WearableData │                                     │
│   │             │  │             │                                     │
│   └─────────────┘  └─────────────┘                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Table Summary (40+ tables)

| Category | Tables | Purpose |
|----------|--------|---------|
| **User/Auth** | User, Athlete, Coach, School, Session, Account | Identity & auth |
| **Chat** | ChatSession, Message, ChatInsight, ChatSummary, CrisisAlert | Conversations |
| **Tracking** | MoodLog, Goal, Task, ReadinessScore | Athlete metrics |
| **Performance** | GameResult, PerformanceMetric, GameSchedule, PreGameSession | Game analytics |
| **Wearables** | WearableConnection, WearableDataPoint | Device integration |
| **Coach** | CoachAthleteRelation, CoachNote, Assignment, AlertRule | Coach features |
| **ML** | AthleteModel, PredictionLog, Intervention | ML/predictions |
| **Audit** | AuditLog, TokenUsage, ErrorLog | Compliance & cost |

### Key Enums

```prisma
enum Role { ATHLETE, COACH, ADMIN }
enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
enum GoalCategory { PERFORMANCE, MENTAL, ACADEMIC, PERSONAL }
enum InterventionType { BREATHING, VISUALIZATION, SELF_TALK, ROUTINE, FOCUS_CUE, ... }
enum AlertTrigger { READINESS_DROP, INACTIVITY, SENTIMENT_DECLINE, THEME_MENTION, ... }
```

---

## 6. API Architecture

### Endpoint Categories

#### Authentication (`/api/auth/*`)
```
POST /api/auth/signup          # User registration
POST /api/auth/login           # User login
GET  /api/auth/user-role       # Get current user role
```

#### Chat - Core Feature (`/api/chat/*`)
```
POST /api/chat                 # Create chat session
POST /api/chat/stream          # Stream AI response (SSE)
POST /api/chat/stream-v2       # V2 streaming endpoint
GET  /api/chat/[sessionId]/messages    # Get session messages
POST /api/chat/[sessionId]/summary     # Generate summary
POST /api/chat/analyze         # Sentiment analysis
```

#### Mood Tracking (`/api/mood-logs/*`)
```
POST /api/mood-logs            # Log mood check-in
GET  /api/mood-logs            # Retrieve history
```

#### Goals (`/api/goals/*`)
```
POST   /api/goals              # Create goal
GET    /api/goals              # List goals
PATCH  /api/goals/[id]         # Update goal
DELETE /api/goals/[id]         # Delete goal
GET    /api/goals/suggestions  # AI suggestions
```

#### Coach (`/api/coach/*`)
```
GET  /api/coach                # Dashboard data
GET  /api/coach/athletes       # Athlete roster
GET  /api/coach/insights       # Team insights
POST /api/coach/alerts         # Alert rules
```

#### Assignments (`/api/assignments/*`)
```
POST   /api/assignments                 # Create
GET    /api/assignments                 # List
PATCH  /api/assignments/[id]            # Edit
POST   /api/assignments/[id]/submit     # Submit
```

#### Performance (`/api/performance/*`, `/api/predictions/*`)
```
GET  /api/performance                   # Metrics
POST /api/performance-outcomes          # Record game
POST /api/predictions                   # Generate prediction
GET  /api/predictions                   # History
```

#### Scheduled Tasks (`/api/cron/*`)
```
GET /api/cron/escalation                # Crisis check (daily)
GET /api/cron/generate-weekly-summaries # Weekly digest
GET /api/cron/cleanup-summaries         # Cleanup old data
```

---

## 7. Frontend Routes

### Public Routes
```
/                    # Landing page
/auth/signup         # Registration
/auth/login          # Login
```

### Athlete Routes (Protected)
```
/dashboard           # Main dashboard
/chat                # AI chat interface (CORE)
/mood                # Mood tracking
/goals               # Goal management
/assignments         # View assignments
/settings            # User settings
```

### Coach Routes (Protected)
```
/(coach)/dashboard   # Coach dashboard (heatmap, alerts)
/(coach)/athletes    # Athlete roster
/(coach)/assignments # Assignment management
/(coach)/alerts      # Alert configuration
/(coach)/reports     # Reports & analytics
```

---

## 8. Core Services

### `/src/lib/` - Utility Layer

| File | Purpose | Critical? |
|------|---------|-----------|
| `prisma.ts` | Singleton Prisma client | Yes |
| `openai.ts` | OpenAI GPT-4 integration | Yes |
| `cost-tracking.ts` | Budget tracking & circuit breakers | Yes (prod) |
| `crisis-escalation.ts` | Crisis detection & escalation | Yes (safety) |
| `readiness-score.ts` | Readiness calculation algorithm | Yes |
| `auth-helpers.ts` | Authentication utilities | Yes |
| `summarizer.ts` | Chat summarization | No |
| `sanitize.ts` | HTML/content sanitization | Yes (security) |

### Key Algorithms

**Readiness Score Calculation:**
```typescript
// apps/web/src/lib/readiness-score.ts
// Weighted average of mood factors
readinessScore = (
  mood * 0.25 +
  confidence * 0.25 +
  (10 - stress) * 0.15 +  // Inverted
  energy * 0.15 +
  sleep * 0.20
) * 10; // Scale to 0-100
```

**Cost Tracking Circuit Breaker:**
```typescript
// apps/web/src/lib/cost-tracking.ts
// Blocks requests when budget exceeded
if (dailySpend >= COST_LIMIT_DAILY_PER_USER) {
  throw new CostLimitExceededError();
}
```

---

## 9. AI/ML Components

### LLM Integration (OpenAI GPT-4)

**System Prompt Flow:**
```
Sport-specific context
    ↓
Athlete history (mood trends, goals)
    ↓
Current conversation context
    ↓
RAG: Knowledge base retrieval
    ↓
GPT-4 response with streaming
```

**Models Used:**
| Model | Purpose | Cost |
|-------|---------|------|
| `gpt-4-turbo-preview` | Chat conversations | ~$0.01/1K tokens |
| `text-embedding-3-small` | RAG embeddings | ~$0.0001/1K tokens |
| `whisper-1` | Speech-to-text | ~$0.006/minute |

### ML Components (from COMPONENT_STATUS.md)

| Component | Status | Purpose |
|-----------|--------|---------|
| **Slump Detector** | Tuned (50% recall) | Detect performance decline |
| **Performance Predictor** | Validated (100% high-risk precision) | 7-day risk forecasting |
| **Correlation Engine** | Working | Mental ↔ performance correlations |
| **Intervention Recommender** | 45+ interventions | Evidence-based recommendations |
| **Feature Extractor** | 32 features | ML feature engineering |

### Crisis Detection

**Keywords Monitored:**
- Self-harm language
- Suicidal ideation
- Eating disorder indicators
- Abuse disclosure
- Severe depression patterns

**Escalation Flow:**
```
Message received
    ↓
Keyword + pattern matching
    ↓
If crisis detected:
    → Flag session
    → Notify coach/admin
    → Provide crisis resources
    → Log for compliance
```

---

## 10. Voice Integration

### Speech-to-Text (STT)

| Provider | Status | Use Case |
|----------|--------|----------|
| OpenAI Whisper | Primary | High accuracy |
| Deepgram | Alternative | Lower latency |

### Text-to-Speech (TTS)

| Provider | Status | Use Case |
|----------|--------|----------|
| ElevenLabs | Primary | Natural voices |
| OpenAI TTS | Fallback | Cost-effective |

### Voice Flow
```
Athlete speaks
    ↓
Record audio (Expo AV)
    ↓
Whisper API (STT)
    ↓
Text message to GPT-4
    ↓
GPT-4 response
    ↓
ElevenLabs (TTS)
    ↓
Play audio to athlete
```

---

## 11. Authentication & Security

### Auth Flow

```
User signs up/logs in
    ↓
NextAuth.js creates session
    ↓
JWT token issued (for mobile)
    ↓
Role extracted (ATHLETE/COACH/ADMIN)
    ↓
Routes protected by middleware
    ↓
RLS policies enforce data access
```

### Security Layers

| Layer | Implementation |
|-------|----------------|
| **Transport** | TLS 1.3, HTTPS only |
| **Storage** | Supabase encryption, AES-256 |
| **Database** | PostgreSQL permissions + RLS |
| **API** | Rate limiting, Zod validation |
| **Secrets** | Environment variables only |

### Row-Level Security (RLS)

```sql
-- Example: Athletes can only read their own data
CREATE POLICY athlete_read_own ON "MoodLog"
  FOR SELECT USING (auth.uid() = "athleteId");

-- Coaches can read data of athletes who consented
CREATE POLICY coach_read_consented ON "MoodLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()
        AND "athleteId" = "MoodLog"."athleteId"
        AND "consentGranted" = true
    )
  );
```

---

## 12. Deployment Architecture

### Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| **Development** | localhost:3000 | feature/* | Local development |
| **Staging** | staging.flowsportscoach.com | staging | Pre-production testing |
| **Production** | app.flowsportscoach.com | main | Live users |

### Vercel Configuration

**`vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/escalation", "schedule": "0 0 * * *" },
    { "path": "/api/cron/generate-weekly-summaries", "schedule": "59 23 * * 0" },
    { "path": "/api/cron/cleanup-summaries", "schedule": "0 2 * * *" }
  ]
}
```

### Mobile Deployment (EAS)

```bash
# iOS TestFlight
eas build --platform ios --profile preview

# Android Play Console
eas build --platform android --profile preview
```

---

## 13. Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...

# AI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Voice
ELEVENLABS_API_KEY=sk_...

# Safety
ENABLE_AI_CRISIS_DETECTION=true

# Cost Controls (PRODUCTION CRITICAL)
ENABLE_COST_LIMITS=true
COST_LIMIT_DAILY_PER_USER=100
COST_LIMIT_MONTHLY_TOTAL=500

# Feature Flags
NEXT_PUBLIC_ENV=staging|production
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false  # MUST be false in production
```

### Environment-Specific Settings

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| Demo accounts | Enabled | Optional | **DISABLED** |
| Cost limits | Disabled | Enabled | **ENABLED** |
| Debug routes | Enabled | Enabled | **DISABLED** |
| Logging level | DEBUG | INFO | WARN |

---

## 14. Monitoring & Observability

### Error Tracking (Sentry)

```typescript
// Automatic error capture
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: 1.0,
});
```

### Health Check

```
GET /api/health
→ { status: "ok", database: "connected", openai: "available" }
```

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| API response time | > 3s |
| OpenAI token usage | > $500/day |
| Error rate | > 1% |
| Crisis alerts | Any |

---

## 15. Data Flows

### Chat Message Flow

```
1. Athlete sends message (text/voice)
        ↓
2. API validates input (Zod)
        ↓
3. Crisis detection check
        ↓
4. Cost limit check
        ↓
5. Retrieve athlete context (history, goals, mood)
        ↓
6. RAG: Query knowledge base
        ↓
7. Build prompt with sport-specific context
        ↓
8. Stream response from GPT-4 (SSE)
        ↓
9. Save message to database
        ↓
10. Update chat insights (sentiment, themes)
        ↓
11. Return streaming response to client
```

### Coach Dashboard Flow

```
1. Coach opens dashboard
        ↓
2. Fetch athletes with consent
        ↓
3. Aggregate mood data (7/14/30 day)
        ↓
4. Calculate readiness scores
        ↓
5. Generate risk alerts
        ↓
6. Build intervention queue
        ↓
7. Render heatmap + metrics
```

---

## 16. Production Checklist

### Security (CRITICAL)

- [ ] Demo accounts disabled (`NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false`)
- [ ] RLS policies on all 40+ tables
- [ ] Cost limits enabled (`ENABLE_COST_LIMITS=true`)
- [ ] Rate limiting enabled (`ENABLE_RATE_LIMITING=true`)
- [ ] Debug routes disabled (`ENABLE_DEBUG_ROUTES=false`)
- [ ] All secrets rotated (last 90 days)
- [ ] Audit logging enabled

### Safety

- [ ] Crisis detection enforced
- [ ] Escalation notifications working
- [ ] Crisis resources displayed

### Operations

- [ ] Sentry monitoring configured
- [ ] Backup/restore tested
- [ ] Rollback procedure documented

### Performance

- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] CDN for static assets

---

## Quick Reference

| Need | Location |
|------|----------|
| Chat interface | `apps/web/src/app/chat/` |
| Database schema | `apps/web/prisma/schema.prisma` |
| API routes | `apps/web/src/app/api/` |
| Cost controls | `apps/web/src/lib/cost-tracking.ts` |
| Coach dashboard | `apps/web/src/app/(coach)/` |
| Mobile app | `apps/mobile/` |
| Environment config | `config/environments/` |
| Component status | `COMPONENT_STATUS.md` |

---

*Document generated: February 2026*
