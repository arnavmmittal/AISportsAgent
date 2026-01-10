# AI Sports Agent - Project Context

This file provides Claude with essential context about the AI Sports Agent project.

## 📋 IMPORTANT: Documentation Structure

The project uses a **streamlined 3-file documentation system**:

1. **`README.md`** - Project overview, architecture, tech stack
2. **`SETUP.md`** - Complete setup guide for new developers
3. **`MVP_STATUS.md`** - Current progress, production roadmap, MVP checklist

**Always check `MVP_STATUS.md` first** for:
- What's done vs. what's needed for production
- Critical gaps (security, cost controls, safety)
- Current sprint focus
- Blockers and open questions

**Update `MVP_STATUS.md`** whenever you:
- Complete MVP checklist items
- Discover production blockers
- Make architecture decisions
- Hit cost/safety milestones

## Project Overview

AI Sports Agent is a **Mental Performance Intelligence Platform** for collegiate athletes. It's NOT a mental health app - it's a predictive analytics and coaching efficiency tool that connects mental state → physical performance → outcomes.

**See `docs/VISION_ARCHITECTURE.md` for the full technical vision.**

### PRODUCT POSITIONING - Critical Context

| What We ARE | What We're NOT |
|-------------|----------------|
| Mental Performance Platform | Mental Health App |
| Predictive Analytics Tool | Therapy/Counseling |
| Coach Efficiency Multiplier | Crisis Intervention Tool |
| Evidence-Based Intelligence | Generic Mood Tracker |

**Crisis detection is a safety requirement, not a feature** - like a seatbelt in a car.

### THE REAL PROBLEM

Sports psychologists are responsible for 150+ athletes each. They can't:
- See patterns across all their athletes
- Predict who will underperform before it happens
- Track which interventions actually work for which athlete
- Connect mental state to actual game outcomes

### THE SOLUTION

**Predictive Mental Performance Intelligence:**

1. **PREDICT** - "Sarah's pre-competition anxiety pattern is emerging. Last 4 times: shooting % dropped 18%."
2. **PRESCRIBE** - "4-7-8 breathing improved her focus 23% in similar situations."
3. **PROVE** - "Your visualization session with Taylor: next game +12% vs baseline."

**Key Differentiators:**
- **Personalization**: Not "athletes like you" but "what works for YOU specifically"
- **Prediction**: Converging signals (mental + physical + context) → performance forecast
- **Evidence Loop**: Every intervention generates outcome data → improves recommendations
- **Wearable Integration**: WHOOP/Garmin + mental state + game stats = unique insights

### Core Value Proposition
- **Athletes**: 24/7 AI coaching with personalized mental techniques that are proven to work FOR THEM
- **Coaches**: "Show me who needs attention, why, and exactly what to do - with evidence"
- **Institutions**: Scale sports psych from 1:150 to 1:500+ without quality loss

## Project Structure

```
SportsAgent/
├── ai-sports-agent/        # Next.js frontend application
├── services/mcp-server/          # Python MCP server with agent orchestration
└── GETTING_STARTED.md      # Setup guide
```

## ai-sports-agent (Next.js Application)

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **AI**: OpenAI GPT-4 + Vercel AI SDK
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

### Key Features
1. **Athlete Chat Interface**: Real-time AI conversations with streaming responses
2. **Mood Tracking**: Daily logging of mood, confidence, stress, sleep
3. **Goal Management**: Set and track performance, mental, academic, personal goals
4. **Session History**: Review past conversations and progress
5. **Coach Dashboard**: View aggregated athlete data (with consent)

### Database Schema (Prisma)
- **User**: Base user model (athletes, coaches, admins)
- **Athlete**: Sport-specific data (sport, year, team, stats)
- **Coach**: Coach-specific data (team info)
- **ChatSession**: Conversation sessions
- **Message**: Individual chat messages
- **MoodLog**: Daily mood and confidence tracking
- **Goal**: Performance and personal goals
- **KnowledgeBase**: Sports psychology research for RAG

### Important Files
- `prisma/schema.prisma` - Complete database schema (DONE)
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/openai.ts` - OpenAI setup with sports psych system prompt
- `src/types/index.ts` - TypeScript type definitions
- `.env.example` - Environment variable template

### Development Commands
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript checking
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Database GUI
```

### Current Status
✅ **Completed**:
- Project initialization and configuration
- Complete Prisma schema with all models
- TypeScript type definitions
- OpenAI utility functions
- Environment variable templates
- Comprehensive documentation

⏳ **To be implemented**:
- NextAuth authentication (login/signup)
- Chat interface UI
- Chat API endpoint with OpenAI streaming
- Session management
- Athlete dashboard
- Coach dashboard
- Mood tracking visualizations
- Goal setting features

## services/mcp-server (MCP Server Platform)

