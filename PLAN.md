# AI Sports Agent - Development Plan & Progress

**Last Updated**: 2025-12-05 17:30 PST
**Current Phase**: MVP Development - Authentication Complete ✅
**Active Branch**: `feature/signup-database-setup`

---

## 🎯 Project Vision

**Core Problem**: Each sports psychology coach manages 150+ student athletes, making individual support impossible at scale.

**Solution**: AI-powered 24/7 mental performance assistant that replaces traditional Zoom meetings with:
- Voice + text chat interface (primary interaction point)
- Evidence-based sports psychology frameworks (CBT, mindfulness, flow state)
- Coach dashboard for monitoring trends and crisis alerts
- Privacy-first design with athlete consent controls

**Primary Use Case**: The `/chat` page is the core product - it replaces scheduled coach-athlete Zoom meetings with on-demand AI conversations.

---

## 📊 Current Status

### ✅ Completed

#### Database & Backend
- [x] Prisma schema with all models (User, Athlete, Coach, ChatSession, Message, MoodLog, Goal, CrisisAlert, etc.)
- [x] Supabase PostgreSQL database configured
- [x] Database connection string in `.env` and `.env.local`
- [x] Signup API route (`/api/auth/signup/route.ts`) with:
  - Zod validation for email, password (8+ chars, uppercase, lowercase, number)
  - bcrypt password hashing (12 rounds)
  - Transactional user + role-specific record creation
  - Default school (University of Washington) auto-creation
  - Proper error handling for duplicates, database errors

#### Frontend Pages & Components
- [x] Signup page (`/auth/signup`)
- [x] Signin page (`/auth/signin`)
- [x] Chat interface (`/chat`) with voice + text support
- [x] Athlete dashboard (`/dashboard`)
- [x] Mood tracking page (`/mood`)
- [x] Goal management page (`/goals`)
- [x] UI components (shadcn/ui based)
- [x] Voice chat components with Cartesia.ai + OpenAI TTS fallback
- [x] Real-time streaming chat with Vercel AI SDK

#### Recent Work (Past Week)
- [x] Integrated athlete dashboard with real-time API data
- [x] Implemented Cartesia.ai → OpenAI TTS fallback for voice
- [x] Fixed voice chat audio format and streaming issues
- [x] Resolved WebSocket lifecycle and text chat streaming

#### Authentication Sprint (2025-12-05) ✅
- [x] Created PLAN.md for persistent context across Claude Code sessions
- [x] Updated CLAUDE.md to reference PLAN.md
- [x] Upgraded to Supabase Pro tier
- [x] Database schema synced successfully with `npx prisma db push`
- [x] Updated signup page to call `/api/auth/signup` endpoint
- [x] Added success message handling to signin page
- [x] Tested complete signup flow: ✅ User created in database
- [x] Tested signin flow: ✅ NextAuth authentication working
- [x] Test user created: test.athlete@university.edu (Basketball, Junior)

### 🔄 In Progress

#### Current Sprint: Chat & Dashboard Integration
- [ ] **Verify chat API**: Test existing chat endpoint with authenticated user
- [ ] **Protected routes**: Add middleware to protect dashboard/chat pages
- [ ] **Session persistence**: Verify session works across page reloads
- [ ] **Chat history**: Test loading previous chat sessions for authenticated user

### 📋 Next Up (MVP Completion)

#### Phase 1: Core MVP Features
1. **Authentication** ✅ COMPLETED
   - [x] NextAuth.js configuration with Prisma adapter
   - [x] Credentials provider with bcrypt password verification
   - [x] Signup API endpoint with database integration
   - [x] Signin page with success/error messaging
   - [x] JWT session strategy
   - [ ] Protected route middleware (Next)
   - [ ] Session management on client side (Next)
   - [ ] Logout functionality (Next)

2. **Chat Functionality**
   - [ ] Create chat API endpoint (`/api/chat/route.ts`) with OpenAI streaming
   - [ ] Session creation and message persistence
   - [ ] Voice + text mode switching
   - [ ] Chat history loading
   - [ ] Basic crisis detection keywords

