# Supabase Setup Guide

Step-by-step instructions to replace demo accounts with production-ready Supabase Auth.

---

## Step 1: Create Supabase Projects

### 1.1 Create Development Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Configure:
   - **Name**: `ai-sports-agent-dev`
   - **Database Password**: Generate strong password (save in password manager)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
4. Wait ~2 minutes for setup
5. Save your project details:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **API Keys** (Settings → API):
     - `anon` (public) key
     - `service_role` (private) key
   - **Database URL** (Settings → Database):
     - Connection string (Transaction mode)

### 1.2 Create Production Project (Later)

Repeat the same process with:
- **Name**: `ai-sports-agent-prod`
- **Pricing Plan**: Pro ($25/month when ready)
- Keep separate from dev

---

## Step 2: Configure Database Connection

### 2.1 Update Local Environment

Edit `apps/web/.env.local`:

```bash
# === SUPABASE (DEV) ===
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# === ENVIRONMENT ===
NEXT_PUBLIC_ENV="development"
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS="true"

# === COST CONTROLS ===
COST_LIMIT_DAILY_PER_USER=100          # Tokens per user per day
COST_LIMIT_MONTHLY_TOTAL=2000          # Total monthly token limit
OPENAI_API_KEY="sk-proj-...dev-key"    # Set $20 limit in OpenAI dashboard

# === NEXTAUTH (keep for now, will migrate) ===
NEXTAUTH_SECRET="[run: openssl rand -base64 32]"
NEXTAUTH_URL="http://localhost:3000"
```

### 2.2 Push Schema to Supabase

```bash
cd apps/web

# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Verify tables created in Supabase dashboard
```

---

## Step 3: Enable Supabase Auth

### 3.1 Configure Auth Providers

In Supabase Dashboard:

1. Go to **Authentication → Providers**
2. Enable **Email** provider:
   - ✅ Enable email provider
   - ✅ Confirm email (recommended)
   - ✅ Secure email change (enabled)
3. Disable other providers (Google, GitHub, etc.) for now

### 3.2 Configure Auth Settings

1. Go to **Authentication → Settings**
2. Update **Site URL**: `http://localhost:3000` (dev) or `https://your-domain.com` (prod)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (allow all for dev)
4. **JWT Expiry**: 3600 (1 hour)
5. **Refresh Token Rotation**: Enabled
6. **Email Templates** (optional): Customize signup/reset emails

### 3.3 Disable Public Signups (Invite-Only)

1. Go to **Authentication → Settings**
2. Scroll to **User Signups**
3. **Disable** "Allow new users to sign up"
4. Now only admins can create accounts via dashboard or API

---

## Step 4: Set Up Row-Level Security (RLS)

### 4.1 Enable RLS on Tables

In Supabase Dashboard → **SQL Editor**, run:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create RLS Policies

**Athletes can only see their own data:**

```sql
-- Athletes can read their own user record
CREATE POLICY "Athletes can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id AND role = 'ATHLETE');

-- Athletes can read their own athlete record
CREATE POLICY "Athletes can view own athlete data"
ON "Athlete"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Athletes can read/write their own mood logs
CREATE POLICY "Athletes can manage own mood logs"
ON "MoodLog"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Athletes can read/write their own goals
CREATE POLICY "Athletes can manage own goals"
ON "Goal"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Athletes can read/write their own chat sessions
CREATE POLICY "Athletes can manage own chat sessions"
ON "ChatSession"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Athletes can read/write their own messages
CREATE POLICY "Athletes can manage own messages"
ON "Message"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "ChatSession"
    WHERE "ChatSession".id = "Message"."sessionId"
    AND "ChatSession"."athleteId" = auth.uid()::text
  )
);
```

**Coaches can only see athletes who granted consent:**

```sql
-- Coaches can view athletes with consent
CREATE POLICY "Coaches can view consenting athletes"
ON "Athlete"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "Athlete"."userId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- Coaches can view mood logs of consenting athletes
CREATE POLICY "Coaches can view consenting athlete mood logs"
ON "MoodLog"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "MoodLog"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- Coaches can view summaries of consenting athletes
CREATE POLICY "Coaches can view consenting athlete summaries"
ON "ChatSummary"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    JOIN "Athlete" a ON a."userId" = car."athleteId"
    WHERE car."athleteId" = "ChatSummary"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
    AND a."consentChatSummaries" = true
  )
);

-- Coaches can manage their own assignments
CREATE POLICY "Coaches can manage own assignments"
ON "Assignment"
FOR ALL
USING (auth.uid()::text = "coachId");
```

