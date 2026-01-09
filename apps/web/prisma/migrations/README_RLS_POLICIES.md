# Row-Level Security (RLS) Policies - Implementation Guide

## Overview

This directory contains SQL migration files that enable Row-Level Security (RLS) policies on all database tables. RLS is the **primary security boundary** for multi-tenant data isolation in the AI Sports Agent platform.

## Purpose

**RLS ensures that:**
1. Athletes can only access their own data
2. Coaches can only access data for athletes who have granted consent
3. Admins can only access data within their school
4. No cross-tenant data leakage is possible
5. All database queries respect tenant boundaries

**CRITICAL: RLS is MANDATORY for FERPA compliance and contract SLAs.**

## Migration Files

### 1. `20250105_enable_rls_core_tables.sql`
**Tables:** users, schools, athletes, coaches, coach_athlete_relations

**Policies:**
- Users can view/update their own record
- Admins can view/update all users in their school
- Coaches can view athletes in their school
- Athletes can view their assigned coaches
- Coach-athlete relations require consent

### 2. `20250105_enable_rls_chat_tables.sql`
**Tables:** chat_sessions, messages, chat_summaries

**Policies:**
- Athletes own all their chat data
- Coaches can view chat data ONLY with consent
- System can create summaries (background jobs)
- All queries filtered by schoolId

### 3. `20250105_enable_rls_wellbeing_tables.sql`
**Tables:** mood_logs, goals, crisis_alerts, crisis_escalations

**Policies:**
- Athletes own mood logs and goals
- Coaches can view with consent
- Coaches can create/assign goals
- Crisis alerts are coach-only (athletes cannot see)
- Escalations require coach/admin role

### 4. `20250105_enable_rls_knowledge_analytics.sql`
**Tables:** knowledge_base, knowledge_chunks, weekly_summaries, multi_modal_analytics, practice_sessions, routine_templates

**Policies:**
- Knowledge base is school-scoped
- Analytics require consent for coach access
- Practice sessions are school-scoped
- Routine templates are school-scoped

### 5. `20250105_enable_rls_audit_system.sql`
**Tables:** audit_logs, token_usage, rate_limit_history, circuit_breaker_events, feature_flags, notifications, consent_logs

**Policies:**
- Audit logs are admin-only, immutable
- Token usage is admin-only
- Rate limit history is admin-only
- Consent logs are immutable (FERPA compliance)
- Notifications are user-scoped

## How to Apply Migrations

### Option A: Supabase Dashboard (Recommended for Initial Setup)

1. Navigate to Supabase project dashboard
2. Go to SQL Editor
3. Copy-paste each migration file in order (1-5)
4. Run each migration
5. Verify policies with test queries

### Option B: Prisma Migrate (For Version Control)

```bash
# 1. Add migrations to Prisma
cd apps/web
pnpm prisma migrate dev --create-only --name enable_rls

# 2. Manually copy SQL files into the generated migration folder
# e.g., prisma/migrations/20250105123456_enable_rls/

# 3. Run migration
pnpm prisma migrate deploy

# 4. Verify policies
pnpm prisma db execute --file prisma/migrations/verify_rls.sql
```

### Option C: Direct psql Execution

```bash
# Connect to database
psql $DATABASE_URL

# Run each migration file
\i prisma/migrations/20250105_enable_rls_core_tables.sql
\i prisma/migrations/20250105_enable_rls_chat_tables.sql
\i prisma/migrations/20250105_enable_rls_wellbeing_tables.sql
\i prisma/migrations/20250105_enable_rls_knowledge_analytics.sql
\i prisma/migrations/20250105_enable_rls_audit_system.sql

# Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Testing RLS Policies

### Test Suite Location
`/apps/web/tests/rls/rls-policies.test.ts`

### Manual Testing Commands

```sql
-- 1. Test as Athlete (set session JWT)
SET request.jwt.claims.sub = 'athlete-user-id';
SET request.jwt.claims.school_id = 'test-school';
SET request.jwt.claims.role = 'ATHLETE';

