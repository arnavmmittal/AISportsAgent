# 🎯 Complete Flow Sports Coach Frontend - Lovable Prompt

Build a complete mental performance coaching web application frontend with athlete and coach dashboards. This is a FULL multi-page React application with routing, authentication UI, and role-based dashboards.

---

## PROJECT OVERVIEW

Create a modern web app for collegiate athletes and sports psychology coaches. Athletes track mood, set goals, chat with an AI coach, and complete assignments. Coaches monitor team mental health, view analytics, and receive crisis alerts.

**Tech Stack:**
- React with React Router for navigation
- Tailwind CSS for styling
- Recharts or Chart.js for data visualization
- Lucide React or Heroicons for icons
- Mock data only (NO backend integration)

---

## DESIGN SYSTEM

### Color Palette
```css
/* Primary */
--purple-primary: #8b5cf6
--purple-secondary: #d946ef
--pink-accent: #ec4899
--blue-primary: #3b82f6
--blue-secondary: #60a5fa

/* Backgrounds */
--bg-primary: #0f172a
--bg-secondary: #1e293b
--bg-tertiary: #334155

/* Text */
--text-primary: #ffffff
--text-secondary: rgba(255, 255, 255, 0.7)
--text-muted: rgba(255, 255, 255, 0.5)

/* Status Colors */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

### Typography
- **Font Family**: Inter, DM Sans, or SF Pro
- **Headings**: Bold (700-900 weight)
- **Body**: Regular (400-500 weight)
- **Size Scale**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Visual Style
- **Dark mode only** (navy/slate backgrounds)
- **Glass morphism**: Subtle blur, transparency, borders
- **Gradients**: Purple-to-pink for CTAs, subtle backgrounds
- **Rounded corners**: 12-16px for cards, 8px for buttons
- **Shadows**: Soft, colorful glows on hover
- **Animations**: Smooth transitions (200-300ms)

---

## APPLICATION STRUCTURE

### Page Routing
```
/                          → Landing Page (public)
/auth/signin              → Sign In Page
/auth/signup              → Sign Up Page
/dashboard                → Athlete Dashboard (protected)
/chat                     → Athlete Chat Interface (protected)
/mood                     → Athlete Mood Tracker (protected)
/goals                    → Athlete Goals Manager (protected)
/assignments              → Athlete Assignments (protected)
/settings                 → Athlete Settings (protected)
/coach/dashboard          → Coach Dashboard (protected)
/coach/athletes           → Coach Athletes List (protected)
/coach/analytics          → Coach Analytics (protected)
/coach/notifications      → Coach Notifications (protected)
/coach/settings           → Coach Settings (protected)
```

### Navigation Structure

**Athlete Navigation** (Left sidebar or bottom tabs on mobile):
- 🏠 Dashboard
- 💬 Chat
- 😊 Mood
- 🎯 Goals
- 📝 Assignments
- ⚙️ Settings

**Coach Navigation**:
- 📊 Dashboard
- 👥 Athletes
- 📈 Analytics
- 🔔 Notifications
- ⚙️ Settings

---

## PAGES TO BUILD

---

## 1. LANDING PAGE (`/`)

### Hero Section
- **Large heading**: "Elevate Your Mental Game"
- **Subheading**: "AI-powered mental performance coaching for collegiate athletes. Available 24/7."
- **CTA Buttons**:
  - Primary: "Get Started" (purple gradient) → /auth/signup
  - Secondary: "Sign In" (outline) → /auth/signin
- **Hero image/graphic**: Abstract illustration of athlete with brain/mindfulness theme

### Features Section (3 columns)
1. **24/7 AI Coach**
   - Icon: Chat bubble with sparkles
   - Description: "Get instant support with evidence-based sports psychology techniques"

2. **Track Your Progress**
   - Icon: Chart trending up
   - Description: "Monitor mood, goals, and mental performance metrics"

3. **Crisis Support**
   - Icon: Shield with heart
   - Description: "Immediate escalation and resources when you need them most"

### How It Works (3 steps)
1. **Chat Naturally** → Speak or type your concerns
2. **Get Personalized Guidance** → AI applies CBT, mindfulness, flow state techniques
3. **Track & Improve** → See your progress over time

### Social Proof
- "Trusted by 150+ student athletes"
- University logos (use placeholders)

### Footer
- Links: About, Privacy Policy, Terms of Service
- Contact: support@flowsportscoach.com
- © 2025 Flow Sports Coach

---

## 2. SIGN IN PAGE (`/auth/signin`)

### Layout
- Centered card on gradient background
- Logo at top
- Form in the middle
- "Don't have an account?" link to signup

### Form Fields
- **Email** (input, type=email)
- **Password** (input, type=password with show/hide toggle)
- **Remember me** (checkbox)
- **Forgot password?** (link)
- **Sign In** button (purple gradient, full width)

### Alternative Sign In
- Divider: "OR"
- **Sign in with Google** button (white outline with Google logo)

### Demo Accounts
- Link: "Try Demo Account" → Populates form with:
  - Athlete: athlete@demo.com / demo123
  - Coach: coach@demo.com / demo123

---

## 3. SIGN UP PAGE (`/auth/signup`)

### Layout
- Same centered card style as sign in
- Multi-step form OR single form (your choice)

### Form Fields
- **Full Name** (input)
- **Email** (input, type=email)
- **Password** (input, type=password, show strength indicator)
- **Confirm Password** (input)
- **Role** (radio buttons):
  - 🏃 Athlete
  - 📋 Coach
- **Sport** (dropdown, only if Athlete selected):
  - Basketball, Football, Soccer, Baseball, Softball, Track & Field, Swimming, Volleyball, Tennis, Golf, Other
- **University** (input, optional)
- **Terms & Conditions** (checkbox with link)
- **Create Account** button (purple gradient)

### Validation
- Email format validation
- Password minimum 8 characters
- Passwords must match
- All required fields filled

### Alternative Sign Up
- Divider: "OR"
- **Sign up with Google** button

---

## 4. ATHLETE DASHBOARD (`/dashboard`)

### Top Header
- **Left**: Logo, "AI Coach" title
- **Center**: Welcome message - "Welcome back, [Name]!"
- **Right**: Avatar dropdown (Settings, Logout)

### Quick Stats Row (4 cards)
1. **Current Mood**
   - Emoji based on score (😊 for 7+, 😐 for 4-6, 😟 for <4)
   - Large number: "7/10"
   - Label: "Current Mood"

2. **Active Goals**
   - Number: "3/5"
   - Label: "Goals Completed"
   - Progress ring

3. **Streak**
   - Number: "12 days"
   - Label: "Check-in Streak"
   - Fire emoji 🔥

4. **Sessions**
   - Number: "24"
   - Label: "Chat Sessions"

### Main Content Grid (2 columns on desktop, stacked on mobile)

#### Left Column

**Mood Trend Chart** (large card)
- Title: "7-Day Mood Trend"
- Line chart with gradient fill
- X-axis: Last 7 days (dates)
- Y-axis: Mood score (0-10)
- Purple line with dots
- Hover tooltips showing exact values

**Quick Actions** (card)
- "Start New Chat" button (purple gradient)
- "Log Mood" button (blue)
- "Add Goal" button (outline)

#### Right Column

**Active Goals** (card)
- Title: "Active Goals"
- List of 3-5 goals:
  - Goal title
  - Category badge (Performance, Mental, Academic, Personal)
  - Progress bar (0-100%)
  - Due date
- "View All →" link at bottom

**Upcoming Assignments** (card)
- Title: "Upcoming Assignments"
- List of 2-3 assignments:
  - Assignment title
  - Coach name with small avatar
  - Due date
  - Status badge (Not Started, In Progress, Completed)
- "View All →" link

**Recent Activity** (card, optional)
- Timeline of recent actions:
  - "Completed mood check-in" - 2h ago
  - "Chat session with AI Coach" - 1d ago
  - "Completed 'Visualization Exercise'" - 2d ago

### Floating Action Button
- Bottom-right corner
- Purple gradient circle
- Chat icon
- Opens /chat on click

---

## 5. ATHLETE CHAT PAGE (`/chat`)

### Layout
- Full-height page
- Chat interface similar to ChatGPT/Claude

### Header
- Left: Back arrow (to /dashboard)
- Center: "AI Coach" with online status indicator
- Right: New chat button (+ icon)

### Chat Area
- Messages display (scrollable):
  - **User messages**: Right-aligned, blue bubble
  - **AI messages**: Left-aligned, dark bubble with AI avatar
  - Timestamps (subtle, below messages)
- Empty state (on new chat):
  - Large chat icon
  - "Ready to talk? 💬"
  - "I'm your AI mental performance coach. Share what's on your mind."
  - **Suggested prompts** (4 cards):
    - "🎯 Pre-game anxiety tips"
    - "💪 Build confidence"
    - "🧘 Stress management"
    - "⚡ Get in the zone"

### Input Area (bottom, sticky)
- Text input (multiline, expands up to 4 lines)
- Placeholder: "Message AI Coach..."
- Left: Voice button (🎤 mic icon)
- Right: Send button (arrow icon, purple gradient when active)
- Character count if >1500 chars

### Features
- Typing indicator when AI is responding
- Smooth scroll to bottom on new message
- Loading animation while waiting for response

---

## 6. ATHLETE MOOD PAGE (`/mood`)

### Header
- Title: "Mood Tracker"
- Subtitle: "Track your daily mental state"

### Today's Mood Check-in (large card)
- Question: "How are you feeling today?"
- **Mood slider** (1-10):
  - Visual: Emoji changes as you slide
  - Labels: "Struggling" (1) to "Excellent" (10)
- **Additional questions** (optional checkboxes):
  - "Feeling anxious?"
  - "Feeling stressed?"
  - "Feeling confident?"
  - "Slept well?"
- **Notes** (textarea): "What's on your mind? (optional)"
- **Submit** button (purple gradient)

### Mood History
- **Calendar view** (monthly):
  - Each day shows emoji based on mood
  - Color-coded (red=low, yellow=medium, green=high)
  - Click day to see details
- **List view toggle**:
  - Shows entries chronologically
  - Date, mood score, notes preview

### Insights Card
- Title: "Mood Insights"
- Average mood this week: 7.2/10
- Best day: Wednesday (9/10)
- Most common mood: 7/10
- Streak: 12 days of check-ins

### Charts
- **Weekly trend** (bar chart)
- **Monthly overview** (line chart)

---

## 7. ATHLETE GOALS PAGE (`/goals`)

### Header
- Title: "Goals"
- "New Goal" button (top-right, purple gradient)

### Goal Categories (tabs)
- All
- Performance
- Mental
- Academic
- Personal

### Goals Display (card grid, 2-3 columns)

Each goal card shows:
- **Title**: "Improve free throw percentage to 85%"
- **Category badge**: "Performance" (colored)
- **Progress bar**: 65% complete
- **Target date**: "Due: Dec 31, 2025"
- **Status**: "In Progress" badge
- **Actions**: Edit, Delete icons (hover only)

### Goal Details Modal (opens on click)
- Full goal description
- Progress bar
- Milestones/steps (checklist):
  - "Practice 100 free throws daily" ✓
  - "Film and review form weekly"
  - "Maintain 80%+ for 2 weeks"
- Notes section
- "Update Progress" button
- "Mark Complete" button

### New Goal Modal
- **Title** (input)
- **Category** (dropdown): Performance, Mental, Academic, Personal
- **Description** (textarea)
- **Target date** (date picker)
- **Milestones** (add/remove list)
- "Create Goal" button

---

## 8. ATHLETE ASSIGNMENTS PAGE (`/assignments`)

### Header
- Title: "Assignments"
- Filter: All, Not Started, In Progress, Completed

### Assignments List (table or card view)

Columns/fields:
- **Assignment title**: "Pre-game Visualization Exercise"
- **Coach**: Coach Martinez (with avatar)
- **Assigned date**: "Dec 15, 2025"
- **Due date**: "Dec 20, 2025"
- **Status**: Badge (Not Started, In Progress, Completed)
- **Actions**: View details button

### Assignment Details Modal
- Assignment title
- Coach name and avatar
- Full description/instructions
- Due date (with countdown if upcoming)
- Attachments (if any)
- **Submission area**:
  - Text response (textarea)
  - File upload
  - "Submit" button
- Status history (when assigned, when started, when completed)

### Empty State
- "No assignments yet"
- "Your coach will assign exercises and reflections here"

---

## 9. ATHLETE SETTINGS PAGE (`/settings`)

### Section Tabs (left sidebar or top tabs)
- Profile
- Notifications
- Privacy
- Account

### Profile Section
- **Avatar upload** (circular, with upload button on hover)
- **Full name** (input)
- **Email** (input, disabled/read-only)
- **Sport** (dropdown)
- **University** (input)
- **Year** (dropdown): Freshman, Sophomore, Junior, Senior
- **Bio** (textarea)
- "Save Changes" button

### Notifications Section
- **Email notifications** (toggle switches):
  - Daily mood reminders
  - Goal progress updates
  - Assignment notifications
  - Weekly insights
- **Push notifications** (toggle):
  - Chat messages
  - Crisis alerts
  - Coach messages

### Privacy Section
- **Data sharing** (toggle):
  - Share mood data with coach
  - Share chat summaries with coach
  - Share goal progress with coach
- **Crisis monitoring** (always on, explanation):
  - "AI monitors conversations for signs of distress"
  - "Coaches receive alerts for high-risk situations"
  - "This cannot be disabled for safety"

### Account Section
- **Change password**:
  - Current password
  - New password
  - Confirm new password
  - "Update Password" button
- **Delete account**:
  - Warning message
  - "Delete My Account" button (red, requires confirmation)

---

## 10. COACH DASHBOARD (`/coach/dashboard`)

### Top Stats Row (4 cards)
1. **Total Athletes**
   - Number: "48"
   - Trend: "+5 this month"

2. **Active Athletes**
   - Number: "42"
   - "Chatted in last 7 days"

3. **Crisis Alerts**
   - Number: "2"
   - Red badge if >0
   - "Needs attention"

4. **Avg Team Mood**
   - Number: "7.2/10"
   - Trend indicator (up/down)

### Main Content Grid

#### Left Column (2/3 width)

**Team Mood Trend** (large card)
- Title: "Team Mood Trend (Last 30 Days)"
- Line chart showing:
  - Average team mood over time
  - Individual athletes (toggle on/off)
- Filter by sport/team

**At-Risk Athletes** (card)
- Title: "Athletes Needing Attention"
- List of 3-5 athletes:
  - Name, avatar
  - Sport
  - Reason: "Mood trending down" or "Crisis alert: mentioned stress"
  - Last check-in: "2 days ago"
  - "View Profile" button
- Red/yellow indicators for severity

#### Right Column (1/3 width)

**Recent Crisis Alerts** (card)
- Title: "Crisis Alerts"
- Timeline of alerts:
  - Athlete name
  - Alert type: "Self-harm mention" or "High distress"
  - Timestamp
  - Status: "Reviewed" or "Pending"
  - "View Details" button

**Engagement Stats** (card)
- Title: "Team Engagement"
- Pie chart or stats:
  - X% active daily
  - Y% completed mood check-in
  - Z% chatted this week

**Quick Actions** (card)
- "Message All Athletes" button
- "Create Assignment" button
- "View Full Analytics" button

---

## 11. COACH ATHLETES PAGE (`/coach/athletes`)

### Header
- Title: "Athletes"
- Search bar (filter by name)
- Filter dropdown: All Sports, Basketball, Football, etc.
- Sort dropdown: Name, Sport, Last Active, Mood

### Athletes Grid (card view) OR Table View (toggle)

**Card View**: 3-4 columns
Each athlete card:
- Avatar (large, circular)
- Name: "Jordan Smith"
- Sport: "Basketball"
- Year: "Junior"
- Last mood: 7/10 with emoji
- Last active: "2h ago"
- Quick stats:
  - Goals: 3/5 complete
  - Streak: 12 days
- "View Profile" button

**Table View**:
Columns: Avatar, Name, Sport, Year, Last Mood, Last Active, Goals, Streak, Actions

### Athlete Profile Modal (opens on click)
- **Header**: Avatar, name, sport, year
- **Tabs**:
  - Overview
  - Mood History
  - Goals
  - Chat Summary
  - Assignments

**Overview Tab**:
- Key stats (mood avg, goals, sessions)
- Recent activity timeline
- Notes section (coach's private notes)

**Mood History Tab**:
- Chart of athlete's mood over time
- Calendar view
- Export data button

**Goals Tab**:
- List of athlete's goals
- Progress for each

**Chat Summary Tab**:
- AI-generated summaries of conversations
- Topics discussed
- Techniques used (CBT, mindfulness)
- "View Full Transcripts" (requires athlete consent)

**Assignments Tab**:
- Assigned exercises
- Completion status
- Submitted responses

---

## 12. COACH ANALYTICS PAGE (`/coach/analytics`)

### Time Range Selector (top)
- Buttons: Last 7 Days, Last 30 Days, Last 90 Days, All Time

### Analytics Grid (4-6 cards)

**1. Team Mood Distribution** (pie chart)
- Excellent (8-10): X%
- Good (6-7): Y%
- Struggling (<6): Z%

**2. Engagement Trends** (line chart)
- Daily active users
- Chat sessions
- Mood check-ins

**3. Goal Completion Rates** (bar chart)
- By category (Performance, Mental, Academic, Personal)

**4. Most Common Topics** (word cloud or list)
- Anxiety: 45 mentions
- Confidence: 38 mentions
- Stress: 32 mentions
- Performance: 28 mentions

**5. Crisis Alert History** (timeline)
- Alerts per week/month
- Types of alerts

**6. Top Athletes** (leaderboard)
- Most engaged (by sessions)
- Best progress (mood improvement)
- Longest streaks

### Export Section
- "Export Report" button (PDF or CSV)
- Date range selector

---

## 13. COACH NOTIFICATIONS PAGE (`/coach/notifications`)

### Header
- Title: "Notifications"
- "Mark All as Read" button

### Notification List (feed)

Each notification shows:
- **Icon** (based on type):
  - 🚨 Crisis alert (red)
  - 📊 Weekly report (blue)
  - 💬 Athlete message (purple)
  - 🎯 Goal achieved (green)
- **Title**: "Crisis Alert: Jordan Smith"
- **Description**: "Mentioned feeling overwhelmed and unable to sleep"
- **Timestamp**: "2 hours ago"
- **Actions**: "View Details", "Dismiss"

### Notification Types
1. **Crisis Alerts**: Red, high priority
2. **Weekly Reports**: "Your weekly team report is ready"
3. **Athlete Milestones**: "Jordan completed their goal!"
4. **Low Engagement**: "5 athletes haven't checked in this week"
5. **System Updates**: "New feature available"

### Filters (tabs)
- All
- Unread
- Crisis Alerts
- Reports
- Milestones

---

## 14. COACH SETTINGS PAGE (`/coach/settings`)

### Section Tabs
- Profile
- Team Management
- Notifications
- Preferences
- Account

### Profile Section
- Avatar upload
- Name, email
- Title (e.g., "Sports Psychologist")
- University/Organization
- Bio
- "Save Changes" button

### Team Management Section
- **Athletes under your care**: List with add/remove
- **Invite Athletes**:
  - Email input
  - "Send Invite" button
- **Team Sports**: Select which sports you coach

### Notifications Section
- **Email alerts** (toggles):
  - Immediate crisis alerts
  - Daily engagement summary
  - Weekly team report
  - Low engagement warnings
- **Alert threshold settings**:
  - Mood drops below: X (slider 1-10)
  - Days inactive: X (slider 1-14)

### Preferences Section
- **Default view**: Dashboard, Athletes, Analytics
- **Data retention**: How long to keep chat histories
- **Report frequency**: Daily, Weekly, Monthly

### Account Section
- Change password
- Logout
- Delete account (with warning)

---

## MOCK DATA STRUCTURE

Use this realistic mock data:

```javascript
// Athlete User
const athleteUser = {
  id: "athlete-1",
  name: "Jordan Smith",
  email: "jordan.smith@university.edu",
  role: "ATHLETE",
  sport: "Basketball",
  university: "State University",
  year: "Junior",
  avatarUrl: "https://i.pravatar.cc/150?img=1",
  createdAt: "2025-09-01"
};

