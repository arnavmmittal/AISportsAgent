# Flow Sports Coach - Complete App Structure Map

**Last Updated**: 2026-01-01

---

## 📱 MOBILE APP (React Native + Expo)

### Authentication Flow
```
Landing/Index
  ├─→ Welcome Screen (onboarding)
  ├─→ Login Screen
  └─→ Signup Flow
       ├─→ Signup (role selection)
       ├─→ Athlete Signup (sport, year, team)
       └─→ Coach Signup (invite code, sport)
```

### 👤 ATHLETE SIDE (Bottom Tab Navigation)

**Tab 1: Dashboard** 📊
- Personal stats overview
- Recent mood trend (last 7 days)
- Active goals count
- Pending assignments count
- Quick actions (Log Mood, Chat with AI)

**Tab 2: Chat** 💬
- AI conversation interface
- Voice input (press & hold to record)
- Text input
- Real-time streaming responses
- Message history
- Crisis detection modal (emergency resources)
- Click-to-call emergency contacts

**Tab 3: Mood** 😊
- Daily mood logging form
  - Mood slider (1-10)
  - Confidence slider (1-10)
  - Stress slider (1-10)
  - Sleep hours input
  - Notes (optional)
- 7-day mood trend chart (LineChart)
- Historical mood logs list
- Average metrics display

**Tab 4: Goals** 🎯
- Goals list (active/completed)
- Create new goal
  - Title, description
  - Category (performance/mental/academic/personal)
  - Timeline (short-term/long-term)
- Update goal progress
- Mark complete
- Delete goal
- AI goal suggestions

**Tab 5: Assignments** 📝
- Pending assignments list
- Completed assignments list
- Due date indicators
- Submit assignment
- Edit submission
- Resubmit with feedback

**Tab 6: Settings** ⚙️
- Profile editing (name, sport, year)
- Consent management (coach data sharing)
- Notification preferences
- Biometric login toggle
- Privacy settings
- Sign out

---

### 👨‍🏫 COACH SIDE (Bottom Tab Navigation)

**Tab 1: Dashboard** 📊
- Team overview stats
  - Total athletes
  - Athletes with consent
  - At-risk count
  - Crisis alerts count
- Team mood metrics (avg mood, confidence, stress)
- Recent alerts
- Invite code display

**Tab 2: Athletes** 👥
- Athlete roster list
- Individual athlete details
  - Personal info
  - Recent mood trends
  - Goals progress
  - Assignment status
  - Chat summaries (if consented)

**Tab 3: Analytics** 📈
- Team performance charts
- Mood trend analysis
- Sport-specific breakdowns
- Custom date ranges
- Export data

**Tab 4: Readiness** 🎯
- Team readiness scores
- Individual athlete readiness
- Performance indicators
- Risk level tracking
- Recommendations

**Tab 5: AI Insights** 🤖
- AI-generated team insights
- Pattern detection
- Recommendations
- Trend analysis
- Predictive analytics

**Tab 6: Assignments** 📝
- Create assignments
- Manage submissions
- Review athlete work
- Track completion rates

**Tab 7: Settings** ⚙️
- Coach profile
- Team settings
- Notification preferences
- Invite code management
- Sign out

---

### 🔔 Push Notifications (100% Complete)
- Token registration on login
- Multi-device support
- Token cleanup on logout
- Crisis alerts
- Assignment notifications
- Goal reminders
- Backend API integration

---

## 🌐 WEB APP (Next.js 15)

### Public Routes
```
/ (Landing Page)
  ├─→ /auth/signin
  └─→ /auth/signup
```

---

### 👤 ATHLETE/STUDENT SIDE

**Navigation**: `/student/*` routes (needs nav bar to be created)

**Available Pages**:
1. **/student/dashboard** 📊
   - Personal overview
   - Recent activity
   - Quick stats

2. **/student/chat** 💬
   - AI conversation interface
   - Text-based chat
   - Message history
   - Crisis detection

3. **/student/mood** 😊
   - Mood logging form
   - Historical trends
   - Charts and visualizations

4. **/student/goals** 🎯
   - Goal management
   - Create/edit/delete
   - Track progress

5. **/student/assignments** 📝
   - View assignments
   - Submit work
   - Track status

6. **/student/settings** ⚙️
   - Profile settings
   - Privacy preferences
   - Consent management

