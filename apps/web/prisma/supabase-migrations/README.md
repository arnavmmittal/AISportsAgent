# Supabase SQL Migrations

This directory contains SQL migrations that should be executed in the **Supabase Dashboard SQL Editor**.

## Why Separate from Prisma Migrations?

Prisma migrations handle schema changes (tables, columns, indexes), but Supabase-specific features like:
- Row-Level Security (RLS) policies
- Triggers and functions
- Custom database roles
- pgvector extensions

...need to be run directly in Supabase SQL Editor.

## How to Apply Migrations

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Migrations in Order

Execute the SQL files in numerical order:

1. **001_enable_rls_policies.sql** - Enables RLS and creates all security policies

Copy the entire contents of each file and paste into the SQL Editor, then click **Run**.

### Step 3: Verify RLS is Enabled

After running `001_enable_rls_policies.sql`, verify by running:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'User', 'Athlete', 'Coach', 'MoodLog', 'Goal',
  'ChatSession', 'Message', 'ChatSummary', 'CrisisAlert',
  'CoachAthleteRelation', 'Assignment', 'AssignmentSubmission', 'AuditLog'
);
```

All tables should show `rowsecurity = true`.

### Step 4: Test Policies

Test that policies work correctly:

```sql
-- Test as athlete (should only see their data)
SELECT * FROM "MoodLog"
WHERE "athleteId" = 'some-athlete-id';

-- Should return 0 rows if auth.uid() != athlete ID
```

## Migration Files

### 001_enable_rls_policies.sql

**Purpose**: Enable Row-Level Security on all tables and create policies

**What it does**:
- Enables RLS on all 13 tables
- Creates 30+ policies for athletes, coaches, and admins
- Ensures athletes can only see their own data
- Ensures coaches can only see athletes who granted consent
- Protects individual chat messages from coach access

**When to run**: After initial `npx prisma db push` to Supabase

## Development vs Production

### Development Environment

- Test RLS policies with real user accounts
- Use Supabase Studio to inspect policies
- Can disable RLS temporarily for debugging (NOT recommended)

### Production Environment

- **NEVER disable RLS** in production
- All queries must respect RLS policies
- Admin operations use `SUPABASE_SERVICE_ROLE_KEY`
- Regular testing of policy enforcement

## Troubleshooting

### "relation does not exist"

**Solution**: Run `npx prisma db push` first to create tables

### RLS blocks everything

**Cause**: auth.uid() is not set (user not authenticated)

**Solution**:
- Ensure user is logged in via Supabase Auth
- Check JWT token is being passed correctly
- Verify middleware is refreshing sessions

### Can't insert/update data

**Cause**: Missing RLS policy for INSERT/UPDATE

**Solution**:
- Check if policy exists for your operation
- Verify `WITH CHECK` condition is met
- Use admin client for system operations

### Testing Policies

To test policies as a specific user:

```sql
-- Temporarily set session user ID (for testing only)
SET request.jwt.claims = '{"sub": "user-id-here"}';

-- Now test queries
SELECT * FROM "MoodLog";

-- Reset
RESET request.jwt.claims;
```

## Best Practices

1. **Always test migrations in dev environment first**
2. **Backup database before running production migrations**
3. **Review policies quarterly** to ensure they match business rules
4. **Never use admin client in client-side code**
5. **Audit logs should track all policy changes**

## Related Documentation

- [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md) - Complete Supabase setup guide
- [Prisma Schema](../schema.prisma) - Database schema
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
