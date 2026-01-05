# Production Security & Architecture Runbook: AI Sports Agent

## Executive Summary

**Objective:** Transform AI Sports Agent from MVP prototype to production-ready SaaS platform with enterprise-grade security, supporting multiple universities at $200K/year pricing.

**Current State:** 55/100 production readiness
- ✅ Excellent database schema (40 tables, RLS policies)
- ✅ MCP server architecture designed (Python FastAPI)
- ✅ Multi-tenant foundation (schoolId isolation)
- ❌ Critical security gaps: no input validation, no cost controls, no encryption
- ❌ MCP server has empty implementations (scaffolding only)

**Target Architecture:**
```
[Web/Mobile Clients]
        ↓ HTTPS + JWT
[Next.js API Gateway] ←→ [Supabase Auth + DB]
        ↓ Internal API + Service Token
[MCP Server (FastAPI)] ←→ [ChromaDB Vector Store]
        ↓ Server-only API keys
[OpenAI/Anthropic LLMs]
```

**Critical Path:** 3 deliverables created
1. `ProductionSecurityRunbook.md` - Complete security playbook (12 sections) ✅
2. Update `CLAUDE.md` - Add production guardrails section
3. Implementation files - Docker, CI/CD, security middleware, env templates

---

## Section 1: Catastrophic Failure Modes & Launch Blockers

### What "Production" Means

- Multi-university SaaS deployment supporting 600+ athletes per school
- 99.9% uptime SLA with <200ms p95 latency for chat responses
- FERPA-compliant data handling with audit trails
- Crisis detection with <5 minute response time
- Cost controls preventing runaway LLM spend (circuit breakers at $500/day)

### Top 10 Catastrophic Failure Modes

1. **Cross-tenant data leak** - Coach at University A sees University B athletes
   - Impact: FERPA violation, contract termination, lawsuits
   - Current risk: HIGH (RLS policies untested in production)

2. **Auth bypass** - Athlete accesses coach-only endpoints
   - Impact: Privacy breach, unauthorized access to sensitive summaries
   - Current risk: HIGH (JWT validation incomplete on mobile)

3. **Runaway LLM costs** - No token limits, user spams API
   - Impact: $10,000+ bill in 24 hours
   - Current risk: CRITICAL (zero cost controls implemented)

4. **Crisis detection failure** - Suicidal ideation not flagged
   - Impact: Student harm, legal liability, reputation damage
   - Current risk: HIGH (regex-only detection, no AI layer)

5. **Prompt injection** - Malicious user extracts other users' chat data via RAG
   - Impact: Privacy breach, data exfiltration
   - Current risk: MEDIUM (no tenant filters on vector search)

6. **Secret leakage** - API keys logged or exposed in client bundle
   - Impact: Unauthorized access, cost abuse, data theft
   - Current risk: MEDIUM (demo accounts hardcoded, secrets in .env)

7. **Session hijacking** - Attacker steals JWT, impersonates user
   - Impact: Full account compromise
   - Current risk: MEDIUM (no token refresh, no device binding)

8. **SQL injection** - Unvalidated input in Prisma queries
   - Impact: Database compromise, data deletion
   - Current risk: MEDIUM (Prisma provides some protection, but gaps exist)

9. **XSS in chat interface** - Malicious athlete injects script via chat message
   - Impact: Session theft, phishing attacks on coaches
   - Current risk: MEDIUM (React escapes by default, but markdown rendering risky)

10. **DoS via voice API** - Attacker spams WebSocket connections
    - Impact: Service degradation, legitimate users blocked
    - Current risk: HIGH (no rate limiting, no connection limits)

### Top 10 Launch Blockers

1. ❌ Input validation on all API routes (Zod schemas)
2. ❌ Cost control middleware with circuit breakers
3. ❌ AI-powered crisis detection (not just regex)
4. ❌ Field-level encryption for ChatSummary.summary
5. ❌ Rate limiting (per-user, per-tenant, global)
6. ❌ Remove demo account logic from production code
7. ❌ JWT validation on mobile app requests
8. ❌ Audit logging for all sensitive data access
9. ❌ RLS policy testing against live Supabase instance
10. ❌ Environment separation (dev/staging/prod secrets)

### Top 10 Day-2 Improvements (Post-Launch)

1. Advanced monitoring (Sentry, Datadog, custom dashboards)
2. Automated backup/restore with 15-minute RPO
3. Multi-region deployment for 99.99% availability
4. GraphQL API layer for efficient mobile data fetching
5. Real-time WebSocket notifications (replace SSE)
6. Advanced analytics (multi-modal correlation already designed)
7. White-label portals per university
8. HIPAA compliance audit + BAA with universities
9. Penetration testing by third-party security firm
10. SOC 2 Type II certification

