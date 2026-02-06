# 🎯 Flow Sports Coach Mobile App - Lovable Prompt

Build a complete mental performance coaching mobile application with athlete and coach views. This is a FULL React Native app with navigation, authentication screens, and role-based interfaces optimized for iOS and Android.

---

## PROJECT OVERVIEW

Create a native mobile app for collegiate athletes and sports psychology coaches. Athletes track mood, chat with an AI coach (voice + text), set goals, and complete assignments. Coaches monitor team mental health, view analytics, and receive crisis alerts.

**Tech Stack:**
- React Native (Expo)
- React Navigation for screens
- NativeWind or React Native Stylesheets for styling
- React Native Charts (or Victory Native) for data visualization
- Expo Vector Icons for icons
- Mock data only (NO backend integration)

---

## DESIGN SYSTEM

### Color Palette
```javascript
const colors = {
  // Primary - Deep Blue (Trust, Focus, Professionalism)
  bluePrimary: '#1E40AF',        // Deep blue for primary actions
  blueSecondary: '#3B82F6',      // Bright blue for interactive elements
  blueAccent: '#60A5FA',         // Light blue for highlights and hover states

  // Neutrals - Black & Chrome Silver (Premium, Athletic)
  black: '#0A0A0A',              // Near-black for depth
  chromeSilver: '#C0C0C0',       // Metallic silver for accents
  silverGray: '#94A3B8',         // Muted silver for secondary text

  // Backgrounds - Dark with subtle blue tint
  bgPrimary: '#0F1419',          // Very dark blue-black (main background)
  bgSecondary: '#1E293B',        // Dark slate (cards, elevated surfaces)
  bgTertiary: '#334155',         // Medium slate (hover states, borders)

  // Text - High contrast for readability
  textPrimary: '#FFFFFF',        // Pure white for headings
  textSecondary: '#E2E8F0',      // Off-white for body text
  textMuted: '#94A3B8',          // Silver gray for subtle text

  // Status - Keep standard semantic colors
  success: '#10B981',            // Green for success, goals
  warning: '#F59E0B',            // Amber for warnings
  error: '#EF4444',              // Red for errors, crisis
  info: '#3B82F6',               // Blue for info
};
```

### Typography
- **Font Family**: System default (SF Pro on iOS, Roboto on Android)
- **Headings**: Bold (700 weight)
- **Body**: Regular (400 weight)
- **Size Scale**: 12, 14, 16, 18, 20, 24, 32, 40

### Visual Style
- **Dark mode only** (deep blue-black backgrounds with chrome silver accents)
- **Native feel**: Platform-specific components where appropriate
- **Gradients**: Deep blue to bright blue for CTAs and interactive elements
- **Metallic accents**: Chrome silver for premium feel (borders, dividers, icons)
- **Rounded corners**: 12-16px for cards
- **Shadows**: Elevation on Android, shadows on iOS
- **Animations**: React Native Animated (smooth, native 60fps)
- **Athletic aesthetic**: Clean, modern, performance-oriented (inspired by Nike, Whoop, Strava)

---

## APP STRUCTURE

### Navigation Architecture

```
Stack Navigator (Auth)
├─ Welcome Screen
├─ Sign In Screen
└─ Sign Up Screen

Tab Navigator (Athlete) - Bottom tabs
├─ Dashboard (Home)
├─ Chat
├─ Mood
├─ Goals
└─ More (Settings, Assignments)

Tab Navigator (Coach) - Bottom tabs
├─ Dashboard
├─ Athletes
├─ Analytics
├─ Notifications
└─ Settings
```

### Screen List

**Public Screens:**
- Welcome/Landing
- Sign In
- Sign Up

**Athlete Screens:**
- Dashboard
- Chat (with voice support)
- Mood Tracker
- Goals List
- Goal Details
- Assignments List
- Assignment Details
- Settings
- Profile Edit

**Coach Screens:**
- Dashboard
- Athletes List
- Athlete Profile
- Analytics
- Notifications
- Settings

---

## SCREENS TO BUILD

---

