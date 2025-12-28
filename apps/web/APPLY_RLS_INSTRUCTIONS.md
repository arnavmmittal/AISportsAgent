# 🔒 Apply RLS Security Policies - Instructions

## Quick Summary

Your Supabase database currently has **RLS disabled on all tables**, which means all data is publicly accessible. This is a critical security vulnerability.

The RLS migration file has been created at:
`apps/web/prisma/migrations/enable_rls_security.sql`

## ⚠️ About Backups

**Good News**: Supabase automatically backs up your database:
- **Free tier**: 7 days of point-in-time recovery
- **Pro tier**: 30 days of point-in-time recovery

You can restore from any point in the last 7-30 days via:
- Supabase Dashboard → Database → Backups
- Or create manual backup: Database → Backups → Create backup

**Note**: PostgreSQL client tools (`psql`, `pg_dump`) are not installed on your system. You can install them via Homebrew:
```bash
brew install postgresql
```

But since Supabase has automatic backups, you're safe to proceed!

## 🚀 How to Apply RLS Policies

### **Method 1: Supabase SQL Editor (Recommended - Easiest)**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste Migration**
   - Open: `apps/web/prisma/migrations/enable_rls_security.sql`
   - Copy entire contents (21 KB, ~500 lines)
   - Paste into Supabase SQL Editor

4. **Run Migration**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for completion (~10-30 seconds)
   - You should see success messages

5. **Verify RLS is Enabled**
   - In SQL Editor, run:
     ```sql
     SELECT tablename, rowsecurity
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename;
     ```
   - All tables should show `rowsecurity = t` (true)

### **Method 2: Using psql (If Installed)**

If you install PostgreSQL client tools:

```bash
# Install PostgreSQL (includes psql)
brew install postgresql

# Apply RLS migration
psql "$DATABASE_URL" < apps/web/prisma/migrations/enable_rls_security.sql
```

### **Method 3: Supabase CLI (If Installed)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

## ✅ Verify RLS is Working

After applying, test that RLS is enforcing security:

### 1. Check RLS is Enabled

```sql
-- Should return 't' for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 2. Check Policies Exist

```sql
-- Should return many rows (one per policy)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Test Access Control

Try querying data from a different user context - you should only see your own data or data you have access to.

## 🔧 If Something Goes Wrong

### To Rollback (Disable RLS):

```sql
-- Disable RLS on all tables (EMERGENCY ONLY)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(tbl) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
```

### To Restore from Backup:

1. Go to Supabase Dashboard → Database → Backups
2. Select a backup from before the RLS migration
3. Click "Restore"

## 📝 After Applying

1. **Test Your Application**
   - Login as athlete - verify you can see your own data
   - Login as coach - verify you can only see consented athletes
   - Try cross-tenant access - should be blocked

2. **Update Backend Code**
   - Ensure backend API uses **service role key** for admin operations
   - Service role key bypasses RLS (needed for system operations)
   - Regular anon/authenticated keys respect RLS policies

3. **Monitor for Issues**
   - Check Supabase logs for RLS violations
   - Watch for "insufficient privilege" errors
   - Test all major features

## 🔐 What Gets Protected

After applying RLS:

| Data Type | Before RLS | After RLS |
|-----------|-----------|-----------|
| Chat messages | 🔴 Public | ✅ Private to athlete |
| Mood logs | 🔴 Public | ✅ Private to athlete + consented coaches |
| Goals | 🔴 Public | ✅ Private to athlete + consented coaches |
| Crisis alerts | 🔴 Public | ✅ Private to athlete + assigned coaches |
| Coach notes | 🔴 Public | ✅ Private to coach only |
| Cross-school data | 🔴 Accessible | ✅ Blocked by schoolId |

## 📖 More Info

See full documentation in:
`apps/web/prisma/migrations/RLS_SECURITY_README.md`

---

**Ready to apply? Use Method 1 (Supabase SQL Editor) - it's the easiest!**

**Questions?**
- Check the README for detailed policy explanations
- Review Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- Test in development first if you have a staging environment
