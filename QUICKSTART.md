# Quick Start Guide - AI Sports Psychology Platform

## Prerequisites
- Python 3.11+ installed
- Node.js 20+ installed
- PostgreSQL database (or use Supabase free tier)
- OpenAI API key

---

## Step 1: Set Up the Backend (Python FastAPI)

### 1.1 Navigate to backend directory
```bash
cd ai-sports-mcp/server
```

### 1.2 Create virtual environment (if not exists)
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows
```

### 1.3 Install dependencies
```bash
pip install -r requirements.txt
```

### 1.4 Set up environment variables
Your `.env` file already exists with your OpenAI API key. You need to update the database URL:

```bash
# Edit .env file - replace the DATABASE_URL with your PostgreSQL connection string
# For local PostgreSQL:
DATABASE_URL=postgresql://username:password@localhost:5432/sportsagent

# OR use Supabase (free tier):
# 1. Go to https://supabase.com
# 2. Create a new project
# 3. Get the connection string from Settings > Database
# 4. Replace in .env
```

### 1.5 Run database migrations (optional for now)
```bash
# If you have a database set up:
alembic upgrade head
```

### 1.6 Start the backend server
```bash
python -m app.main
```

The backend should now be running at **http://localhost:8000**

You can verify by visiting:
- **http://localhost:8000** - API root
- **http://localhost:8000/docs** - Interactive API documentation
- **http://localhost:8000/health** - Health check

---

## Step 2: Set Up the Frontend (Next.js)

### 2.1 Open a NEW terminal window

### 2.2 Navigate to frontend directory
```bash
cd ai-sports-agent
```

### 2.3 Install dependencies
```bash
npm install
```

### 2.4 Set up environment variables
Create a `.env.local` file:

```bash
# Copy the example
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Database (use same as backend)
DATABASE_URL=postgresql://username:password@localhost:5432/sportsagent

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Generate a NextAuth secret:
```bash
openssl rand -base64 32
```

### 2.5 Set up Prisma database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 2.6 Start the frontend server
```bash
npm run dev
```

The frontend should now be running at **http://localhost:3000**

---

## Step 3: Test the Application

### 3.1 Create a test user (using Prisma Studio)
In a new terminal:
```bash
cd ai-sports-agent
npx prisma studio
```

This opens a database GUI at **http://localhost:5555**

**Create a test school:**
1. Click "School" table
2. Add record:
   - id: `school_1`
   - name: `Test University`
   - division: `D1`

**Create a test athlete user:**
1. Click "User" table
2. Add record:
   - id: `user_athlete_1`
   - email: `athlete@test.com`
   - name: `Test Athlete`
   - password: `$2a$10$XYZ...` (use bcrypt hash - see below)
   - role: `ATHLETE`
   - schoolId: `school_1`

**To generate password hash:**
```bash
# In a Node.js console or use online bcrypt generator
# Password: "password123"
# Hash: $2a$10$rOZVQQnQYqN7YQYfQQQQQOZVQQnQYqN7YQYfQQQQQOZVQQnQYqN7YQ
```

Or use this Python script:
```python
from bcrypt import hashpw, gensalt
print(hashpw(b"password123", gensalt()).decode())
```

3. Click "Athlete" table
4. Add record:
   - userId: `user_athlete_1`
   - sport: `Basketball`
   - year: `Junior`
   - teamPosition: `Guard`

**Create a test coach user:**
1. Click "User" table
2. Add record:
   - id: `user_coach_1`
   - email: `coach@test.com`
   - name: `Test Coach`
   - password: (same hash as above)
   - role: `COACH`
   - schoolId: `school_1`

3. Click "Coach" table
4. Add record:
   - userId: `user_coach_1`
   - sport: `Basketball`
   - title: `Head Coach`

### 3.2 Test the Chat Interface (Athlete)

1. **Go to http://localhost:3000**
2. **Sign in** with:
   - Email: `athlete@test.com`
   - Password: `password123`
3. **Navigate to Chat** (you'll need to create a chat page or access the component)
4. **Send a message**: "I'm feeling nervous about the big game tomorrow"
5. **Watch the AI respond** with streaming text and sports psychology advice!

### 3.3 Test the Coach Dashboard

1. **Sign out** and sign back in with:
   - Email: `coach@test.com`
   - Password: `password123`
2. **Navigate to Dashboard** (you'll need to create a dashboard page)
3. **View team analytics** (will be empty until athletes log moods)

### 3.4 Test Mood Logging

1. **Sign in as athlete**
2. **Navigate to Mood Logger**
3. **Log a mood entry**:
   - Mood: 7/10
   - Confidence: 8/10
   - Stress: 6/10
4. **Submit** and verify it saves

---

## Step 4: Quick Component Testing (Without Full Pages)

If you don't have pages set up yet, you can test components directly:

### 4.1 Test Chat Component
Edit `ai-sports-agent/src/app/page.tsx`:

```tsx
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="h-screen">
      <ChatInterface />
    </main>
  );
}
```

### 4.2 Test Coach Dashboard
```tsx
import { CoachDashboard } from '@/components/dashboard/CoachDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <CoachDashboard />
    </main>
  );
}
```

### 4.3 Test Mood Logger
```tsx
import { MoodLogger } from '@/components/mood/MoodLogger';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <MoodLogger />
    </main>
  );
}
```

---

## Quick Troubleshooting

### Backend won't start
- Check if port 8000 is already in use
- Verify `.env` file exists with OPENAI_API_KEY
- Make sure venv is activated

### Frontend won't start
- Run `npm install` again
- Delete `.next` folder and restart
- Check Node.js version: `node -v` (should be 20+)

### Database errors
- Verify DATABASE_URL is correct
- Run `npx prisma db push` to sync schema
- Check if PostgreSQL is running

### Chat not working
- Check backend is running at http://localhost:8000
- Verify NEXT_PUBLIC_API_URL in `.env.local`
- Check browser console for errors
- Verify you're signed in

### Components not showing
- Wrap app in SessionProvider for NextAuth
- Check if user is authenticated
- Verify role matches (ATHLETE for chat, COACH for dashboard)

---

## Minimal Test Without Database

If you want to test **just the backend API** without database:

```bash
# In ai-sports-mcp/server
source venv/bin/activate

# Test knowledge base query (already ingested)
python scripts/query_knowledge_base.py \
  --query "How to handle pre-game anxiety?" \
  --sport basketball \
  --n 3

# Start backend
python -m app.main
```

Visit **http://localhost:8000/docs** and test the endpoints manually!

---

## Next Steps

1. **Create full pages** for chat, dashboard, mood logging
2. **Add authentication wrapper** to protect routes
3. **Style the components** with your brand colors
4. **Deploy to production** (Vercel for frontend, Railway/Render for backend)

---

## Need Help?

- Backend API docs: **http://localhost:8000/docs**
- Check logs in terminal for errors
- Review `GETTING_STARTED.md` for detailed setup
- Check `CLAUDE.md` for architecture details