3. **Athlete Dashboard**
   - [ ] Display recent chat sessions
   - [ ] Show mood trends (basic charts)
   - [ ] List active goals
   - [ ] Profile settings

4. **Basic Coach Dashboard**
   - [ ] View aggregated athlete metrics (with consent only)
   - [ ] Crisis alerts list
   - [ ] Team mood overview

#### Phase 2: Enhanced Features
- [ ] Advanced mood tracking visualizations
- [ ] Goal progress tracking with milestones
- [ ] RAG knowledge base integration (MCP agent)
- [ ] Email notifications for crisis alerts
- [ ] Multi-school support with row-level security

#### Phase 3: Production Ready
- [ ] HIPAA/FERPA compliance audit
- [ ] Rate limiting and security hardening
- [ ] Performance optimization
- [ ] Deployment to Vercel
- [ ] User acceptance testing with real athletes

---

## 🏗️ Architecture Overview

### Tech Stack
**Frontend**:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- NextAuth.js v5 (Auth)
- Vercel AI SDK (Streaming)
- Zustand (State)

**Backend**:
- Supabase PostgreSQL
- OpenAI GPT-4
- Cartesia.ai (Voice TTS)
- MCP Server (Python/FastAPI - separate repo)

**Deployment**:
- Vercel (Frontend)
- Supabase (Database)

### Database Connection
```
Host: db.ccbcrerrnkqqgxtlqjnm.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: p?Y83B?P?uNnP5b (URL encoded as p%3FY83B%3FP%3FuNnP5b)
```

**Status**: Recently upgraded to Supabase Pro tier

---

## 🚧 Current Blockers & Issues

### Active Blockers
- ✅ No blockers! Authentication is working end-to-end.

### Recently Resolved
1. **Database Connectivity** (RESOLVED 2025-12-05)
   - Issue: Free tier database was paused
   - Solution: Upgraded to Supabase Pro
   - Result: Database synced successfully with Prisma

### Known Issues
- None currently blocking MVP

---

## 🔀 Git Workflow

### Active Branches
- `main`: Production-ready code
- `feature/signup-database-setup`: ⭐ CURRENT - Authentication and database setup
- `feature/mcp-agent-integration`: Full MCP agent orchestration
- `feature/voice-integration`: Voice chat features (merged into main)
- `feature/coach-experience`: Coach dashboard work
- `feature/ui-polish-design-system`: UI/UX improvements

### Branching Strategy
- **Feature branches**: `feature/[descriptive-name]`
- **Bug fixes**: `fix/[bug-description]`
- **Refactoring**: `refactor/[component-name]`
- **Documentation**: `docs/[doc-name]`

**Important**: Always use descriptive branch names (avoid generic names like `develop`, `dev`, `integration`)

### Commit Guidelines
- Commit frequently with clear messages
- Format: `type: description` (e.g., `feat: Add signup validation`, `fix: Resolve database connection`)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## 📝 Important Development Notes

### Security Considerations
- **Password Hashing**: bcrypt with 12 rounds (done)
- **Input Validation**: Zod schemas for all user inputs (done)
- **SQL Injection**: Using Prisma ORM (protected)
- **CSRF Protection**: NextAuth.js handles this
- **Rate Limiting**: TODO - implement for production
- **HIPAA/FERPA**: Encryption at rest (Supabase), TLS in transit, audit logs needed

### Privacy & Consent
- Athletes must explicitly consent for coach to view their data (`consentCoachView` field)
- Crisis alerts bypass consent for safety
- Anonymized data only in coach dashboards (unless consent given)
- Row-level security by `schoolId` for multi-tenancy

### AI Chat Guidelines
- System prompt emphasizes evidence-based psychology
- Crisis keywords trigger immediate resource provision
- No medical advice - refers to professionals when needed
- Maintains conversation context across sessions
- Uses Discovery-First protocol (5 steps: Discovery → Understanding → Framework → Action → Follow-up)

