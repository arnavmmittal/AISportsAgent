# Flow Sports Coach

An intelligent, evidence-based virtual sports psychology assistant designed for collegiate athletes and their teams.

## Overview

The Flow Sports Coach provides athletes with 24/7 access to mental performance tools, emotional support, and cognitive-behavioral insights through a conversational interface. The system is designed to complement (not replace) human sports psychologists by extending their reach and ensuring athletes have support when university resources are limited.

### Core Features

#### For Athletes
- **24/7 AI Chat Support**: Evidence-based guidance for performance anxiety, focus, confidence, goal-setting, and recovery
- **Mood Tracking**: Log daily mood, confidence, stress levels, and sleep patterns
- **Goal Management**: Set and track performance, mental, academic, and personal goals
- **Session History**: Review past conversations and track progress over time
- **Voice Input** (Phase 2): Talk to the AI assistant using voice

#### For Coaches
- **Dashboard**: View aggregated athlete data and mental performance trends
- **Session Summaries**: AI-generated summaries of athlete conversations (with consent)
- **Notes & Follow-ups**: Leave notes and reminders for specific athletes
- **Team Overview**: Monitor overall team mental health trends

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **AI**: OpenAI GPT-4 + Vercel AI SDK
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Deployment**: Vercel

## Prerequisites

### IMPORTANT: Node.js Version
**You must have Node.js >= 20.9.0 installed.**

Current version detected: v18.16.0 (TOO OLD)

#### Update Node.js:

**Option 1 - Homebrew (Recommended)**:
```bash
brew install node@20
```

**Option 2 - nvm**:
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
```

**Option 3 - Direct Download**:
Visit [nodejs.org](https://nodejs.org/) and download Node.js 20 LTS

### Verify Installation
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show v10.x.x or higher
```

## Installation

### 1. Install Dependencies

```bash
cd ~/Desktop/SportsAgent/flow-sports-coach
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```bash
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
```

### 3. Set Up Database

#### Option A: Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the PostgreSQL connection string
4. Add to `.env.local` as `DATABASE_URL`

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql@15

# Start service
brew services start postgresql@15

# Create database
createdb ai_sports_agent
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) View database in Prisma Studio
npm run prisma:studio
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
flow-sports-coach/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (athlete)/               # Athlete routes
│   │   │   ├── chat/                # Chat interface
│   │   │   ├── history/             # Conversation history
│   │   │   └── progress/            # Progress tracking
│   │   ├── (coach)/                 # Coach routes
│   │   │   ├── dashboard/           # Coach dashboard
│   │   │   └── athletes/[id]/       # Individual athlete view
│   │   ├── api/                     # API routes
│   │   │   ├── auth/[...nextauth]/  # NextAuth endpoints
│   │   │   ├── chat/                # AI chat endpoint
│   │   │   ├── sessions/            # Session management
│   │   │   ├── moods/               # Mood tracking
│   │   │   └── embeddings/          # Vector search (RAG)
│   │   └── auth/                    # Login/Signup pages
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── chat/                    # Chat components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   └── dashboard/               # Coach dashboard components
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── auth.ts                  # NextAuth configuration
│   │   ├── openai.ts                # OpenAI setup
│   │   ├── vector.ts                # Vector DB utilities (RAG)
│   │   └── utils.ts                 # Utility functions
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Seed data
├── public/                          # Static assets
├── .env.local                       # Environment variables (DO NOT COMMIT)
├── .env.example                     # Environment template
├── SETUP.md                         # Detailed setup instructions
└── package.json
```

## Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **User**: Base user model (athletes, coaches, admins)
- **Athlete**: Athlete-specific data (sport, year, team)
- **Coach**: Coach-specific data
- **ChatSession**: Conversation sessions
- **Message**: Individual chat messages
- **MoodLog**: Daily mood and confidence tracking
- **Goal**: Performance and personal goals
- **KnowledgeBase**: Sports psychology research (for RAG)

View the full schema in [`prisma/schema.prisma`](./prisma/schema.prisma)

## Development Workflow

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Prisma commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run db:push          # Push schema changes without migration
npm run db:reset         # Reset database (CAUTION)
```

### Development Checklist

- [ ] Update Node.js to >= 20.9.0
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up database (Supabase or local)
- [ ] Run Prisma migrations
- [ ] (Optional) Seed database with test data
- [ ] Start dev server

## Phase 1 - MVP Features

✅ Completed in this setup:
- [x] Next.js project initialization
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Prisma schema with all models
- [x] Type definitions
- [x] OpenAI utility functions
- [x] Environment variable templates
- [x] Project documentation

⏳ To be implemented:
- [ ] NextAuth authentication (login/signup)
- [ ] Chat interface UI
- [ ] Chat API endpoint with OpenAI streaming
- [ ] Session management
- [ ] Athlete dashboard
- [ ] Basic coach dashboard

## Phase 2 - Advanced Features

- [ ] RAG (Retrieval-Augmented Generation) with vector search
- [ ] Knowledge base ingestion (sports psych research)
- [ ] Coach dashboard with athlete summaries
- [ ] Mood tracking visualizations
- [ ] Goal setting and tracking
- [ ] Voice input (11Labs integration)
- [ ] Email notifications

## Environment Variables

See [`.env.example`](./.env.example) for all required environment variables.

### Required for MVP:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Application URL (http://localhost:3000 for dev)
- `OPENAI_API_KEY`: OpenAI API key

### Optional (Phase 2):
- `PINECONE_API_KEY`: Pinecone vector database
- `ELEVENLABS_API_KEY`: Voice API
- `RESEND_API_KEY`: Email service

## Security & Compliance

### HIPAA/FERPA Considerations
- All data encrypted at rest (Supabase built-in)
- SSL/TLS for data in transit
- Role-based access control (Prisma)
- Audit logs for data access
- Athlete consent mechanism required before coach access
- No PHI (Protected Health Information) stored without proper consent

### Best Practices
- Never commit `.env.local`
- Use environment variables for all secrets
- Implement rate limiting on API routes
- Sanitize all user inputs
- Regular security audits

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Environment Variables in Production
Make sure to add all environment variables from `.env.example` to your Vercel project settings.

## API Documentation

### POST /api/chat
Stream chat completion with OpenAI

**Request**:
```json
{
  "messages": [
    { "role": "user", "content": "I'm feeling anxious before my game" }
  ],
  "athleteId": "user_id",
  "sessionId": "session_id"
}
```

**Response**: SSE stream of AI response

### GET /api/sessions
Get athlete's chat sessions

**Query Params**:
- `athleteId`: User ID
- `limit`: Number of sessions (default: 10)

### POST /api/moods
Log mood entry

**Request**:
```json
{
  "athleteId": "user_id",
  "mood": 7,
  "confidence": 8,
  "stress": 4,
  "notes": "Feeling ready for tomorrow's match"
}
```

## Contributing

This is a private project. For questions or suggestions, contact the development team.

## License

Proprietary - All Rights Reserved

---

## Support

For setup help, see [`SETUP.md`](./SETUP.md)

For technical questions, contact: [your-email@example.com]

---

**Built with ❤️ for student athletes**