---

## Section 2: Target Architecture & Data Flow

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC INTERNET                          │
└────────────────┬────────────────────────────┬───────────────────┘
                 │                            │
                 │ HTTPS (TLS 1.3)            │ HTTPS
                 ↓                            ↓
        ┌─────────────────┐          ┌──────────────────┐
        │   Web Client    │          │  Mobile Client   │
        │   (Next.js)     │          │  (React Native)  │
        │                 │          │                  │
        │  - Auth UI      │          │  - Auth UI       │
        │  - Chat UI      │          │  - Chat UI       │
        │  - Dashboard    │          │  - Offline sync  │
        └─────────────────┘          └──────────────────┘
                 │                            │
                 │ JWT Bearer Token           │ JWT Bearer Token
                 ↓                            ↓
        ┌─────────────────────────────────────────────┐
        │         Next.js API Gateway                 │ ← TRUST BOUNDARY 1
        │         (apps/web/src/app/api)              │
        │                                             │
        │  - Validate JWT (NextAuth.js)              │
        │  - Lightweight endpoints                    │
        │  - Proxy to MCP Server                      │
        │  - Static file serving                      │
        └──────────────┬──────────────────────────────┘
                       │
                       │ Internal Network
                       │ Service-to-Service Token
                       │ (not exposed to internet)
                       ↓
        ┌──────────────────────────────────────────────┐
        │         MCP Server (FastAPI)                 │ ← TRUST BOUNDARY 2
        │         (services/mcp-server)                │
        │                                              │
        │  Routes:                                     │
        │    POST /v1/chat/stream                     │
        │    POST /v1/chat/analyze                    │
        │    GET  /v1/coach/summaries                 │
        │    POST /v1/voice/stream (WebSocket)        │
        │    POST /v1/knowledge/ingest                │
        │                                              │
        │  Agent Runtime:                              │
        │    - AthleteAgent (Discovery protocol)      │
        │    - GovernanceAgent (Crisis detection)     │
        │    - KnowledgeAgent (RAG)                   │
        │    - CoachAgent (Analytics)                 │
        │                                              │
        │  Services:                                   │
        │    - ProtocolPhaseManager                   │
        │    - InterventionSelector                   │
        │    - RAGQueryRewriter                       │
        │    - SessionContext                         │
        │    - EscalationWorkflows                    │
        │    - RoutineBuilder                         │
        └───────┬──────────────┬───────────────────────┘
                │              │
                │              │ Tenant-scoped queries
                ↓              ↓
   ┌────────────────────┐   ┌─────────────────────┐
   │  Supabase Auth+DB  │   │  ChromaDB (Vector)  │ ← TRUST BOUNDARY 3
   │                    │   │                     │
   │  - RLS Policies    │   │  - Collections per  │
   │  - Multi-tenant    │   │    tenant           │
   │  - Audit logs      │   │  - Metadata filters │
   └────────────────────┘   └─────────────────────┘
                │
                │ Server-only API keys
                ↓
        ┌────────────────────┐
        │  OpenAI/Anthropic  │ ← TRUST BOUNDARY 4
        │                    │
        │  - GPT-4 Turbo     │
        │  - Text embeddings │
        │  - Whisper STT     │
        └────────────────────┘
```

### Trust Boundaries Explained

**TB1: Public Internet → Next.js**
- Threat: Unauthenticated access, credential stuffing, XSS
- Defense: NextAuth session validation, CSRF tokens, Vercel DDoS protection
- Validation: JWT signature verification on every request

**TB2: Next.js → MCP Server**
- Threat: Bypassing Next.js auth, service impersonation
- Defense: Internal network isolation, service-to-service token
- Validation: MCP verifies JWT + checks service token in header

**TB3: MCP Server → Databases**
- Threat: Cross-tenant queries, RLS bypass, unauthorized reads
- Defense: Supabase RLS (canonical), tenant filters on ChromaDB queries
- Validation: Every query includes `WHERE schoolId = :tenant`

**TB4: MCP Server → LLM APIs**
- Threat: Prompt injection, data exfiltration, cost abuse
- Defense: Server-only API keys, PII redaction, strict token limits
- Validation: Schema validation before sending, response sanitization

### Endpoint Communication Matrix

| Source | Destination | Protocol | Auth Method | Data Classification |
|--------|-------------|----------|-------------|---------------------|
| Web UI | Next.js API | HTTPS | JWT (session) | Public + User PII |
| Mobile | Next.js API | HTTPS | JWT (bearer) | Public + User PII |
| Next.js | MCP Server | HTTP (internal) | Service token + JWT | User PII + Chat data |
| MCP Server | Supabase DB | PostgreSQL | Connection string | All data (RLS enforced) |
| MCP Server | ChromaDB | HTTP | API key | Embeddings (derived) |
| MCP Server | OpenAI | HTTPS | API key (server) | Redacted prompts only |

### Primary Tenant Boundary Enforcement Points

1. **Supabase RLS (CANONICAL)** - Every table has `schoolId` policies
2. **Next.js Middleware** - Extract `user.schoolId` from JWT, add to request context
3. **MCP Server Service Layer** - Every DB query includes tenant filter
4. **ChromaDB Metadata Filters** - Vector queries filtered by `{"schoolId": "xyz"}`

### Recommendation: Next.js ↔ MCP Communication

**Option A: Direct Internal API Call** ✅ RECOMMENDED
- Next.js routes proxy to `http://mcp-server:8000/v1/*` (internal network)
- Advantages: Simple, low latency, no public exposure
- Implementation: Docker Compose networking or Kubernetes service mesh

