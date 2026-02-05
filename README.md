# Flow Sports Coach - Performance Analytics Platform

**Performance optimization platform for collegiate athletics** that correlates mental readiness with game performance, providing predictive analytics and 24/7 athlete support to give programs a competitive edge.

## ⚠️ Important Terminology

**"Coaches" in this application refers to Sports Psychologists, NOT sport team coaches.**

At universities like UW, there are only ~6 Sports Psychologists serving hundreds of student-athletes across all sports programs. This creates a critical 1:150+ ratio that makes traditional 1-on-1 support impossible. The app's "Coach Portal" is designed for these mental performance professionals—not the basketball coach, football coach, etc.

**User Types:**
- **Athletes** = Student-athletes from any sport (basketball, football, soccer, etc.)
- **Coaches** = Sports Psychologists / Mental Performance Consultants (NOT sport team coaches)

## 🎯 The Problem

**Sports psychology doesn't scale:**
- Each sports psychologist serves 150+ athletes across multiple sports
- Individual 1-on-1 Zoom meetings are physically impossible at this ratio
- Athletes need support but can't access it (night before game, after bad performance)
- **Sports psychologists are working blind** - no data on who's struggling until performance drops

**The cost of ignorance:**
- Star player transfers due to mental health issues: **$500k lost**
- One preventable injury from mental fatigue: **$100k in medical costs**
- One missed conference win: **$1M+ in bowl/tournament revenue**

## 💡 The Solution

**Two-part competitive advantage:**

### 1. Predictive Performance Analytics
- **Correlate mental readiness → game performance**
  - "When Sarah's readiness >85, she scores 22 PPG"
  - "When readiness <70, she scores 12 PPG"
  - r=0.73 correlation between confidence and assists
- **7-day forecasting**: Predict who will struggle next week
- **Data-driven decisions**: Lineup optimization, intervention prioritization
- **This is data you don't have today**

### 2. 24/7 Scalable Support
- **Replaces impossible 1:150 Zoom meeting model**
- Voice + text AI chat available anytime (not just scheduled appointments)
- Athletes get support when they need it (pre-game anxiety, performance slumps)
- Frees up sports psychologists for high-risk cases
- Crisis detection escalates to human professionals

**Market Positioning:**
- WHOOP (physical readiness) → **We're WHOOP for mental readiness**
- Catapult (GPS tracking) → **We're Catapult for mental performance**
- Kinduct (athlete management) → **We integrate with them**

**Pricing:** $100-200k/year (market-rate for D1 performance tech)

### UX Design for 1:150+ Ratio

The Coach Portal is specifically designed for the reality that one sports psychologist serves 150+ athletes:

- **Triage-first dashboard**: Critical-risk athletes surface to the top automatically
- **Visual heatmaps**: See 100+ athletes' readiness at a glance, no clicking required
- **AI-prioritized intervention queue**: Recommendations on who needs attention most
- **Risk-based filtering**: Instantly filter to Critical / Warning / Good status
- **Bulk assignments**: Create mental skills exercises for entire teams
- **Crisis escalation**: Automatic alerts ensure high-risk cases never get missed

This design means a psychologist can effectively monitor their entire caseload in minutes, not hours.

---

## 🏗️ Architecture

### Monorepo Structure
```
FlowSportsCoach/
├── apps/
│   ├── web/          # Next.js (web app for athletes + coaches)
│   └── mobile/       # React Native Expo (iOS + Android)
├── packages/
│   ├── api-client/   # Shared API client
│   └── types/        # Shared TypeScript types
└── services/mcp-server/    # Python MCP server (future advanced features)
```

### Tech Stack

**Web (Next.js 15)**
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL via Supabase
- ORM: Prisma
- Auth: NextAuth.js v5 (JWT for mobile)
- AI: OpenAI GPT-4 + Vercel AI SDK
- Deployment: Vercel

**Mobile (React Native + Expo)**
- Framework: Expo SDK 52
- Navigation: Expo Router (file-based)
- Voice: Whisper (STT) + ElevenLabs (TTS)
- State: React hooks + Zustand
- Auth: JWT tokens
- Deployment: TestFlight (iOS), Play Console (Android)

**Backend**
- API: Next.js API routes (25+ endpoints)
- Real-time: SSE for AI streaming
- Automation: Vercel Cron for stats import
- Future: Python FastAPI MCP server for advanced ML

---

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

```bash
# Install dependencies (monorepo)
pnpm install

# Run web app (localhost:3000)
cd apps/web
pnpm dev

# Run mobile app (Expo Go)
cd apps/mobile
pnpm start
```

---

## 👥 Demo/Seed Accounts

**For testing with real seed data:**

**Coach:**
- Email: `coach@uw.edu`
- Password: `Coach2024!`

**Athletes (20 accounts):**
- Email: `athlete1@uw.edu` through `athlete20@uw.edu`
- Password: `Athlete2024!`
- Examples:
  - `athlete1@uw.edu` - Basketball, Junior
  - `athlete5@uw.edu` - Soccer, Sophomore
  - `athlete10@uw.edu` - Track & Field, Senior

**Legacy demo accounts (offline mode):**
- `demo@athlete.com` / `demo123`
- `demo@coach.com` / `demo123`

---

## 📱 Features

### Athlete Features (Mobile + Web)
- ✅ **AI Chat** (text + voice with natural TTS)
  - 24/7 availability (replaces scheduled Zoom meetings)
  - Sport-specific mental performance coaching
  - Evidence-based techniques (visualization, breathing, self-talk)
  - Crisis detection with immediate escalation
