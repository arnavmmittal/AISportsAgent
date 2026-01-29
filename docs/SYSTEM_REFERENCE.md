# AI Sports Agent - System Reference

> **Last Updated**: 2026-01-27
> **Purpose**: Quick reference for Claude Code sessions to understand the full system

---

## Quick Summary

**What it is**: AI-powered sports psychology platform for collegiate athletes, designed to replace 1:1 Zoom meetings at scale (150+ athletes per coach).

**Core value**: 24/7 mental performance support via AI chat, with readiness tracking, performance correlation, and proactive intervention suggestions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEPLOYMENT                                                          │
│  ├─ Vercel: Next.js web app (apps/web)                              │
│  ├─ Railway: Python MCP server (services/mcp-server) - OPTIONAL     │
│  └─ Supabase: PostgreSQL database + Auth                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  TWO AI SYSTEMS (TypeScript is primary, MCP is optional)            │
│                                                                      │
│  TypeScript Agents (apps/web/src/agents/):                          │
│  ├─ AthleteAgent: Chat with 5-step protocol + sport frameworks      │
│  ├─ GovernanceAgent: 3-layer crisis detection                       │
│  ├─ KnowledgeAgent: RAG with PDF knowledge base                     │
│  └─ AgentOrchestrator: Coordinates all agents                       │
│                                                                      │
│  MCP Server (services/mcp-server/):                                 │
│  ├─ Python FastAPI with ML models                                   │
│  ├─ ElevenLabs TTS, Deepgram STT                                    │
│  └─ ChromaDB vector store                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Feature Status Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| **AI Chat** | ✅ Production | GPT-4 streaming, enriched context |
| **Crisis Detection** | ✅ Production | 3-layer: keywords, patterns, AI moderation |
| **Mood Tracking** | ✅ Production | 5 dimensions: mood, confidence, stress, energy, sleep |
| **Readiness Score** | ✅ Production | Real-time composite calculation |
| **Goal Management** | ✅ Production | Hierarchical, AI suggestions |
| **Performance Import** | ✅ Production | CSV bulk import + ESPN auto-sync |
| **Performance Correlation** | ✅ Production | Pearson correlation, p-values, insights |
| **Intervention Tracking** | ✅ Production | Effectiveness scoring per athlete |
| **ML Predictions** | ✅ Built | Rule-based fallback, MCP for trained models |
| **Slump Detection** | ✅ Built | Pattern-based detection |
| **Coach Dashboard** | ✅ Production | Heatmaps, analytics, roster |
| **Voice (Mobile)** | ⏳ Partial | Infrastructure ready, needs testing |
| **Voice (Web)** | ⏳ Partial | VoiceManager exists, not integrated |
| **Wearable Sync** | ⏳ Partial | OAuth done, sync jobs incomplete |
| **Email Notifications** | ⏳ Partial | Infrastructure ready, not wired |

---

## Data Flow

### Athlete Input → AI Response
```
Athlete types message
    ↓
/api/chat/stream validates (Zod schema)
    ↓
AthleteContextService.getEnrichedContext()
├─ Fetch mood logs (last 14 days)
├─ Calculate readiness score
├─ Get ML predictions (risk, slump)
├─ Find effective interventions
└─ Generate proactive insights
    ↓
Orchestrator routes through:
├─ GovernanceAgent (crisis check)
├─ KnowledgeAgent (RAG retrieval)
└─ AthleteAgent (generate response)
    ↓
Stream tokens back + save to DB
```

### Performance Correlation
```
Coach imports game results (CSV or ESPN auto-sync)
    ↓
GameResult / PerformanceMetric stored
    ↓
analyzePerformanceCorrelations()
├─ Match games with mood logs (24h before)
├─ Calculate Pearson correlation
├─ Test statistical significance (p < 0.05)
└─ Generate actionable insights
    ↓
Coach sees: "Mood has 0.72 correlation with performance"
```

### ESPN Auto-Import Flow
```
Coach clicks "Sync from ESPN" on /coach/performance/import
    ↓
POST /api/coach/import-games { source: 'espn', daysBack: 30 }
    ↓
importGamesFromESPN()
├─ Search ESPN for school's team
├─ Fetch completed games (last N days)
├─ Get box scores with player stats
├─ Match athletes by name
├─ Auto-link pre-game mood logs (24h window)
└─ Calculate sport-specific performance rating
    ↓
PerformanceOutcome records created
    ↓
Correlation analysis now has game data to work with
```