## 1. WELCOME SCREEN (Landing)

### Layout
- Full screen with gradient background (deep blue to black)
- Centered content

### Content
- **App Logo/Icon** (large, centered)
- **Title**: "Flow Sports Coach"
- **Tagline**: "Mental performance coaching for athletes"
- **Illustration**: Abstract athlete/brain graphic (blue and silver tones)
- **CTA Buttons** (bottom):
  - "Get Started" (blue gradient with chrome silver border, full width)
  - "Sign In" (chrome silver outline, full width)

### Animations
- Fade in logo
- Slide up buttons from bottom

---

## 2. SIGN IN SCREEN

### Layout
- Scrollable view
- Gradient background
- Card container with form

### Form Elements
- **Email** (TextInput with email keyboard)
- **Password** (TextInput with secure entry, show/hide toggle)
- **Remember Me** (Checkbox with blue accent)
- **Forgot Password?** (Link in light blue)
- **Sign In Button** (blue gradient, full width)

### Alternative Sign In
- Divider: "OR"
- **Sign in with Google** button (white with Google logo)
- **Sign in with Apple** button (iOS only, black)

### Footer
- "Don't have an account?" link to Sign Up

### Demo Access
- Small link: "Try Demo" → Pre-fills credentials

---

## 3. SIGN UP SCREEN

### Layout
- Multi-step wizard OR single scrollable form
- Progress indicator if multi-step

### Form Fields

**Step 1: Basic Info**
- Full Name
- Email
- Password (with strength indicator)
- Confirm Password

**Step 2: Role & Details**
- Role selection (Athlete or Coach - large tap targets)
- Sport (dropdown/picker, if Athlete)
- University (optional)
- Year (Freshman/Sophomore/Junior/Senior, if Athlete)

**Step 3: Terms**
- Terms & Conditions (checkbox with link)
- Privacy Policy (checkbox with link)
- "Create Account" button

### Validation
- Inline error messages
- Email format check
- Password strength meter
- Real-time validation

### Alternative
- "Sign up with Google" button
- "Sign up with Apple" button (iOS)

---

## 4. ATHLETE DASHBOARD

### Header
- **Title**: "Welcome back, [Name]!"
- **Avatar** (right) - tappable for menu
- **Notifications badge** if unread

### Stats Row (Horizontal ScrollView)
4 cards showing:
1. **Current Mood** - Emoji + number
2. **Goals** - Progress (3/5)
3. **Streak** - Days + 🔥
4. **Sessions** - Count

Each card:
- Small, tappable
- Icon + number + label
- Subtle gradient background

### Main Content (ScrollView)

**Quick Actions** (2x2 grid)
- Start Chat (blue gradient)
- Log Mood (light blue)
- View Goals (green)
- Assignments (silver with blue accent)

**Mood Trend** (Card)
- Title: "7-Day Mood"
- Line chart (simplified for mobile)
- Small, readable labels
- Tap to expand

**Active Goals** (Card)
- Title: "Active Goals"
- List of 2-3 goals:
  - Title
  - Progress bar
  - Category badge
- "See All" button

**Upcoming Assignments** (Card)
- List of 1-2 assignments
- Coach name
- Due date
- Status badge

### Floating Action Button
- Bottom-right
- Chat icon
- Blue gradient with chrome silver border
- Opens chat on tap

---

## 5. ATHLETE CHAT SCREEN

### Header
- Back button (left)
- "AI Coach" title (center)
- New chat button (right, + icon)

### Chat Messages (FlatList)
- Inverted list (new messages at bottom)
- User messages: Right-aligned, blue bubble
- AI messages: Left-aligned, dark bubble with avatar
- Timestamps (subtle)
- Auto-scroll to bottom on new message

### Empty State
- Large icon
- "Ready to talk?"
- Suggested prompts (4 cards, horizontal scroll):
  - "Pre-game anxiety"
  - "Build confidence"
  - "Stress help"
  - "Get focused"

### Input Area (Sticky Bottom)
- **Voice button** (left, mic icon)
  - Tap to record
  - Pulsing animation when active
  - Red when recording
