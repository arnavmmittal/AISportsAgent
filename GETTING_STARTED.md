# Getting Started with AI Sports Agent

## 🚨 IMPORTANT: Node.js Version Issue

Your current Node.js version (v18.16.0) is **TOO OLD** for this project.

**You MUST upgrade to Node.js >= 20.9.0 before proceeding.**

---

## Quick Start (After Upgrading Node.js)

### 1. Update Node.js

Choose one method:

**Method 1 - Homebrew (Easiest)**:
```bash
brew install node@20
```

**Method 2 - nvm**:
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen terminal, then:
nvm install 20
nvm use 20
nvm alias default 20
```

**Method 3 - Download**:
Visit https://nodejs.org/ and download Node.js 20 LTS

### 2. Verify Installation

```bash
node --version
# Should show v20.x.x

npm --version
# Should show v10.x.x
```

### 3. Install Project Dependencies

```bash
cd ~/Desktop/SportsAgent/ai-sports-agent
npm install
```

This will install:
- Next.js 16
- Prisma (database ORM)
- NextAuth (authentication)
- OpenAI SDK
- Vercel AI SDK
- And more...

### 4. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add:
- Database URL (from Supabase or local PostgreSQL)
- NextAuth secret (generate with `openssl rand -base64 32`)
- OpenAI API key

### 5. Set Up Database

#### Option A: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Copy PostgreSQL connection string
4. Add to `.env.local`

#### Option B: Local PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15
createdb ai_sports_agent
```

### 6. Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 7. Start Dev Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Project Structure Overview

```
~/Desktop/SportsAgent/ai-sports-agent/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities (prisma, openai, auth)
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema (complete!)
├── .env.example          # Environment variable template
├── package.json          # Dependencies & scripts
├── README.md             # Full documentation
└── SETUP.md              # Detailed setup guide
```

---

## What's Already Done ✅

- ✅ Next.js 16 project initialized
- ✅ TypeScript configured
- ✅ Tailwind CSS set up
- ✅ Complete Prisma schema (Users, Athletes, Coaches, Sessions, Messages, Moods, Goals)
- ✅ Type definitions for entire app
- ✅ OpenAI utility with sports psych system prompt
- ✅ Prisma client setup
- ✅ Environment variable templates
- ✅ Package.json with all dependencies
- ✅ Comprehensive documentation

---

## What's Next (After Node.js Upgrade) 🚀

### Phase 1 - MVP (Weeks 1-4)
1. Set up authentication (NextAuth)
2. Build athlete chat interface
3. Create chat API endpoint with OpenAI
4. Add session storage
5. Basic athlete dashboard
6. Simple coach dashboard

### Phase 2 - Advanced Features (Weeks 5-8)
1. RAG (vector search with knowledge base)
2. Coach dashboard with athlete summaries
3. Mood tracking with visualizations
4. Goal setting and tracking

### Phase 3 - Polish (Weeks 9-12)
1. Voice input (11Labs)
2. Email notifications
3. HIPAA/FERPA compliance audit
4. Performance optimization
5. Deployment to Vercel

---

## Key Files to Know

### Configuration
- `prisma/schema.prisma` - Database models (complete!)
- `.env.local` - Environment variables (YOU NEED TO CREATE THIS)
- `package.json` - Dependencies and scripts

### Utilities
- `src/lib/prisma.ts` - Database client
- `src/lib/openai.ts` - AI integration with system prompt
- `src/types/index.ts` - TypeScript types

### Documentation
- `README.md` - Full project documentation
- `SETUP.md` - Detailed setup instructions
- `.env.example` - Environment variable reference

---

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run build                # Build for production
npm run lint                 # Run linter
npm run type-check           # Check TypeScript

# Database
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate       # Run migrations
npm run prisma:studio        # Open database GUI
npm run db:push              # Push schema without migration
```

---

## Getting Help

1. **Setup Issues**: See `SETUP.md`
2. **Architecture Questions**: See `README.md`
3. **Database Schema**: See `prisma/schema.prisma`
4. **Type Definitions**: See `src/types/index.ts`

---

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind
- **Backend**: Next.js API routes (serverless)
- **Database**: PostgreSQL (via Supabase or local)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

### Database Models
- User (athletes, coaches, admins)
- Athlete (sport, year, stats)
- Coach (team info)
- ChatSession (conversations)
- Message (individual messages)
- MoodLog (daily mood tracking)
- Goal (performance goals)
- KnowledgeBase (for RAG - sports psych research)

### Key Features
1. **Athlete Chat**: Real-time AI chat with evidence-based sports psychology guidance
2. **Coach Dashboard**: View athlete summaries, trends, and insights
3. **Mood Tracking**: Daily mood, confidence, stress logging
4. **Goal Setting**: Track performance and mental health goals
5. **RAG System**: AI responses grounded in research papers

---

## Next Steps for You

1. **Upgrade Node.js to v20+** ⚠️ MUST DO FIRST
2. Run `npm install` to install all dependencies
3. Set up Supabase account and get database URL
4. Create `.env.local` with your credentials
5. Run Prisma migrations
6. Start dev server and begin building!

---

## Questions?

Check the documentation:
- Full docs: `README.md`
- Setup guide: `SETUP.md`
- Database schema: `prisma/schema.prisma`

Good luck building the AI Sports Agent! 🏆