**Decision:** Use Option A for MVP. Solo founder needs speed. Internal Docker networking is secure enough with proper service tokens.

---

## Section 3: Environments & Secrets

### Environment Strategy

| Environment | Purpose | Data Type | Access Control | Secrets | Monitoring |
|-------------|---------|-----------|----------------|---------|------------|
| **Local** | Development on laptop | Synthetic/seed data | Developer only | .env.local (gitignored) | Console logs |
| **Dev** | Shared dev environment | Synthetic + anonymized prod samples | Dev team | GitHub Secrets (dev-*) | Basic logging |
| **Staging** | Pre-production testing | Anonymized prod copy | Dev + QA + Stakeholders | GitHub Secrets (staging-*) | Full observability |
| **Production** | Live customer data | Real athlete/coach PII | Admins only (break-glass) | Vercel/Railway env vars | Full + alerts |

### Secret Management Principles

1. **Never in client bundles** - No `NEXT_PUBLIC_*` for sensitive keys
2. **Rotation every 90 days** - Automated alerts, manual rotation process
3. **Environment validation** - Startup checks verify all required secrets exist
4. **Least privilege** - Each service gets only the keys it needs
5. **Audit trail** - Log all secret access (not values, just access events)

### Secret Classification

| Secret Type | Examples | Storage | Rotation | Exposure Risk |
|-------------|----------|---------|----------|---------------|
| **Critical** | Supabase service role key, JWT signing key | Vercel env vars, encrypted vault | 90 days | Complete DB access |
| **High** | OpenAI API key, Supabase anon key | Vercel env vars | 180 days | Cost abuse, data access |
| **Medium** | ChromaDB API key, Redis password | Docker secrets | 365 days | Service degradation |
| **Low** | Sentry DSN, analytics tokens | Public OK | Never | Spam risk only |

### Environment Validation on Startup

```typescript
// apps/web/src/lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  MCP_SERVER_URL: z.string().url(),
  MCP_SERVICE_TOKEN: z.string().min(32),

  // Production-only validations
  ENABLE_DEMO_ACCOUNTS: z.enum(['true', 'false']).refine(
    (val) => process.env.NODE_ENV !== 'production' || val === 'false',
    'Demo accounts must be disabled in production'
  ),

  // Cost controls must be enabled in production
  ENABLE_COST_LIMITS: z.enum(['true', 'false']).refine(
    (val) => process.env.NODE_ENV !== 'production' || val === 'true',
    'Cost limits must be enabled in production'
  ),
});

// Validate on app startup
export const env = envSchema.parse(process.env);
```

### Secret Rotation Process

1. **Generate new secret** (automated script)
2. **Add new secret to vault** (GitHub Secrets or Vercel)
3. **Deploy with both old + new** (dual-key support for 24 hours)
4. **Monitor for failures** (alert on auth errors)
5. **Remove old secret** (after validation period)
6. **Update audit log** (record rotation event)

**Rotation Schedule:**
- JWT secrets: Every 90 days
- API keys: Every 180 days (or immediately if exposed)
- Service tokens: Every 365 days
- Database passwords: Every 180 days (Supabase auto-rotates)

---

## Section 4: AuthN/AuthZ Model (Supabase-Centered)

### Authentication Flow

**Web App (NextAuth.js):**
```
User → Email/Password
  ↓
NextAuth.js → Supabase Auth API
  ↓
Supabase returns JWT
  ↓
NextAuth creates session cookie
  ↓
All requests include session cookie
  ↓
Next.js middleware validates session
```

**Mobile App (Direct JWT):**
```
User → Email/Password
  ↓
Mobile app → Supabase Auth API directly
  ↓
Supabase returns access_token + refresh_token
  ↓
Mobile stores tokens in secure storage
  ↓
All requests include Authorization: Bearer {token}
  ↓
Next.js API validates JWT signature
```

