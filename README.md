# AI Sports Agent - Mental Performance Platform

Evidence-based virtual sports psychology assistant for collegiate athletes providing 24/7 mental performance support through AI-powered conversations, mood tracking, and performance analytics.

## 🎯 Problem & Solution

**Problem**: Each sports psychology coach is responsible for 150+ student athletes, making individual support impossible.

**Solution**: AI-powered mental performance assistant that:
- Provides 24/7 availability for immediate support
- Offers voice + text chat interface (replaces Zoom meetings)
- Applies evidence-based sports psychology frameworks (CBT, mindfulness, flow state)
- Enables coaches to monitor 150+ athletes through aggregated insights
- Maintains privacy while providing crisis detection

## 🏗️ Architecture

### Monorepo Structure
```
SportsAgent/
├── apps/
│   ├── web/          # Next.js web application (athletes + coaches)
│   └── mobile/       # React Native Expo app (athletes + coaches)
├── packages/
│   └── api-client/   # Shared API client
└── ai-sports-mcp/    # Python MCP server (future)
```

### Tech Stack

**Web (Next.js 15)**
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL via Supabase
- ORM: Prisma
- Auth: NextAuth.js v5 (migrating to Supabase Auth)
- AI: OpenAI GPT-4 + Vercel AI SDK

**Mobile (React Native)**
- Framework: Expo SDK 52
- Navigation: Expo Router (file-based)
- State: Zustand
- Voice: expo-av + WebSocket streaming
- Auth: JWT tokens

**Backend**
- API: Next.js API routes (web + mobile)
- Future: Python FastAPI MCP server for advanced agent orchestration

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
pnpm install

# Run web app
cd apps/web
pnpm dev

# Run mobile app
cd apps/mobile
npx expo start
```

## 👥 Demo Accounts

**Athlete:**
- Email: `demo@athlete.com`
- Password: `demo123`

**Coach:**
- Email: `demo@coach.com`
- Password: `demo123`

## 📱 Features

### Athlete Features
- ✅ AI Chat (text + voice)
- ✅ Mood tracking with visualizations
- ✅ Goal setting and progress tracking
- ✅ Session history
- ✅ Crisis detection and safety protocols

### Coach Features
- ✅ Team dashboard with analytics
- ✅ Athlete roster and filtering
- ✅ Readiness scores and trends
- ✅ Crisis alerts and interventions
- ✅ AI-powered insights and patterns
- ✅ Assignment management
- ✅ Privacy controls and consent

## 🔐 Security & Privacy

- Row-level security (RLS) with Supabase
- Athlete consent required for coach access
- Crisis detection with immediate escalation
- HIPAA/FERPA compliance considerations
- Cost controls and rate limiting

## 📊 Current Status

See [MVP_STATUS.md](./MVP_STATUS.md) for current progress and next steps.

## 🤝 Contributing

This is a research project for the University of Washington. Contact the team for collaboration opportunities.

## 📄 License

Proprietary - University of Washington
