# AI Sports Agent - Project Context

This file provides Claude with essential context about the AI Sports Agent project.

## 📋 IMPORTANT: Development Plan & Progress

**Always check `PLAN.md` first** - This file contains:
- Current MVP progress and completed work
- Active branch and sprint goals
- Blockers and issues
- Next steps and task breakdown
- Database connection info
- Git workflow and commit history context

`PLAN.md` is maintained continuously across all development sessions to preserve context. **Update it whenever you complete tasks, encounter blockers, or change direction.**

## Project Overview

AI Sports Agent is an evidence-based virtual sports psychology assistant for collegiate athletes. The platform provides 24/7 mental performance support through AI-powered conversations, mood tracking, and goal management.

### PRIMARY USE CASE - Critical Context

**The Problem**: Each sports psychology coach is responsible for 150+ student athletes, making it impossible to provide individual Zoom meetings or one-on-one sessions with adequate frequency and quality.

**The Solution**: The AI chat interface **replaces and improves traditional Zoom meetings** by providing:
- **24/7 Availability**: Athletes get immediate support whenever they need it (pre-game anxiety, performance slumps, academic stress)
- **Voice + Text**: Natural conversation via voice (like ChatGPT/Claude voice mode) or typing - more convenient than scheduling Zoom calls
- **Consistent Quality**: Evidence-based sports psychology frameworks (CBT, mindfulness, flow state) applied consistently
- **Scalability**: One coach can monitor 150+ athletes through aggregated insights, crisis alerts, and trends
- **Privacy**: Athletes feel more comfortable discussing sensitive topics with AI than in group settings

**Chat Interface is the Core**: The chat page (`/chat`) is the primary interface where athletes spend most of their time. This is what replaces the traditional coach-athlete Zoom meeting.

### Core Purpose
- **Athletes**: Get immediate access to evidence-based mental performance guidance through voice/text chat (replacing scheduled Zoom meetings)
- **Coaches**: Monitor team mental health trends through anonymized insights and focus on crisis cases (150+ athletes per coach)
- **Institutions**: Extend sports psychology resources beyond traditional capacity constraints

## Project Structure

```
SportsAgent/
├── ai-sports-agent/        # Next.js frontend application
├── ai-sports-mcp/          # Python MCP server with agent orchestration
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

## ai-sports-mcp (MCP Server Platform)

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

**IMPORTANT: Always create/switch to a feature branch before starting new work.**

**Branch Naming Convention:**
- `feature/[feature-name]` - New features (e.g., `feature/voice-integration`, `feature/coach-dashboard`)
- `fix/[bug-description]` - Bug fixes (e.g., `fix/auth-redirect-loop`)
- `refactor/[component-name]` - Code refactoring (e.g., `refactor/prisma-models`)
- `docs/[doc-name]` - Documentation updates

**IMPORTANT: Use Descriptive Branch Names**
- ❌ **Avoid generic names**: `develop`, `dev`, `integration`, `testing`, `wip`
- ✅ **Use specific names**: `feature/mvp-chat-interface`, `fix/voice-websocket-disconnect`, `refactor/agent-singletons`
- **Why**: Descriptive names make it clear what work is happening on each branch, especially when multiple features are in development simultaneously

**Workflow:**
1. **Before starting new work:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **During development:**
   - Make small, focused commits with clear messages
   - Push to remote regularly: `git push -u origin feature/your-feature-name`

3. **When feature is complete:**
   - Ensure all tests pass and code is reviewed
   - Create pull request to `main` branch
   - Include summary of changes and testing notes

4. **After PR merge:**
   - Delete local branch: `git branch -d feature/your-feature-name`
   - Delete remote branch: `git push origin --delete feature/your-feature-name`

**Current Branches:**
- `main` - Production-ready code (MVP with basic chat + MCP integration)
- `feature/mcp-agent-integration` - Full MCP agent orchestration + knowledge base

### Environment Variables

**ai-sports-agent** (.env.local):
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
```

**ai-sports-mcp** (.env):
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
2. **ai-sports-mcp**: Advanced MCP agent platform (full-featured)

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

## Key Priorities

1. **Safety First**: Crisis detection must work perfectly
2. **Privacy**: Athlete data is sacred - never expose without consent
3. **Evidence-Based**: All psychological content must cite research
4. **User Experience**: Athletes need simple, fast, supportive interface
5. **Coach Value**: Provide actionable insights without compromising privacy

## Resources

- **Main Docs**: `GETTING_STARTED.md`, `README.md` files in each directory
- **Setup Guide**: `ai-sports-agent/SETUP.md`
- **Architecture**: `ai-sports-mcp/ARCHITECTURE.md`
- **Implementation**: `ai-sports-mcp/IMPLEMENTATION_GUIDE.md`

## Notes

- This is a university research project for University of Washington
- Target users: collegiate student-athletes and coaching staff and eventually across all universities
- Goal: Extend sports psychology resources beyond traditional capacity
- Built with mental health and performance outcomes as primary metrics

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