// Coach User
const coachUser = {
  id: "coach-1",
  name: "Dr. Sarah Martinez",
  email: "s.martinez@university.edu",
  role: "COACH",
  title: "Sports Psychologist",
  university: "State University",
  avatarUrl: "https://i.pravatar.cc/150?img=5",
  createdAt: "2024-01-15"
};

// Athlete Stats
const athleteStats = {
  currentMood: 7,
  moodAverage7Day: 7.2,
  moodAverage30Day: 6.8,
  goalsCompleted: 3,
  goalsActive: 5,
  checkInStreak: 12,
  totalSessions: 24,
  lastCheckIn: "2025-12-17T08:30:00Z"
};

// Mood History (7 days)
const moodHistory = [
  { date: "2025-12-11", mood: 6, notes: "Pre-game jitters" },
  { date: "2025-12-12", mood: 7, notes: "Felt good after practice" },
  { date: "2025-12-13", mood: 8, notes: "Great game!" },
  { date: "2025-12-14", mood: 7, notes: "" },
  { date: "2025-12-15", mood: 6, notes: "Stressed about finals" },
  { date: "2025-12-16", mood: 8, notes: "Aced my exam" },
  { date: "2025-12-17", mood: 7, notes: "" }
];

// Active Goals
const goals = [
  {
    id: "goal-1",
    title: "Improve free throw percentage to 85%",
    description: "Currently at 72%, need to get to 85% by end of season",
    category: "Performance",
    progress: 65,
    targetDate: "2025-12-31",
    status: "In Progress",
    milestones: [
      { text: "Practice 100 free throws daily", completed: true },
      { text: "Film and review form weekly", completed: true },
      { text: "Maintain 80%+ for 2 weeks", completed: false }
    ]
  },
  {
    id: "goal-2",
    title: "Practice mindfulness 10 mins daily",
    description: "Build a consistent meditation practice",
    category: "Mental",
    progress: 40,
    targetDate: "2026-01-15",
    status: "In Progress",
    milestones: [
      { text: "Download meditation app", completed: true },
      { text: "Meditate 3x per week", completed: false },
      { text: "Increase to daily practice", completed: false }
    ]
  },
  {
    id: "goal-3",
    title: "Maintain 3.5 GPA this semester",
    description: "Stay on top of academics while managing sports",
    category: "Academic",
    progress: 80,
    targetDate: "2026-05-30",
    status: "In Progress",
    milestones: [
      { text: "Attend all classes", completed: true },
      { text: "Complete assignments on time", completed: true },
      { text: "Study 10 hours per week", completed: true }
    ]
  },
  {
    id: "goal-4",
    title: "Strengthen team relationships",
    description: "Build better communication with teammates",
    category: "Personal",
    progress: 50,
    targetDate: "2026-02-28",
    status: "In Progress",
    milestones: [
      { text: "Organize team dinner", completed: true },
      { text: "Have 1-on-1 conversations", completed: false },
      { text: "Practice active listening", completed: false }
    ]
  },
  {
    id: "goal-5",
    title: "Develop pre-game routine",
    description: "Create consistent mental preparation ritual",
    category: "Performance",
    progress: 30,
    targetDate: "2026-01-10",
    status: "In Progress",
    milestones: [
      { text: "Research effective routines", completed: true },
      { text: "Test 3 different routines", completed: false },
      { text: "Stick with chosen routine for 5 games", completed: false }
    ]
  }
];

