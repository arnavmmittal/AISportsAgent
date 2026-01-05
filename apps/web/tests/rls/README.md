# RLS (Row-Level Security) Test Suite

## Overview

This directory contains comprehensive tests for Supabase Row-Level Security (RLS) policies. These tests ensure:

1. **Multi-tenant isolation**: Schools cannot access each other's data
2. **Consent enforcement**: Coaches can only view athlete data with consent
3. **Policy coverage**: All critical tables have RLS enabled
4. **Production readiness**: Security best practices are followed

## Test Files

### 1. `cross-tenant-isolation.test.ts`

**Purpose**: Verify complete data isolation between different schools (tenants)

**What it tests**:
- ✅ ChatSession isolation (School 1 cannot see School 2 sessions)
- ✅ Message isolation (Cross-school messages are blocked)
- ✅ ChatSummary isolation (Weekly summaries are school-specific)
- ✅ MoodLog isolation (Mood data is private per school)
- ✅ Goal isolation (Goals cannot be accessed cross-school)
- ✅ CrisisAlert isolation (Crisis alerts are school-specific)

**Failure impact**: **CRITICAL** - Data leakage between universities

---

### 2. `coach-consent-access.test.ts`

**Purpose**: Verify coach access is consent-based

**What it tests**:
- ✅ Coach can view summaries when athlete consents
- ✅ Coach CANNOT view summaries without consent
- ✅ Consent revocation immediately blocks access
- ✅ Coach dashboard only shows consented athletes
- ✅ Aggregated stats exclude non-consented data
- ✅ Audit logging for all coach access

**Failure impact**: **CRITICAL** - Privacy violation, FERPA non-compliance

---

### 3. `verify-all-policies.test.ts`

**Purpose**: Verify RLS policies are correctly configured

**What it tests**:
- ✅ All 13+ critical tables have RLS enabled
- ✅ Policies exist for SELECT, INSERT, UPDATE, DELETE
- ✅ Policies enforce tenant isolation (schoolId filtering)
- ✅ Service role key is NOT exposed to client
- ✅ Anon key is used for client queries
- ✅ Policy complexity analysis (performance)

**Failure impact**: **HIGH** - Missing RLS leaves data exposed

---

## Running Tests

### Prerequisites

1. **Supabase Project**:
   ```bash
   # Ensure you have a Supabase project set up
   # Get credentials from: https://app.supabase.com/project/_/settings/api
   ```

2. **Environment Variables**:
   ```bash
   # Copy .env.example to .env.test
   cp apps/web/.env.example apps/web/.env.test

   # Add Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # Server-only
   DATABASE_URL="postgresql://..."
   ```

3. **Install Dependencies**:
   ```bash
   cd apps/web
   pnpm install
   ```

### Run All RLS Tests

```bash
# Run all RLS tests
pnpm test tests/rls

# Run specific test file
pnpm test tests/rls/cross-tenant-isolation.test.ts

# Run with coverage
pnpm test tests/rls --coverage

# Run in watch mode (development)
pnpm test tests/rls --watch
```

### Run Against Staging Database

```bash
# Use staging environment variables
NODE_ENV=staging pnpm test tests/rls

# Or use .env.staging
cp .env.staging .env.test
pnpm test tests/rls
```

### Run Against Production Database (CAUTION!)

```bash
# ⚠️ ONLY run read-only tests against production
# DO NOT run tests that create/delete data

# Use production env vars
NODE_ENV=production pnpm test tests/rls/verify-all-policies.test.ts

# Recommended: Use read-only connection string
DATABASE_URL="postgresql://readonly-user:password@..."
```

---

## Test Results Interpretation

### ✅ All Tests Pass

```
✓ Cross-Tenant Isolation (6/6 tests passed)
✓ Coach Consent Access (8/8 tests passed)
✓ RLS Policy Verification (7/7 tests passed)

Total: 21/21 tests passed
```

**Action**: Safe to deploy to production

---

### ❌ Tests Fail

#### Scenario 1: Cross-tenant data leak detected

```
❌ should NOT allow athlete from school 1 to see sessions from school 2
   Expected: data is null
   Received: { id: 'session-xyz', athlete_id: 'athlete-2' }
```

**Cause**: RLS policy missing or incorrect

**Fix**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'chat_sessions';

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users see own school data"
ON chat_sessions FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);
```

---

#### Scenario 2: Coach accessed data without consent

```
❌ should NOT allow coach to view summary without athlete consent
   CONSENT VIOLATION: Coach accessed data without consent!
```

**Cause**: Consent filter not applied in query

**Fix**:
```typescript
// Add consent filter to all coach queries
const summaries = await prisma.chatSummary.findMany({
  where: {
    Athlete: {
      consentChatSummaries: true,  // ← Add this
    },
  },
});
```

---

#### Scenario 3: RLS policies missing

```
❌ should verify RLS is enabled on critical tables
   Missing RLS on: messages, mood_logs, crisis_alerts
```

**Cause**: RLS not enabled on all tables

**Fix**:
```sql
-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- (See verify-all-policies.test.ts for examples)
```

---

## Manual Testing Checklist

Before production deployment, manually verify:

### 1. Cross-Tenant Isolation

```bash
# In Supabase SQL Editor:

-- 1. Create two schools
INSERT INTO schools (id, name, email)
VALUES
  ('test-school-1', 'University A', 'a@test.edu'),
  ('test-school-2', 'University B', 'b@test.edu');

-- 2. Create users in each school
INSERT INTO users (id, email, name, role, school_id)
VALUES
  ('user-1', 'athlete1@a.edu', 'Athlete 1', 'ATHLETE', 'test-school-1'),
  ('user-2', 'athlete2@b.edu', 'Athlete 2', 'ATHLETE', 'test-school-2');