### Authorization Model

**Role Hierarchy:**
```
ADMIN (system-wide)
  ↓ can impersonate
COACH (school-scoped)
  ↓ can view (with consent)
ATHLETE (self-only)
```

**Access Control Rules:**

| Resource | ADMIN | COACH | ATHLETE |
|----------|-------|-------|---------|
| Own profile | RW | RW | RW |
| Own chat sessions | RW | R (if consent) | RW |
| Own mood logs | RW | R (if consent) | RW |
| Own goals | RW | RW (assign) | RW |
| Team roster | RW | R (own team) | None |
| Crisis alerts | RW | R (own team) | None |
| Weekly summaries | RW | R (if consent) | R (own) |
| System config | RW | None | None |
| Audit logs | R | None | None |

### Multi-Tenant Boundary Enforcement

**1. Database (PRIMARY)** - Supabase RLS policies:
```sql
-- Example: ChatSession policy
CREATE POLICY "Athletes see own sessions"
ON chat_sessions FOR SELECT
USING (
  athlete_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Coaches see sessions with consent"
ON chat_sessions FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM coach_athlete_relations
    WHERE coach_id = auth.uid()
    AND athlete_id = chat_sessions.athlete_id
    AND consent_granted = true
  )
);
```

**2. Application (SECONDARY)** - Next.js middleware:
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return redirect('/login');

  // Inject tenant context
  req.headers.set('X-School-Id', session.user.schoolId);
  req.headers.set('X-User-Role', session.user.role);

  return NextResponse.next();
}
```

**3. Service Layer (TERTIARY)** - MCP Server:
```python
# services/mcp-server/app/core/tenancy.py
def enforce_tenant_boundary(db_query, user_context):
    """Every DB query must include tenant filter"""
    if not user_context.school_id:
        raise UnauthorizedError("Missing tenant context")

    return db_query.filter(
        models.BaseModel.school_id == user_context.school_id
    )
```

### Supabase RLS "Never Do" List

❌ **Never bypass RLS with service role key on client**
```typescript
// BAD - Exposes service role key
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

✅ **Always use anon key on client, service role only on server**
```typescript
// GOOD - Client uses anon key
const supabase = createClient(url, ANON_KEY);

// GOOD - Server uses service role (Next.js API route only)
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY);
```

❌ **Never disable RLS to "fix" permission issues**
```sql
-- BAD - Opens security hole
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
```

✅ **Always fix the RLS policy instead**
```sql
-- GOOD - Add missing policy
CREATE POLICY "Missing use case" ON chat_sessions ...;
```

❌ **Never query without RLS in application code**
```typescript
// BAD - Assumes RLS is enough (defense in depth)
const sessions = await prisma.chatSession.findMany();
```

✅ **Always add explicit tenant filter**
```typescript
// GOOD - Belt and suspenders
const sessions = await prisma.chatSession.findMany({
  where: { schoolId: user.schoolId }
});
```

### Audit Logging Requirements

**Log ALL sensitive actions:**
```typescript
// Audit log structure
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'EXPORT';
  resource: string;  // e.g., "ChatSession:abc123"
  schoolId: string;
  metadata: {
    ipAddress: string;
    userAgent: string;
    endpoint: string;
    success: boolean;
    errorMessage?: string;
  };
}
```

**Events requiring audit logs:**
- Viewing another user's data (coach viewing athlete)
- Exporting data (PDF reports, CSV downloads)
- Modifying consent settings
- Escalating crisis alerts
- Accessing weekly summaries
- Deleting chat sessions
- Changing user roles
- System configuration changes

**Audit log retention:**
- Active logs: 90 days in hot storage (Supabase)
- Archive: 7 years in cold storage (S3 Glacier) for FERPA compliance
- Critical security events: Permanent retention

---

## Section 5: MCP Server Production Design

### FastAPI Architecture