// Assignments
const assignments = [
  {
    id: "assign-1",
    title: "Pre-game Visualization Exercise",
    description: "Spend 10 minutes visualizing your best performance. Imagine every detail - the sounds, sights, feelings. Write a reflection.",
    coachName: "Dr. Sarah Martinez",
    coachAvatar: "https://i.pravatar.cc/150?img=5",
    assignedDate: "2025-12-15",
    dueDate: "2025-12-20",
    status: "Not Started",
    instructions: "1. Find a quiet space\n2. Close your eyes\n3. Visualize your ideal game\n4. Write what you experienced"
  },
  {
    id: "assign-2",
    title: "Weekly Reflection Journal",
    description: "Reflect on your week - what went well, what challenges did you face, what did you learn?",
    coachName: "Dr. Sarah Martinez",
    coachAvatar: "https://i.pravatar.cc/150?img=5",
    assignedDate: "2025-12-11",
    dueDate: "2025-12-18",
    status: "In Progress",
    submission: "This week was tough with finals..."
  },
  {
    id: "assign-3",
    title: "Gratitude Practice",
    description: "List 3 things you're grateful for each day this week",
    coachName: "Dr. Sarah Martinez",
    coachAvatar: "https://i.pravatar.cc/150?img=5",
    assignedDate: "2025-12-08",
    dueDate: "2025-12-15",
    status: "Completed",
    submission: "1. My supportive teammates\n2. Great coaching\n3. My health"
  }
];