### Tech Stack
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with pgvector extension
- **Cache**: Redis
- **Auth**: Firebase
- **AI**: OpenAI GPT-4
- **Vector DB**: ChromaDB or Pinecone
- **ORM**: SQLAlchemy

### MCP Agent Architecture

Four specialized agents work together:

1. **AthleteAgent** - Discovery-First conversation protocol
   - 5-step protocol: Discovery → Understanding → Framework → Action → Follow-up
   - Sport-specific interventions (CBT, mindfulness, flow state)
   - Tools: `ask_discovery_question()`, `retrieve_framework()`, `apply_cbt()`

2. **CoachAgent** - Team analytics and insights
   - Anonymizes athlete data
   - Generates weekly/monthly reports
   - Identifies patterns across athletes
   - Tools: `anonymize_data()`, `generate_summary()`, `detect_patterns()`

3. **GovernanceAgent** - Crisis detection and safety
   - Monitors for self-harm, depression, abuse disclosures
   - Immediate escalation and resource provision
   - Audit logging for compliance
   - Tools: `detect_crisis_language()`, `escalate_alert()`, `flag_session()`

4. **KnowledgeAgent** - RAG knowledge base management
   - Ingests sports psychology research PDFs
   - Semantic search with metadata filtering
   - Auto-tags content (sport, framework, phase)
   - Tools: Vector search, chunk retrieval

### API Endpoints
```
POST   /v1/chat              # Main chat (streaming)
POST   /v1/kb/query          # Knowledge base search
GET    /v1/report/weekly     # Coach summaries
POST   /v1/experiments       # Athlete journals
POST   /v1/auth/login        # Firebase auth
GET    /v1/sessions          # Session history
```

### Important Files
- `server/app/main.py` - FastAPI application
- `server/app/agents/` - MCP agent implementations
- `server/app/core/config.py` - Configuration
- `server/app/core/security.py` - Auth and encryption
- `server/requirements.txt` - Python dependencies
- `ARCHITECTURE.md` - Detailed architecture docs
- `IMPLEMENTATION_GUIDE.md` - Code samples

## Development Workflow

### Prerequisites
- **Node.js** >= 20.9.0 (current system has v18.16.0 - NEEDS UPGRADE)
- **Python** >= 3.11
- **PostgreSQL** >= 15 with pgvector
- **Redis** >= 7.0

### Git Workflow & Branching Strategy

**🚨 CRITICAL: NEVER WORK DIRECTLY ON MAIN BRANCH 🚨**

**ALWAYS create/switch to a feature branch before starting ANY new work.** This applies to:
- New features
- Bug fixes
- Refactoring
- Documentation updates
- Testing changes
- Configuration changes

**If you find yourself on main branch, STOP and create a feature branch first.**

**Branch Naming Convention:**
- `feature/[feature-name]` - New features (e.g., `feature/voice-integration`, `feature/coach-dashboard`)
- `fix/[bug-description]` - Bug fixes (e.g., `fix/auth-redirect-loop`)
- `refactor/[component-name]` - Code refactoring (e.g., `refactor/prisma-models`)
- `docs/[doc-name]` - Documentation updates

**IMPORTANT: Use Descriptive Branch Names**
- ❌ **Avoid generic names**: `develop`, `dev`, `integration`, `testing`, `wip`
- ✅ **Use specific names**: `feature/mvp-chat-interface`, `fix/voice-websocket-disconnect`, `refactor/agent-singletons`
- **Why**: Descriptive names make it clear what work is happening on each branch, especially when multiple features are in development simultaneously

**Three-Branch Strategy (CRITICAL FOR COST/SECURITY PROTECTION):**

**Why we need staging:**
- **Cost Protection**: Test OpenAI cost controls before production (prevent $1000s in runaway spending)
- **Security Testing**: Verify RLS policies, auth flows, crisis detection without risking production data
- **Database Safety**: Test migrations on staging DB first, practice rollbacks
- **Integration Testing**: Test MCP server + Next.js together before universities see bugs

**Branch Roles:**

1. **`main`** = Production (live users, paying universities)
   - Vercel: `app.aisportsagent.com`
   - Railway: `mcp-production.railway.app`
   - **Only merge after thorough staging testing**
   - Protected branch: requires PR review

2. **`staging`** = Pre-production testing environment
   - Vercel: `staging.aisportsagent.com` (or preview URL)
   - Railway: `mcp-staging.railway.app`
   - **Test ALL changes here first**
   - Merge feature branches here for integration testing
   - Test for days/weeks before promoting to main

3. **`feature/*`** = Development work (short-lived)
   - Create from `staging`: `git checkout -b feature/crisis-detection`
   - Merge back to `staging` when ready to test
   - Delete after merging

**Workflow:**