**ALSO EXISTS** (duplicate routes, needs consolidation):
- `/chat` - Duplicate chat interface
- `/dashboard` - Duplicate athlete dashboard
- `/mood` - Duplicate mood tracking
- `/goals` - Duplicate goals management
- `/assignments` - Duplicate assignments
- `/settings` - Duplicate settings

---

### 👨‍🏫 COACH SIDE

**Navigation**: Sidebar (✅ IMPLEMENTED)
- Logo/header: "Coach Portal"
- Active page highlighting
- Mobile hamburger menu
- Sign out button at bottom

**Page Structure**:

**1. /coach/dashboard** 📊
- **Header**:
  - "Coach Dashboard" title
  - Invite code button
  - Time range filter (7/14/30 days)
  - Sport filter
- **Content**:
  - Overview cards (total athletes, consent status, at-risk, crisis alerts)
  - Team mood metrics (avg mood, confidence, stress)
  - Mood trend chart (LineChart)
  - At-risk athletes list
  - Athlete readiness scores
  - Crisis alerts

**2. /coach/athletes** 👥
- Athlete roster/list view
- Filter by sport/status
- Individual athlete cards
  - Name, sport, year
  - Risk level indicator
  - Recent mood stats

**3. /coach/athletes/[id]** 👤
- Individual athlete detail page
- Tabs/sections:
  - Profile info
  - Mood history chart
  - Goals list
  - Assignment status
  - Chat summaries (if consented)
  - Weekly summaries

**4. /coach/insights** 📈
- Team analytics dashboard
- Advanced visualizations
- Pattern detection
- Trend analysis
- Custom reports

**5. /coach/readiness** 🎯
- Team readiness overview
- Individual readiness scores
- Performance metrics
- Risk indicators
- Recommendations

**6. /coach/assignments** 📝
- Assignment list
- Create assignment button
- Submission stats (total, submitted, pending)
- Due date tracking
- Filter by status

**7. /coach/assignments/[id]** 📄
- Individual assignment detail
- Submissions list
- Review interface
- Grading/feedback

**8. /coach/performance** 🏃
- Landing page with 3 options:
  - Record Performance → `/coach/performance/record`
  - Import Data → `/coach/performance/import`
  - Analytics → redirects to `/coach/readiness`

**9. /coach/performance/record** 📝
- Form to log athlete performance
- Game stats
- Practice metrics
- Custom data points

**10. /coach/performance/import** 📤
- CSV upload
- Bulk data import
- Data validation
- Import history

**11. /coach/settings** ⚙️
- Coach profile
- Team configuration
- Notification settings
- Privacy controls

**12. /coach/analytics** 📊
- (Separate analytics page, may overlap with insights)

---

### 🗂️ DUPLICATE/LEGACY ROUTES (Need Cleanup)

**These exist in parallel to coach routes**:
- `/(coach)/analytics` - Grouped route
- `/(coach)/command-center` - Unknown purpose
- `/(coach)/insights` - Grouped route
- `/(coach)/readiness` - Grouped route
- `/(coach)/roster` - Grouped route (duplicate of /coach/athletes?)

**Recommendation**: Consolidate to single `/coach/*` structure

---

## 🎨 CURRENT DESIGN ISSUES

### Web App - Athlete Side
❌ **No navigation bar** - Pages exist but no way to navigate between them
❌ **Duplicate routes** - `/student/*` and root-level routes (`/chat`, `/dashboard`, etc.)
❌ **Inconsistent routing** - Need to consolidate to one pattern

### Web App - Coach Side
✅ **Has sidebar navigation** (just added)
❌ **Duplicate grouped routes** - `/(coach)/*` vs `/coach/*`
❌ **Some pages may overlap** (analytics vs insights)

### Mobile App
✅ **Clean tab-based navigation** for both athletes and coaches
✅ **Consistent routing structure**
✅ **100% feature complete**

---

## 🔄 NAVIGATION FLOWS

### Web - Athlete Flow (CURRENT - BROKEN)
```
Login → /student/dashboard (redirected by middleware)
         ↓
    NO NAVIGATION - trapped on page
    (Can manually type URLs to access other pages)
```