-- 3. Create athletes
INSERT INTO athletes (user_id, sport, year, team_name)
VALUES
  ('user-1', 'Basketball', 'JUNIOR', 'Team A'),
  ('user-2', 'Soccer', 'SOPHOMORE', 'Team B');

-- 4. Create chat sessions
INSERT INTO chat_sessions (id, athlete_id)
VALUES
  ('session-1', 'user-1'),
  ('session-2', 'user-2');

-- 5. Try cross-tenant query (should return empty)
-- Simulate logged in as user-1 (auth.uid() = 'user-1')
SET LOCAL request.jwt.claim.sub = 'user-1';

SELECT * FROM chat_sessions WHERE athlete_id = 'user-2';
-- Expected: 0 rows (RLS blocks it)

-- Cleanup
DELETE FROM chat_sessions WHERE id IN ('session-1', 'session-2');
DELETE FROM athletes WHERE user_id IN ('user-1', 'user-2');
DELETE FROM users WHERE id IN ('user-1', 'user-2');
DELETE FROM schools WHERE id IN ('test-school-1', 'test-school-2');
```

### 2. Coach Consent Enforcement

```bash
# In Supabase SQL Editor:

-- 1. Create school, coach, and athlete
INSERT INTO schools (id, name, email)
VALUES ('test-school', 'Test U', 'test@test.edu');

INSERT INTO users (id, email, name, role, school_id)
VALUES
  ('coach-1', 'coach@test.edu', 'Coach', 'COACH', 'test-school'),
  ('athlete-1', 'athlete@test.edu', 'Athlete', 'ATHLETE', 'test-school');

INSERT INTO athletes (user_id, sport, year, consent_chat_summaries)
VALUES ('athlete-1', 'Basketball', 'JUNIOR', false);  -- NO CONSENT

-- 2. Create chat summary
INSERT INTO chat_summaries (id, athlete_id, summary_type, week_start, week_end, summary, key_themes, message_count)
VALUES ('summary-1', 'athlete-1', 'WEEKLY', '2025-01-01', '2025-01-07', 'Test summary', '{}', 10);

-- 3. Coach tries to access (should be blocked)
SET LOCAL request.jwt.claim.sub = 'coach-1';
SELECT * FROM chat_summaries WHERE athlete_id = 'athlete-1';
-- Expected: 0 rows (no consent)

-- 4. Grant consent
UPDATE athletes SET consent_chat_summaries = true WHERE user_id = 'athlete-1';

-- 5. Coach tries again (should work now)
SELECT * FROM chat_summaries WHERE athlete_id = 'athlete-1';
-- Expected: 1 row (consent granted)

-- Cleanup
DELETE FROM chat_summaries WHERE id = 'summary-1';
DELETE FROM athletes WHERE user_id = 'athlete-1';
DELETE FROM users WHERE id IN ('coach-1', 'athlete-1');
DELETE FROM schools WHERE id = 'test-school';
```

### 3. Service Role Key Security

```bash
# Check that service role key is NOT exposed to client

# ❌ WRONG (exposes key to client)
echo $NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
# Should be: (empty)

# ✅ CORRECT (server-only)
echo $SUPABASE_SERVICE_ROLE_KEY
# Should be: eyJhbGci...
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/rls-tests.yml
name: RLS Security Tests

on:
  pull_request:
    paths:
      - 'apps/web/prisma/**'
      - 'apps/web/tests/rls/**'
  push:
    branches:
      - main
      - staging

jobs:
  rls-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run RLS tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
        run: pnpm test tests/rls --run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Troubleshooting

### Test fails: "Cannot connect to database"

**Cause**: DATABASE_URL not set or incorrect

**Fix**:
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Should look like:
# postgresql://postgres:password@host:5432/database

# If missing, add to .env.test
echo 'DATABASE_URL="postgresql://..."' >> apps/web/.env.test
```

---

### Test fails: "auth.uid() is not defined"

**Cause**: Not using Supabase client, using Prisma directly

**Fix**:
```typescript
// Use Supabase client instead of Prisma for RLS tests
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This respects RLS policies
const { data } = await supabase.from('chat_sessions').select('*');
```

---

### Test fails: "RLS policy not found"

**Cause**: Policies not created in database

**Fix**:
```bash
# Connect to Supabase
psql $DATABASE_URL

# Check if policies exist
\d+ chat_sessions
# Should show "Policies:" section

# If missing, create policies (see verify-all-policies.test.ts for SQL)
```

---

## Best Practices

### 1. Run RLS tests on every PR

```bash
# Add to pre-commit hook
echo "pnpm test tests/rls" >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 2. Test with real Supabase instance

Don't mock RLS - test against actual Supabase (staging) to catch policy issues.

### 3. Clean up test data

Always delete test records in `afterAll()` to avoid polluting database.

### 4. Use descriptive test names

```typescript
// ❌ Bad
it('test 1', () => { ... });

// ✅ Good
it('should NOT allow accessing summaries from other schools', () => { ... });
```

### 5. Document expected behavior

```typescript
it('should block cross-tenant access', async () => {
  // Setup: Create session in school 2
  // Action: Try to access as user from school 1
  // Expected: RLS blocks access, returns null
});
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All RLS tests pass (21/21)
- [ ] Manual cross-tenant test completed
- [ ] Manual consent test completed
- [ ] Service role key is NOT in `NEXT_PUBLIC_*`
- [ ] RLS enabled on all 13+ critical tables
- [ ] Policies verified in Supabase dashboard
- [ ] Audit logging enabled for data access
- [ ] Load testing with RLS (no performance degradation)
- [ ] Security team approval (if applicable)

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