```
services/mcp-server/
├── app/
│   ├── api/                    # Thin controllers
│   │   ├── v1/
│   │   │   ├── chat.py         # POST /v1/chat/stream
│   │   │   ├── coach.py        # GET /v1/coach/summaries
│   │   │   ├── voice.py        # WS /v1/voice/stream
│   │   │   ├── analytics.py   # GET /v1/analytics/multi-modal
│   │   │   └── knowledge.py   # POST /v1/knowledge/ingest
│   │   └── health.py           # GET /health, /ready
│   │
│   ├── services/              # Business logic layer
│   │   ├── chat_service.py    # Orchestrates agent execution
│   │   ├── coach_service.py   # Generates weekly summaries
│   │   ├── crisis_service.py  # Crisis detection + escalation
│   │   ├── rag_service.py     # Vector search + reranking
│   │   └── cost_service.py    # Token tracking + limits
│   │
│   ├── agents/                # Agent runtime
│   │   ├── athlete_agent.py   # Discovery-First protocol
│   │   ├── governance_agent.py # Crisis detection
│   │   ├── knowledge_agent.py  # RAG
│   │   └── coach_agent.py      # Analytics
│   │
│   ├── core/                  # Shared infrastructure
│   │   ├── protocol.py        # ProtocolPhaseManager
│   │   ├── rag_enhancement.py # RAGQueryRewriter, KBChunkReranker
│   │   ├── session.py         # SessionContext
│   │   ├── escalation.py      # EscalationWorkflows
│   │   ├── security.py        # JWT validation, auth
│   │   ├── config.py          # Settings
│   │   └── logging.py         # Structured logging
│   │
│   ├── models/                # SQLAlchemy ORM
│   │   ├── user.py
│   │   ├── chat.py
│   │   ├── knowledge.py
│   │   └── audit.py
│   │
│   ├── schemas/               # Pydantic request/response
│   │   ├── chat.py
│   │   ├── coach.py
│   │   └── analytics.py
│   │
│   ├── db/                    # Database layer
│   │   ├── session.py         # Connection pool
│   │   └── migrations/        # Alembic
│   │
│   ├── middleware/            # Request/response processing
│   │   ├── auth.py            # JWT validation
│   │   ├── rate_limit.py      # Rate limiting
│   │   ├── cost_control.py    # Token budget checks
│   │   ├── tenant.py          # Multi-tenant context
│   │   └── logging.py         # Request logging
│   │
│   └── main.py                # FastAPI app + lifespan
│
├── tests/
├── alembic/                   # DB migrations
├── Dockerfile
├── requirements.txt
└── .env.example
```

### Background Jobs with Arq

**Recommendation: Arq (Redis-based task queue)** ✅

**Why Arq over Celery:**
- Simpler setup (no RabbitMQ/separate broker)
- Asyncio-native (matches FastAPI)
- Built-in retries + cron scheduling
- Lightweight for solo founder

**Task Types:**

1. **Weekly Summary Generation** (cron: every Monday 9 AM)
```python
from arq import cron

@cron("0 9 * * MON")
async def generate_weekly_summaries(ctx):
    schools = await get_all_schools()
    for school in schools:
        athletes = await get_consented_athletes(school.id)
        for athlete in athletes:
            await generate_summary(athlete.id)
```

2. **Crisis Alert Escalation** (immediate)
```python
@task
async def escalate_crisis_alert(alert_id: str):
    alert = await get_alert(alert_id)
    await send_email(alert.coach_email, alert.details)
    await send_sms(alert.emergency_contact, alert.brief)
```

3. **Cost Tracking Aggregation** (hourly)
```python
@cron("0 * * * *")
async def aggregate_token_usage():
    usage = await calculate_hourly_usage()
    await store_usage_metrics(usage)
    await check_budget_alerts(usage)
```

### Streaming Response Design

**Recommendation: Server-Sent Events (SSE)** ✅

**Why SSE over WebSocket for chat:**
- Simpler (one-way server→client, which is 90% of use case)
- HTTP/2 friendly (multiplexing)
- Auto-reconnect built into browser EventSource
- Easier to proxy through CDN/load balancer

**Use WebSocket only for voice** (bidirectional audio required)

**SSE Implementation:**
```python
@router.post("/v1/chat/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        user = await validate_jwt(request.token)
        await check_cost_limit(user.id)

        async for chunk in athlete_agent.stream_response(request.message):
            await track_tokens(user.id, chunk.tokens)
            yield f"data: {json.dumps(chunk.dict())}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
```

### Rate Limiting Strategy

**Multi-Layer Approach:**

1. **Global (per service)** - 10,000 requests/minute total
2. **Per-tenant (per school)** - 1,000 requests/minute per school
3. **Per-user** - 60 requests/minute per athlete (1 req/sec)
4. **Per-endpoint** - Chat: 20 requests/minute (prevent spam)

**Implementation:**
```python
from slowapi import Limiter

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

@app.post("/v1/chat/stream")
@limiter.limit("20/minute")
async def stream_chat(...):
    ...
```

### Request Validation with Pydantic

```python
from pydantic import BaseModel, Field, validator

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str | None = Field(None, regex=r'^[a-zA-Z0-9-]+$')
    athlete_id: str = Field(..., regex=r'^[a-zA-Z0-9-]+$')

    @validator('message')
    def sanitize_message(cls, v):
        return bleach.clean(v, tags=[], strip=True)

    class Config:
        extra = 'forbid'
```

---

## Section 6: RAG/ChromaDB Production Design

### Hosting Recommendation