// Chat Messages
const chatMessages = [
  {
    id: "msg-1",
    role: "assistant",
    content: "Hi Jordan! I'm your AI mental performance coach. How are you feeling today?",
    timestamp: "2025-12-17T09:00:00Z"
  },
  {
    id: "msg-2",
    role: "user",
    content: "I'm feeling anxious about the big game tomorrow. I keep missing my layups in practice.",
    timestamp: "2025-12-17T09:01:00Z"
  },
  {
    id: "msg-3",
    role: "assistant",
    content: "I hear you - pre-game anxiety is really common, especially when you're noticing your performance isn't where you want it to be. Let's work through this together. First, tell me: when you miss those layups, what thoughts go through your mind?",
    timestamp: "2025-12-17T09:01:30Z"
  }
];

// Coach Dashboard Data
const coachDashboardData = {
  totalAthletes: 48,
  activeAthletes: 42, // Active in last 7 days
  crisisAlerts: 2,
  avgTeamMood: 7.2,
  trends: {
    athletesChange: "+5 this month",
    moodChange: "+0.3 from last week"
  }
};

// Athletes List (for coach)
const athletesList = [
  {
    id: "athlete-1",
    name: "Jordan Smith",
    sport: "Basketball",
    year: "Junior",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    lastMood: 7,
    lastActive: "2025-12-17T08:30:00Z",
    goalsCompleted: 3,
    goalsTotal: 5,
    streak: 12,
    riskLevel: "low"
  },
  {
    id: "athlete-2",
    name: "Emma Johnson",
    sport: "Soccer",
    year: "Sophomore",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    lastMood: 4,
    lastActive: "2025-12-16T14:00:00Z",
    goalsCompleted: 1,
    goalsTotal: 4,
    streak: 5,
    riskLevel: "medium" // Mood trending down
  },
  {
    id: "athlete-3",
    name: "Marcus Williams",
    sport: "Football",
    year: "Senior",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    lastMood: 8,
    lastActive: "2025-12-17T07:00:00Z",
    goalsCompleted: 5,
    goalsTotal: 6,
    streak: 28,
    riskLevel: "low"
  },
  {
    id: "athlete-4",
    name: "Sophia Chen",
    sport: "Volleyball",
    year: "Freshman",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    lastMood: 3,
    lastActive: "2025-12-15T10:00:00Z",
    goalsCompleted: 0,
    goalsTotal: 3,
    streak: 0,
    riskLevel: "high" // Crisis alert triggered
  }
];

