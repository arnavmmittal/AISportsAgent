# Row Level Security (RLS) Policies

## 🔒 What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL/Supabase security feature that restricts which rows users can access in database tables. **Without RLS, all tables are publicly accessible**, which is a critical security vulnerability.

## ⚠️ Current Issue

Your Supabase tables are currently **public without RLS enabled**. This means:
- ❌ Any user can read ANY athlete's chat messages
- ❌ Any user can see ALL mood logs and performance data
- ❌ Any user can access crisis alerts for other athletes
- ❌ Multi-tenant isolation is not enforced (users can see data from other schools)

## ✅ What This Migration Does

The `enable_rls_security.sql` migration enables RLS on **all 30+ tables** and creates policies that enforce:

### 1. **Multi-Tenant Isolation**
- Users can only access data from their own school (`schoolId`)
- No cross-school data leakage

### 2. **Role-Based Access Control**

**Athletes can:**
- ✅ View and manage their own data (chats, mood logs, goals, tasks)
- ✅ View their assigned coaches
- ❌ View other athletes' data

**Coaches can:**
- ✅ View their own profile and settings
- ✅ View assigned athletes' data **ONLY if athlete granted consent**
- ✅ View crisis alerts for their athletes (regardless of consent)
- ✅ Create assignments for their athletes
- ❌ View athletes they're not assigned to
- ❌ View chat summaries if `consentChatSummaries = false`

**Admins can:**
- ✅ Manage schools and knowledge base
- ✅ View audit logs and error logs
- ✅ Manage team configurations

### 3. **Privacy-First Chat Summaries**

Chat summaries have the **most restrictive policies**:
- Athletes can always view their own summaries
- Coaches can ONLY view if:
  - ✅ Coach is assigned to athlete (`CoachAthleteRelation` exists)
  - ✅ Athlete granted consent (`consentChatSummaries = true`)
  - ✅ Summary not revoked (`revokedAt IS NULL`)
  - ✅ Summary not expired (`expiresAt > NOW()`)

### 4. **Crisis Alert Escalation**

Crisis alerts bypass consent restrictions:
- Coaches can always see crisis alerts for their assigned athletes
- This ensures safety trumps privacy in emergencies

## 📋 How to Apply

### Option 1: Using the Script (Recommended)

```bash
cd apps/web
./scripts/apply-rls-policies.sh
```

### Option 2: Manual SQL Execution

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `enable_rls_security.sql`
3. Paste and run the SQL

### Option 3: Using psql

```bash
psql "$DATABASE_URL" < prisma/migrations/enable_rls_security.sql
```

## 🧪 Testing RLS Policies

After applying, test that:

1. **Athletes can't see other athletes' data**:
   ```sql
   -- Login as athlete A, try to query athlete B's mood logs
   SELECT * FROM "MoodLog" WHERE "athleteId" = 'athlete_b_id';
   -- Should return 0 rows
   ```

2. **Coaches can only see consented data**:
   ```sql
   -- Login as coach, try to view athlete chat summaries
   SELECT * FROM "ChatSummary" WHERE "athleteId" = 'athlete_id';
   -- Should only return rows if athlete.consentChatSummaries = true
   ```

3. **Multi-tenant isolation works**:
   ```sql
   -- Login as user from school A, try to view users from school B
   SELECT * FROM "User" WHERE "schoolId" = 'school_b_id';
   -- Should return 0 rows
   ```

## 🔍 Understanding the Helper Functions

```sql
-- Get current authenticated user's school ID
auth.user_school_id()

-- Get current authenticated user's role (ATHLETE, COACH, ADMIN)
auth.user_role()

-- Get current authenticated user's ID
auth.uid()
```

These functions are used in RLS policies to check permissions dynamically.

## 📊 Key Tables and Their Policies

| Table | Athletes | Coaches | Notes |
|-------|----------|---------|-------|
| `User` | Own profile | Same school users | Multi-tenant boundary |
| `Athlete` | Own profile | Assigned athletes (with consent) | - |
| `ChatSession` | Own sessions | ❌ No access | Privacy protected |
| `Message` | Own messages | ❌ No access | Privacy protected |
| `ChatSummary` | Own summaries | Consented athletes only | 4-layer privacy check |
| `MoodLog` | Own logs | Assigned athletes (with consent) | - |
| `Goal` | Own goals | Assigned athletes (with consent) | - |
| `CrisisAlert` | Own alerts | All assigned athletes | Safety override |
| `Assignment` | Assigned to self | Own assignments | - |
| `CoachNote` | ❌ No access | Own notes only | Always private |

## 🚨 Important Notes

1. **Backup First**: Always backup your database before applying RLS policies
2. **Test Thoroughly**: Test all application features after enabling RLS
3. **Service Role**: Backend API calls should use Supabase **service role key** to bypass RLS when needed
4. **Auth Context**: RLS policies rely on `auth.uid()` - ensure NextAuth/Supabase auth is working
5. **Performance**: RLS policies add query overhead - indexes are included for optimization

## 🔧 Troubleshooting

### "Row not found" errors after enabling RLS

**Cause**: Your application is trying to access data that RLS is now blocking.

**Fix**:
- Ensure backend uses service role key for admin operations
- Check that `auth.uid()` is correctly set (user is authenticated)
- Verify the user has the correct role and school assignment

### Slow queries after RLS

**Cause**: RLS adds WHERE clause conditions to every query.

**Fix**: The migration includes performance indexes:
```sql
idx_coach_athlete_consent
idx_athlete_consent_summaries
idx_chat_summary_revoked
```

Run `EXPLAIN ANALYZE` on slow queries to verify indexes are being used.

### Coach can't see athlete data despite consent

**Checklist**:
1. ✅ `CoachAthleteRelation` exists with `coachId` and `athleteId`
2. ✅ `CoachAthleteRelation.consentGranted = true`
3. ✅ For chat summaries: `Athlete.consentChatSummaries = true`
4. ✅ For chat summaries: `ChatSummary.revokedAt IS NULL`
5. ✅ For chat summaries: `ChatSummary.expiresAt > NOW()`

## 📖 Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenancy with RLS](https://supabase.com/docs/guides/auth/managing-user-data#using-row-level-security)

## 🔐 Security Compliance

These RLS policies help achieve:
- ✅ **FERPA Compliance**: Student data access restrictions
- ✅ **HIPAA Considerations**: Mental health data privacy
- ✅ **Multi-Tenant SaaS**: School-level data isolation
- ✅ **Audit Trail**: Combined with `AuditLog` table for compliance

---

**Last Updated**: 2025-12-23
**Migration Version**: 1.0.0