-- Try to select own data (should succeed)
SELECT * FROM chat_sessions WHERE athlete_id = 'athlete-user-id';

-- Try to select other athlete's data (should return empty)
SELECT * FROM chat_sessions WHERE athlete_id = 'other-athlete-id';

-- 2. Test as Coach
SET request.jwt.claims.sub = 'coach-user-id';
SET request.jwt.claims.role = 'COACH';

-- Try to view athlete data without consent (should return empty)
SELECT * FROM chat_sessions WHERE athlete_id = 'athlete-user-id';

-- Grant consent
INSERT INTO coach_athlete_relations (coach_id, athlete_id, consent_granted)
VALUES ('coach-user-id', 'athlete-user-id', true);

-- Try again (should succeed now)
SELECT * FROM chat_sessions WHERE athlete_id = 'athlete-user-id';

-- 3. Test cross-tenant isolation
SET request.jwt.claims.school_id = 'school-b';

-- Try to access school-a data (should return empty)
SELECT * FROM users WHERE school_id = 'school-a';
```

## Security Guarantees

### What RLS Protects Against

✅ **Cross-Tenant Data Leaks**
- Coach at University A cannot see University B athletes
- Even if schoolId filter is missing in application code, RLS blocks query

✅ **Unauthorized Data Access**
- Athletes cannot view coach-only crisis alerts
- Coaches cannot view athlete data without consent
- Admins cannot view data outside their school

✅ **SQL Injection**
- Even if attacker injects SQL, RLS policies still apply
- Database-level enforcement cannot be bypassed by application bugs

✅ **Insider Threats**
- Developers cannot query production data without proper authentication
- Service role key required to bypass RLS (only on server)

### What RLS Does NOT Protect Against

❌ **Service Role Key Exposure**
- If `SUPABASE_SERVICE_ROLE_KEY` is exposed, RLS is bypassed
- **Solution:** Never use service role key on client, only on server

❌ **Application Logic Bugs**
- RLS is defense-in-depth, but application should still filter by schoolId
- **Solution:** Always add explicit tenant filters in queries

❌ **Timing Attacks**
- RLS query times may reveal existence of data
- **Solution:** Rate limiting + audit logging

## Troubleshooting

### Issue: "Permission denied for table X"

**Cause:** RLS is enabled but no policies allow the operation

**Solution:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Add missing policy
CREATE POLICY "policy_name" ON your_table FOR SELECT USING (condition);
```

### Issue: "Row-level security is not enabled"

**Cause:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` was not run

**Solution:**
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Issue: Queries return empty results unexpectedly

**Cause:** JWT claims are missing or incorrect

**Solution:**
```typescript
// Verify JWT includes required claims
const token = await supabase.auth.getSession();
console.log(token.user); // Should have: id, school_id, role
```

### Issue: Service role queries are blocked

**Cause:** Using anon key instead of service role key

**Solution:**
```typescript
// Use service role key for admin operations (server-side only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // NOT anon key
);
```

## Maintenance

### Adding New Tables

When adding a new table:

1. **Enable RLS immediately:**
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

2. **Create policies based on data type:**
```sql
-- For user-owned data
CREATE POLICY "Users view own data" ON new_table FOR SELECT
USING (user_id = auth.uid());

-- For school-scoped data
CREATE POLICY "Users view school data" ON new_table FOR SELECT
USING (
  school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
);
```

3. **Test policies before deployment:**
```bash
pnpm test:rls
```

### Auditing Policies

Run quarterly audit:

```sql
-- Check all tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) AS policy_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled, policy_count;

-- Tables with RLS disabled or zero policies are security gaps
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [FERPA Compliance Requirements](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)

## Support

For issues with RLS policies:
1. Check this README
2. Run test suite: `pnpm test:rls`
3. Review audit logs: `SELECT * FROM audit_logs WHERE action = 'RLS_VIOLATION'`
4. Contact security team if cross-tenant leak suspected
