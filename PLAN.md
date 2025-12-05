# AI Sports Agent - Development Plan & Progress

**Last Updated**: 2025-12-05
**Current Phase**: MVP Development
**Active Branch**: `feature/signup-database-setup`

---

## 🎯 Project Vision

**Core Problem**: Each sports psychology coach manages 150+ student athletes, making individual support impossible at scale.

**Solution**: AI-powered 24/7 mental performance assistant that replaces traditional Zoom meetings with:
- Voice + text chat interface (primary interaction point)
- Evidence-based sports psychology frameworks (CBT, mindfulness, flow state)
- Coach dashboard for monitoring trends and crisis alerts
- Privacy-first design with athlete consent controls

**Primary Use Case**: The `/chat` page is the core product - it replaces scheduled coach-athlete Zoom meetings with on-demand AI conversations.

---

## 📊 Current Status

### ✅ Completed

#### Database & Backend
- [x] Prisma schema with all models (User, Athlete, Coach, ChatSession, Message, MoodLog, Goal, CrisisAlert, etc.)
- [x] Supabase PostgreSQL database configured
- [x] Database connection string in `.env` and `.env.local`
- [x] Signup API route (`/api/auth/signup/route.ts`) with:
  - Zod validation for email, password (8+ chars, uppercase, lowercase, number)
  - bcrypt password hashing (12 rounds)
  - Transactional user + role-specific record creation
  - Default school (University of Washington) auto-creation
  - Proper error handling for duplicates, database errors

#### Frontend Pages & Components
- [x] Signup page (`/auth/signup`)
- [x] Signin page (`/auth/signin`)
- [x] Chat interface (`/chat`) with voice + text support
- [x] Athlete dashboard (`/dashboard`)
- [x] Mood tracking page (`/mood`)
- [x] Goal management page (`/goals`)
- [x] UI components (shadcn/ui based)
- [x] Voice chat components with Cartesia.ai + OpenAI TTS fallback
- [x] Real-time streaming chat with Vercel AI SDK

#### Recent Work (Past Week)
- [x] Integrated athlete dashboard with real-time API data
- [x] Implemented Cartesia.ai → OpenAI TTS fallback for voice
- [x] Fixed voice chat audio format and streaming issues
- [x] Resolved WebSocket lifecycle and text chat streaming

### 🔄 In Progress

#### Current Sprint: MVP Authentication & Database Setup
- [ ] **Database Schema Sync**: Run `npx prisma db push` to sync schema to Supabase (BLOCKED: waiting for Pro tier activation)
- [ ] **NextAuth.js Setup**: Configure NextAuth v5 with credentials provider
- [ ] **Authentication Flow**: Test signup → signin → protected routes
- [ ] **Chat API Endpoint**: Ensure chat works with authenticated users
- [ ] **End-to-End Testing**: Verify complete user journey

### 📋 Next Up (MVP Completion)

#### Phase 1: Core MVP Features
1. **Authentication** (Current Focus)
   - [ ] NextAuth.js configuration with Prisma adapter
   - [ ] Protected route middleware
   - [ ] Session management
   - [ ] Logout functionality

2. **Chat Functionality**
   - [ ] Create chat API endpoint (`/api/chat/route.ts`) with OpenAI streaming
   - [ ] Session creation and message persistence
   - [ ] Voice + text mode switching
   - [ ] Chat history loading
   - [ ] Basic crisis detection keywords

3. **Athlete Dashboard**
   - [ ] Display recent chat sessions
   - [ ] Show mood trends (basic charts)
   - [ ] List active goals
   - [ ] Profile settings

4. **Basic Coach Dashboard**
   - [ ] View aggregated athlete metrics (with consent only)
   - [ ] Crisis alerts list
   - [ ] Team mood overview

#### Phase 2: Enhanced Features
- [ ] Advanced mood tracking visualizations
- [ ] Goal progress tracking with milestones
- [ ] RAG knowledge base integration (MCP agent)
- [ ] Email notifications for crisis alerts
- [ ] Multi-school support with row-level security

#### Phase 3: Production Ready
- [ ] HIPAA/FERPA compliance audit
- [ ] Rate limiting and security hardening
- [ ] Performance optimization
- [ ] Deployment to Vercel
- [ ] User acceptance testing with real athletes

---

## 🏗️ Architecture Overview

### Tech Stack
**Frontend**:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- NextAuth.js v5 (Auth)
- Vercel AI SDK (Streaming)
- Zustand (State)

**Backend**:
- Supabase PostgreSQL
- OpenAI GPT-4
- Cartesia.ai (Voice TTS)
- MCP Server (Python/FastAPI - separate repo)

**Deployment**:
- Vercel (Frontend)
- Supabase (Database)

### Database Connection
```
Host: db.ccbcrerrnkqqgxtlqjnm.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: p?Y83B?P?uNnP5b (URL encoded as p%3FY83B%3FP%3FuNnP5b)
```

**Status**: Recently upgraded to Supabase Pro tier

---

## 🚧 Current Blockers & Issues

