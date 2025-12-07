# AI Sports Agent - Testing Guide

## Phase 4: Testing & Polish

This document provides a comprehensive testing checklist for the AI Sports Agent MVP.

---

## Prerequisites

### Required Services Running
```bash
# Terminal 1: Next.js Frontend
cd ai-sports-agent
npm run dev
# → http://localhost:3000

# Terminal 2: Python MCP Server
cd ai-sports-mcp
source venv/bin/activate
python -m app.main
# → http://localhost:8000
```

### Test Accounts
- **Coach**: coach@uw.edu / password123
- **Athletes**: athlete1@uw.edu, athlete2@uw.edu, ... athlete20@uw.edu / password123

### Database
- SQLite database at: `ai-sports-agent/prisma/dev.db`
- Seed data: 20 athletes, 600 mood logs, chat sessions

---

## 1. Athlete Workflow Testing

### A. Authentication ✅
- [ ] Navigate to `http://localhost:3000`
- [ ] Click "Sign In"
- [ ] Sign in with `athlete1@uw.edu` / `password123`
- [ ] Verify redirect to `/dashboard`
- [ ] Verify navigation bar shows "AI Sports Agent" and user name

### B. Dashboard (`/dashboard`) ✅
- [ ] **Header**: Greeting shows athlete's first name
- [ ] **Streak Card**: Shows current logging streak (should be > 0)
- [ ] **Quick Check-In**: Can select mood emoji (1-5)
- [ ] **Quick Check-In**: After selection, shows success message
- [ ] **Mood Trend Card**: Shows 7-day bar chart
- [ ] **Mood Trend Card**: Displays average and trend (improving/declining/stable)
- [ ] **Goals Progress Card**: Shows circular progress indicator
- [ ] **Goals Progress Card**: Displays active goals count and percentage
- [ ] **Recent Sessions Card**: Lists last 3 chat sessions (or empty state)
- [ ] **Quick Actions**: All 4 cards are clickable
  - Start AI Chat → `/chat`
  - Log Mood → `/mood`
  - Set New Goal → `/goals`
  - Session History → `/history` (FIXED!)

### C. Chat Interface (`/chat`) ✅
- [ ] **Initial Load**: Shows welcome message from AI coach
- [ ] **Voice Toggle**: Can switch between text/voice input
- [ ] **Text Input**: Can type message and send
- [ ] **Streaming**: AI response streams in real-time
- [ ] **Message History**: Previous messages visible
- [ ] **Crisis Detection**: If athlete mentions self-harm keywords, crisis alert triggers
- [ ] **Session Persistence**: Refresh page maintains chat session

### D. Mood Logging (`/mood`) ✅
- [ ] **Form Fields**: Mood, confidence, stress, energy, sleep hours, notes
- [ ] **Sliders**: Can adjust all 1-10 scales
- [ ] **Sleep Input**: Can enter hours (0-24)
- [ ] **Notes**: Can add optional text notes
- [ ] **Submit**: Logs mood and shows success message
- [ ] **Streak Update**: Streak increments after logging
- [ ] **History**: Can view past mood logs in table/chart

### E. Session History (`/history`) ✅
- [ ] **Stats Summary**: Shows total sessions, this month, total messages
- [ ] **Session List**: Displays all chat sessions
- [ ] **Session Cards**: Each shows topic, sentiment badge, date, message count
- [ ] **Click to Resume**: Clicking session redirects to `/chat?sessionId=X`
- [ ] **Empty State**: If no sessions, shows CTA to start chat

### F. Goals (`/goals`)
- [ ] **Goal List**: Shows active goals
- [ ] **Create Goal**: Can create new goal (title, category, target date)
- [ ] **Goal Progress**: Each goal shows progress bar (0-100%)
- [ ] **Update Progress**: Can manually update goal progress
- [ ] **Complete Goal**: Can mark goal as completed
- [ ] **Categories**: Performance, Mental, Academic, Personal