- **Text input** (center, multiline, auto-expand)
  - Placeholder: "Message AI Coach..."
- **Send button** (right, arrow icon)
  - Disabled if empty (silver gray)
  - Blue gradient when active

### Voice Recording UI
- When recording:
  - Waveform animation
  - Timer
  - "Release to send" / "Slide to cancel"
- Processing state:
  - "Transcribing..." with spinner
- Playback controls for AI response

### Features
- Typing indicator (3 dots animation)
- Pull to refresh for history
- Long-press message for copy/delete
- Keyboard avoiding view

---

## 6. ATHLETE MOOD SCREEN

### Header
- Title: "Mood Tracker"
- Calendar icon (right) - opens history

### Today's Check-in (Card, top)
- Large: "How are you feeling?"
- **Emoji Slider** (1-10):
  - Drag to select
  - Emoji changes dynamically
  - Haptic feedback on change
  - Labels: "Struggling" to "Excellent"
- **Quick Tags** (chips, multi-select):
  - Anxious, Stressed, Confident, Tired, Energized
- **Notes** (expandable textarea)
  - "What's on your mind?"
  - Optional
- **Submit** button (blue gradient, full width)

### This Week (Card)
- Mini calendar view (7 days)
- Each day shows emoji
- Color-coded background
- Tap day to see notes

### Insights (Card)
- Weekly average: 7.2/10
- Best day badge
- Current streak

### Charts (Collapsible)
- Weekly bar chart
- Monthly line chart
- Tap to expand full screen

---

## 7. ATHLETE GOALS SCREEN

### Header
- Title: "Goals"
- Add button (right, + icon)

### Category Tabs (Horizontal ScrollView)
- All
- Performance
- Mental
- Academic
- Personal

### Goals List (FlatList)
Each goal card:
- **Title** (large, bold)
- **Category badge** (colored chip)
- **Progress bar** (with percentage)
- **Due date** (small, icon + text)
- **Status badge** (In Progress, Completed)
- Tap to open details

### Goal Details Modal (Bottom Sheet)
- Full height
- **Header**: Title, category, edit/delete icons
- **Description** (scrollable)
- **Progress bar** (large)
- **Milestones** (checklist):
  - Each with checkbox
  - Strikethrough if complete
- **Notes section** (editable)
- **Update Progress** button
- **Mark Complete** button (green)

### New Goal Sheet
- Title input
- Category picker
- Description textarea
- Target date picker
- Add milestones (+ button)
- "Create Goal" button

### Empty State
- Illustration
- "No goals yet"
- "Set your first goal" button

---

## 8. ATHLETE ASSIGNMENTS SCREEN

### Header
- Title: "Assignments"
- Filter button (right) - status filter sheet

### Filter Tabs
- All
- Not Started
- In Progress
- Completed

### Assignments List (FlatList)
Each card:
- **Title** (bold)
- **Coach** (small avatar + name)
- **Due date** (with countdown if soon)
- **Status badge** (colored)
- Tap to open details

### Assignment Details Modal
- Full screen
- **Header**: Title, close button
- **Coach info**: Avatar, name, role
- **Instructions** (scrollable)
- **Due date** (prominent if approaching)
- **Submission area**:
  - Text response (textarea)
  - File upload button (if needed)
  - "Submit" button
- **Status history** (collapsible)

### Empty State
- "No assignments"
- Illustration
- "Your coach will assign exercises here"

---

## 9. ATHLETE MORE/SETTINGS SCREEN

### Profile Section (Top)
- Large avatar (tappable to change)
- Name
- Email
- Sport
- "Edit Profile" button

### Menu List (Grouped)

**Account**
- Edit Profile
- Change Password
- Notification Settings
- Privacy Settings

**Support**
- Help Center
- Contact Coach
- Crisis Resources

**About**
- About App
- Privacy Policy
- Terms of Service
- Version info

**Danger Zone**
- Logout (red text)
- Delete Account (red)

### Settings Screens

**Edit Profile**:
- Avatar picker
- Name, email, sport, university, year, bio
- Save button

