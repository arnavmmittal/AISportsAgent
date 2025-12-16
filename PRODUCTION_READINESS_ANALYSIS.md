# Production Readiness Analysis

**Date**: 2025-12-15
**Purpose**: Evaluate folder structure, dev/prod separation, and MVP production path

---

## 📂 Current Folder Structure Analysis

### ✅ What's Good

**1. Monorepo Structure (Optimal)**
```
SportsAgent/
├── apps/
│   ├── web/          # Next.js (shared codebase for both platforms)
│   └── mobile/       # React Native Expo
├── packages/
│   └── api-client/   # Shared API client (good for consistency)
```
**Verdict**: KEEP THIS. Monorepo is production-ready.

**2. API Routes Organization**
```
apps/web/src/app/api/
├── chat/             # AI chat endpoint
├── moods/            # Mood logging
├── goals/            # Goal management
├── auth/             # Authentication
├── coach/            # Coach-specific endpoints
│   ├── athletes/
│   ├── dashboard/
│   ├── invite-code/
│   └── summaries/
```
**Verdict**: GOOD structure. Clear separation of concerns.

**3. Component Organization**
```
apps/web/src/components/
├── athlete/          # Athlete-specific UI
├── coach/            # Coach-specific UI
│   ├── analytics/
│   ├── insights/
│   ├── readiness/
│   └── charts/
├── ui/               # shadcn/ui base components
```
**Verdict**: EXCELLENT. Scales well for production.

### ⚠️ What Needs Cleanup

**1. Duplicate Route Patterns**
```
Current (CONFUSING):
/app/(coach)/          # Next.js route group (unused?)
/app/coach/            # Actual coach pages ✅
/app/student/          # Duplicate athlete portal?
/app/{dashboard, mood, goals}/  # Also athlete pages ✅
```

**Problem**: Two parallel athlete portals (`/student/` and root-level pages). This is redundant.

**Recommendation**:
- **KEEP**: `/app/coach/*` for coaches
- **KEEP**: `/app/{dashboard, mood, goals, history, chat}` for athletes
- **DELETE**: `/app/student/*` (redundant)
- **DELETE**: `/app/(coach)/*` (unused route group)

**2. Algorithm Libraries**
```
apps/web/src/lib/algorithms/
├── risk.ts           # 748 lines - complex risk scoring
├── readiness.ts      # 344 lines
├── patterns.ts       # 701 lines
├── burnout.ts        # 571 lines
├── archetype.ts      # 634 lines
```

**Issue**: These are sophisticated but NOT needed for MVP. They add:
- Complexity
- Potential bugs
- Maintenance overhead
- No real users to validate against

**MVP Recommendation**: Simple calculations in API routes, move complex algorithms post-MVP.

---

## 🔐 Dev vs. Prod Separation Strategy

### CRITICAL: Environment Separation

**Current (UNSAFE for prod):**
- Single `.env.local` file
- Demo accounts hardcoded in auth logic
- Mock data in API routes (`if (user.id.startsWith('demo-'))`)
- No RLS policies
- No cost controls

**Required for Production:**

### 1. Environment Files Structure
```
apps/web/
├── .env.example          # Template (committed)
├── .env.local            # Dev secrets (gitignored)
├── .env.production       # Prod secrets (set in Vercel, not committed)
└── .env.test             # Test environment (optional)
```

**Variables to Split:**
```bash
# Development (.env.local)
DATABASE_URL="postgresql://...dev.supabase.co..."
OPENAI_API_KEY="sk-proj-...dev-key..."  # $20/month limit
NEXT_PUBLIC_ENV="development"
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS="true"
COST_LIMIT_DAILY=100                     # Tokens per user
COST_LIMIT_MONTHLY=2000                  # Total monthly limit

# Production (Vercel env vars)
DATABASE_URL="postgresql://...prod.supabase.co..."
OPENAI_API_KEY="sk-proj-...prod-key..."  # $500/month limit
NEXT_PUBLIC_ENV="production"
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS="false"  # NO DEMO IN PROD
COST_LIMIT_DAILY=20                       # Strict per-user limit
COST_LIMIT_MONTHLY=10000                  # Monitor closely
```

### 2. Supabase Project Separation

**Create TWO Supabase projects:**

**Dev Project: `ai-sports-agent-dev`**
- Purpose: Development and testing
- Data: Can be wiped/reset anytime
- Auth: Allow demo accounts
- RLS: Can be relaxed for debugging
- Cost: Free tier ($0)

