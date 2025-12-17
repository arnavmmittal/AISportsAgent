# AI Sports Agent - Production-Ready MVP Architecture

## Folder Structure (Unified Monolith)

```
SportsAgent/
└── apps/
    └── web/                          # Main application
        ├── src/
        │   ├── app/                  # Next.js App Router
        │   │   ├── (auth)/           # Auth routes
        │   │   ├── (athlete)/        # Athlete routes
        │   │   ├── (coach)/          # Coach routes
        │   │   └── api/              # API routes
        │   │       ├── auth/
        │   │       ├── chat/         # Chat endpoints (MCP integrated)
        │   │       ├── coach/
        │   │       ├── athlete/
        │   │       └── webhooks/
        │   │
        │   ├── agents/               # MCP Agent System (TypeScript)
        │   │   ├── core/
        │   │   │   ├── BaseAgent.ts         # Base agent class
        │   │   │   ├── AgentOrchestrator.ts # Routes to specific agents
        │   │   │   └── types.ts             # Agent types
        │   │   ├── athlete/
        │   │   │   ├── AthleteAgent.ts      # Main conversation agent
        │   │   │   ├── protocols.ts         # 5-step protocol
        │   │   │   └── interventions.ts     # CBT, mindfulness, etc.
        │   │   ├── governance/
        │   │   │   ├── GovernanceAgent.ts   # Crisis detection
        │   │   │   ├── detectors.ts         # Keyword/pattern detection
        │   │   │   └── escalation.ts        # Alert escalation
        │   │   ├── knowledge/
        │   │   │   ├── KnowledgeAgent.ts    # RAG system
        │   │   │   ├── vectorStore.ts       # Vector DB interface
        │   │   │   └── retrieval.ts         # Document retrieval
        │   │   └── index.ts                 # Agent exports
        │   │
        │   ├── services/             # Business Logic Layer
        │   │   ├── chat/
        │   │   │   ├── ChatService.ts       # Chat orchestration
        │   │   │   ├── StreamHandler.ts     # SSE streaming
        │   │   │   └── SessionManager.ts    # Session state
        │   │   ├── crisis/
        │   │   │   ├── CrisisService.ts     # Crisis management
        │   │   │   └── AlertService.ts      # Alert creation
        │   │   ├── knowledge/
        │   │   │   ├── KnowledgeService.ts  # KB management
        │   │   │   └── EmbeddingService.ts  # Generate embeddings
        │   │   └── analytics/
        │   │       └── AnalyticsService.ts  # Team insights
        │   │
        │   ├── lib/                  # Shared Utilities
        │   │   ├── ai/
        │   │   │   ├── anthropic.ts         # Claude API client
        │   │   │   ├── openai.ts            # OpenAI client
        │   │   │   └── prompts.ts           # System prompts
        │   │   ├── db/
        │   │   │   ├── prisma.ts            # Prisma singleton
        │   │   │   └── queries.ts           # Reusable queries
        │   │   ├── auth/
        │   │   │   ├── auth.ts              # Auth config
        │   │   │   └── auth-helpers.ts      # Auth utilities
        │   │   ├── vector/
        │   │   │   ├── pinecone.ts          # Pinecone client
        │   │   │   └── embeddings.ts        # Embedding utils
        │   │   └── utils/
        │   │       ├── logger.ts            # Logging
        │   │       ├── errors.ts            # Error handling
        │   │       └── validation.ts        # Input validation
        │   │
        │   ├── components/           # React Components
        │   ├── hooks/                # Custom React hooks
        │   ├── types/                # TypeScript types
        │   └── middleware.ts         # Next.js middleware
        │
        ├── prisma/
        │   ├── schema.prisma
        │   ├── migrations/
        │   └── seeds/
        │       ├── seed.ts                  # Main seed
        │       ├── seed-dev.ts              # Dev-specific seed
        │       └── seed-prod.ts             # Prod-specific seed
        │
        ├── scripts/
        │   ├── seed-mvp-data.js             # Current seed script
        │   ├── ingest-knowledge-base.ts     # Ingest sports psych docs
        │   └── generate-embeddings.ts       # Pre-generate embeddings
        │
        ├── knowledge-base/           # Sports Psychology Content
        │   ├── frameworks/
        │   │   ├── cbt.md
        │   │   ├── mindfulness.md
        │   │   └── flow-state.md
        │   └── research/
        │       └── papers/
        │
        ├── config/                   # Configuration Files
        │   ├── env.ts               # Environment validation
        │   ├── ai.config.ts         # AI model configs
        │   └── features.ts          # Feature flags
        │
        ├── .env.local               # Dev environment
        ├── .env.staging             # Staging environment
        ├── .env.production          # Production environment
        ├── .env.example             # Template
        │
        ├── next.config.js
        ├── tsconfig.json
        └── package.json
```

