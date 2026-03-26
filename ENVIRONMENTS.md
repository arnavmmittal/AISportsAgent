# Environment Management Guide

> **How staging and production should work** for Flow Sports Coach

---

## Current State

| Environment | Status | Vercel Vars | Database | Domain |
|-------------|--------|-------------|----------|--------|
| **Production** | ❌ Not configured | None | None | Not assigned |
| **Staging/Preview** | ✅ Active | 21 vars | Supabase (current) | Preview URLs |
| **Local Development** | ✅ Active | .env.local | Same as staging | localhost:3000 |

**This is correct for now.** You shouldn't have production until ready to go live.

---

## The Three Environments

### 1. Local Development (`localhost:3000`)
**Purpose:** Day-to-day coding and testing

```
Branch: feature/* or staging
Database: Staging Supabase (shared with Preview)
Env File: apps/web/.env.local
```

**When to use:**
- Writing new features
- Debugging
- Running tests
- Quick iterations

---

### 2. Staging / Preview (`staging` branch → Vercel Preview)
**Purpose:** Integration testing before production

```
Branch: staging
Database: Staging Supabase
Vercel: Preview deployments (auto-deploy on push)
URL: Random preview URL or custom staging domain
```

**When to use:**
- Testing features with team
- Beta testing with select users
- Verifying before production release
- Running the 8-week UW pilot

**Current setup:** ✅ Working - all 21 env vars configured for Preview

---

### 3. Production (`main` branch → Vercel Production)
**Purpose:** Live users, paying universities

```
Branch: main
Database: SEPARATE production Supabase project
Vercel: Production deployment
URL: app.flowsportscoach.com (or similar)
```

**NOT NEEDED YET.** Set up when:
- UW pilot is successful
- Ready for paying customers
- Security audit complete
- FERPA compliance verified

---

## Recommended Setup

### Right Now (Pre-Launch)

```
┌─────────────────┐     ┌─────────────────┐
│  Local Dev      │────▶│  Staging        │
│  (localhost)    │     │  (Preview)      │
│                 │     │                 │
│  feature/*      │     │  staging branch │
│  .env.local     │     │  Vercel Preview │
│                 │     │  Same Supabase  │
└─────────────────┘     └─────────────────┘
         │                      │
         │    git push          │
         └──────────────────────┘
```

**This is fine.** You don't need production yet.

---

### When Ready for Production

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Local Dev      │────▶│  Staging        │────▶│  Production     │
│  (localhost)    │     │  (Preview)      │     │  (Live)         │
│                 │     │                 │     │                 │
│  feature/*      │     │  staging branch │     │  main branch    │
│  .env.local     │     │  Vercel Preview │     │  Vercel Prod    │
│  Staging DB     │     │  Staging DB     │     │  PROD DB        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key differences for production:**
1. **Separate Supabase project** - Different database with real user data
2. **Different API keys** - Production OpenAI key with higher limits
3. **Different secrets** - Unique NEXTAUTH_SECRET, CRON_SECRET
4. **Custom domain** - app.flowsportscoach.com
5. **Stricter settings** - ENABLE_DEMO_ACCOUNTS=false, lower rate limits

---

## Setting Up Production (When Ready)

### Step 1: Create Production Supabase Project
```bash
# In Supabase Dashboard:
# 1. Create new project: "flowsportscoach-prod"
# 2. Run Prisma migrations
# 3. Apply RLS policies
# 4. Note the new keys
```

### Step 2: Add Production Env Vars to Vercel
```bash
cd apps/web

# Database
printf "postgresql://..." | npx vercel env add DATABASE_URL production --force

# Supabase (NEW production project)
printf "https://xxx.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
printf "eyJ..." | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
printf "eyJ..." | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --force

# New secrets (generate fresh)
printf "$(openssl rand -base64 32)" | npx vercel env add NEXTAUTH_SECRET production --force
printf "$(openssl rand -base64 32)" | npx vercel env add CRON_SECRET production --force
printf "$(openssl rand -hex 32)" | npx vercel env add SUMMARY_ENCRYPTION_KEY production --force

# Same OpenAI key OR production key with higher limits
printf "sk-proj-..." | npx vercel env add OPENAI_API_KEY production --force

# Production settings
printf "false" | npx vercel env add NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS production --force
printf "true" | npx vercel env add ENABLE_COST_LIMITS production --force
printf "false" | npx vercel env add ENABLE_DEBUG_ROUTES production --force
```

### Step 3: Add Production Domain
```bash
npx vercel domains add app.flowsportscoach.com
```

### Step 4: Deploy to Production
```bash
git checkout main
git merge staging
git push origin main
# Vercel auto-deploys to production
```

---

## Current Recommendation

### For UW Pilot (8 weeks)

**Use staging only.** Here's why:

1. **Simpler** - One environment to manage
2. **Faster iteration** - Can push fixes immediately
3. **Pilot is testing** - Not "production" in the real sense
4. **Limited users** - 15 athletes, 1 coach

**Setup for pilot:**
- Give pilot users a preview URL (or set up staging.flowsportscoach.com)
- Use current staging database
- Monitor closely via Sentry + Vercel logs

### For Real Production (After Pilot)

**Create separate production when:**
- [ ] Pilot is successful (60%+ weekly active users)
- [ ] Ready for second university
- [ ] Charging money
- [ ] Need data isolation between pilot and real users

---

## Branch → Environment Mapping

| Branch | Deploys To | Database | URL |
|--------|------------|----------|-----|
| `feature/*` | Nothing (PR previews only) | - | PR preview URL |
| `staging` | Vercel Preview | Staging Supabase | Preview URL |
| `main` | Vercel Production | Production Supabase | app.flowsportscoach.com |

---

## Quick Commands

```bash
# Check current branch
git branch --show-current

# Deploy to staging
git checkout staging
git merge feature/your-feature
git push origin staging
# → Auto-deploys to Preview

# Deploy to production (CAREFUL)
git checkout main
git merge staging
git push origin main
# → Auto-deploys to Production

# Check Vercel env vars
npx vercel env ls

# Pull staging env to local
npx vercel env pull .env.local
```

---

## What NOT To Do

❌ **Don't share databases between staging and production**
- User data gets mixed
- Testing affects real users
- Can't reset staging without losing production data

❌ **Don't deploy directly to main**
- Always go through staging first
- Test for at least 24 hours before promoting

❌ **Don't use same secrets**
- Each environment needs unique NEXTAUTH_SECRET
- Prevents session token reuse across environments

❌ **Don't skip the staging step**
- Every change goes: Local → Staging → Production
- No exceptions

---

*Updated: 2026-02-26*