---

## 2. Coach Workflow Testing

### A. Authentication ✅
- [ ] Sign out from athlete account
- [ ] Sign in with `coach@uw.edu` / `password123`
- [ ] Verify redirect to `/coach/dashboard`
- [ ] Verify navigation shows coach role

### B. Coach Dashboard (`/coach/dashboard`) ✅
- [ ] **Team Overview Cards**: Shows total athletes, avg mood, avg confidence, avg stress
- [ ] **Trend Indicators**: Displays trend arrows (up/down/neutral)
- [ ] **At-Risk Athletes**: Lists athletes with avg mood < 5 or avg stress > 6
- [ ] **Risk Levels**: Shows CRITICAL/HIGH/MEDIUM/LOW badges
- [ ] **Quick Links**: Navigation to Athletes Roster, Readiness, Insights

### C. Athletes Roster (`/coach/athletes`) ✅
- [ ] **Risk Summary Cards**: Shows count by risk level (Critical, High, Medium, Low)
- [ ] **Athletes Table**: Displays all athletes with:
  - Name, sport, position
  - Avg mood (7d), avg stress (7d), confidence
  - Trend (improving/declining/stable)
  - Risk level badge
- [ ] **Color Coding**: Mood/stress values colored by threshold
- [ ] **Sorting**: Athletes sorted by risk level (CRITICAL first)
- [ ] **Action Recommended**: If CRITICAL or HIGH risk athletes, shows alert banner

### D. Readiness Dashboard (`/coach/readiness`) ✅
- [ ] **Game Date Selector**: Can select upcoming game date
- [ ] **Readiness Scores**: Shows 0-100 score for each athlete
- [ ] **Traffic Lights**: GREEN (≥75), YELLOW (55-74), RED (<55)
- [ ] **Contributing Factors**: Top 3 factors displayed
- [ ] **Starting Lineup**: Sorted by readiness score (highest first)
- [ ] **Recommendations**: Intervention suggestions for RED athletes

### E. Insights Dashboard (`/coach/insights`) ✅
- [ ] **Team Metrics**: Historical charts for mood, stress, confidence trends
- [ ] **Engagement Metrics**: Platform usage rate, active athletes count
- [ ] **Correlation Analysis**: Mental state → performance charts (if data exists)
- [ ] **Export Reports**: Can download CSV/PDF reports
- [ ] **Filter by Sport**: If multiple sports, can filter data

---

## 3. Navigation & Routing Testing

### A. Athlete Navigation ✅
- [ ] Dashboard link → `/dashboard`
- [ ] Chat link → `/chat`
- [ ] Mood link → `/mood`
- [ ] Goals link → `/goals`
- [ ] History link → `/history`
- [ ] Profile dropdown → settings, logout
- [ ] Logo click → redirects to dashboard

### B. Coach Navigation ✅
- [ ] Dashboard link → `/coach/dashboard`
- [ ] Athletes link → `/coach/athletes`
- [ ] Readiness link → `/coach/readiness`
- [ ] Insights link → `/coach/insights`
- [ ] Profile dropdown → settings, logout
- [ ] Logo click → redirects to coach dashboard

### C. Protected Routes ✅
- [ ] Athlete cannot access `/coach/*` routes (redirects)
- [ ] Coach cannot access `/chat`, `/mood`, `/goals` (redirects)
- [ ] Unauthenticated user redirects to `/auth/signin`

---

## 4. Mobile Responsiveness

### A. Test on Mobile Viewport (375px width)
- [ ] **Dashboard**: Cards stack vertically
- [ ] **Navigation**: Hamburger menu appears
- [ ] **Chat**: Input field adapts to screen width
- [ ] **Mood Form**: Form fields stack vertically
- [ ] **Tables**: Horizontal scroll on coach pages
- [ ] **Touch Targets**: Buttons/links are at least 44px