**Notifications**:
- Toggle switches:
  - Daily mood reminders
  - Goal updates
  - Assignment notifications
  - Crisis alerts
  - Chat messages

**Privacy**:
- Data sharing toggles:
  - Share mood with coach
  - Share chat summaries
  - Share goals
- Crisis monitoring (always on, explained)

---

## 10. COACH DASHBOARD

### Header
- Title: "Coach Dashboard"
- Avatar + name (right)
- Notifications badge

### Stats Cards (2x2 Grid)
1. **Total Athletes** - Number + trend
2. **Active** - Last 7 days
3. **Crisis Alerts** - Red badge if >0
4. **Avg Mood** - Team average + trend

### Quick Actions (Horizontal Scroll)
- View Athletes
- Analytics
- Create Assignment
- Send Message

### At-Risk Athletes (Card)
- Title: "Needs Attention"
- List of 2-3 athletes:
  - Avatar + name
  - Sport
  - Reason (mood drop, crisis)
  - "View" button
- Red/yellow severity indicators

### Team Mood (Card)
- Simplified chart
- 7-day trend
- Tap to see full analytics

### Recent Alerts (Card)
- Timeline of 2-3 recent alerts
- Athlete, type, timestamp
- Tap to view details

---

## 11. COACH ATHLETES SCREEN

### Header
- Title: "Athletes"
- Search button (right)
- Filter button (right)

### Search Bar (Expandable)
- Text input for name search
- Cancel button

### Filters (Bottom Sheet)
- Sport filter (multi-select)
- Risk level
- Activity status
- Sort by: Name, Mood, Activity

### Athletes List (FlatList)
Each card:
- **Avatar** (left)
- **Name** (bold)
- **Sport + Year**
- **Last mood** (emoji + number)
- **Last active** (time ago)
- **Quick stats**: Goals, streak
- **Risk indicator** (colored dot)
- Tap to view profile

### Athlete Profile Modal
- Full screen
- **Header**: Avatar, name, sport, year, close
- **Tabs** (horizontal scroll):
  - Overview
  - Mood History
  - Goals
  - Chat Summary
  - Assignments

**Overview Tab**:
- Key stats cards
- Recent activity timeline
- Coach notes (editable)

**Mood Tab**:
- Chart (30 days)
- Calendar view
- Export button

**Goals Tab**:
- List of athlete's goals
- Progress for each
- Tap to see details

**Chat Summary Tab**:
- AI-generated summaries
- Topics discussed
- View transcripts button (if consented)

**Assignments Tab**:
- List of assigned work
- Completion status
- View submissions

---

## 12. COACH ANALYTICS SCREEN

### Header
- Title: "Analytics"
- Time range picker (dropdown)
  - Last 7 Days
  - Last 30 Days
  - Last 90 Days

### Charts (ScrollView)

**Team Mood Distribution** (Pie Chart)
- Excellent (8-10)
- Good (6-7)
- Struggling (<6)
- Tap segments for details

**Engagement Trends** (Line Chart)
- Daily active users
- Sessions
- Mood check-ins

**Goal Completion** (Bar Chart)
- By category
- Horizontal bars

**Common Topics** (List)
- Anxiety: 45
- Confidence: 38
- Stress: 32
- etc.

**Crisis Alerts** (Timeline)
- Monthly/weekly view
- Tap to see details

### Export Button (Bottom)
- "Export Report" (PDF/CSV)
- Share sheet

---

## 13. COACH NOTIFICATIONS SCREEN

### Header
- Title: "Notifications"
- "Mark All Read" (right)

### Filter Tabs
- All
- Unread
- Crisis
- Reports

### Notifications List (FlatList)
Each item:
- **Icon** (based on type, colored)
  - 🚨 Crisis (red)
  - 📊 Report (blue)
  - 🎯 Milestone (green)
  - 💬 Message (light blue)
- **Title** (bold)
- **Description**
- **Timestamp** (relative)
- **Unread indicator** (dot)
- Swipe actions:
  - Mark read/unread
  - Delete

