# AI Sports Agent - Setup Guide

## Prerequisites

**IMPORTANT: Node.js Version Requirement**
- Required: Node.js >= 20.9.0
- Current: v18.16.0 (TOO OLD)
- Update Node.js before continuing!

### Update Node.js

Option 1 - Using Homebrew (Recommended):
```bash
brew install node@20
```

Option 2 - Using nvm:
```bash
# Install nvm if not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 20
nvm install 20
nvm use 20
```

Option 3 - Download from nodejs.org:
Visit https://nodejs.org/ and download Node.js 20 LTS

### Verify Installation
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show v10.x.x or higher
```

---

## Installation Steps

Once Node.js is updated, run these commands:

### 1. Install Dependencies
```bash
cd ~/Desktop/SportsAgent/ai-sports-agent

# Install all dependencies
npm install
```

### 2. Install Additional Packages
```bash
# Core dependencies
npm install prisma @prisma/client next-auth@beta openai ai zod zustand react-hook-form @hookform/resolvers

# Dev dependencies
npm install -D prisma
```

### 3. Initialize Prisma
```bash
npx prisma init
```

### 4. Set Up Environment Variables
Create a `.env.local` file (see .env.example)

### 5. Set Up Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (once database is configured)
npx prisma migrate dev --name init
```

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## Tech Stack Summary

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **AI**: OpenAI GPT-4 + Vercel AI SDK
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

---

## Database Setup Options

### Option 1: Supabase (Recommended for MVP)
1. Go to https://supabase.com
2. Create a new project
3. Get your PostgreSQL connection string
4. Add to .env.local

### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb ai_sports_agent
```

---

## Project Structure

```
ai-sports-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (athlete)/          # Athlete-specific routes
│   │   │   ├── chat/
│   │   │   ├── history/
│   │   │   └── progress/
│   │   ├── (coach)/            # Coach-specific routes
│   │   │   ├── dashboard/
│   │   │   └── athletes/
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   ├── sessions/       # Session management
│   │   │   └── embeddings/     # Vector search
│   │   └── auth/               # Auth pages
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── chat/               # Chat interface
│   │   └── dashboard/          # Coach dashboard
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── openai.ts           # OpenAI setup
│   │   └── vector.ts           # Vector DB utilities
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
└── .env.local                  # Environment variables
```

---

## Next Steps After Node.js Update

1. Run `npm install` to install all dependencies
2. Set up Prisma database schema
3. Configure environment variables
4. Set up authentication
5. Build chat interface
6. Implement AI integration

See TODO.md for detailed task breakdown.