**Prod Project: `ai-sports-agent-prod`**
- Purpose: Real users ONLY
- Data: Persistent, daily backups
- Auth: Real users with invite-only
- RLS: Strictly enforced
- Cost: Paid tier with quotas

### 3. Code-Level Separation

**Create environment checker utility:**
```typescript
// apps/web/src/lib/env.ts
export const isDev = process.env.NEXT_PUBLIC_ENV === 'development';
export const isProd = process.env.NEXT_PUBLIC_ENV === 'production';
export const isTest = process.env.NEXT_PUBLIC_ENV === 'test';

export const DEMO_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';

// NEVER allow demo accounts in production
if (isProd && DEMO_ENABLED) {
  throw new Error('CRITICAL: Demo accounts enabled in production!');
}
```

**Use in auth logic:**
```typescript
// apps/web/src/lib/auth.ts
import { DEMO_ENABLED } from './env';

async function authorize(credentials) {
  // Only allow demo accounts in dev
  if (DEMO_ENABLED && credentials.email === 'demo@athlete.com') {
    return DEMO_ATHLETE;
  }

  // Production: ALWAYS query real database
  return await authenticateWithSupabase(credentials);
}
```

---

## 🛡️ Production Safety Checklist

### Authentication & Authorization
- [ ] Replace NextAuth demo accounts with Supabase Auth
- [ ] Implement Row-Level Security (RLS) in Supabase
- [ ] Verify RLS policies with test queries
- [ ] Remove all `if (user.id.startsWith('demo-'))` checks from production code
- [ ] Disable public signups (invite-only)

### Data Integrity
- [ ] Remove ALL mock data returns from API routes
- [ ] Verify all queries use real database
- [ ] Test data persists across logout/login
- [ ] Implement database backups (Supabase auto-backup)

### Cost Controls (CRITICAL)
- [ ] Daily per-user message limit (20/day)
- [ ] Monthly OpenAI budget ceiling
- [ ] Token usage tracking per request
- [ ] Alert when 80% budget consumed
- [ ] Kill switch to disable AI if budget exceeded

### Safety & Crisis Detection
- [ ] Crisis detection runs on EVERY message (no bypasses)
- [ ] Flagged sessions logged to database
- [ ] Unsafe responses overridden
- [ ] Coach email alerts for crisis situations
- [ ] Admin dashboard for reviewing flagged sessions

### Infrastructure
- [ ] Deploy to Vercel (or preferred platform)
- [ ] Set up prod environment variables
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Test deployment with staging environment first

---

## 📁 Recommended Folder Structure Changes

### Option 1: Minimal Changes (Recommended for MVP)

**What to do:**
1. Delete `/app/student/` (use existing athlete pages)
2. Delete `/app/(coach)/` (unused route group)
3. Keep everything else as-is

**Result:**
```
apps/web/src/app/
├── api/                    # Backend API routes
│   ├── chat/
│   ├── moods/
│   ├── goals/
│   ├── auth/
│   └── coach/
├── coach/                  # Coach portal pages
│   ├── dashboard/
│   ├── athletes/
│   └── ...
├── {dashboard, mood, goals, history}/  # Athlete pages
└── auth/                   # Login/signup
```

**Pros**: Minimal disruption, works for MVP
**Cons**: Slightly inconsistent naming

### Option 2: Clean Refactor (Post-MVP)

**What to do:**
1. Move athlete pages under `/athlete/` prefix
2. Keep `/coach/` as-is
3. Centralize under `/app/(portal)/` route group

**Result:**
```
apps/web/src/app/
├── api/
├── (portal)/              # Route group (no URL prefix)
│   ├── athlete/
│   │   ├── dashboard/
│   │   ├── mood/
│   │   ├── goals/
│   │   └── history/
│   └── coach/
│       ├── dashboard/
│       └── ...
└── auth/
```

**Pros**: Clean, scalable, symmetric
**Cons**: Requires refactoring, migration work

**Recommendation**: Stick with **Option 1** for MVP. Refactor post-launch.

---

## 🚀 Production Deployment Strategy

### Week 1: Infrastructure Setup
1. **Day 1-2**: Create prod Supabase project
2. **Day 3-4**: Implement Supabase Auth (replace NextAuth)
3. **Day 5**: Set up RLS policies
4. **Day 6-7**: Test auth flow end-to-end