### Notification Detail Modal
- Full screen
- Type-specific content
- Related actions
- Dismiss button

### Empty State
- "All caught up!"
- Illustration
- "No new notifications"

---

## 14. COACH SETTINGS SCREEN

### Layout
Similar to Athlete Settings, but with:

**Profile**:
- Avatar, name, title, university
- Edit profile

**Team Management**:
- Athletes list (manage)
- Invite athletes (email input)
- Sports coached

**Notifications**:
- Email alerts (toggles)
- Push notifications
- Alert thresholds (sliders)

**Preferences**:
- Default view
- Report frequency
- Data retention

**Account**:
- Change password
- Logout
- Delete account

---

## MOCK DATA STRUCTURE

```javascript
// Use same mock data as web version
// Ensure data is stored in context/state management
// Format dates for mobile display (e.g., "2h ago", "Yesterday")

const athleteUser = {
  id: "athlete-1",
  name: "Jordan Smith",
  email: "jordan.smith@university.edu",
  role: "ATHLETE",
  sport: "Basketball",
  university: "State University",
  year: "Junior",
  avatarUrl: "https://i.pravatar.cc/150?img=1"
};

const coachUser = {
  id: "coach-1",
  name: "Dr. Sarah Martinez",
  email: "s.martinez@university.edu",
  role: "COACH",
  title: "Sports Psychologist",
  university: "State University",
  avatarUrl: "https://i.pravatar.cc/150?img=5"
};

// ... (use same mock data as web version for consistency)
```

---

## COMPONENTS TO BUILD

### Core UI Components
1. **Button** - Variants: primary, secondary, outline, text
2. **Card** - Glass morphism with gradient
3. **Input** - Text, password, multiline
4. **Select/Picker** - Native pickers
5. **Badge** - Status indicators
6. **Avatar** - User avatars with online dot
7. **ProgressBar** - Linear progress
8. **ProgressRing** - Circular progress (SVG)
9. **Modal/BottomSheet** - Native modals
10. **Tabs** - Tab navigation
11. **ListItem** - Reusable list row
12. **EmptyState** - Empty illustrations

### Custom Components
1. **StatCard** - Dashboard stats
2. **MoodSlider** - Emoji slider for mood
3. **ChatBubble** - Message bubbles
4. **GoalCard** - Goal list item
5. **AssignmentCard** - Assignment item
6. **AthleteCard** - Athlete profile card
7. **NotificationItem** - Notification row
8. **VoiceButton** - Voice recording button
9. **WaveformView** - Audio waveform animation

---

## NAVIGATION SETUP

### Stack + Tab Navigation
```javascript
// Auth Stack
AuthStack
  ├─ Welcome
  ├─ SignIn
  └─ SignUp

// Athlete Tab Navigator
AthleteTabs (Bottom tabs)
  ├─ Dashboard
  ├─ Chat
  ├─ Mood
  ├─ Goals
  └─ More

// Coach Tab Navigator
CoachTabs (Bottom tabs)
  ├─ Dashboard
  ├─ Athletes
  ├─ Analytics
  ├─ Notifications
  └─ Settings

// Root Navigator
RootNavigator
  ├─ AuthStack (if not authenticated)
  └─ AthleteTabs or CoachTabs (based on role)
```

### Tab Bar Icons
- Use Expo Vector Icons (Ionicons)
- Active state: Blue with chrome silver glow
- Inactive: Silver gray (40% opacity)

### Mock Auth Context
```javascript
const AuthContext = {
  isAuthenticated: true,
  user: athleteUser, // or coachUser
  login: async (email, password) => {},
  logout: async () => {},
  signup: async (data) => {}
};
```

---

## MOBILE-SPECIFIC FEATURES

### Voice Integration
- **Expo AV** for audio recording
- **WebSocket** for voice server connection
- **Audio playback** for AI responses
- Visual feedback (waveform, timer)
- Haptic feedback on start/stop

### Gestures
- **Pull to refresh** on lists
- **Swipe** for actions (delete, archive)
- **Long press** for context menus
- **Drag** to reorder (goals, milestones)
- **Pinch to zoom** on charts

