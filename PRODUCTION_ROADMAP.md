# AI Sports Agent - Production Roadmap & Cost Analysis

**Last Updated**: 2025-12-12

---

## Table of Contents
1. [Cost Analysis](#cost-analysis)
2. [Current Architecture](#current-architecture)
3. [End Goal Architecture](#end-goal-architecture)
4. [Path to Production](#path-to-production)
5. [Cost Projections](#cost-projections)
6. [Testing Strategy](#testing-strategy)

---

## Cost Analysis

### Current Cost Breakdown

**OpenAI API Costs (Primary Expense):**
- **GPT-4 Turbo**: $10/1M input tokens, $30/1M output tokens
- **Whisper (voice transcription)**: $0.006/minute
- **TTS (text-to-speech)**: $15/1M characters

**Per Conversation Estimates:**
| Type | Duration | Cost |
|------|----------|------|
| Text chat | 5-10 turns | $0.10-0.20 |
| Voice conversation | 5 minutes | $0.20-0.30 |

**Supabase (Database):**
- **Free tier**: 500MB database, 2GB bandwidth, 50,000 MAU
- **Current usage**: Well within free tier limits ✅
- **Cost**: $0/month for MVP

**ChromaDB (Vector Database):**
- Self-hosted locally: **FREE**
- No cloud costs

**Expo (Mobile Development):**
- Free tier: **FREE** for development and testing

### Testing Cost Scenarios

| Scenario | Conversations | Estimated Cost |
|----------|--------------|----------------|
| Light testing (you + 2-3 friends, 2 weeks) | 50-100 | $10-30 |
| MVP validation (10-20 athletes, 2 weeks) | 200-500 | $40-150 |
| Pilot program (50 athletes, 2 weeks) | 500-1,500 | $100-450 |
| Full team launch (100+ athletes, ongoing) | 2,000-5,000/month | $400-1,500/month |

### Cost Optimization Strategies

**1. Set OpenAI API Usage Limits (CRITICAL!)**
```
Action: Go to https://platform.openai.com/account/limits
- Set hard limit: $50-100/month
- Set email alerts: $25, $50, $75
```

**2. Model Selection by Use Case**
- **Crisis detection**: GPT-4 (critical, need accuracy)
- **Main conversations**: GPT-4 Turbo (quality + cost balance) ✅ Currently using
- **Summaries/tags**: GPT-3.5-turbo (80% cheaper, good enough)

**3. Progressive Feature Rollout**

**Phase 1: MVP Essentials** ($50-150 budget)
- ✅ Text chat with protocol-guided conversations
- ✅ Session history
- ✅ Basic mood tracking
- ✅ Goal setting
- ⚠️ **Skip voice initially** (saves 50% of costs)

**Phase 2: Voice & Advanced** ($200-500 budget)
- Enable voice conversations
- Practice drill generation
- Routine builder
- Coach analytics

**4. Implement Caching** (20-30% cost reduction)
```python
# Cache common responses:
- Greeting messages
- FAQ responses
- Common intervention frameworks
```

**5. Real-time Monitoring**
```
Dashboard: https://platform.openai.com/usage
Check daily during testing
Set up cost alerts
```

---

## Current Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (React Native/Expo)    Web App (Next.js 14)    │
│  - Voice chat UI                   - Dashboard              │
│  - Text chat UI                    - Chat interface         │
│  - Dashboard                       - Coach analytics         │
│  - Mood/Goals tracking             - Admin panel            │
└────────────┬────────────────────────────┬───────────────────┘
             │ HTTP/WebSocket             │ HTTP/SSE
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│           AI Sports MCP Server (FastAPI - Python)           │
│  ┌──────────────────────────────────────────────────────────┐
│  │  MCP AGENT ORCHESTRATION                                 │
│  │  ┌────────────────┐  ┌─────────────────┐                │
│  │  │ AthleteAgent   │  │ KnowledgeAgent  │                │
│  │  │ - 6-phase      │  │ - RAG retrieval │                │
│  │  │   protocol     │  │ - ChromaDB      │                │
│  │  │ - Structured   │  │ - Embeddings    │                │
│  │  │   responses    │  │ - Citation      │                │
│  │  └────────────────┘  └─────────────────┘                │
│  │  ┌────────────────┐  ┌─────────────────┐                │
│  │  │GovernanceAgent │  │ CoachAgent      │                │
│  │  │ - Crisis detect│  │ - Team analytics│                │
│  │  │ - Safety       │  │ - Insights      │                │
│  │  └────────────────┘  └─────────────────┘                │
│  └──────────────────────────────────────────────────────────┘
│                                                              │
│  API Routes:                                                │
│  - POST /api/chat/stream (SSE streaming)                    │
│  - WebSocket /api/voice/stream (bidirectional voice)        │
│  - GET /api/kb/query (knowledge base search)                │
│  - GET /api/report/weekly (coach summaries)                 │
└────────────┬─────────────────────────┬──────────────────────┘
             │                         │
             ▼                         ▼
┌──────────────────────┐    ┌───────────────────────┐
│  DATABASE LAYER      │    │  EXTERNAL SERVICES    │
├──────────────────────┤    ├───────────────────────┤
│ Supabase PostgreSQL  │    │ OpenAI API            │
│ - 23 tables          │    │ - GPT-4 Turbo         │
│ - Prisma ORM (web)   │    │ - Whisper (STT)       │
│ - SQLAlchemy (MCP)   │    │ - TTS                 │
│                      │    │                       │
│ ChromaDB (Vector DB) │    │ Cartesia (backup TTS) │
│ - Local/self-hosted  │    └───────────────────────┘
│ - Sports psych KB    │
└──────────────────────┘
```

### Key Components

**1. AthleteAgent (Core AI)**
- 6-phase Discovery-First protocol: CHECK_IN → CLARIFY → FORMULATION → INTERVENTION → PLAN → WRAP_UP
- Structured JSON responses with:
  - Human-readable text
  - Action plans (today/this week/next competition)
  - Practice drills (mental → physical integration)
  - Pre-performance routines with timer-based cues
  - Tracking metrics

**2. KnowledgeAgent (RAG System)**
- Sports psychology knowledge base (PDFs → ChromaDB)
- Semantic search with sport-specific filtering
- Reranking by: semantic similarity + sport relevance + evidence quality
- Citation tracking for transparency

**3. GovernanceAgent (Safety)**
- Crisis detection (self-harm, depression, eating disorders, abuse)
- Automatic escalation to human counselors
- Audit logging for HIPAA/FERPA compliance

**4. Session Context System**
- Conversation history (last 10 messages)
- Athlete profile (sport, position, year)
- Recent mood logs (last 3 days average)
- Active goals (IN_PROGRESS status)
- Upcoming games (next 3 scheduled)
- Athlete memory (cross-session patterns, effective techniques)

**5. Database Schema (23 Tables)**
```
Core Users:
├─ User (base user model)
├─ Athlete (sport-specific data)
├─ Coach (team info)
└─ School (multi-tenancy)

Conversations:
├─ ChatSession (protocol-guided sessions)
├─ Message (conversation history)
├─ ConversationInsight (AI-detected patterns)
└─ CrisisAlert (safety escalations)

Athlete Data:
├─ MoodLog (daily check-ins)
├─ Goal (performance, mental, academic)
├─ PerformanceMetric (game stats + mental state)
├─ Assignment (homework from sessions)
└─ AthleteMemory (cross-session learning) *in progress*

Coach Analytics:
├─ ChatSummary (session summaries)
├─ TeamInsight (aggregated trends)
└─ ConsentLog (FERPA/HIPAA compliance)

Knowledge Base:
├─ KnowledgeBase (sports psych research)
└─ Citation (evidence tracking)
```

### Current Implementation Status

**✅ Completed (Phases 1-5):**
- Session context loading with conversation history
- Structured JSON responses
- 6-phase protocol state machine
- RAG knowledge retrieval with sport filtering
- Practice drill generator (8 mental skills × 6 sports)
- Pre-performance routine builder
- Voice conversations (Whisper STT + OpenAI TTS)
- Mobile app with welcome screen
- Crisis detection system
- Database schema fully defined

**🚧 In Progress (Phase 6):**
- Voice-first redesign with audio cues
- Evaluation harness (metrics, test cases)

**📋 Planned (Future):**
- Athlete memory system (stable traits + transient state)
- Pressure simulator (mental rehearsal)
- Coach dashboard v2 (team analytics)
- HIPAA/FERPA compliance audit
- Email notifications
- Mobile push notifications

---

## End Goal Architecture (Production Vision)

### Enhanced Features

**1. Multi-Tenancy**
- Row-level security by `school_id`
- Separate vector collections per institution
- Custom frameworks per school
- Configurable data retention policies

**2. Advanced Coach Dashboard**
- Team mental health trends (anonymized)
- Pre-game readiness scores (aggregated)
- Crisis alert dashboard
- Performance correlation analytics
- Intervention effectiveness tracking

**3. HIPAA/FERPA Compliance**
- Encryption at rest (PostgreSQL native encryption)
- TLS for all data in transit
- Role-based access control (RBAC)
- Comprehensive audit logs
- Athlete consent management
- Coach access requires explicit opt-in

**4. Pressure Simulator**
- Script-based mental rehearsal
- Sport-specific pressure scenarios
- Guided visualization exercises
- Progressive difficulty levels

**5. Athlete Memory System**
- **Stable traits**: Anxiety patterns, effective techniques, learning style
- **Transient state**: Current stress, upcoming events, recent sleep
- **Technique outcomes**: Track what works, adherence rates
- **Decay rules**: Stale data expires, requires re-confirmation

---

## Path to Production

### Phase 1: MVP Validation (2-4 weeks, $100-300)

**Goal**: Validate product-market fit with real athletes

**✅ Already Completed:**
- Core chat functionality working
- Voice conversations working
- Database schema complete
- Mobile app with welcome screen
- Protocol-guided conversations

**📋 Remaining Work:**
1. **Bug fixes from testing**
   - Edge cases in conversation flow
   - Voice quality improvements (reduce latency)
   - Mobile UX polish (loading states, error handling)

2. **Basic analytics tracking**
   ```python
   # Key metrics:
   - Daily active users
   - Messages per session
   - Session duration
   - Voice vs text usage ratio
   - Feature engagement (goals, mood logs)
   - Crisis detection frequency
   ```

3. **In-app feedback collection**
   - Simple feedback form after sessions
   - Weekly user surveys
   - Feature request tracking

**Testing Plan:**
- **Week 1-2**: Internal testing (you + 2-3 friends)
  - Cost: $10-30
  - Focus: Bug hunting, UX issues
  - Target: 50-100 test conversations

- **Week 3-4**: Pilot program (5-10 real athletes)
  - Cost: $70-150
  - Focus: Real-world validation
  - Target: 300-500 conversations
  - Success metrics: 60%+ weekly active, 3+ sessions/week/user

---

### Phase 2: Pre-Production Hardening (4-6 weeks, $500-1,500)

**Goal**: Production-ready infrastructure and security

#### Infrastructure Deployment

**Option A: Simple Stack (Recommended for MVP)**
```
Mobile App (Expo) → Web API (Vercel) → MCP Server (Railway) → Supabase PostgreSQL
                                      → ChromaDB (Railway)
```

**Monthly Costs:**
- **Vercel**: FREE (Hobby tier) or $20/month (Pro)
- **Railway**: $5-20/month (MCP server) + $10/month (ChromaDB)
- **Supabase**: FREE tier → $25/month (Pro) at 100+ users
- **Total**: **$0-65/month**

**Option B: Scalable Stack (For 500+ users)**
```
Mobile App → CloudFront CDN → ECS/Fargate (MCP) → RDS PostgreSQL
Web App → CloudFront CDN                        → OpenSearch (vector DB)
                                                 → ElastiCache (Redis cache)
```

**Monthly Costs:**
- **AWS**: $200-500/month for 500-1,000 active users
- Better scalability, monitoring, security

#### Deployment Steps (Railway/Vercel)

**1. Deploy MCP Server to Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
cd ai-sports-mcp/server
railway init

# Deploy
railway up

# Set environment variables in Railway dashboard:
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
CARTESIA_API_KEY=...
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
```

**2. Deploy Web App to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod

# Set environment variables in Vercel dashboard:
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate-secure-random>
NEXTAUTH_URL=https://yourdomain.com
OPENAI_API_KEY=sk-...
```

**3. Build Mobile App with EAS**
```bash
# Configure EAS
cd apps/mobile
npm install -g eas-cli
eas login

# Update environment
# Edit apps/mobile/.env.production
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_VOICE_URL=wss://api.yourdomain.com

# Build for iOS and Android
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

#### Security Hardening

**1. API Rate Limiting**
```python
# ai-sports-mcp/server/app/main.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/chat/stream")
@limiter.limit("20/minute")  # 20 requests per minute per IP
async def chat_stream(...):
    ...
```

**2. Authentication Improvements**
```typescript
// Implement refresh tokens (currently 7-day JWTs)
// Add session invalidation on logout
// Device tracking for suspicious activity
// IP allowlisting for admin routes
```

**3. Data Encryption**
```sql
-- Enable pgcrypto in PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive message content
ALTER TABLE "Message" ADD COLUMN content_encrypted BYTEA;

-- Migration: plaintext → encrypted
UPDATE "Message" SET content_encrypted = pgp_sym_encrypt(content, 'encryption-key');
```

**4. CORS Configuration**
```python
# Production CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://api.yourdomain.com",
        # Remove "*" wildcard in production!
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### Monitoring & Observability

**Tools to Set Up:**

1. **Sentry** (Error Tracking)
   - Free tier: 5,000 events/month
   - Paid: $26/month for 50,000 events
   - Tracks: Exceptions, performance issues, user context

2. **LogRocket** (Session Replay)
   - $99/month for 10,000 sessions
   - Records: User interactions, console logs, network requests

3. **Vercel Analytics** (Web App)
   - Built-in for Next.js
   - Free tier available

4. **Railway Logs** (MCP Server)
   - Built-in log aggregation
   - Search and filter capabilities

**Key Metrics to Monitor:**
```python
# Application Performance
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- OpenAI API latency
- Database query performance
- WebSocket connection stability

# Business Metrics
- Daily/Weekly active users
- Session duration (avg, median)
- Messages per session
- Crisis alerts triggered
- Voice vs text usage ratio
- Feature engagement (goals, mood, assignments)
```

#### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          cd apps/web && npm install
          cd ../.. && cd ai-sports-mcp/server && pip install -r requirements.txt

      - name: Run tests
        run: |
          cd apps/web && npm run test
          cd ../.. && cd ai-sports-mcp/server && pytest

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-mcp:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service=mcp-server
```

---

### Phase 3: Scale to 100+ Users (Ongoing)

#### Cost Optimization

**1. Model Selection by Use Case**
```python
# High-priority (use GPT-4 Turbo)
- Main athlete conversations
- Crisis detection
- Protocol phase transitions

# Medium-priority (use GPT-3.5-turbo)
- Session summaries
- Tag generation
- Knowledge base queries

# Low-priority (use embeddings only)
- Semantic search (no LLM needed)
```

**2. Response Caching**
```python
# Implement Redis cache on Railway ($10/month)
import redis
from functools import lru_cache

cache = redis.Redis(host='redis-railway-url', port=6379)

@lru_cache(maxsize=1000)
def get_common_response(message_hash):
    # Cache FAQ responses, greetings, common interventions
    return cache.get(message_hash)
```

**3. Batch Processing**
```python
# Batch non-urgent operations
- Session summaries (run nightly)
- Team analytics (weekly batch job)
- Email notifications (hourly digest)
```

**4. Streaming Optimization**
```python
# Already implemented ✅
# Continue using SSE streaming for all chat responses
# Reduces perceived latency, improves UX
```

#### Scaling Infrastructure

**Railway Auto-Scaling:**
- Automatically scales up to 8GB RAM
- Horizontal scaling available on Pro plan
- Cost: $20-50/month for 100-500 users

**AWS ECS (for 1000+ users):**
- Fargate auto-scaling
- Application Load Balancer
- CloudWatch monitoring
- Cost: $200-500/month

**Database Scaling:**
- **Supabase**: Pro tier supports 10,000+ concurrent users
- **Connection pooling**: PgBouncer (included in Railway/Supabase)
- **Read replicas**: For coach analytics queries (separate from athlete writes)

---

## Cost Projections (Full Lifecycle)

| Stage | Users | Duration | Monthly Cost | Breakdown |
|-------|-------|----------|--------------|-----------|
| **MVP Testing** | 5-10 | 2-4 weeks | $50-100 | OpenAI ($50) + Infrastructure ($0-50) |
| **Pilot Program** | 50-100 | 1-3 months | $300-600 | OpenAI ($200-400) + Railway ($50) + Supabase ($25) + Monitoring ($50) |
| **Single Team** | 200-500 | Ongoing | $800-1,500 | OpenAI ($500-1,000) + Railway ($100) + Supabase ($50) + Tools ($150) |
| **Multi-School** | 1,000-2,000 | Ongoing | $2,500-5,000 | OpenAI ($1,500-3,000) + AWS ($500-1,000) + DB ($300) + Operations ($500) |

### Revenue Requirements (Break-Even Analysis)

**Pricing Models:**

1. **Per-Athlete Subscription**
   - MVP: $5-10/athlete/month
   - Scale: $3-5/athlete/month (volume discounts)
   - Example: 100 athletes × $5/month = $500/month revenue

2. **Per-Team Licensing**
   - Small team (20-30 athletes): $100-150/month
   - Medium team (30-50 athletes): $200-300/month
   - Large team (50+ athletes): $400-600/month

3. **Institutional Contract**
   - Per-school annual license: $5,000-15,000/year
   - Covers all teams (100-500 athletes)
   - Includes coach dashboards, custom integrations

**Break-Even Analysis (100 athletes):**
```
Monthly Costs: $600
Required Revenue: $600
Per-Athlete Price: $6/month
Or: 5 teams × $120/month
```

---

## Testing Strategy

### Local Testing Setup (Current)

**Architecture:**
```
Your Laptop:
├─ MCP Server (localhost:8000)
├─ Web App (localhost:3000)
└─ ChromaDB (local file storage)

Your Phone:
└─ Mobile App (connects to laptop IP on same WiFi)

Friends' Phones:
└─ Mobile App (connect to laptop IP on same WiFi)
```

**Pros:**
- ✅ Zero infrastructure costs
- ✅ Full control and debugging
- ✅ Fast iteration

**Cons:**
- ❌ Your laptop must stay on and connected
- ❌ All testers must be on same WiFi network
- ❌ Difficult for remote testing

### Recommended Testing Setup (Deploy Backend)

**Architecture:**
```
Railway (Cloud):
├─ MCP Server (https://your-app.railway.app)
└─ ChromaDB (persistent storage)

Supabase (Cloud):
└─ PostgreSQL (already deployed)

Testers (Anywhere):
├─ Mobile App (connects to Railway backend)
└─ Web App (Vercel preview or local)
```

**Pros:**
- ✅ Your laptop can be off
- ✅ Testers can be anywhere with internet
- ✅ More realistic production environment
- ✅ Easier to onboard new testers

**Costs:**
- Railway: $5-10/month (Starter plan)
- Supabase: FREE tier (already using)
- OpenAI: Pay-as-you-go (same as local)

**Setup Time:** ~30 minutes

---

## Immediate Next Steps (Action Items)

### Before Testing (Do These First!)

1. **✅ Set OpenAI Usage Limits**
   - Go to: https://platform.openai.com/account/limits
   - Hard limit: $100/month
   - Email alerts: $25, $50, $75

2. **✅ Document Current Status**
   - This file serves as roadmap ✅
   - Share with stakeholders
   - Track progress in PLAN.md

3. **📋 Choose Testing Method** (see TESTING_GUIDE.md for details)
   - Option A: Local testing (free, same WiFi required)
   - Option B: Railway deployment (small cost, anywhere access)

4. **📋 Recruit Test Users**
   - 2-3 close friends first
   - Then 5-10 real athletes
   - Prepare feedback forms

5. **📋 Set Up Analytics** (Optional but recommended)
   - Google Analytics for web
   - Amplitude or Mixpanel for mobile
   - Track key engagement metrics

### During Testing (Weekly Checklist)

- [ ] Monitor OpenAI usage (check dashboard daily)
- [ ] Collect user feedback (weekly surveys)
- [ ] Review error logs (Sentry if deployed)
- [ ] Track key metrics (DAU, sessions/user, message count)
- [ ] Iterate on UX issues
- [ ] Document bugs in GitHub Issues

### After Validation (If Athletes Love It)

- [ ] Deploy to Railway + Vercel
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Implement rate limiting
- [ ] Add CI/CD pipeline
- [ ] Launch pilot with 50-100 athletes
- [ ] Prepare pricing model
- [ ] Plan for scale (AWS migration if needed)

---

## Resources & Links

**Deployment Platforms:**
- Railway: https://railway.app
- Vercel: https://vercel.com
- Expo EAS: https://expo.dev/eas

**Monitoring Tools:**
- Sentry: https://sentry.io
- LogRocket: https://logrocket.com
- Vercel Analytics: Built-in

**OpenAI:**
- API Dashboard: https://platform.openai.com
- Usage Limits: https://platform.openai.com/account/limits
- Pricing: https://openai.com/pricing

**Database:**
- Supabase Dashboard: https://supabase.com/dashboard/project/ccbcrerrnkqqgxtlqjnm

**Documentation:**
- Implementation Plan: `.claude/plans/snazzy-napping-ember.md`
- Network Setup: `NETWORK_SETUP.md`
- Getting Started: `GETTING_STARTED.md`
- Testing Guide: `TESTING_GUIDE.md` (to be created)

---

**End of Production Roadmap**
