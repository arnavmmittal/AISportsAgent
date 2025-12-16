# MVP Status & Production Roadmap

**Last Updated**: 2025-12-15
**Current Branch**: `main`
**Status**: Feature-complete, moving to production readiness

---

## ✅ MVP Features Complete

### Athlete Portal
- [x] Authentication (demo accounts + NextAuth)
- [x] AI Chat interface (text + voice streaming)
- [x] Mood tracking with visualizations
- [x] Goal setting and progress tracking
- [x] Session history
- [x] Mobile app (iOS + Android via Expo)

### Coach Portal
- [x] Team dashboard with analytics
- [x] Athlete roster with filtering
- [x] Readiness scores and trends
- [x] Crisis alerts
- [x] AI-powered insights and pattern detection
- [x] Assignment management
- [x] Settings and privacy controls
- [x] Mobile coach portal (7 tabs matching web)

### Infrastructure
- [x] PostgreSQL database (Prisma ORM)
- [x] API routes for web + mobile
- [x] JWT authentication for mobile
- [x] Demo accounts (no database required)
- [x] Shared API client package

---

## 🚧 MVP Gaps (Must Fix Before Production)

### CRITICAL - Security & Data
- [ ] **Replace demo accounts with Supabase Auth**
  - Current: Hardcoded demo users in auth logic
  - Target: Real invite-only auth with RLS
  - Impact: No production without this

- [ ] **Implement Row-Level Security (RLS)**
  - Current: No database-level access control
  - Target: Supabase RLS policies per user/role
  - Impact: Data leaks possible

- [ ] **Remove all mock data from API routes**
  - Current: `if (user.id.startsWith('demo-'))` returns mock data
  - Target: Real database queries only
  - Impact: False sense of functionality

### CRITICAL - Cost & Safety
- [ ] **AI Cost Controls**
  - Daily per-user message caps (20 messages/day)
  - Monthly OpenAI budget ceiling ($100 dev, $500 prod)
  - Token tracking and alerts
  - Rate limiting middleware

- [ ] **Crisis Detection Always On**
  - Current: Exists but may not run on every message
  - Target: Safety check before ANY AI response
  - Must log flagged sessions
  - Must override AI response if unsafe

### HIGH PRIORITY - Data Persistence
- [ ] **All data must persist in real database**
  - Sessions (no fake history)
  - Moods (no hardcoded trends)
  - Goals (CRUD against DB)
  - Coach summaries (auto-generated, not static)

- [ ] **Environment Separation**
  - Dev Supabase project (for testing)
  - Prod Supabase project (for real users)
  - Separate OpenAI API keys with limits
  - `.env` vs `.env.production` separation

---

## 📋 Production Checklist

### Week 1: Core Infrastructure
- [ ] Set up Supabase Auth (replace NextAuth)
  - Email/password + magic link
  - Invite-only (disable public signup)
  - Store roles in `users` table
- [ ] Implement RLS policies
  - Athletes see only their data
  - Coaches see only consented athletes
  - Admins see all (with audit log)
- [ ] Create dev + prod Supabase projects
- [ ] Set OpenAI spending limits ($20 dev, $100 prod)

### Week 2: Safety & Cost
- [ ] Single `/api/chat` endpoint (no client OpenAI calls)
- [ ] Crisis detection before every response
  - Parse message for self-harm, abuse, severe depression
  - Log flagged sessions
  - Return safe fallback response
- [ ] Cost control middleware
  - Track tokens per request
  - Daily user message cap (20/day)
  - Monthly budget ceiling
  - Alert when 80% budget used
- [ ] Remove ALL mock data from prod

### Week 3: Real Data + Coach Value
- [ ] Sessions persist to database
- [ ] Mood history visible (from DB)
- [ ] Goals editable (CRUD operations)
- [ ] Coach weekly summary auto-generation
- [ ] Coach dashboard (real athlete data with consent)
- [ ] Test data survives logout/device switch

### Week 4: Testing + Polish
- [ ] Test with 2-3 real athletes
- [ ] Test with 1 real coach
- [ ] Test crisis detection with edge cases
- [ ] Verify cost caps work (try to spam)
- [ ] Confirm safety never bypassed
- [ ] No crashes on long sessions

---

## 🎯 MVP "Done" Gate

Production readiness achieved when:

✅ Real users (no demo accounts in prod)
✅ Real auth (Supabase Auth with RLS)
✅ Real data (no mock responses)
✅ Real AI (single controlled endpoint)
✅ Cost bounded (daily caps + budget ceiling)
✅ Safety enforced (crisis detection always runs)
✅ Coach value proven (weekly summaries useful)

