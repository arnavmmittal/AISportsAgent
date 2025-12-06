# Database Setup & Management Guide

## 🔍 How to View Users in Supabase

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `AI Sports Agent` project
3. **Navigate to Table Editor**:
   - Click "Table Editor" in the left sidebar
   - Select the "User" table
   - You'll see all users with their details:
     - id, email, name, role, schoolId, etc.

### Option 2: SQL Editor

1. In Supabase dashboard, click "SQL Editor"
2. Run this query to see all users:
```sql
SELECT
  id,
  name,
  email,
  role,
  "schoolId",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

3. To see users with their athlete/coach info:
```sql
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u."schoolId",
  a.sport AS athlete_sport,
  a.year AS athlete_year,
  c.sport AS coach_sport
FROM "User" u
LEFT JOIN "Athlete" a ON u.id = a."userId"
LEFT JOIN "Coach" c ON u.id = c."userId"
ORDER BY u."createdAt" DESC;
```

---

## 🔒 Fixing Row Level Security (RLS) Warnings

### What are RLS warnings?

Supabase warns when tables are publicly accessible without Row Level Security (RLS) enabled. This is a security concern because anyone with the database URL could potentially access all data.

### How to Enable RLS

#### Method 1: Using Prisma Migration (Recommended)

I've created a migration file that enables RLS and creates policies. To apply it:

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/ai-sports-agent

# Apply the RLS migration
npx prisma migrate dev --name enable_rls
```

#### Method 2: Manual SQL in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the migration SQL from:
   `/ai-sports-agent/prisma/migrations/enable_rls/migration.sql`

#### Method 3: Supabase Dashboard UI

1. Go to **Authentication** → **Policies**
2. For each table showing warnings, click **"Enable RLS"**
3. Then add policies manually using the UI

### RLS Policies Created

The migration creates these access policies:

- **Users**: Can view/update own profile only
- **Athletes**: Can view own data; Coaches can view athletes in same school
- **MoodLogs**: Athletes manage own; Coaches view with consent
- **PerformanceMetric**: Coaches/Admins can manage
- **ReadinessScore**: Athletes view own; Coaches view all
- **AuditLog**: Admins only
- **KnowledgeBase**: All authenticated users can read

---

## 🔧 Fixing MCP Server Database Connection

### The Error

```
could not translate host name "db.ccbcrerrnkqqgxtlqjnm.supabase.co" to address: nodename nor servname provided, or not known
```

### Possible Causes & Solutions

#### 1. **Supabase Project Paused**

Supabase pauses inactive projects. To check:
1. Go to https://supabase.com/dashboard
2. Check if project shows "Paused" status
3. Click "Restore project" if paused

#### 2. **Network/DNS Issue**

Test connection:
```bash
# Test if hostname resolves
ping db.ccbcrerrnkqqgxtlqjnm.supabase.co

# If it doesn't resolve, try with DNS lookup
nslookup db.ccbcrerrnkqqgxtlqjnm.supabase.co
```

If DNS fails, check:
- Your internet connection
- Firewall/VPN blocking Supabase
- Try switching networks (Wi-Fi → Ethernet or vice versa)

#### 3. **Wrong Connection String**

Verify your connection string:
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" under "Connection pooling"
3. Update both:
   - `/ai-sports-agent/.env.local`
   - `/ai-sports-mcp/server/.env`

**Correct format:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 4. **Add SSL Mode (Required for Supabase)**

Update your `.env` files to include SSL mode:

**Frontend** (`/ai-sports-agent/.env.local`):
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

**Backend** (`/ai-sports-mcp/server/.env`):
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

---

## 📊 Testing Database Connection

### Frontend (Next.js + Prisma)

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/ai-sports-agent

# Test Prisma connection
npx prisma db pull

# If successful, you'll see "✓ Pulled 15 tables"
```

### Backend (MCP Server)

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/ai-sports-mcp/server

# Activate venv
source venv/bin/activate

# Test Python connection
python3 -c "
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"
```

---

## 🗂️ Supabase Table Structure

Your current tables:

| Table | Description | RLS Status |
|-------|-------------|------------|
| User | All users (athletes, coaches, admins) | ⚠️ Needs RLS |
| School | School/university records | ✅ Has RLS |
| Athlete | Athlete-specific data | ⚠️ Needs RLS |
| Coach | Coach-specific data | ⚠️ Needs RLS |
| ChatSession | Chat conversation sessions | ⚠️ Needs RLS |
| Message | Individual chat messages | ⚠️ Needs RLS |
| MoodLog | Daily mood check-ins | ⚠️ Needs RLS |
| Goal | Performance goals | ⚠️ Needs RLS |
| KnowledgeBase | Sports psychology content | ⚠️ Needs RLS |
| PerformanceMetric | Game stats + mental state | ⚠️ Needs RLS |
| ReadinessScore | Pre-game readiness (0-100) | ⚠️ Needs RLS |
| WearableData | Whoop/Oura data | ⚠️ Needs RLS |
| TeamConfig | Team customization | ⚠️ Needs RLS |
| AuditLog | FERPA compliance logs | ⚠️ Needs RLS |

---

## 🚀 Quick Fix Checklist

- [ ] **View users**: Supabase Dashboard → Table Editor → User table
- [ ] **Enable RLS**: Run `npx prisma migrate dev --name enable_rls`
- [ ] **Fix database connection**:
  - [ ] Check if Supabase project is paused
  - [ ] Add `?sslmode=require` to DATABASE_URL
  - [ ] Test with `ping db.[project-ref].supabase.co`
  - [ ] Verify connection string in Supabase dashboard
- [ ] **Test connections**: Run Prisma pull and Python test script

---

## 📝 Environment Variables Checklist

**Frontend** (`.env.local`):
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
NEXTAUTH_SECRET=[YOUR_SECRET]
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=[YOUR_KEY]
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`server/.env`):
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
OPENAI_API_KEY=[YOUR_KEY]
# ... other vars
```

Both should use the **exact same DATABASE_URL** from Supabase dashboard.

---

## 🆘 Still Having Issues?

1. **Check Supabase Status**: https://status.supabase.com/
2. **Restart Supabase Project**: Dashboard → Settings → General → Restart project
3. **Create New Project**: If project is deleted, you'll need to:
   - Create new Supabase project
   - Update DATABASE_URL in both .env files
   - Run `npx prisma db push` to create tables
   - Re-enable RLS

---

**Last Updated**: 2025-12-06