**Admins can see everything:**

```sql
-- Admins bypass RLS (set in application code)
-- Use service_role key for admin operations
```

### 4.3 Test RLS Policies

Run this query to verify policies work:

```sql
-- Test as athlete (should only see their data)
SELECT * FROM "MoodLog"
WHERE "athleteId" = 'some-athlete-id';

-- Should return 0 rows if user != athlete
```

---

## Step 5: Create Admin User

### 5.1 Create First User (You)

In Supabase Dashboard:

1. Go to **Authentication → Users**
2. Click **"Add user"**
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: [strong password]
   - **Auto Confirm Email**: Yes
4. Click **"Create user"**
5. Copy the **User ID** (UUID)

### 5.2 Add to Database

In SQL Editor, run:

```sql
-- Insert your user into User table
INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  '[USER-ID-FROM-STEP-5.1]',
  'your-email@example.com',
  'Your Name',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
);
```

### 5.3 Test Login

```bash
# Start your app
cd apps/web
pnpm dev

# Visit http://localhost:3000/auth/signin
# Login with your Supabase credentials
```

---

## Step 6: Migrate Demo Accounts to Invite System

### 6.1 Create Invite Code System

Run migration:

```sql
-- Add invite codes table
CREATE TABLE "InviteCode" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'ATHLETE' or 'COACH'
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "expiresAt" TIMESTAMP,
  "maxUses" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "InviteCode" ENABLE ROW LEVEL SECURITY;

-- Coaches/Admins can create invite codes
CREATE POLICY "Coaches can create invite codes"
ON "InviteCode"
FOR INSERT
USING (auth.uid()::text = "createdBy" AND role IN ('COACH', 'ADMIN'));

-- Anyone can view valid invite codes (to validate during signup)
CREATE POLICY "Anyone can view valid invite codes"
ON "InviteCode"
FOR SELECT
USING (
  "expiresAt" IS NULL OR "expiresAt" > NOW()
  AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
);
```

### 6.2 Update Auth Logic

Remove demo account logic from `/apps/web/src/lib/auth.ts` and replace with Supabase Auth (implementation in next step).

---

## Step 7: Install Supabase Client Libraries

```bash
cd apps/web
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Step 8: Create Supabase Client

Create `apps/web/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (use in React components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side (use in API routes)
export function getSupabaseServerClient() {
  return createServerComponentClient({ cookies });
}

// Admin client (bypass RLS, for admin operations only)
export function getSupabaseAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

---

## Step 9: Update Middleware

Update `apps/web/src/middleware.ts` to use Supabase Auth:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth/signin') ||
    pathname.startsWith('/auth/signup');

  // Redirect to signin if not authenticated
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith('/auth/')) {
    // Get user role from database
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const redirectPath = user?.role === 'COACH' ? '/coach/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Step 10: Testing Checklist

- [ ] Supabase project created
- [ ] Database connected
- [ ] Schema pushed successfully
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] Admin user created
- [ ] Can login with Supabase credentials
- [ ] Demo accounts disabled in production
- [ ] Middleware redirects work
- [ ] Athletes can only see own data
- [ ] Coaches can only see consenting athletes

---

## Next Steps

After Supabase is set up:
1. Migrate auth logic in `/apps/web/src/app/api/auth/`
2. Update API routes to use Supabase client
3. Remove demo account logic
4. Test with real users
5. Set up production project when ready

---

## Troubleshooting

### "relation does not exist"
- Run `npx prisma db push` again
- Check Supabase dashboard → Database → Tables

### RLS blocks everything
- Temporarily disable RLS for debugging:
  ```sql
  ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
  ```
- Check auth.uid() is set correctly
- Verify policies match your use case

### Can't login
- Check Site URL and Redirect URLs in Supabase settings
- Verify email confirmation is disabled for dev
- Check browser console for CORS errors

---

**Status**: Ready to start implementation ✅