### Testing Strategy
- Manual testing for MVP
- Critical paths to test:
  1. Signup → Signin → Chat → Logout
  2. Crisis keyword detection → Alert generation
  3. Coach dashboard with/without athlete consent
  4. Voice chat audio streaming
  5. Mood logging → Dashboard visualization

---

## 🎯 Success Metrics (Post-MVP)

- **Athlete Engagement**: Daily active users, avg session length
- **Mental Health Outcomes**: Pre/post mood scores, goal completion rate
- **Coach Efficiency**: Time saved per athlete, crisis detection accuracy
- **Platform Reliability**: Uptime, response latency, error rates

---

## 🔗 Key Resources

- **Main Codebase**: `/Users/arnavmittal/Desktop/SportsAgent/ai-sports-agent/`
- **Prisma Schema**: `ai-sports-agent/prisma/schema.prisma`
- **Project Docs**: `CLAUDE.md`, `README.md`, `GETTING_STARTED.md`
- **MCP Server**: Separate Python repo (not current focus for MVP)
- **GitHub Repo**: https://github.com/arnavmmittal/AISportsAgent.git

---

## 📅 Timeline & Milestones

### Week 1 (Current): MVP Foundation
- [x] Database schema finalized
- [x] Signup API completed
- [ ] Authentication flow working
- [ ] Basic chat functional
- [ ] Dashboard displays data

### Week 2: MVP Features
- [ ] Mood tracking with charts
- [ ] Goal management CRUD
- [ ] Coach dashboard with consent logic
- [ ] Crisis detection MVP

### Week 3: Polish & Testing
- [ ] UI/UX refinements
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes

### Week 4+: Production Prep
- [ ] Security audit
- [ ] Deployment pipeline
- [ ] User documentation
- [ ] Pilot testing with real users

---

## 💡 Ideas & Future Enhancements

- Integration with wearables (sleep, HRV data)
- Team-wide challenges and leaderboards
- Peer support groups (moderated)
- Multilingual support
- Custom frameworks per sport (e.g., golf-specific mental game)

---

## 📱 Mobile App Strategy

### **Recommendation: Mobile-First is Correct** ✅

**You are absolutely right** - mobile is the primary use case for athletes. Here's why:

#### **Why Mobile is Critical:**
1. **Athletes are on-the-go** - between classes, in locker rooms, on buses to games
2. **Pre-game anxiety** - 30 mins before competition, athletes need quick access (not a laptop)
3. **Push notifications** - Crisis alerts, mood log reminders, coach check-ins
4. **Voice is natural on mobile** - Athletes will talk to AI coach like texting a friend
5. **Higher engagement** - Mobile apps have 3-5x higher engagement than web for mental health apps

#### **Coach Dashboard = Web**
- Coaches need desktop/laptop for analytics, readiness dashboards, and detailed insights
- Larger screens for data visualization and multiple athlete comparisons
- Web app is perfect for coaches

---

### **Current State: Responsive Web App**

**What we have now:**
- Next.js responsive web app that works on mobile browsers
- Voice chat, mood logging, chat interface all mobile-responsive
- Can be used on phones TODAY via browser

**Limitations:**
- No app store presence (harder to discover)
- No push notifications
- No offline capabilities
- Slightly slower than native apps
- Requires browser app switching

---

### **Mobile App Implementation Strategy**

#### **Option 1: Progressive Web App (PWA) - QUICK WIN** ⭐ **RECOMMENDED FIRST**

**Timeline**: 1-2 weeks
**Effort**: Low
**Tech**: Add PWA manifest + service worker to existing Next.js app

**Benefits:**
- Install to home screen (looks like native app)
- Push notifications (via web push API)
- Offline caching
- Fast load times
- Works on iOS + Android
- No app store submission (deploy immediately)
- Share same codebase as web app

**Limitations:**
- Limited iOS push notification support (iOS 16.4+ only)
- Can't access all native device features
- Not in App Store (discovery harder)

**Implementation:**
```json
// Add to next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // existing config
})
```