### Week 2: Safety & Cost
1. **Day 1-2**: Implement cost control middleware
2. **Day 3-4**: Crisis detection enforcement
3. **Day 5**: Remove all mock data from API routes
4. **Day 6-7**: Test with real data only

### Week 3: Testing & Launch Prep
1. **Day 1-2**: Deploy to Vercel staging
2. **Day 3-4**: Test with 2-3 real athletes + 1 coach
3. **Day 5**: Verify cost caps, safety checks
4. **Day 6**: Set up monitoring and alerts
5. **Day 7**: Go/no-go decision

### Week 4: Production Launch
1. **Day 1**: Deploy to production
2. **Day 2-3**: Monitor closely, fix bugs
3. **Day 4-5**: Onboard first cohort (5-10 athletes)
4. **Day 6-7**: Collect feedback, iterate

---

## ⚠️ Dangerous Patterns to Avoid

### 1. Demo Data in Production
```typescript
// ❌ NEVER DO THIS IN PRODUCTION
if (user.id.startsWith('demo-')) {
  return MOCK_DATA;
}
```
**Why dangerous**: Gives false sense of functionality, hides database issues.

### 2. Bypassing Safety Checks
```typescript
// ❌ NEVER SKIP CRISIS DETECTION
if (isDev) {
  return aiResponse;  // Skip safety check
}
```
**Why dangerous**: One forgotten check = liability.

### 3. Shared API Keys
```typescript
// ❌ NEVER USE SAME OPENAI KEY FOR DEV/PROD
const OPENAI_KEY = "sk-shared-key-123";
```
**Why dangerous**: Dev testing consumes prod budget, no usage separation.

### 4. No Rate Limiting
```typescript
// ❌ NEVER ALLOW UNLIMITED REQUESTS
export async function POST(req) {
  const response = await openai.chat.completions.create(...);
  // No limits = runaway costs
}
```
**Why dangerous**: $10k bill from spam/bugs.

---

## 📊 Success Metrics for Production

### MVP Success = Real Users + Real Data + Real Safety

**Quantitative:**
- 5-10 athletes actively using (not demo accounts)
- 50+ chat sessions logged to database
- 30+ mood logs per week
- 5+ goals created and tracked
- 1 coach finding value in dashboard
- $0 crisis detection failures
- <$100/month OpenAI costs

**Qualitative:**
- Athletes report it's helpful
- Coach says "this saves me time"
- No data leaks or auth issues
- Safety protocols never bypassed

---

## 🎯 Immediate Next Steps

### This Week (Must Do)
1. [ ] Create dev Supabase project
2. [ ] Set up environment variable separation
3. [ ] Write RLS policies (even if not enforced yet)
4. [ ] Add cost tracking to chat endpoint
5. [ ] Document production deployment process

### Next Week (Critical Path)
1. [ ] Replace NextAuth with Supabase Auth
2. [ ] Remove demo data from API routes
3. [ ] Implement crisis detection enforcement
4. [ ] Deploy to Vercel staging
5. [ ] Test with 2 real users

### Following Week (Launch Prep)
1. [ ] Create prod Supabase project
2. [ ] Set up monitoring (Sentry)
3. [ ] Final security review
4. [ ] Deploy to production
5. [ ] Onboard first cohort

---

## 📝 Final Recommendations

### Keep (Production-Ready)
- ✅ Monorepo structure
- ✅ API route organization
- ✅ Component architecture
- ✅ Mobile app structure
- ✅ All existing features (Analytics, Insights, etc.)

### Fix (Critical for Production)
- ❌ Demo account system (replace with Supabase Auth)
- ❌ Mock data in API routes (query real DB)
- ❌ No RLS policies (implement ASAP)
- ❌ No cost controls (add middleware)
- ❌ Crisis detection not enforced (make mandatory)

### Delete (Cleanup Only)
- `/app/student/` (redundant with root athlete pages)
- `/app/(coach)/` (unused route group)
- Duplicate directories (already cleaned)

### Move to Post-MVP
- Complex algorithm libraries (use simple calculations for MVP)
- Voice chat polish (works but can improve later)
- Advanced analytics (simpler metrics for MVP)
- MCP server integration (Next.js API routes sufficient for MVP)

---

**Bottom Line**: The codebase is feature-rich and well-structured. The main gaps are **production infrastructure** (auth, RLS, cost controls, safety) rather than features. Focus next 2-3 weeks on making what exists safe for real users.