**Chroma Cloud (managed)** ✅

**Why Chroma Cloud over self-hosted:**
- No infrastructure management
- Auto-scaling for spikes
- Built-in backups
- 99.9% SLA
- Cost: ~$50/month for 100K vectors vs. $200/month for self-hosted EC2

**Alternative for budget:** Self-hosted ChromaDB on Railway ($20/month)

### Tenant Partitioning Strategy

**Option A: Collections per tenant** ✅ RECOMMENDED
```python
collection_name = f"kb_{school_id}"
collection = chroma_client.get_or_create_collection(collection_name)
```

**Pros:**
- Complete data isolation
- Easy to delete tenant data (GDPR compliance)
- No risk of cross-tenant leakage
- Per-tenant backups

**Decision:** Use Option A (collections per tenant) for security. Universities pay $200K/year for data isolation guarantees.

### Consistency Strategy

**Postgres = Source of Truth**
- Stores metadata: source, ingestion time, chunk count
- Stores access control: which coaches can query which knowledge

**ChromaDB = Derived Cache**
- Stores embeddings + text for fast retrieval
- Can be rebuilt from Postgres + source PDFs
- Not authoritative for permissions

**If ChromaDB fails:**
1. Fallback to built-in knowledge base (hardcoded CBT/mindfulness frameworks)
2. Alert on-call engineer
3. Rebuild ChromaDB from Postgres metadata + S3 PDFs

---

## Section 7: LLM Safety + Cost Controls

### Key Management

**Principles:**
1. **Server-only** - API keys NEVER in client bundles
2. **Rotation** - Every 180 days (or immediately if exposed)
3. **Per-env separation** - Dev/staging/prod keys are different
4. **Least privilege** - Each service gets only the keys it needs

**Storage:**
```bash
# Production keys in environment variables
OPENAI_API_KEY="sk-proj-prod-..."
ANTHROPIC_API_KEY="sk-ant-prod-..."
```

### Data Minimization + Redaction

**Before sending to LLM:**
```python
import re

PII_PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
}

def redact_pii(text: str) -> str:
    for pattern_type, pattern in PII_PATTERNS.items():
        text = re.sub(pattern, f'[REDACTED_{pattern_type.upper()}]', text)
    return text
```

### Prompt Injection Defense

**1. Tool Allowlists** (most effective)
```python
ALLOWED_TOOLS = [
    "ask_discovery_question",
    "retrieve_framework",
    "assess_readiness",
    "apply_cbt",
    "apply_mindfulness",
]

def validate_tool_call(tool_name: str):
    if tool_name not in ALLOWED_TOOLS:
        raise SecurityError(f"Tool '{tool_name}' not allowed")
```

**2. Strict Schemas**
```python
response = await openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=messages,
    tools=[{
        "type": "function",
        "function": {
            "name": "ask_discovery_question",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "maxLength": 500},
                },
                "additionalProperties": False
            }
        }
    }]
)
```

**3. Tenant-Scoped Retrieval Filters**
```python
def retrieve_knowledge(query: str, user_context):
    results = chromadb.query(
        query_texts=[query],
        where={"school_id": user_context.school_id},
        n_results=5
    )
    return results
```

### Cost Guardrails

**Per-Tenant Quotas:**
```python
TENANT_LIMITS = {
    "daily_tokens": 1_000_000,    # 1M tokens/day per school (~$2)
    "monthly_tokens": 25_000_000, # 25M tokens/month (~$50)
}

async def check_tenant_quota(school_id: str):
    usage = await get_daily_usage(school_id)

    if usage.tokens > TENANT_LIMITS["daily_tokens"]:
        await trigger_circuit_breaker(school_id)
        raise QuotaExceededError("Daily token limit reached")
```

**Circuit Breakers:**
```python
# When quota exceeded, flip circuit breaker
await redis.set(f"circuit_breaker:{school_id}", "open", ex=86400)

# All requests check circuit breaker first
@app.middleware("http")
async def circuit_breaker_check(request: Request, call_next):
    school_id = request.state.school_id
    if await redis.get(f"circuit_breaker:{school_id}"):
        return JSONResponse(
            status_code=429,
            content={"error": "Daily quota exceeded. Resets at midnight UTC."}
        )
    return await call_next(request)
```

### Logging Policy

**What to LOG:**
- Request metadata (timestamp, user ID, school ID, endpoint)
- Token usage per request
- Response latency
- Error messages (sanitized)

**What NOT to log:**
- User messages (PII)
- LLM responses (may contain PII)
- API keys
- Session tokens

---

## Section 8: Threat Model & Risk Register