```json
// public/manifest.json
{
  "name": "AI Sports Agent",
  "short_name": "Sports Agent",
  "description": "24/7 Mental Performance Coach",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Use Case**: Get athletes using the app on phones immediately (no code rewrite), test engagement, then decide if native app needed.

---

#### **Option 2: React Native (Expo) - NATIVE APP** 🚀

**Timeline**: 4-8 weeks
**Effort**: Medium
**Tech**: React Native with Expo, share UI components with Next.js

**Benefits:**
- App Store + Google Play presence
- Full native features (biometrics, better camera access, native gestures)
- Better performance
- Offline-first architecture
- Superior push notifications

**Limitations:**
- Maintain separate codebase (web + mobile)
- App store review process (can delay releases)
- Need to learn React Native ecosystem
- More complex CI/CD

**Shared Code Strategy:**
```
/packages
  /ui-components    (shared React components)
  /types            (TypeScript types)
  /utils            (helpers)
  /api-client       (API SDK)

/apps
  /web              (Next.js - coaches + responsive web)
  /mobile           (Expo - athletes native app)
```

**When to use**: After PWA proves product-market fit, if you need App Store presence or advanced native features.

---

#### **Option 3: Capacitor - HYBRID APP**

**Timeline**: 2-4 weeks
**Effort**: Low-Medium
**Tech**: Wrap existing Next.js app with Capacitor

**Benefits:**
- Use exact same codebase (Next.js → native app)
- App Store + Google Play
- Access to native plugins (camera, push, biometrics)
- Faster than React Native rewrite

**Limitations:**
- Performance not as good as React Native
- Webview-based (feels less native)
- Bundle size larger than React Native

**Implementation:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "AI Sports Agent" "com.aisportsagent.app"
npx cap add ios
npx cap add android
```

**When to use**: If you want App Store presence quickly without rewriting for React Native.

---

### **Recommended Roadmap**

#### **Phase 1: PWA (Weeks 1-2)** ⭐ **DO THIS FIRST**
- [ ] Add PWA manifest.json
- [ ] Implement service worker for offline caching
- [ ] Add "Add to Home Screen" prompt
- [ ] Test push notifications (Android + iOS 16.4+)
- [ ] Optimize mobile layouts (already responsive, just fine-tune)
- [ ] Add app icons (192px, 512px)

**Outcome**: Athletes can install app to home screen, works offline, push notifications for crisis alerts

---

#### **Phase 2: Test & Validate (Weeks 3-6)**
- [ ] Run pilot with 20-30 athletes using PWA
- [ ] Measure engagement metrics:
  - Daily active users (target: 60%+)
  - Session duration (target: 5+ minutes)
  - Push notification click rate (target: 30%+)
  - Retention (7-day, 30-day)
- [ ] Collect feedback: Is native app needed? What's missing?

**Decision Point**:
- If engagement HIGH (60%+ DAU) → Proceed to Phase 3
- If engagement LOW → Fix core product first, not platform

---

#### **Phase 3A: React Native App (Months 2-3)** - IF NEEDED
- [ ] Set up Expo project
- [ ] Build shared component library
- [ ] Implement authentication (NextAuth → native)
- [ ] Build chat interface (voice + text)
- [ ] Mood logging screen
- [ ] Push notifications setup
- [ ] Submit to App Store + Google Play
- [ ] Beta testing with TestFlight/Google Play Beta

**Outcome**: Native app in App Store, superior UX, better retention

---

#### **Phase 3B: Alternative - Enhance PWA** - IF NATIVE NOT NEEDED
- [ ] Add biometric authentication (WebAuthn)
- [ ] Implement app badging (unread messages)
- [ ] Add file system access (offline journals)
- [ ] Optimize animations (60fps)
- [ ] Add haptic feedback (vibrations for notifications)

**Outcome**: PWA that feels 90% native at 20% of the effort

---

### **Key Decision Factors**

| Factor | Go PWA | Go React Native |
|--------|--------|-----------------|
| **Budget** | Limited | Well-funded |
| **Timeline** | Need app in 2 weeks | Can wait 2-3 months |
| **Team** | 1-2 devs, web background | 3+ devs, or native exp |
| **Features** | Chat, mood, goals | Wearable integrations, advanced sensors |
| **Engagement** | Unknown (testing) | Proven (60%+ DAU) |
| **App Store** | Not critical yet | Important for credibility |
| **Maintenance** | Minimal (one codebase) | High (web + mobile codebases) |