### Active Blockers
1. **Database Connectivity** (RESOLVED - Pro tier activated)
   - Previous issue: Free tier database was paused
   - Action: Upgraded to Supabase Pro
   - Next step: Test connectivity and run `prisma db push`

### Known Issues
- None currently blocking MVP

---

## 🔀 Git Workflow

### Active Branches
- `main`: Production-ready code
- `feature/signup-database-setup`: ⭐ CURRENT - Authentication and database setup
- `feature/mcp-agent-integration`: Full MCP agent orchestration
- `feature/voice-integration`: Voice chat features (merged into main)
- `feature/coach-experience`: Coach dashboard work
- `feature/ui-polish-design-system`: UI/UX improvements

### Branching Strategy
- **Feature branches**: `feature/[descriptive-name]`
- **Bug fixes**: `fix/[bug-description]`
- **Refactoring**: `refactor/[component-name]`
- **Documentation**: `docs/[doc-name]`

**Important**: Always use descriptive branch names (avoid generic names like `develop`, `dev`, `integration`)

### Commit Guidelines
- Commit frequently with clear messages
- Format: `type: description` (e.g., `feat: Add signup validation`, `fix: Resolve database connection`)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## 📝 Important Development Notes

### Security Considerations
- **Password Hashing**: bcrypt with 12 rounds (done)
- **Input Validation**: Zod schemas for all user inputs (done)
- **SQL Injection**: Using Prisma ORM (protected)
- **CSRF Protection**: NextAuth.js handles this
- **Rate Limiting**: TODO - implement for production
- **HIPAA/FERPA**: Encryption at rest (Supabase), TLS in transit, audit logs needed

### Privacy & Consent
- Athletes must explicitly consent for coach to view their data (`consentCoachView` field)
- Crisis alerts bypass consent for safety
- Anonymized data only in coach dashboards (unless consent given)
- Row-level security by `schoolId` for multi-tenancy

### AI Chat Guidelines
- System prompt emphasizes evidence-based psychology
- Crisis keywords trigger immediate resource provision
- No medical advice - refers to professionals when needed
- Maintains conversation context across sessions
- Uses Discovery-First protocol (5 steps: Discovery → Understanding → Framework → Action → Follow-up)

### Testing Strategy
- Manual testing for MVP
- Critical paths to test:
  1. Signup → Signin → Chat → Logout
  2. Crisis keyword detection → Alert generation
  3. Coach dashboard with/without athlete consent
  4. Voice chat audio streaming
  5. Mood logging → Dashboard visualization

---

## 🎯 Success Metrics (Post-MVP)

- **Athlete Engagement**: Daily active users, avg session length
- **Mental Health Outcomes**: Pre/post mood scores, goal completion rate
- **Coach Efficiency**: Time saved per athlete, crisis detection accuracy
- **Platform Reliability**: Uptime, response latency, error rates

---

## 🔗 Key Resources

- **Main Codebase**: `/Users/arnavmittal/Desktop/SportsAgent/ai-sports-agent/`
- **Prisma Schema**: `ai-sports-agent/prisma/schema.prisma`
- **Project Docs**: `CLAUDE.md`, `README.md`, `GETTING_STARTED.md`
- **MCP Server**: Separate Python repo (not current focus for MVP)
- **GitHub Repo**: https://github.com/arnavmmittal/AISportsAgent.git

---

## 📅 Timeline & Milestones

### Week 1 (Current): MVP Foundation
- [x] Database schema finalized
- [x] Signup API completed
- [ ] Authentication flow working
- [ ] Basic chat functional
- [ ] Dashboard displays data

### Week 2: MVP Features
- [ ] Mood tracking with charts
- [ ] Goal management CRUD
- [ ] Coach dashboard with consent logic
- [ ] Crisis detection MVP

### Week 3: Polish & Testing
- [ ] UI/UX refinements
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes

### Week 4+: Production Prep
- [ ] Security audit
- [ ] Deployment pipeline
- [ ] User documentation
- [ ] Pilot testing with real users

---

## 💡 Ideas & Future Enhancements

- Integration with wearables (sleep, HRV data)
- Team-wide challenges and leaderboards
- Peer support groups (moderated)
- Mobile app (React Native)
- Multilingual support
- Custom frameworks per sport (e.g., golf-specific mental game)

---

## 🐛 Troubleshooting Guide

### Common Issues

**1. Database Connection Failed**
- Check Supabase dashboard - is project paused?
- Verify DATABASE_URL in `.env` and `.env.local`
- Test with `npx prisma db push`

**2. Prisma Client Out of Sync**
- Run `npm run prisma:generate` after schema changes
- Clear `.next` folder: `rm -rf .next`

**3. NextAuth Session Issues**
- Verify NEXTAUTH_SECRET is set (32+ char random string)
- Check NEXTAUTH_URL matches your dev environment

**4. Build Errors**
- Run `npm run type-check` to find TypeScript errors
- Check for missing dependencies: `npm install`

---

## 📞 Contact & Support

- **Developer**: Arnav Mittal
- **Institution**: University of Washington
- **Project Type**: Research project for collegiate sports psychology

---

*This file is continuously updated to maintain context across development sessions. Always update this file when completing tasks, changing plans, or encountering blockers.*