### Web - Athlete Flow (SHOULD BE)
```
Login → /student/dashboard
         ↓
    [Top Nav or Sidebar]
    ├─→ Dashboard
    ├─→ Chat
    ├─→ Mood
    ├─→ Goals
    ├─→ Assignments
    ├─→ Settings
    └─→ Sign Out
```

### Web - Coach Flow (CURRENT - WORKING)
```
Login → /coach/dashboard
         ↓
    [Sidebar Nav] ✅
    ├─→ Dashboard
    ├─→ Athletes (with individual detail pages)
    ├─→ Insights
    ├─→ Readiness
    ├─→ Assignments (with individual assignment pages)
    ├─→ Performance (with sub-pages)
    ├─→ Settings
    └─→ Sign Out
```

### Mobile - Athlete Flow (PERFECT ✅)
```
Login → Dashboard Tab
         ↓
    [Bottom Tabs]
    ├─→ Dashboard
    ├─→ Chat (with voice)
    ├─→ Mood (with charts)
    ├─→ Goals
    ├─→ Assignments
    └─→ Settings
```

### Mobile - Coach Flow (PERFECT ✅)
```
Login → Dashboard Tab
         ↓
    [Bottom Tabs]
    ├─→ Dashboard
    ├─→ Athletes (with detail modals)
    ├─→ Analytics
    ├─→ Readiness
    ├─→ AI Insights
    ├─→ Assignments
    └─→ Settings
```

---

## 📋 FEATURES BY PAGE

### Common Features Across Platforms

**Chat/AI Conversation**:
- Real-time streaming responses
- Message history
- Crisis detection (keywords: suicide, self-harm, abuse)
- Crisis resources modal
- Voice input (mobile only)
- Text input (web & mobile)

**Mood Tracking**:
- Form: mood, confidence, stress, sleep, notes
- 7-day trend chart (LineChart)
- Historical logs
- Average calculations

**Goals Management**:
- CRUD operations (Create, Read, Update, Delete)
- Categories: performance, mental, academic, personal
- Timeline: short-term, long-term
- Progress tracking (0-100%)
- AI suggestions (mobile)

**Assignments**:
- View assignments
- Due date tracking
- Submit work
- Edit submissions
- Status indicators (pending, submitted, reviewed)
- Overdue warnings

**Coach Dashboard**:
- Team overview stats
- At-risk athlete identification
- Crisis alert monitoring
- Mood trend analysis
- Consent management
- Invite code system

---

## 🚀 WHAT'S WORKING VS BROKEN

### ✅ FULLY FUNCTIONAL
- Mobile app (100% complete, both athlete & coach)
- Web coach portal (with new sidebar navigation)
- Authentication system (Supabase Auth)
- Database (Prisma + PostgreSQL)
- API endpoints (Next.js API routes)
- AI chat (OpenAI GPT-4)
- Push notifications (mobile)

### ❌ NEEDS FIXING
- Web athlete/student navigation (no nav bar)
- Duplicate route consolidation (`/student/*` vs root-level)
- Grouped route cleanup (`/(coach)/*` vs `/coach/*`)
- Some pages may have missing API connections
- Performance tracking pages incomplete
- Analytics vs Insights consolidation

---

## 📊 ARCHITECTURE SUMMARY

```
User Login
    ├─→ Role: ATHLETE
    │    ├─→ Mobile: Tab navigation (6 tabs) ✅
    │    └─→ Web: /student/* (NO NAV) ❌
    │
    └─→ Role: COACH
         ├─→ Mobile: Tab navigation (7 tabs) ✅
         └─→ Web: /coach/* with sidebar ✅
```

**Backend**: Shared Next.js API routes
**Database**: Single PostgreSQL database (Supabase)
**Auth**: Supabase Auth (web session, mobile JWT)
**AI**: OpenAI GPT-4 for chat
**Notifications**: Expo push notifications (mobile only)

---

## 🎯 RECOMMENDED NEXT STEPS

1. **Create student/athlete navigation layout** (similar to coach sidebar)
2. **Consolidate duplicate routes** - decide on `/student/*` or root-level
3. **Remove grouped routes** - stick with `/coach/*` pattern
4. **Add athlete nav component** - top bar or sidebar
5. **Audit all pages** - ensure API endpoints work
6. **Test complete flows** - end-to-end user journeys
7. **Design consistency pass** - align web with mobile design
8. **Performance optimization** - fix any database connection issues

---

This map reflects the CURRENT state as of your latest session.