---

### **Coach Experience: Stay Web-Only** 🖥️

**Why coaches don't need mobile app:**
1. Coaches primarily work at desks (reviewing dashboards, analyzing trends)
2. Large screens needed for multi-athlete comparisons
3. Data visualization requires screen real estate
4. Desktop workflows (Excel exports, email reports)
5. Web app already optimized for coaches

**Exception**: Add PWA for coaches too (they can install web app to laptop/desktop for quick access).

---

### **Implementation Priority**

**Week 1-2: Convert to PWA** ✅ High priority
- Minimal effort, immediate mobile app experience
- Test engagement before committing to React Native
- Unblock athletes who need mobile access NOW

**Month 2-3: React Native (conditional)**
- Only if PWA shows 60%+ engagement
- Only if App Store presence is critical
- Only if advanced native features needed

**Alternative: Stay PWA**
- If engagement is high with PWA, no need for React Native
- Modern PWAs (2025) support 90% of native features
- Saves 100+ dev hours maintaining two codebases

---

### **Technical Notes**

**Shared API Design:**
All platforms (web, PWA, React Native) use same REST API:
```
/api/auth/signin
/api/chat/stream
/api/mood-logs
/api/goals
```

**Authentication:**
- Web/PWA: NextAuth.js cookies
- React Native: JWT tokens in secure storage

**Push Notifications:**
- PWA: Web Push API (Firebase Cloud Messaging)
- React Native: Expo Push Notifications

**Offline:**
- PWA: Service Worker + IndexedDB
- React Native: AsyncStorage + SQLite

---

### **Cost Analysis**

| Approach | Dev Time | Ongoing Cost | App Store Fees |
|----------|----------|--------------|----------------|
| **PWA** | 10-15 hours | $0/month | $0 |
| **Capacitor** | 20-30 hours | $0/month | $99/year (Apple) + $25 (Google) |
| **React Native** | 80-120 hours | $0/month | $99/year (Apple) + $25 (Google) |

**PWA wins on speed and cost.**

---

### **Final Recommendation**

**IMMEDIATE (Next 1-2 weeks):**
1. ✅ Convert existing Next.js app to PWA
2. ✅ Add "Install App" prompt for athletes
3. ✅ Test push notifications for mood log reminders
4. ✅ Run 2-week pilot with 20 athletes

**FUTURE (Month 2-3 - conditional):**
- IF PWA engagement is high (60%+ DAU) AND you need App Store credibility → Build React Native app
- IF PWA engagement is high but no need for App Store → Enhance PWA with advanced features
- IF engagement is low → Fix core product (AI quality, conversation flow) before worrying about platform

**Bottom Line**: You're right that mobile is the primary use case. PWA gets you 80% of the way there in 2 weeks. React Native gives you 100% but takes 3 months. Start with PWA, validate demand, then decide.

---

## 🐛 Troubleshooting Guide

### Common Issues

**1. Database Connection Failed**
- Check Supabase dashboard - is project paused?
- Verify DATABASE_URL in `.env` and `.env.local`
- Test with `npx prisma db push`

**2. Prisma Client Out of Sync**
- Run `npm run prisma:generate` after schema changes
- Clear `.next` folder: `rm -rf .next`

**3. NextAuth Session Issues**
- Verify NEXTAUTH_SECRET is set (32+ char random string)
- Check NEXTAUTH_URL matches your dev environment

**4. Build Errors**
- Run `npm run type-check` to find TypeScript errors
- Check for missing dependencies: `npm install`

---

## 📞 Contact & Support

- **Developer**: Arnav Mittal
- **Institution**: University of Washington
- **Project Type**: Research project for collegiate sports psychology

---

*This file is continuously updated to maintain context across development sessions. Always update this file when completing tasks, changing plans, or encountering blockers.*