- ✅ **Mood Tracking** with 7-day trend visualization
  - Daily check-ins: mood, confidence, stress, energy, sleep
  - Readiness score calculation (0-100)
  - Charts and historical trends
- ✅ **Goal Management**
  - Performance, mental, academic, personal goals
  - Progress tracking with AI-generated insights
  - Category filtering and search
- ✅ **Assignments**
  - Coach-assigned mental skills exercises
  - Submit responses, track completion
  - Due date reminders

### Coach Features (Mobile + Web)
- ✅ **Team Dashboard** with at-a-glance metrics
  - Total athletes, consent status, at-risk count
  - Crisis alerts with severity levels
  - Team mood averages (7/14/30 day views)
- ✅ **Predictive Analytics** (Post-MVP)
  - **Team Heatmap**: 14-day readiness across all athletes
  - **Performance Correlation**: Mental state ↔ game stats
  - **Readiness Forecasting**: 7-day ML predictions
  - **Intervention Queue**: Prioritized recommendations
- ✅ **Athlete Roster** with filtering
  - Risk levels (high/medium/low)
  - Mood indicators, active goals count
  - Consent management
- ✅ **Assignment Management**
  - Create team-wide or individual assignments
  - Track completion rates
  - View submissions

### Advanced Analytics (NEW)
- ✅ **Automated Stats Import**
  - Web scraping from school athletics sites
  - Vercel Cron daily imports
  - CSV upload fallback
  - API integrations (ESPN, NCAA, SportsDataIO)
- ✅ **Performance Correlations**
  - Pearson correlation (r-values)
  - Statistical significance (p-values)
  - Actionable insights ("focus on sleep before games")
- ✅ **ML Forecasting**
  - Exponential smoothing predictions
  - Confidence bounds
  - Risk flags ("predicted decline next week")

---

## 🔐 Security & Privacy

**Current (Demo Mode):**
- Demo accounts for testing
- Mock data for offline functionality
- Basic crisis detection

**Production Requirements:**
- Row-level security (RLS) with Supabase
- Athlete consent required for coach access
- Invite-only authentication
- FERPA compliance (student data protection)
- Crisis detection with immediate escalation to licensed professionals
- Cost controls and rate limiting
- Audit logging

---

## 📊 Current Status

**Feature Completeness:** 95%
- ✅ Full athlete experience (mobile + web)
- ✅ Full coach dashboard (mobile + web)
- ✅ Voice chat with Whisper + ElevenLabs
- ✅ POST-MVP analytics (heatmap, correlation, forecasting, interventions)
- ✅ Crisis detection
- ✅ Push notifications
- ✅ All TypeScript errors fixed

**Production Readiness:** 60%
- ❌ Demo accounts (need real auth)
- ❌ No RLS policies (security gap)
- ❌ No cost controls (risk of runaway costs)
- ❌ Crisis detection not enforced (liability risk)

**See [MVP_STATUS.md](./MVP_STATUS.md) for detailed production roadmap.**
**See [NextSteps.md](./NextSteps.md) for UW demo prep and pilot strategy.**

---

## 🎯 Business Model

### Target Market
- **Phase 1 (Year 1):** Pac-12 schools (12 programs)
- **Phase 2 (Year 2):** Power 5 conferences (65 programs)
- **Phase 3 (Year 3+):** All D1 (350+ programs)

### Pricing
- **Single Team:** $100k/year (50 athletes)
- **Full Program:** $150k/year (100 athletes)
- **Enterprise:** $200k+/year (200+ athletes, white-label)

### Comparable Pricing
- WHOOP (team edition): $30-50k/year
- Catapult (GPS tracking): $100-150k/year
- Kinduct (athlete management): $50-100k/year
- **Our pricing is market-rate for D1 performance tech**

### ROI Pitch
- One prevented star transfer: $500k saved (5x ROI)
- One prevented injury: $100k saved
- One extra conference win: $1M+ in revenue
- **If it prevents ONE major loss, it pays for itself 5-10x**

---

## 🧪 UW Pilot Plan (8 Weeks)

**Target:** Women's basketball (15 athletes)

**Hypothesis:** Mental readiness correlates with game performance (r>0.5)

**Success Metrics:**
- 60%+ weekly active users
- 50%+ mood log completion rate
- Coach finds insights valuable ("changed my lineup based on this")
- r>0.5 correlation between readiness and performance
- <$200 OpenAI costs

**Timeline:**
- Week 1-2: Onboarding + training
- Week 3-8: Active use + data collection
- Week 9-10: Evaluation + results

**Next Steps:** See [NextSteps.md](./NextSteps.md)

---

## 🤝 Contributing

This is a startup project by Arnav Mittal (UW student) aiming to give D1 programs a competitive edge through predictive mental performance analytics.

**Interested in:**
- Piloting at your school? → Email or LinkedIn
- Co-founding? → Looking for sports science and enterprise sales co-founders
- Partnering (Kinduct, TeamBuildr, Catapult)? → Open to integrations
- Acquiring? → Open to discussions

---

## 📄 License

Proprietary - © 2024-2025 Arnav Mittal

---

## 🔗 Quick Links

- [NextSteps.md](./NextSteps.md) - Demo prep & pilot strategy
- [MVP_STATUS.md](./MVP_STATUS.md) - Production roadmap
- [SETUP.md](./SETUP.md) - Development setup
- [CLAUDE.md](./CLAUDE.md) - AI assistant context
- [MOBILE_STATUS.md](./apps/mobile/MOBILE_STATUS.md) - Mobile app status

---

**Built to give D1 programs a competitive edge through data-driven mental performance optimization.** 🏆