1. **Daily development:**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/your-feature-name
   # ... make changes ...
   git push origin feature/your-feature-name
   ```

2. **Ready to test:**
   ```bash
   git checkout staging
   git merge feature/your-feature-name
   git push origin staging
   # → Vercel auto-deploys to staging URL
   # → Railway auto-deploys to staging MCP server
   # → Test everything thoroughly
   ```

3. **Promote to production (only after extensive staging testing):**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   # → Deploys to production (live users)
   ```

4. **Cleanup:**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

**Current Branches:**
- `main` - Production (live users)
- `staging` - Pre-production testing (active development)
- `feature/*` - Short-lived feature branches (delete after merge)

### Environment Variables

**ai-sports-agent** (.env.local):
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
```

**services/mcp-server** (.env):
```
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
FIREBASE_CREDENTIALS_PATH="..."
REDIS_URL="redis://..."
```

## Security & Compliance

### HIPAA/FERPA Considerations
- Encryption at rest (Supabase/PostgreSQL)
- TLS for data in transit
- Role-based access control (RBAC)
- Audit logs for all data access
- Athlete consent required for coach access
- No PHI stored without consent

### Multi-Tenancy
- Row-level security by `school_id`
- Separate vector collections per institution
- Custom frameworks per school
- Configurable data retention policies

## Production & Security Guardrails

### Secrets & Environment
- ❌ NEVER use `NEXT_PUBLIC_*` for API keys or sensitive data
- ✅ All secrets in environment variables (Vercel/Railway, never in code)
- ✅ Rotation: JWT secrets every 90 days, API keys every 180 days
- ✅ Validation: Startup checks verify all required secrets exist
- ✅ Separation: Dev/staging/prod use different credentials

### Supabase RLS (Row-Level Security)
- ✅ EVERY table must have RLS policies (no exceptions)
- ❌ NEVER use service role key on client (security breach)
- ✅ Test RLS: Try accessing other user's data, must fail
- ✅ Defense in depth: Add explicit `WHERE schoolId = user.schoolId` in application code
- ✅ Audit logs: Log all data access with user ID, timestamp, resource

### Multi-Tenant Boundaries
- ✅ Enforce at 3 layers: (1) Supabase RLS, (2) Next.js middleware, (3) MCP service layer
- ✅ ChromaDB: Use collections per tenant (e.g., `kb_{schoolId}`)
- ❌ NEVER let user control `where` filters in vector queries
- ✅ Every DB query includes `schoolId` filter (server-side enforced)

### LLM Safety
- ✅ Tool allowlists: Only approved functions callable by LLM
- ✅ Strict schemas: Use function calling with `additionalProperties: false`
- ✅ PII redaction: Remove emails, phones, SSNs before sending to LLM
- ✅ Prompt storage: Opt-in only, redacted, 30-day retention
- ✅ Cost controls: Circuit breakers at $500/day per tenant, $10K/month total

### Input Validation
- ✅ Zod schemas on ALL API routes (no exceptions)
- ✅ Sanitize HTML in chat messages (use DOMPurify for markdown)
- ❌ NEVER use `dangerouslySetInnerHTML` without sanitization
- ✅ Rate limiting: 60 req/min per user, 1000 req/min per tenant

### CI/CD Rules
- ✅ Protected main branch: Require PR reviews + passing checks
- ✅ Required checks: lint, typecheck, tests, security scan
- ✅ Secret scanning: GitHub Dependabot + npm audit / safety check
- ❌ NEVER merge failing builds or skipped tests
- ✅ Staging deployment: Auto-deploy on merge to staging branch
- ✅ Production deployment: Manual approval required

### Deployment Safety
- ✅ Deploy to staging first, test for 24 hours minimum
- ✅ Database migrations: Test rollback before production
- ✅ Rollback plan: Verify can rollback in < 2 minutes
- ✅ Kill switch: Ability to disable features via Redis flags
- ✅ Feature flags: Use PostHog or similar for gradual rollouts

### Incident Response
- ✅ Leaked keys: Revoke within 5 minutes, rotate, audit usage
- ✅ Data exposure: Kill switch → investigate → notify users → fix → deploy
- ✅ Auth compromise: Lock account → invalidate sessions → require password reset
- ✅ Runaway costs: Circuit breaker triggers at $500/day (auto-blocks requests)
- ✅ Downtime: Rollback → verify recovery → post-mortem within 24 hours

### Pre-Launch Checklist (CRITICAL)
- [ ] No demo account logic in production code (`ENABLE_DEMO_ACCOUNTS=false`)
- [ ] Cost limits enabled (`ENABLE_COST_LIMITS=true`)
- [ ] RLS policies on all 40 tables (verify with tests)
- [ ] Secrets rotated in last 90 days
- [ ] Monitoring alerts configured (5xx, latency, cost)
- [ ] Incident playbooks documented
- [ ] Backup/restore drill completed successfully

**See `/ProductionSecurityRunbook.md` for complete security playbook.**

## Coding Conventions

### TypeScript/Next.js
- Use TypeScript for all files
- Prefer functional components with hooks
- Use server components by default, client components when needed
- Keep components small and focused
- Use Prisma for all database operations
- Follow Next.js App Router patterns

### Python/FastAPI
- Type hints for all functions
- Async/await for I/O operations
- SQLAlchemy for database models
- Pydantic for request/response validation
- Follow PEP 8 style guide

### General Principles
- **No over-engineering**: Keep solutions simple and focused
- **Security-first**: Validate inputs, sanitize outputs, prevent injection
- **Privacy-focused**: Minimize data collection, anonymize where possible
- **Evidence-based**: Ground all psychology content in research

## Important Context

### Node.js Version Issue
The current system has Node.js v18.16.0, but the project requires >= 20.9.0. This must be upgraded before npm install will work in ai-sports-agent.

### Phase-Based Development
The project is planned in phases:
- **Phase 1 (MVP)**: Authentication, chat interface, basic dashboards
- **Phase 2**: RAG knowledge base, advanced analytics, mood tracking
- **Phase 3**: Voice input, email notifications, HIPAA compliance audit

### Two Architecture Options
The project has TWO separate implementations:
1. **ai-sports-agent**: Simpler Next.js-only approach (good for MVP)
2. **services/mcp-server**: Advanced MCP agent platform (full-featured)

Choose which to develop based on requirements. They can coexist or one can be selected.

## Git Repository

- **Remote**: https://github.com/arnavmmittal/AISportsAgent.git
- **Current Branch**: setup
- **Status**: Initial codebase pushed to setup branch

## When Working on This Project

### For Features
1. Read relevant files first before suggesting changes
2. Follow existing patterns and conventions
3. Don't add features beyond what's requested
4. Keep security and privacy as top priorities
5. Write evidence-based content for psychology features

### For Database Changes
1. Always update `prisma/schema.prisma` first
2. Run `prisma:generate` after schema changes
3. Create migrations with `prisma:migrate`
4. Never manually edit migration files

### For API Development
1. Use Next.js API routes in `src/app/api/`
2. Implement proper error handling
3. Add rate limiting for production
4. Validate all inputs with Zod
5. Use streaming for chat endpoints

### For Testing
1. Write tests for critical paths (auth, chat, crisis detection)
2. Test with realistic athlete scenarios
3. Verify FERPA compliance for coach access
4. Test crisis detection thoroughly

### File Cleanup Guidelines

**NEVER commit these types of files:**

1. **Development SQL scripts** with hardcoded IDs/data:
   - `create-missing-user.sql`, `fix-user-id-mismatch.sql`
   - One-off debugging scripts with specific UUIDs
   - Keep RLS policies in `apps/web/supabase-rls-policies.sql` (tracked)

2. **Session/progress notes** (use proper docs instead):
   - `*_COMPLETE.md`, `*_PROGRESS.md` files
   - Move design decisions to `docs/` or relevant README files
   - Keep `MVP_STATUS.md` for production progress tracking

3. **Untracked scripts** in random locations:
   - Development utilities should go in `apps/web/prisma/` or be gitignored
   - If a script is useful, add it to package.json scripts

**Files to keep:**
- `supabase-rls-policies.sql` - The canonical RLS policy definitions
- `DEMO_CODE_AUDIT.md` - Production readiness checklist
- `UI_REVAMP_STRATEGY.md` - Design system documentation
- Migration SQL files in `prisma/migrations/` - Required by Prisma

**Before committing, check:**
```bash
git status  # Review untracked files
# Delete any *.sql files outside prisma/migrations/
# Delete any session-note .md files
```

## Key Priorities

1. **Prediction Accuracy**: Can we predict performance deviation before it happens?
2. **Intervention Evidence**: Track what actually works for each athlete
3. **Data Integration**: Connect mental state + physical + outcomes
4. **Coach Efficiency**: Surface the 3 athletes who need attention, with evidence
5. **Privacy**: Athlete data is sacred - never expose without consent
6. **Safety (table stakes)**: Crisis detection as safety net, not feature

## Resources

- **Main Docs**: `GETTING_STARTED.md`, `README.md` files in each directory
- **Setup Guide**: `ai-sports-agent/SETUP.md`
- **Architecture**: `services/mcp-server/ARCHITECTURE.md`
- **Implementation**: `services/mcp-server/IMPLEMENTATION_GUIDE.md`

## Notes

- This is a university research project for University of Washington
- Target users: collegiate student-athletes and coaching staff and eventually across all universities
- Goal: Extend sports psychology resources beyond traditional capacity
- Built with mental health and performance outcomes as primary metrics

---

**Last Updated**: 2026-01-10
**Version**: 1.0.1