---

## Where Correlation Insights Appear

| Page | Component | Data Source |
|------|-----------|-------------|
| `/coach/analytics` (Performance Intelligence tab) | `PerformanceIntelligence.tsx` | `/api/analytics/performance-correlation` |
| `/coach/insights` | `CorrelationChart.tsx` | `/api/analytics/performance-correlation` |
| `/coach/athletes/[id]` | `PerformanceCorrelationMatrix.tsx` | `/api/analytics/performance-correlation?athleteId=X` |

**What's shown:**
- Correlation coefficients (-1 to +1) for each mental metric vs performance
- Statistical significance indicators (p < 0.05)
- Top performance factor identification
- Consistent factors across team (70%+ athletes)
- At-risk athlete predictions based on readiness trends

---

## Key Files

### Core Chat Flow
- `apps/web/src/app/api/chat/stream/route.ts` - Main chat endpoint
- `apps/web/src/agents/core/AgentOrchestrator.ts` - Agent coordination
- `apps/web/src/agents/athlete/AthleteAgent.ts` - Response generation
- `apps/web/src/services/AthleteContextService.ts` - Enriched context + ML predictions

### Analytics & Correlation
- `apps/web/src/lib/analytics/performance-correlation.ts` - Correlation calculations
- `apps/web/src/lib/analytics/correlation.ts` - Statistical functions
- `apps/web/src/lib/analytics/intervention-effectiveness.ts` - Per-athlete intervention tracking
- `apps/web/src/lib/analytics/forecasting.ts` - Readiness prediction (Holt's method)
- `apps/web/src/app/api/analytics/performance-correlation/route.ts` - API endpoint
- `apps/web/src/components/coach/analytics/PerformanceIntelligence.tsx` - Real-time correlation dashboard
- `apps/web/src/components/coach/analytics/PerformanceCorrelationMatrix.tsx` - Per-athlete correlation chart

### AI Insights (Plain-English Analytics)
- `apps/web/src/app/api/coach/ai-insights/route.ts` - Aggregates all analytics into insights
- `apps/web/src/app/coach/ai-insights/page.tsx` - Main showcase page
- `apps/web/src/components/coach/insights/InsightCard.tsx` - Insight display components

### Game Import (ESPN + CSV)
- `apps/web/src/lib/sports-data/espn-api.ts` - ESPN unofficial API client
- `apps/web/src/lib/sports-data/game-importer.ts` - Import orchestration
- `apps/web/src/app/api/coach/import-games/route.ts` - Import API (ESPN + CSV)
- `apps/web/src/app/coach/performance/import/page.tsx` - Import UI with ESPN sync button

### Knowledge Base
- `apps/web/knowledge_base/chunks.json` - Pre-processed PDF chunks (37 chunks)
- `apps/web/src/agents/knowledge/KnowledgeAgent.ts` - RAG retrieval
- `apps/web/src/lib/pdf-knowledge-loader.ts` - Chunk loader

### Database
- `apps/web/prisma/schema.prisma` - 41 models
- Key tables: User, Athlete, MoodLog, ChatSession, Message, GameResult, PerformanceMetric, Goal, Intervention

### Validation
- `apps/web/src/lib/validation.ts` - Zod schemas (supports UUID + CUID)

---

## Environment Variables (Key Ones)

```bash
# Required for chat
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Database
DATABASE_URL=postgresql://...

# Auth
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional: MCP Server
MCP_SERVER_URL=https://your-railway-url.up.railway.app
USE_MCP_SERVER=true  # Set to use Python MCP instead of TypeScript agents

# Optional: Voice
ELEVENLABS_API_KEY=...  # Only needed if MCP server is used
```

---

## API Routes (Key Ones)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/stream` | POST | Main chat (TypeScript agents) |
| `/api/chat/stream-mcp` | POST | Chat via MCP server |
| `/api/mood-logs` | POST/GET | Log/retrieve mood |
| `/api/goals` | POST/GET | Manage goals |
| `/api/performance/import` | POST | CSV import (legacy) |
| `/api/coach/import-games` | POST/GET | ESPN auto-sync + CSV import |
| `/api/analytics/performance-correlation` | GET | Correlation analysis |
| `/api/coach/analytics/team-heatmap` | GET | Team readiness heatmap |
| `/api/coach/athletes` | GET | Athlete roster |
| `/api/coach/athletes/[id]` | GET | Athlete detail |
| `/api/interventions` | POST/GET | Track interventions |
| `/api/coach/ai-insights` | GET | Plain-English ML insights aggregation |

---

## Pages (Key Ones)

### Athlete
- `/student/ai-coach` - Chat interface (main feature)
- `/student/wellness` - Mood check-in
- `/student/goals` - Goal management
- `/student/dashboard` - Overview

### Coach
- `/coach/dashboard` - Command center (with AI Insights banner)
- `/coach/ai-insights` - **ML-powered insights showcase (correlations, predictions, interventions)**
- `/coach/athletes` - Roster view
- `/coach/athletes/[id]` - Individual athlete (includes correlation matrix)
- `/coach/analytics` - Analytics dashboard (Performance Intelligence tab)
- `/coach/insights` - Combined analytics with reports
- `/coach/performance/import` - **ESPN sync + CSV import**
- `/coach/readiness` - Team heatmap

---

## What's Actually Connected (Staging)

| Component | Connected? | Notes |
|-----------|-----------|-------|
| Vercel → Supabase | ✅ Yes | Database working |
| Chat → OpenAI | ✅ Yes | GPT-4 streaming |
| Knowledge RAG | ✅ Yes | PDF chunks loaded |
| Crisis Detection | ✅ Yes | 3-layer system |
| ML Predictions | ✅ Local | Rule-based fallback |
| ESPN Auto-Import | ✅ Yes | Manual sync via UI button |
| Performance Correlation | ✅ Yes | Real-time analysis with Pearson r |
| MCP Server | ❌ No | Not configured |
| ElevenLabs | ❌ No | Only in MCP |
| Wearables | ⏳ OAuth only | Sync not running |

---

## Common Issues & Fixes

### 400 on /api/chat/stream
- **Cause**: session_id validation (CUID vs UUID)
- **Fix**: `sessionIdSchema` now accepts both formats (Jan 2025)

### 500 on dashboard APIs
- **Cause**: Missing data or Prisma query errors
- **Fix**: Added individual try/catch blocks per query

### MCP not working
- **Check**: `MCP_SERVER_URL` and `USE_MCP_SERVER` env vars
- **Note**: TypeScript agents work without MCP

---

## Testing Accounts (Staging)

Seeded accounts (password: same as email prefix):
- `athlete1@uw.edu` through `athlete50@uw.edu`
- `coach@uw.edu`

---

## Branch Strategy

- `main` - Production (live users)
- `staging` - Pre-production testing
- `feature/*` - Development work

**Current**: Using TypeScript agents on staging (simpler), MCP for production later.

---

## Quick Commands

```bash
# Development
cd apps/web && pnpm dev

# Database
pnpm prisma:studio    # GUI
pnpm prisma:seed      # Seed test data

# Type check
npx tsc --noEmit

# Deploy to staging
git push origin staging  # Auto-deploys to Vercel
```

---

## What's NOT Built Yet

1. **Email/SMS notifications** - Infrastructure ready, not wired
2. **Wearable data sync** - OAuth done, background jobs missing
3. **Web voice integration** - VoiceManager exists, not in chat UI
4. **Cost controls enforcement** - Tracking exists, limits not enforced
5. **Automatic ESPN cron job** - Manual sync works, scheduled sync not set up

## What WAS Built Recently (Jan 2026)

1. **ESPN Auto-Import** - `/coach/performance/import` now has ESPN sync button
2. **Real Correlation Dashboard** - `PerformanceIntelligence.tsx` uses live API data
3. **CUID/UUID validation fix** - Chat no longer fails on Prisma-generated IDs
4. **AI Insights Dashboard** - `/coach/ai-insights` - Dedicated showcase for ML analytics
   - Plain-English insights: "Sarah's mood is 72% correlated with free throw percentage"
   - Aggregates correlations, intervention effectiveness, and risk predictions
   - Category filtering: Correlations, Interventions, Patterns, Alerts
   - Featured insight hero card for top finding
   - API: `/api/coach/ai-insights`
   - Components: `InsightCard.tsx`, `FeaturedInsightCard.tsx`, `InsightSummaryBar.tsx`

---

## Contact & Resources

- **Repo**: https://github.com/arnavmmittal/AISportsAgent
- **Docs**: `/docs/` folder
- **MVP Status**: `/docs/archive/MVP_STATUS.md`