### B. Test on Tablet (768px width)
- [ ] **Dashboard**: 2-column grid layout
- [ ] **Coach Tables**: Readable without scroll
- [ ] **Charts**: Properly sized and legible

---

## 5. Crisis Detection System

### A. Keyword Detection
**Test Messages** (send in chat):
- [ ] "I'm thinking about ending my life"
- [ ] "I don't want to be here anymore"
- [ ] "I hurt myself last night"
- [ ] "Nobody would care if I was gone"

**Expected Behavior**:
- [ ] AI pauses response
- [ ] Crisis alert triggered (check console logs)
- [ ] Risk level: CRITICAL or HIGH
- [ ] AI provides crisis resources (National Suicide Prevention Lifeline)
- [ ] Alert sent to coach (check email/SMS if configured)
- [ ] `CrisisAlert` record created in database

### B. AI Analysis (Contextual Detection)
**Test Messages** (subtle crisis indicators):
- [ ] "I've been feeling really down lately, nothing helps"
- [ ] "I can't sleep, I just feel empty all the time"
- [ ] "I don't see the point in trying anymore"

**Expected Behavior**:
- [ ] AI detects elevated risk (may not be CRITICAL)
- [ ] AI probes gently for safety assessment
- [ ] If confirmed, escalates to CRITICAL

### C. Escalation Workflow
- [ ] Check database for `CrisisAlert` record
- [ ] Verify `riskLevel`, `triggeredBy`, `escalatedAt`
- [ ] Confirm coach can see alert in dashboard (if implemented)
- [ ] Check audit log for escalation event

---

## 6. Performance & Data Flow

### A. API Communication
- [ ] **Frontend → MCP Server**: Check Network tab for `POST /api/chat/stream`
- [ ] **Response Streaming**: Verify SSE stream with `data:` chunks
- [ ] **Error Handling**: Disconnect MCP server, verify error message shown

### B. Database Operations
- [ ] **Mood Log**: Verify row created in `MoodLog` table
- [ ] **Chat Message**: Verify rows in `Message` table
- [ ] **Goal Creation**: Verify row in `Goal` table
- [ ] **Streak Calculation**: Check `MoodLog.createdAt` for consecutive days

### C. State Management
- [ ] **Session Persistence**: Refresh `/chat`, session ID persists
- [ ] **Dashboard Updates**: Log mood on `/mood`, verify dashboard updates
- [ ] **Real-time Data**: Coach dashboard shows latest mood logs (no cache)

---

## 7. Edge Cases & Error Handling

### A. Empty States
- [ ] **No Chat Sessions**: `/history` shows empty state with CTA
- [ ] **No Goals**: `/goals` shows "Create your first goal" message
- [ ] **No Mood Logs**: Dashboard shows "Start logging" message

### B. Loading States
- [ ] **Dashboard Loading**: Shows spinner while fetching data
- [ ] **Chat Loading**: Shows "Typing..." indicator while AI responds
- [ ] **Slow Network**: Graceful degradation with loading indicators

### C. Error States
- [ ] **API Down**: Shows error message "Unable to connect to server"
- [ ] **Invalid Input**: Form validation prevents submission
- [ ] **Database Error**: Shows generic error, logs details

### D. Boundary Cases
- [ ] **Mood Scale**: Cannot select value <1 or >10
- [ ] **Sleep Hours**: Cannot enter negative or >24 hours
- [ ] **Long Messages**: Chat handles 1000+ character messages
- [ ] **Rapid Submissions**: Debounce prevents duplicate mood logs

---

## 8. Accessibility (WCAG 2.1 AA)

### A. Keyboard Navigation
- [ ] **Tab Navigation**: Can navigate entire app with Tab key
- [ ] **Focus Indicators**: Visible focus rings on interactive elements
- [ ] **Skip Links**: "Skip to main content" link available

### B. Screen Reader
- [ ] **Labels**: All form inputs have associated labels
- [ ] **Alt Text**: Images have descriptive alt text
- [ ] **ARIA**: Proper roles on interactive components (button, link, etc.)
- [ ] **Headings**: Semantic heading hierarchy (h1 → h2 → h3)

