# Lessons Learned

> **Auto-updated file** - Captures bugs, fixes, decisions, and patterns discovered during development.
> Each entry includes context, solution, and prevention strategies.

---

## Security

### 2026-02-17: Credentials Exposed in Git
**Severity:** CRITICAL
**Discovery:** Security audit found `vercel-staging.env` committed to git with real API keys

**Exposed:**
- OpenAI API key
- Supabase service role key
- ElevenLabs API key
- Database password
- Auth secrets

**Fix:**
1. Removed file from git tracking (`git rm --cached`)
2. Added patterns to `.gitignore`
3. Rotated all exposed credentials
4. Updated Vercel env vars via CLI

**Prevention:**
- Never create `*.env` files with real values in tracked directories
- Use `vercel env pull` to get env vars locally
- Add pre-commit hook to block `.env` files with secrets
- Regular `git ls-files | grep -i env` audits

---

### 2026-02-17: RLS Disabled on All Tables
**Severity:** CRITICAL
**Discovery:** Security audit script found 45/46 tables had RLS disabled, 0 policies existed

**Impact:** Any authenticated user could potentially access any other user's data

**Fix:**
1. Created `20260217_EMERGENCY_RLS_FIX.sql` migration
2. Enabled RLS on all 46 tables
3. Created 96 security policies
4. Implemented proper consent-based access for coaches

**Prevention:**
- Run `node scripts/security-audit.js` before every deployment
- Add security audit to CI/CD pipeline
- New tables MUST have RLS enabled in same migration that creates them
- Add RLS verification to PR checklist

---

## Database

### 2026-02-17: ChatSummary Table Missing
**Severity:** LOW
**Discovery:** Security audit flagged missing policies for `ChatSummary` table

**Cause:** Table defined in Prisma schema but migration never ran

**Fix:** Need to run `npx prisma migrate deploy`

**Prevention:**
- Verify all Prisma migrations are applied after schema changes
- Add migration status check to deployment script

---

### Policy Column Name Mismatch Pattern
**Severity:** HIGH
**Discovery:** Some RLS policies referenced `userId` but tables use `athleteId`

**Affected Tables:** PerformanceMetric, Task, MoodLog, etc.

**Pattern:** Many athlete-related tables use `athleteId` (foreign key to Athlete.userId), NOT `userId`

**Prevention:**
- Always check schema before writing RLS policies
- Use the correct column: `athleteId` for athlete data tables
- Add column verification query to security audit

---

## Deployment

### 2026-02-17: Vercel CLI Directory Context
**Severity:** MEDIUM
**Discovery:** `vercel env` commands failed when run from root - must be in `apps/web`

**Fix:** Always `cd apps/web` before running Vercel CLI commands

**Prevention:**
- Add directory check to deployment scripts
- Document in SETUP.md

---

### pnpm Registry Errors on Vercel
**Severity:** LOW
**Discovery:** Direct `vercel` deploys sometimes fail with npm registry errors

**Cause:** Transient network issues with npm registry during pnpm install

**Fix:** Use git push to trigger deployment instead of `vercel` CLI

**Prevention:**
- Prefer git-based deployments over CLI
- Add retry logic if using CLI deployments

---

## Code Patterns

### Service Role Bypass Pattern
**Pattern:** All RLS policies should include service role bypass for system operations

```sql
CREATE POLICY "Service role full access" ON "TableName"
  FOR ALL USING (auth.role() = 'service_role');
```

**Why:** Allows cron jobs, admin scripts, and system operations to work without RLS restrictions

---

### Consent-Based Coach Access Pattern
**Pattern:** Coaches should only see athlete data when consent is granted

```sql
CREATE POLICY "Coaches can view with consent" ON "TableName"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "TableName"."athleteId"
        AND "consentGranted" = true
    )
  );
```

**Why:** FERPA compliance requires explicit consent for data sharing

---

## Architecture Decisions

### 2026-02-17: All-in-One Next.js over Separate MCP Server
**Decision:** Keep all functionality in Next.js API routes instead of separate Python MCP server

**Rationale:**
- Simpler deployment (one Vercel project vs Vercel + Railway)
- Lower cost (no separate server)
- Faster iteration
- TypeScript consistency

**Trade-off:** Lose Python ML libraries, but can add later via API

---

### Monorepo Structure
**Decision:** Use pnpm workspaces with Turborepo

**Structure:**
- `apps/web` - Next.js web app
- `apps/mobile` - React Native app
- `packages/types` - Shared TypeScript types
- `packages/api-client` - Shared API client

**Benefits:**
- Shared code between web and mobile
- Single lockfile
- Cached builds with Turbo

---

## Performance

### Database Connection Pooling
**Learning:** Use Supabase connection pooler (port 6543) not direct connection (port 5432)

**Why:** Serverless functions open many connections; pooler prevents connection exhaustion

**Config:**
```
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## Testing

### RLS Policy Testing
**Learning:** Must test RLS policies with actual user contexts, not service role

**Script:** `scripts/security-audit.js` verifies:
1. RLS enabled on all tables
2. Policy count per table
3. Column references correct
4. Critical tables have policies

---

## Operational

### Cost Control Circuit Breaker
**Learning:** OpenAI costs can spike quickly without limits

**Implementation:**
- Daily per-user limit: $100
- Monthly total limit: $500 (staging), $10,000 (production)
- Circuit breaker at threshold

**Location:** `src/lib/cost-tracking.ts`

---

## Incident Log

### INC-001: 2026-02-17 Security Vulnerability
**Duration:** ~30 minutes
**Impact:** Potential data exposure (no evidence of exploitation)
**Root Cause:** RLS not enabled, credentials in git
**Resolution:** RLS enabled, credentials rotated
**Post-mortem:** Added security audit to workflow

---

## How to Add Lessons

When you discover something worth documenting:

1. **Add entry under appropriate section**
2. **Include:**
   - Date
   - Severity (CRITICAL/HIGH/MEDIUM/LOW)
   - Discovery context
   - Root cause
   - Fix applied
   - Prevention strategy

3. **Update prevention checklists** in WORKFLOW.md

---

*Last updated: 2026-02-17*