**NOT required for MVP:**
- 10k users
- AWS migration
- Perfect UI
- Voice streaming polish
- Offline mode

---

## 🏗️ Architecture Decisions

### Current Architecture (MVP)
```
Frontend (Next.js + React Native)
    ↓
API Routes (/api/chat, /api/moods, /api/goals)
    ↓
Supabase (PostgreSQL + Auth + RLS)
    ↓
OpenAI API (GPT-4)
```

### Future Architecture (Post-MVP)
```
Frontend
    ↓
Next.js API (simple CRUD)
    ↓
Python MCP Server (advanced AI orchestration)
    ↓
Supabase + OpenAI + Vector DB
```

**Decision**: Keep simple for MVP, add MCP layer when we need:
- Multi-agent workflows
- RAG knowledge base
- Complex intervention logic

### Folder Structure (Current)

```
apps/web/src/
  app/
    api/
      chat/route.ts              # Main AI endpoint
      moods/route.ts
      goals/route.ts
      auth/[...nextauth]/route.ts
      coach/
        athletes/route.ts
        dashboard/route.ts
    athlete/                     # Athlete pages
      chat/
      mood/
      goals/
      history/
    coach/                       # Coach pages
      dashboard/
      athletes/
      analytics/
      readiness/
      insights/
      assignments/
      settings/
  components/
    athlete/                     # Athlete UI components
    coach/                       # Coach UI components
    ui/                          # shadcn/ui base
  lib/
    prisma.ts                    # Database client
    auth.ts                      # NextAuth config
    auth-helpers.ts              # JWT + session helpers
```

**Recommendation**: This structure is fine for MVP. No refactor needed.

---

## 🔐 Production Environment Setup

### Required Environment Variables

**Development (`apps/web/.env.local`):**
```bash
DATABASE_URL="postgresql://...dev.supabase.co..."
NEXTAUTH_SECRET="[run: openssl rand -base64 32]"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-...dev-key..."
NEXT_PUBLIC_ENV="development"
```

**Production (Vercel environment variables):**
```bash
DATABASE_URL="postgresql://...prod.supabase.co..."
NEXTAUTH_SECRET="[different-secret]"
NEXTAUTH_URL="https://app.yourdomain.com"
OPENAI_API_KEY="sk-...prod-key..."
NEXT_PUBLIC_ENV="production"
```

### Supabase Projects

**Dev Project:**
- Name: `ai-sports-agent-dev`
- Purpose: Development + testing
- Data: Can be wiped/reset
- OpenAI: $20 monthly limit

**Prod Project:**
- Name: `ai-sports-agent-prod`
- Purpose: Real users only
- Data: Persistent, backed up
- OpenAI: $100 monthly limit

---

## 🚀 Next Steps (Immediate)

### This Week
1. [ ] Create dev Supabase project
2. [ ] Implement Supabase Auth (replace demo accounts)
3. [ ] Add RLS policies to database
4. [ ] Remove mock data from coach APIs
5. [ ] Add cost control middleware

### Next Week
1. [ ] Crisis detection testing
2. [ ] Real data persistence verification
3. [ ] Coach weekly summary generation
4. [ ] Test with 2-3 athletes + 1 coach

### Following Week
1. [ ] Create prod Supabase project
2. [ ] Deploy to Vercel
3. [ ] Mobile app to TestFlight (iOS)
4. [ ] Institutional pilot preparation

---

## 📊 Current Metrics (Mock)

Replace with real metrics once production:
- Total users: TBD
- Sessions/day: TBD
- Crisis alerts: TBD
- Coach engagement: TBD
- OpenAI costs: TBD

---

## 🤔 Open Questions

1. **Auth Strategy**: Supabase Auth or keep NextAuth v5?
   - Recommendation: Supabase Auth (simpler RLS integration)

2. **Mobile Deployment**: App Store or web-only MVP?
   - Recommendation: TestFlight beta, delay App Store until post-MVP

3. **Voice Chat**: Include in MVP or skip?
   - Current: Voice exists but may skip for production readiness
   - Recommendation: Include (already built)

4. **Crisis Protocol**: Who gets alerts?
   - Recommendation: Email to coach + admin + log to DB

---

## 📝 Notes

- Keep this file updated weekly during MVP push
- Mark items complete with [x] as you go
- Update metrics when real data flows
- Document blockers immediately
