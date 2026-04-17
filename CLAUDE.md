# Flow Sports Coach

AI sports psychology assistant for collegiate athletes (University of Washington). Replaces traditional 1-on-1 Zoom meetings — chat (`/chat`) is the core product. Coaches monitor 150+ athletes via aggregated insights and crisis alerts.

## Tech Stack

- **Web**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: Expo SDK 54, React Native 0.81, Expo Router 6
- **Database**: PostgreSQL (Supabase) + Prisma ORM (46 tables, 103 RLS policies)
- **Auth**: NextAuth.js v5 — JWT (mobile) + Supabase session (web)
- **AI**: Anthropic Claude (primary) + OpenAI GPT-4 (fallback), LangGraph agent orchestration
- **Knowledge Base**: OpenAI embeddings → vector retrieval from ingested sports psychology content
- **State**: Zustand
- **Deployment**: Vercel (web), EAS (mobile)

## Dev Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript checking
npx vitest run           # Run tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Database GUI
```

## Branch Rules

- **NEVER commit directly to `main`** — always use `staging` or `feature/*` branches
- Default to `staging` for all work
- Branch naming: `feature/name`, `fix/name`, `refactor/name`
- Flow: `feature/*` → `staging` (test) → `main` (production)
- Check branch at session start: `git branch --show-current`
- Warn if on `main`
- Remote: https://github.com/arnavmmittal/FlowSportsCoach.git

## Security Rules

- NEVER use `NEXT_PUBLIC_*` for API keys
- NEVER use `dangerouslySetInnerHTML` without sanitization
- NEVER use service role key on client
- Zod validation on ALL API routes
- RLS policies on all Supabase tables
- Every DB query includes `schoolId` filter (multi-tenant)
- PII redaction before sending to LLM

## Coding Conventions

- TypeScript for all files, functional components with hooks
- Server components by default, `'use client'` only when needed
- Prisma for all DB operations — update `schema.prisma` first, then `prisma:generate`
- Next.js App Router patterns, API routes in `src/app/api/`
- No over-engineering, no emojis in UI (D1 professional context)
- Evidence-based sports psychology content only
- Crisis detection is safety-critical — test thoroughly

## Database Conventions

- `Athlete.userId` is the `@id` (primary key) — there is no separate `id` field
- All child tables (`MoodLog`, `Goal`, `ChatSession`, etc.) use `athleteId` referencing `Athlete.userId`
- Message → ChatSession relation name is `ChatSession` (not `session`)

## Production & Deployment Rules

- Deploy to `staging` first, test before promoting to `main`
- Database migrations: test rollback before production
- Cost controls: circuit breakers at $500/day per tenant, $10K/month total
- Rate limiting: 60 req/min per user, 1000 req/min per tenant
- Never merge failing builds or skipped tests
- Staging auto-deploys on merge; production requires manual approval
- Rollback plan: must be able to rollback in < 2 minutes
- Leaked keys: revoke within 5 minutes, rotate, audit usage
- LLM safety: tool allowlists, strict schemas (`additionalProperties: false`), prompt storage opt-in with 30-day retention
- Feature flags for gradual rollouts
- No demo account logic in production code

## Key Architecture

- **LangGraph agent**: `src/agents/langgraph/` — state graph with parallel init (safety + context), model invocation, tool execution, PostgresSaver checkpointing
- **Chat streaming**: LangGraph `streamEvents` → SSE → React with `useStreamBuffer` for smooth character reveal
- **Dual LLM**: Anthropic primary (`maxRetries: 0`, 15s timeout) → OpenAI fallback (`maxRetries: 1`, 30s timeout)
- **Knowledge base**: `src/agents/knowledge/` — ingested sports psychology PDFs, OpenAI embeddings, `retrieveRelevantKnowledge()` for RAG
- **Message sanitization**: Strips orphaned `tool_use` blocks before model calls to prevent checkpoint corruption
- **Wellness center**: 3-zone layout (check-in → readiness dashboard → personalized toolkit), mobile-first
- **Coach portal**: Obsidian design system (SpotlightCard, AnimatedNumber, ReadinessRing, Sparkline)