// Crisis Alerts
const crisisAlerts = [
  {
    id: "crisis-1",
    athleteId: "athlete-4",
    athleteName: "Sophia Chen",
    athleteAvatar: "https://i.pravatar.cc/150?img=4",
    severity: "HIGH",
    type: "Distress",
    message: "Athlete mentioned feeling overwhelmed, unable to sleep, and thoughts of quitting",
    timestamp: "2025-12-17T06:30:00Z",
    status: "Pending",
    transcript: "I just can't handle this anymore. The pressure is too much, I can't sleep, and I don't know if I should even be here..."
  },
  {
    id: "crisis-2",
    athleteId: "athlete-2",
    athleteName: "Emma Johnson",
    athleteAvatar: "https://i.pravatar.cc/150?img=2",
    severity: "MEDIUM",
    type: "Mood Decline",
    message: "Mood has dropped from 8 to 4 over the past week",
    timestamp: "2025-12-16T14:00:00Z",
    status: "Reviewed",
    notes: "Coach contacted athlete - exam stress, will monitor"
  }
];

// Notifications
const notifications = [
  {
    id: "notif-1",
    type: "crisis",
    title: "Crisis Alert: Sophia Chen",
    description: "Mentioned feeling overwhelmed and unable to sleep",
    timestamp: "2025-12-17T06:30:00Z",
    read: false,
    severity: "high"
  },
  {
    id: "notif-2",
    type: "report",
    title: "Weekly Team Report Available",
    description: "Your weekly team insights are ready to view",
    timestamp: "2025-12-16T09:00:00Z",
    read: false,
    severity: "low"
  },
  {
    id: "notif-3",
    type: "milestone",
    title: "Marcus Williams achieved a goal!",
    description: "Completed 'Maintain 3.5 GPA this semester'",
    timestamp: "2025-12-15T16:00:00Z",
    read: true,
    severity: "low"
  },
  {
    id: "notif-4",
    type: "engagement",
    title: "Low Engagement Alert",
    description: "5 athletes haven't checked in this week",
    timestamp: "2025-12-15T08:00:00Z",
    read: true,
    severity: "medium"
  }
];