### Haptic Feedback
- Button taps (light)
- Form submission (medium)
- Error/success (notification)
- Mood slider change (selection)
- Voice recording start/stop (heavy)

### Notifications
- **Local notifications** for reminders
- **Push notifications** for crisis alerts
- Badge count on app icon
- In-app notification banner

### Offline Support
- Cache recent data
- Queue actions when offline
- Sync when back online
- Show offline indicator

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### iOS
- Use native date/time pickers
- Respect safe area insets
- Support Face ID/Touch ID
- Sign in with Apple
- iOS-style modals (slide up)
- Swipe back gesture

### Android
- Material Design ripple effects
- Android back button handling
- Sign in with Google
- Bottom sheet modals
- StatusBar color coordination

---

## RESPONSIVE DESIGN

### Screen Sizes
- Small phones (< 375px width)
- Standard phones (375-414px)
- Large phones (> 414px)
- Tablets (> 768px)

### Adaptations
- Scale font sizes
- Adjust card sizing
- Grid column count (2 on phone, 3-4 on tablet)
- Tablet: Side-by-side layouts where appropriate

---

## ANIMATIONS

### React Native Animated
- Fade in/out
- Slide up/down
- Scale
- Rotate
- Spring physics for interactive elements

### Specific Animations
- **Mood slider**: Emoji bounce on change
- **Voice button**: Pulse while recording
- **Charts**: Animate in on mount
- **Lists**: Stagger item appearance
- **Modals**: Slide up with fade
- **Success**: Confetti on goal completion

### Performance
- Use `useNativeDriver: true` where possible
- Avoid animating layout properties
- 60 FPS target

---

## ACCESSIBILITY

### React Native Accessibility
- `accessibilityLabel` on all interactive elements
- `accessibilityHint` for complex actions
- `accessibilityRole` (button, header, etc.)
- Screen reader support
- Sufficient touch target sizes (44x44 minimum)
- High contrast mode support
- Dynamic type support (scalable fonts)

---

## WHAT NOT TO BUILD

❌ **Backend integration** - Mock data only
❌ **Real authentication** - UI only
❌ **Database** - Use in-memory state
❌ **Real push notifications** - Just UI
❌ **File uploads** - Show UI, don't process
❌ **Payment** - Not needed
❌ **Deep linking** - Optional
❌ **App Store deployment** - Development only

---

## SUCCESS CRITERIA

The app should:
1. ✅ Have all screens built and navigable
2. ✅ Support both athlete and coach flows
3. ✅ Work on iOS and Android
4. ✅ Have smooth 60fps animations
5. ✅ Use native platform patterns
6. ✅ Display all mock data correctly
7. ✅ Have voice recording UI (mock recording)
8. ✅ Be accessible (screen reader compatible)
9. ✅ Look professional and native
10. ✅ Handle different screen sizes

---

## DELIVERABLES

1. **Complete Expo/React Native app**
2. **All screens implemented**
3. **Navigation configured**
4. **Mock data integrated**
5. **Component library**
6. **README** with:
   - How to run (expo start)
   - Screen structure
   - Component hierarchy
   - Mock data location

---

## TESTING

### Test On
- iOS Simulator (iPhone 14 Pro)
- Android Emulator (Pixel 6)
- Physical device if possible

### Verify
- Navigation between all screens
- Tab bar switching
- Modals/bottom sheets
- Forms and validation
- Charts rendering
- Lists scrolling smoothly
- Voice button interaction (UI only)
- Responsive on different sizes

---

## REFERENCE APPS

**Style inspiration:**
- Headspace (mental health, calm design)
- Strava (sports tracking, data viz)
- Notion Mobile (clean, professional)
- WhatsApp (chat interface)
- Apple Health (data visualization)

**Principles:**
- Native feel, not web-in-app
- Thumb-friendly navigation
- Clear visual hierarchy
- Smooth, delightful interactions
- Supportive, not clinical

---

Let me know if you need any clarifications! 📱