## Environment Structure (Dev → Prod)

### Development (.env.local)
```env
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Database
DATABASE_URL="postgresql://..."  # Local or dev Supabase

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret"
SUPABASE_SERVICE_ROLE_KEY="..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Vector DB (optional for dev)
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="us-west-2"

# Feature Flags
ENABLE_CRISIS_DETECTION=true
ENABLE_KNOWLEDGE_BASE=true
ENABLE_VOICE_INPUT=false

# Logging
LOG_LEVEL=debug
```

### Staging (.env.staging)
```env
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging

DATABASE_URL="postgresql://..."  # Staging Supabase
NEXTAUTH_URL="https://staging.mettle.coach"

# Same keys as dev but with rate limits
LOG_LEVEL=info
```

### Production (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

DATABASE_URL="postgresql://..."  # Prod Supabase
NEXTAUTH_URL="https://app.mettle.coach"

# Production keys with full quotas
# Monitoring enabled
SENTRY_DSN="..."
LOG_LEVEL=warn
```

## Key Architectural Decisions

### 1. **Unified Codebase (TypeScript)**
- All agents in TypeScript (not Python) for single-language deployment
- Use `@anthropic-ai/sdk` for Claude API
- Easier deployment, no cross-language complexity

### 2. **Service Layer Pattern**
- API routes are thin, delegate to services
- Services contain business logic
- Agents are called by services
- Clean separation of concerns

### 3. **Agent System**
```typescript
// Example: How it all connects
// apps/web/src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json();

  // Service orchestrates
  const response = await ChatService.sendMessage(message);

  return new Response(response.stream);
}

// apps/web/src/services/chat/ChatService.ts
class ChatService {
  async sendMessage(message: string) {
    // 1. Governance check (crisis detection)
    const crisisCheck = await GovernanceAgent.analyze(message);
    if (crisisCheck.isCrisis) {
      await CrisisService.createAlert(crisisCheck);
    }

    // 2. Knowledge retrieval (RAG)
    const context = await KnowledgeAgent.retrieve(message);

    // 3. Generate response with context
    const response = await AthleteAgent.respond(message, context);

    return response;
  }
}
```

### 4. **Deployment Strategy**

**MVP/Staging:**
- Deploy to Vercel (single Next.js app)
- Supabase for database
- Pinecone for vector DB
- Simple, fast deployment

**Production (Future):**
- Vercel Edge Functions for API routes
- AWS/GCP for heavy compute (if needed)
- Redis for caching
- CloudFlare for CDN
- Monitoring: Sentry, DataDog

### 5. **Feature Flags**
- Enable/disable features per environment
- Gradual rollout of new agents
- A/B testing capability
- Kill switch for problematic features

## Migration Path: MVP → Production

### Phase 1: MVP (Current + MCP Agents)
- Everything in apps/web
- Single Vercel deployment
- Basic monitoring
- Manual scaling

### Phase 2: Pre-Prod (Optimization)
- Add caching layer
- Optimize DB queries
- Add monitoring/alerts
- Load testing
- Security audit

### Phase 3: Production (Scale)
- Multi-region deployment
- Advanced caching
- Real-time analytics
- Advanced security
- Compliance certifications

## Next Steps for Implementation

1. **Set up agent folder structure**
2. **Implement BaseAgent and AgentOrchestrator**
3. **Create AthleteAgent with 5-step protocol**
4. **Add GovernanceAgent for crisis detection**
5. **Integrate KnowledgeAgent with RAG**
6. **Update chat API to use agent orchestrator**
7. **Add proper environment configuration**
8. **Test end-to-end agent flow**

This structure gives you:
✅ Everything together (single codebase)
✅ Most advanced MVP (full agent system)
✅ Easy dev/prod split (environment files)
✅ Production-ready architecture
✅ Simple deployment (Vercel)
✅ Easy to scale later