// Analytics Data
const analyticsData = {
  moodDistribution: {
    excellent: 35, // 8-10
    good: 50,      // 6-7
    struggling: 15 // <6
  },
  engagementTrend: [
    { date: "12/11", activeUsers: 38, sessions: 45, moodCheckins: 40 },
    { date: "12/12", activeUsers: 42, sessions: 52, moodCheckins: 42 },
    { date: "12/13", activeUsers: 40, sessions: 48, moodCheckins: 38 },
    { date: "12/14", activeUsers: 35, sessions: 40, moodCheckins: 35 },
    { date: "12/15", activeUsers: 38, sessions: 44, moodCheckins: 37 },
    { date: "12/16", activeUsers: 41, sessions: 50, moodCheckins: 41 },
    { date: "12/17", activeUsers: 42, sessions: 53, moodCheckins: 42 }
  ],
  goalCompletion: {
    performance: 68,
    mental: 55,
    academic: 82,
    personal: 45
  },
  commonTopics: [
    { topic: "Anxiety", count: 45 },
    { topic: "Confidence", count: 38 },
    { topic: "Stress", count: 32 },
    { topic: "Performance", count: 28 },
    { topic: "Sleep", count: 22 },
    { topic: "Focus", count: 20 }
  ]
};
```

---

## COMPONENTS TO BUILD

### Reusable Components
1. **Button** - Primary, secondary, outline, danger variants
2. **Card** - Glass morphism card with optional gradient
3. **Input** - Text, email, password, textarea
4. **Select** - Dropdown selector
5. **Badge** - Status badges (success, warning, error, info)
6. **Avatar** - User avatar with online indicator
7. **ProgressBar** - Linear progress indicator
8. **ProgressRing** - Circular progress (for stats)
9. **Modal** - Centered modal dialog
10. **Tabs** - Tab navigation
11. **Tooltip** - Hover tooltips
12. **EmptyState** - Empty state illustrations

### Layout Components
1. **AppLayout** - Main layout with navigation
2. **AuthLayout** - Centered layout for auth pages
3. **Sidebar** - Left sidebar navigation (for athlete/coach)
4. **Header** - Top header with user menu
5. **Footer** - Footer links

### Page-Specific Components
1. **StatCard** - Dashboard stat display
2. **MoodChart** - Line/bar chart for mood
3. **GoalCard** - Individual goal display
4. **ChatMessage** - Chat bubble (user/assistant)
5. **AssignmentCard** - Assignment list item
6. **AthleteCard** - Athlete profile card (for coach)
7. **AlertCard** - Crisis alert display
8. **NotificationItem** - Notification list item

---

## ROUTING & NAVIGATION

### Protected Routes
- Use React Router's routing
- Check `userRole` from mock auth:
  - ATHLETE → Can access `/dashboard`, `/chat`, `/mood`, `/goals`, `/assignments`, `/settings`
  - COACH → Can access `/coach/*` routes
- Redirect to `/auth/signin` if not authenticated
- Redirect based on role:
  - Athlete trying to access `/coach/*` → redirect to `/dashboard`
  - Coach trying to access athlete routes → redirect to `/coach/dashboard`

### Mock Authentication
Create a simple context/hook:
```javascript
const mockAuth = {
  isAuthenticated: true, // Toggle for testing
  user: athleteUser, // or coachUser
  login: (email, password) => { /* set user */ },
  logout: () => { /* clear user */ },
  signup: (data) => { /* create user */ }
};
```

---

## RESPONSIVE DESIGN

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- **Navigation**: Bottom tab bar for athletes, hamburger menu for coaches
- **Cards**: Stack vertically
- **Charts**: Reduce height, simplify labels
- **Modals**: Full-screen on mobile
- **Tables**: Convert to cards or horizontal scroll
- **Forms**: Full-width inputs

---

## INTERACTIONS & ANIMATIONS

### Hover Effects
- Cards: Slight scale (1.02) + shadow glow
- Buttons: Brighten gradient
- Links: Color change + underline

### Transitions
- All: 200-300ms ease
- Page transitions: Fade in
- Modal: Scale + fade

### Loading States
- Skeleton loaders for cards/lists
- Spinner for buttons
- Progress bar for page loads

### Micro-interactions
- Confetti on goal completion
- Pulse animation on crisis alerts
- Smooth scroll to new chat messages
- Toast notifications for actions

---

## ACCESSIBILITY

- **Semantic HTML**: Use proper headings, labels, buttons
- **Keyboard navigation**: All interactive elements focusable
- **Focus indicators**: Visible focus rings
- **Alt text**: All images have descriptions
- **ARIA labels**: For icons, buttons without text
- **Color contrast**: WCAG AA compliant
- **Screen reader support**: Proper announcements

---

## WHAT NOT TO BUILD

❌ **Backend/API integration** - Use mock data only
❌ **Real authentication** - Just UI/UX, no actual auth
❌ **Database** - Everything in memory/state
❌ **Real-time features** - No WebSockets, just simulate
❌ **File uploads** - Just show UI, don't process
❌ **Email sending** - Just show success message
❌ **Payment/billing** - Not needed
❌ **Admin panel** - Only athlete and coach views

---

## SUCCESS CRITERIA

The app should:
1. ✅ Have all 14 pages fully designed and functional (with mock data)
2. ✅ Support role-based routing (athlete vs coach)
3. ✅ Be fully responsive (mobile, tablet, desktop)
4. ✅ Use the dark purple/blue design system consistently
5. ✅ Have smooth animations and transitions
6. ✅ Display all mock data correctly
7. ✅ Have working navigation between all pages
8. ✅ Look professional and production-ready
9. ✅ Have clear visual hierarchy
10. ✅ Be accessible (keyboard navigation, screen readers)

---

## DELIVERABLES

Please provide:
1. **Complete React application** with all pages
2. **Component library** (reusable components)
3. **Mock data** integrated throughout
4. **Routing setup** (React Router)
5. **Responsive styles** (Tailwind CSS)
6. **README** with:
   - How to run the app
   - Page structure overview
   - Component hierarchy
   - Mock data location

---

## REFERENCE STYLE

**Visual inspiration:**
- Modern SaaS dashboards (Notion, Linear, Amplitude)
- Sports apps (Strava, Whoop, TeamSnap)
- Mental health apps (Calm, Headspace)

**Design principles:**
- Clean, not cluttered
- Data-driven, not decorative
- Professional, not playful
- Supportive, not clinical

---

Let me know if you need any clarifications! 🚀