| Attack Surface | Impact | Likelihood | Mitigations | How to Verify |
|----------------|--------|------------|-------------|---------------|
| **Broken Access Control (IDOR)** | HIGH | MEDIUM | 1. Supabase RLS policies<br>2. Explicit tenant filters<br>3. Audit logging | Test: Try accessing other user's session ID |
| **Tenant Isolation Failure** | CRITICAL | MEDIUM | 1. RLS on all tables<br>2. ChromaDB collections per tenant<br>3. Server-side filters | Create 2 schools, verify no cross-access |
| **Auth/Session Compromise** | HIGH | MEDIUM | 1. JWT 15 min expiry<br>2. Refresh tokens<br>3. Logout invalidates tokens | Test token replay attack |
| **Secret Leakage** | CRITICAL | LOW | 1. No secrets in client<br>2. Environment validation<br>3. Secret scanning in CI | `grep -r "sk-" apps/web/public` |
| **DoS via LLM** | HIGH | HIGH | 1. Rate limiting (60 req/min)<br>2. Token budgets ($500/day)<br>3. Circuit breakers | Load test: 1000 req/sec, verify 429s |
| **RAG Exfiltration** | MEDIUM | MEDIUM | 1. Tenant-scoped collections<br>2. Server-side filters<br>3. Tool allowlists | Try querying other school's KB |
| **Prompt Injection** | MEDIUM | MEDIUM | 1. System prompt refusals<br>2. Strict tool schemas<br>3. Output validation | Red team: 100 injection attempts |
| **XSS in Chat** | MEDIUM | LOW | 1. React auto-escaping<br>2. DOMPurify for markdown<br>3. CSP headers | Test: Send `<script>alert(1)</script>` |
| **Crisis Detection Bypass** | CRITICAL | LOW | 1. Multi-layer detection<br>2. Human review queue<br>3. Escalation timeouts | Test coded language ("unalive") |

**Risk Scoring:**
- **CRITICAL**: Immediate production blocker (must fix before launch)
- **HIGH**: Fix within 1 sprint (2 weeks)
- **MEDIUM**: Fix within 1 month
- **LOW**: Backlog (fix when capacity allows)

---

## Section 9: CI/CD & Release Strategy

### Branch Strategy

```
main (protected)
  ↑
staging (auto-deploy)
  ↑
feature/* (PR required)
```

### Branch Protections (main)