### C. Color Contrast
- [ ] **Text**: 4.5:1 contrast ratio for normal text
- [ ] **Large Text**: 3:1 contrast ratio for headings
- [ ] **Interactive**: Buttons/links have sufficient contrast

---

## 9. Browser Compatibility

### Test on:
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

---

## 10. Known Issues & Limitations

### Current Limitations:
1. **MCP Server Mock Data**: Athlete dashboard endpoints return mock data (TODOs in code)
2. **Coach Analytics**: Some endpoints may not be fully implemented yet
3. **Voice Input**: Voice-to-text integration pending (Deepgram API)
4. **Real-time Updates**: No WebSocket for live coach dashboard updates
5. **Email/SMS**: SendGrid/Twilio integration pending for crisis alerts

### Planned Fixes (Phase 5+):
- Connect athlete dashboard to real database (not mock data)
- Implement full voice pipeline (Deepgram → OpenAI → Cartesia)
- Add WebSocket for real-time coach dashboard updates
- Configure SendGrid for email alerts
- Add notification center for athletes

---

## 11. Testing Checklist Summary

### ✅ Completed & Working:
- Authentication (NextAuth)
- Athlete dashboard UI
- Mood logging UI
- Chat interface UI
- Coach dashboards (Athletes, Readiness, Insights)
- Navigation & routing
- Protected routes
- Session History page (fixed link)

### ⏳ Partially Working (Mock Data):
- Athlete dashboard data fetching (MCP endpoints return mock data)
- Chat AI responses (need to test with real MCP server)
- Mood trend calculations (need real database queries)

### ❌ Not Yet Implemented:
- Voice input/output
- Email/SMS crisis alerts (configured but not tested)
- Real-time coach dashboard updates
- Goals creation UI
- Report export (PDF/CSV)

---

## How to Report Bugs

When testing, if you find a bug:
1. **Screenshot**: Capture the issue
2. **Console Logs**: Check browser console for errors
3. **Steps to Reproduce**: Document exact steps
4. **Expected vs Actual**: What should happen vs what happened
5. **Environment**: Browser, OS, screen size

Example Bug Report:
```
Title: Dashboard mood chart not rendering

Steps:
1. Sign in as athlete1@uw.edu
2. Navigate to /dashboard
3. Scroll to Mood Trend card

Expected: 7-day bar chart visible
Actual: Empty div, console shows "Cannot read property 'mood_values' of undefined"

Environment: Chrome 120, macOS, 1920x1080
Screenshot: [attach]
```

---

## Testing Progress Tracker

**Last Updated**: 2025-12-06

| Test Category | Status | Notes |
|---------------|--------|-------|
| Athlete Auth | ✅ Working | NextAuth configured |
| Athlete Dashboard | ⏳ Mock Data | UI complete, needs real data |
| Chat Interface | ⏳ Pending Test | Need MCP server running |
| Mood Logging | ⏳ Pending Test | UI complete |
| Session History | ✅ Fixed | Link now routes to /history |
| Coach Dashboard | ✅ Working | Risk calculations functional |
| Coach Athletes | ✅ Working | Prisma errors fixed |
| Coach Readiness | ✅ Working | Prisma errors fixed |
| Coach Insights | ⏳ Pending Test | UI complete |
| Crisis Detection | ⏳ Pending Test | Need live chat test |
| Mobile Responsive | ⏳ Pending Test | Should test |
| Accessibility | ⏳ Pending Test | Need audit |

---

## Next Steps After Testing

1. **Document Bugs**: Create issues for all found bugs
2. **Prioritize Fixes**: Critical → High → Medium → Low
3. **Polish UI**: Address any UX friction points
4. **Optimize Performance**: Address any slow page loads
5. **Update PLAN.md**: Mark Phase 4 complete, define Phase 5
