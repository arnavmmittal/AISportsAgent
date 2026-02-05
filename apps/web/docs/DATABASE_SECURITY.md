# Database Security Guide

## Overview

This document covers the security setup for Flow Sports Coach's Supabase database, including Row-Level Security (RLS), staging/production separation, and cost controls.

## Quick Reference

| Environment | Supabase Branch | Git Branch | URL |
|-------------|-----------------|------------|-----|
| Development | N/A (local or staging) | `feature/*` | `localhost:3000` |
| Staging | `staging` | `staging` | `staging.flowsportscoach.com` |
| Production | `main` | `main` | `app.flowsportscoach.com` |

## 1. Applying the RLS Migration

### Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your **staging** project first

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Copy the entire contents of:
     ```
     apps/web/prisma/migrations/20260205_comprehensive_rls_fix.sql
     ```
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - No errors in the console

### Verification Queries

After running the migration, execute these verification queries:

```sql
-- 1. Check all tables have RLS enabled (should return EMPTY)
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. Count total policies (should be 100+)
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';

-- 3. Check for policies with wrong column names (should return EMPTY)
SELECT tablename, policyname, qual::text as definition
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%"userId"%'
  AND tablename IN ('PerformanceMetric', 'Task', 'MoodLog');

-- 4. List all policies for verification
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 2. Staging vs Production Setup

### Supabase Branch Configuration

**Staging Branch** (`staging`):
- Linked to GitHub `staging` branch
- Used for testing RLS policies
- Safe to experiment with migrations
- Lower cost limits for testing

**Production Branch** (`main`):
- Linked to GitHub `main` branch
- Never test migrations here first
- Stricter security settings
- Full cost controls enabled

### Environment Variables by Environment

#### Staging (`.env.staging`)

```env
# Database
DATABASE_URL="postgresql://[staging-connection-string]"
SUPABASE_URL="https://[staging-project-id].supabase.co"
SUPABASE_ANON_KEY="[staging-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[staging-service-role-key]"

# Auth
NEXTAUTH_URL="https://staging.flowsportscoach.com"
NEXTAUTH_SECRET="[32+ character secret - different from prod]"

# Features - More relaxed for testing
ENABLE_DEMO_ACCOUNTS=true
ENABLE_DEBUG_ROUTES=true
ENABLE_COST_LIMITS=true
ENABLE_RATE_LIMITING=true

# Cost limits - Lower for staging
COST_LIMIT_DAILY=100
COST_LIMIT_MONTHLY=500
COST_CIRCUIT_BREAKER=50

# OpenAI
OPENAI_API_KEY="sk-[your-key]"
OPENAI_MODEL="gpt-4-turbo-preview"

# Optional for staging
ENCRYPTION_KEY="[64 hex chars - generate with: openssl rand -hex 32]"
```

#### Production (`.env.production`)

```env
# Database
DATABASE_URL="postgresql://[production-connection-string]"
SUPABASE_URL="https://[production-project-id].supabase.co"
SUPABASE_ANON_KEY="[production-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[production-service-role-key]"

# Auth - MUST use HTTPS
NEXTAUTH_URL="https://app.flowsportscoach.com"
NEXTAUTH_SECRET="[32+ character secret - DIFFERENT from staging]"

# Features - STRICT for production
ENABLE_DEMO_ACCOUNTS=false    # CRITICAL: Must be false
ENABLE_DEBUG_ROUTES=false     # CRITICAL: Must be false
ENABLE_COST_LIMITS=true       # CRITICAL: Must be true
ENABLE_RATE_LIMITING=true     # CRITICAL: Must be true

# Cost limits - Production values
COST_LIMIT_DAILY=500
COST_LIMIT_MONTHLY=10000
COST_CIRCUIT_BREAKER=500

# OpenAI
OPENAI_API_KEY="sk-[your-key]"
OPENAI_MODEL="gpt-4-turbo-preview"

# REQUIRED for production
ENCRYPTION_KEY="[64 hex chars - generate with: openssl rand -hex 32]"
CRISIS_EMERGENCY_EMAIL="crisis@yourschool.edu"