- ✅ Require pull request reviews (1 approver minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ No force pushes
- ✅ No deletions

### Deployment Flows

**Web App (Vercel):**
```
PR merged to staging
  ↓
Vercel auto-deploys to staging.aisportsagent.com
  ↓
QA testing (manual)
  ↓
PR from staging → main
  ↓
Manual approval required
  ↓
Vercel deploys to production
```

**MCP Server (Railway/AWS ECS):**
```
PR merged to staging
  ↓
GitHub Action builds Docker image
  ↓
Railway auto-deploys staging
  ↓
QA testing + load testing
  ↓
PR from staging → main
  ↓
Manual approval
  ↓
Blue-green deployment (zero downtime)
```

### Rollback Strategy

**Web App:**
```bash
vercel rollback app.aisportsagent.com
```

**MCP Server:**
```bash
railway rollback
```

**Database Migrations:**
```bash
alembic downgrade -1
```

---

## Section 10: Observability & Incident Response

### Minimal Tooling (Lean but Real)

1. **Error Tracking:** Sentry ($26/month)
2. **Logging:** Betterstack ($20/month)
3. **Uptime:** UptimeRobot (free tier)
4. **Metrics:** Prometheus + Grafana (self-hosted, $0)
5. **Alerts:** PagerDuty (free tier for 1 user)

**Total:** ~$50/month for production observability

### Incident Playbooks

**1. Leaked API Key**

**Response (IMMEDIATE):**
```bash
# 1. Revoke key (< 5 minutes)
# Go to OpenAI dashboard → API Keys → Revoke

# 2. Rotate to new key
openai_new_key=$(openai api keys.create)

# 3. Update production env
vercel env add OPENAI_API_KEY $openai_new_key --scope production

# 4. Redeploy
vercel deploy --prod
```

**2. Suspected Data Exposure**

**Response:**
```bash
# 1. Contain (< 2 minutes)
redis-cli SET disable_ai_chat "true"

# 2. Investigate (< 15 minutes)
SELECT * FROM audit_logs
WHERE action = 'READ'
AND created_at > NOW() - INTERVAL '1 hour';

# 3. Notify affected users
# Email athletes whose data was accessed
```

**3. Runaway Cost Event**

**Response:**
```bash
# 1. Circuit breaker triggers automatically at $500/day

# 2. Identify cause
SELECT user_id, endpoint, SUM(tokens) as total_tokens
FROM token_usage
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, endpoint
ORDER BY total_tokens DESC;
```

---

## Section 11: Production Readiness Checklist

### Pre-Launch Checklist (Must-Do)

**Week -2 (2 weeks before launch):**
- [ ] Security audit (internal or external)
- [ ] Load testing (simulate 1000 concurrent users)
- [ ] Backup/restore drill
- [ ] Review all environment variables (no demo accounts)
- [ ] Enable monitoring and alerting

**Week -1 (1 week before launch):**
- [ ] Final code freeze (only critical fixes)
- [ ] Staging → production dry run
- [ ] Database migration dry run
- [ ] DNS configuration (production domain)
- [ ] SSL certificates verified

**Launch Day:**
- [ ] Deploy to production (morning, not Friday)
- [ ] Verify health checks pass
- [ ] Send launch announcement
- [ ] Monitor dashboard for 4 hours

### Stop-the-Line Criteria

**Immediately halt production launch if ANY occur:**

🚨 **Critical Security Issue:**
- Unauthenticated access to any endpoint
- Cross-tenant data leak confirmed
- Secret exposed in public repository
- RLS bypass discovered

🚨 **Data Loss Risk:**
- Database corruption detected
- Backup verification fails

🚨 **Legal/Compliance Blocker:**
- FERPA violation reported
- Privacy policy missing

---

## Section 12: Milestones (Solo Founder Timeline)

**Assumptions:**
- Solo technical founder
- Working full-time (40-50 hours/week)
- Existing codebase (current state: 55/100 ready)

### Week 1: Critical Security Fixes (40 hours)

**Day 1-2: Input Validation**
- [ ] Create Zod schemas for all API routes
- [ ] Add validation middleware
- [ ] **Acceptance:** All endpoints reject invalid inputs with 400 errors

**Day 3-4: Cost Controls**
- [ ] Implement token tracking middleware
- [ ] Add circuit breakers for budget limits
- [ ] **Acceptance:** Can set $500/day limit and verify it blocks requests

**Day 5: Remove Demo Accounts**
- [ ] Audit code for demo account logic
- [ ] Remove all demo account code
- [ ] **Acceptance:** No demo accounts in production code

**Day 6-7: JWT Validation (Mobile)**
- [ ] Add JWT verification on all protected routes
- [ ] Implement refresh token flow
- [ ] **Acceptance:** Mobile app can authenticate and refresh tokens

### Week 2: AI Safety & MCP Server (40 hours)

**Day 1-2: AI Crisis Detection**
- [ ] Integrate OpenAI moderation API
- [ ] Add AI-powered crisis detection (beyond regex)
- [ ] **Acceptance:** Detects coded language ("unalive") in tests

**Day 3-4: MCP Server Deployment**
- [ ] Create Dockerfile for MCP server
- [ ] Deploy to Railway
- [ ] **Acceptance:** Chat works through MCP server

**Day 5-6: Field-Level Encryption**
- [ ] Encrypt ChatSummary.summary before storing
- [ ] **Acceptance:** Summaries encrypted in DB

**Day 7: RLS Testing**
- [ ] Create RLS test suite
- [ ] **Acceptance:** All 40 tables have RLS, tests pass

### Week 3: Rate Limiting & Observability (40 hours)

**Day 1-2: Rate Limiting**
- [ ] Implement rate limiting middleware
- [ ] **Acceptance:** Returns 429 when limit exceeded

**Day 3-4: Audit Logging**
- [ ] Add audit log middleware
- [ ] **Acceptance:** Can query "who accessed athlete X's data"

**Day 5-6: Monitoring & Alerts**
- [ ] Configure Sentry error tracking
- [ ] Set up uptime monitoring
- [ ] **Acceptance:** Alerts fire in test scenarios

### Week 4: Hardening & Launch Prep (40 hours)

**Day 1-2: Security Hardening**
- [ ] Enable GitHub secret scanning
- [ ] Run npm audit / safety check
- [ ] **Acceptance:** Zero high/critical CVEs

**Day 3-4: Load Testing**
- [ ] Simulate 100 concurrent chat sessions
- [ ] **Acceptance:** Handles 2x expected peak load

**Day 5: Backup/Restore Drill**
- [ ] Backup production DB to staging
- [ ] **Acceptance:** Restore completes in < 15 minutes

**Day 6-7: Pre-Launch Checklist**
- [ ] Complete all pre-launch checklist items
- [ ] **Acceptance:** Ready for production launch

---

**Total Timeline: 4 weeks (160 hours) from start to production-ready**

**Risk Buffer:** Add 20% contingency (34 hours) for unexpected issues.

**Realistic Timeline for Solo Founder:** 5-6 weeks working full-time.

---

*Last Updated: 2025-01-04*
*Version: 1.0.0*