# Monitoring (highly recommended)
SENTRY_DSN="https://[your-sentry-dsn]"
NEXT_PUBLIC_SENTRY_DSN="https://[your-sentry-dsn]"
```

### Vercel Environment Configuration

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add variables for each environment:**
   - Select "Preview" for staging
   - Select "Production" for production
   - Use different values for each

3. **Critical production settings:**
   ```
   ENABLE_DEMO_ACCOUNTS = false (Production only)
   ENABLE_DEBUG_ROUTES = false (Production only)
   ENABLE_COST_LIMITS = true (Production only)
   ```

## 3. Security Layers

### Layer 1: Supabase RLS

Row-Level Security ensures users can only access their own data at the database level:

```sql
-- Athletes can only see their own data
CREATE POLICY "Athletes can manage own data" ON "PerformanceMetric"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

-- Coaches can see athlete data WITH CONSENT
CREATE POLICY "Coaches can view with consent" ON "PerformanceMetric"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PerformanceMetric"."athleteId"
        AND "consentGranted" = true
    )
  );
```

### Layer 2: Application Middleware

Even with RLS, add explicit checks in your API routes:

```typescript
// apps/web/src/app/api/athlete/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  // Check user is authenticated
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user owns this resource OR is coach with consent
  const canAccess = await checkAthleteAccess(session.user.id, params.id);
  if (!canAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Safe to fetch - RLS is backup layer
  const data = await prisma.athlete.findUnique({
    where: { id: params.id }
  });

  return Response.json(data);
}
```

### Layer 3: Security Configuration

Use `src/lib/security-config.ts` for centralized security settings:

```typescript
import { RATE_LIMITS, COST_LIMITS, FEATURE_FLAGS, validateSecurityConfig } from '@/lib/security-config';

// At app startup
const validation = validateSecurityConfig();
if (!validation.valid) {
  throw new Error(`Security config invalid: ${validation.errors.join(', ')}`);
}

// In rate limiting middleware
if (FEATURE_FLAGS.enableRateLimiting) {
  const limit = RATE_LIMITS.perUser[userRole]; // 60 for ATHLETE, 300 for COACH
}

// In LLM calls
if (FEATURE_FLAGS.enableCostLimits && dailyCost >= COST_LIMITS.circuitBreakerThreshold) {
  throw new Error('Circuit breaker triggered - cost limit exceeded');
}
```

## 4. Cost Protection

### Circuit Breaker

The circuit breaker automatically halts LLM requests when costs exceed thresholds:

| Environment | Daily/School | Monthly Total | Circuit Breaker |
|-------------|--------------|---------------|-----------------|
| Development | $100 | $500 | $50 |
| Staging | $100 | $500 | $50 |
| Production | $500 | $10,000 | $500 |

### Per-User Limits

| Metric | Athlete | Coach | Admin |
|--------|---------|-------|-------|
| Tokens/day | 50,000 | 100,000 | 200,000 |
| Messages/day | 100 | 500 | 1,000 |
| Rate (req/min) | 60 | 300 | 600 |

## 5. Testing Security

### Test RLS Locally

1. Create a test user in staging
2. Try to access another user's data:

```sql
-- This should return EMPTY (RLS blocking)
SELECT * FROM "PerformanceMetric"
WHERE "athleteId" = '[other-user-id]';
```

### Test as Different Roles

1. **Test as Athlete:**
   - Should see only own data
   - Cannot see other athletes' data
   - Cannot access coach dashboard

2. **Test as Coach:**
   - Should see consented athletes only
   - Cannot see athletes who revoked consent
   - Cannot modify athlete data (only view)

3. **Test as Admin:**
   - Can see all data in their school
   - Cannot see other schools' data
   - Can manage user roles

## 6. Incident Response

### If You Suspect a Data Breach

1. **Immediately** revoke any compromised API keys
2. Check audit logs: `SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 100`
3. Review recent RLS policy changes
4. Contact the security team

### If Costs Spike Unexpectedly

1. Circuit breaker should auto-trigger at threshold
2. Check token usage: `SELECT * FROM "TokenUsage" ORDER BY "timestamp" DESC`
3. Identify which users/schools are causing spike
4. Temporarily increase rate limits if legitimate usage

## 7. Deployment Checklist

Before deploying to production:

- [ ] RLS migration applied to staging first
- [ ] All verification queries pass
- [ ] Tested athlete, coach, admin flows
- [ ] `ENABLE_DEMO_ACCOUNTS=false` in production
- [ ] `ENABLE_DEBUG_ROUTES=false` in production
- [ ] `ENABLE_COST_LIMITS=true` in production
- [ ] `ENCRYPTION_KEY` set (64 hex chars)
- [ ] `CRISIS_EMERGENCY_EMAIL` configured
- [ ] `NEXTAUTH_URL` uses HTTPS
- [ ] Different secrets for staging vs production
