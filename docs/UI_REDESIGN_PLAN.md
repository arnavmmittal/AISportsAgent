# AI Sports Agent - Comprehensive UI/UX Redesign Plan

**Version**: 1.0
**Date**: January 2026
**Author**: Claude (Senior Product Designer + Frontend Architect)

---

## A) Product Thesis

### The Problem We Solve

Each sports psychology coach serves **150+ student athletes**, making personalized 1:1 support impossible at scale. Traditional Zoom meetings are:
- **Scheduling nightmares** - athletes need support at 2 AM before a big game, not during office hours
- **Capacity-limited** - 30-minute slots x 150 athletes = mathematically impossible
- **Inconsistent** - quality varies by coach energy, time constraints, athlete openness
- **Stigma-heavy** - athletes avoid scheduling "psych" sessions in front of teammates

### Our Solution

**Replace Zoom meetings with an AI-first mental performance platform** that provides:
1. **24/7 availability** - Pre-game anxiety at 6 AM? We're there.
2. **Evidence-based consistency** - CBT, mindfulness, flow state frameworks applied systematically
3. **Proactive intelligence** - Detect slumps BEFORE they spiral (88.46% accuracy)
4. **Coach leverage** - One coach monitors 150+ athletes through intelligent triage

### Design Philosophy

| Principle | Rationale |
|-----------|-----------|
| **Chat is the Product** | The AI conversation IS the therapy session replacement. Everything else supports it. |
| **Proactive > Reactive** | Don't wait for athletes to ask for help. Surface insights, detect patterns, suggest interventions. |
| **Trust through Transparency** | Show athletes what data coaches see. Make privacy controls visible and understandable. |
| **Reduce Cognitive Load** | Athletes are stressed. Every tap, every decision, every screen adds load. Minimize ruthlessly. |
| **Coaches as Multipliers** | Coach UI should answer: "Who needs me MOST right now?" in < 5 seconds. |

### Target Personas

#### Athlete Persona: "Stressed Sarah"
- **Context**: D1 volleyball player, junior, 3.5 GPA, starting setter
- **Pain**: Performance anxiety before big matches, tendency to overthink mistakes
- **Behavior**: Uses phone at night, prefers typing to talking, checks things frequently
- **Need**: Immediate validation, quick techniques, pattern awareness
- **Anti-need**: Does NOT want lengthy intake forms, clinical language, or feeling "broken"

#### Coach Persona: "Overloaded Coach O"
- **Context**: Head of mental performance, covers volleyball + basketball + soccer (200+ athletes)
- **Pain**: Can't be everywhere, misses warning signs, drowns in manual check-ins
- **Behavior**: Checks dashboard 3x/day, needs mobile access during practice
- **Need**: Triage who needs attention NOW, evidence for escalation decisions
- **Anti-need**: Does NOT want more dashboards, more data, more complexity

---

## B) Information Architecture + Screen Map

### Athlete Information Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ATHLETE EXPERIENCE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    DAILY LOOP                        │    │
│  │                                                      │    │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐         │    │
│  │   │ Morning │───▶│   AI    │───▶│ Evening │         │    │
│  │   │ Check-in│    │  Chat   │    │ Reflect │         │    │
│  │   └─────────┘    └─────────┘    └─────────┘         │    │
│  │        │              │              │               │    │
│  │        ▼              ▼              ▼               │    │
│  │   [Mood Log]    [Conversation]  [Goal Check]        │    │
│  │   [Readiness]   [Techniques]   [Journaling]         │    │
│  │                 [Routines]                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   ATHLETE SCREENS                       │ │
│  │                                                         │ │
│  │  PRIMARY (Tab Bar):                                     │ │
│  │  ┌────────┬────────┬────────┬────────┬────────┐        │ │
│  │  │  Home  │  Chat  │ Check- │Progress│Settings│        │ │
│  │  │        │        │   In   │        │        │        │ │
│  │  └────────┴────────┴────────┴────────┴────────┘        │ │
│  │                                                         │ │
│  │  SECONDARY (Accessible from Primary):                   │ │
│  │  • Chat History                                         │ │
│  │  • Pre-Performance Routines                             │ │
│  │  • Goal Detail / Edit                                   │ │
│  │  • Technique Library                                    │ │
│  │  • My Data & Privacy                                    │ │
│  │  • Assignment Detail                                    │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Coach Information Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     COACH EXPERIENCE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                TRIAGE WORKFLOW                       │    │
│  │                                                      │    │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐         │    │
│  │   │ Alert   │───▶│ Athlete │───▶│  Take   │         │    │
│  │   │ Review  │    │ Profile │    │ Action  │         │    │
│  │   └─────────┘    └─────────┘    └─────────┘         │    │
│  │        │              │              │               │    │
│  │        ▼              ▼              ▼               │    │
│  │   [Priority]    [Full History]  [Assign Task]       │    │
│  │   [Risk Level]  [Correlations]  [Schedule]          │    │
│  │   [Patterns]    [Predictions]   [Escalate]          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    COACH SCREENS                        │ │
│  │                                                         │ │
│  │  PRIMARY (Sidebar Navigation):                          │ │
│  │  ┌──────────────────────────────────────────────┐      │ │
│  │  │ 🏠 Command Center    (Default Landing)        │      │ │
│  │  │ 👥 Team Roster       (All Athletes)           │      │ │
│  │  │ 📊 Analytics         (Team Trends)            │      │ │
│  │  │ 🎯 Readiness         (Game Day View)          │      │ │
│  │  │ 📋 Assignments       (Task Management)        │      │ │
│  │  │ ⚙️ Settings          (Team Configuration)     │      │ │
│  │  └──────────────────────────────────────────────┘      │ │
│  │                                                         │ │
│  │  DETAIL VIEWS (From Primary):                           │ │
│  │  • Athlete Deep Dive (from Roster/Command Center)       │ │
│  │  • Alert Investigation (from Command Center)            │ │
│  │  • Pattern Analysis (from Analytics)                    │ │
│  │  • Lineup Optimizer (from Readiness)                    │ │
│  │  • Assignment Builder (from Assignments)                │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Screen Map (Complete)

```
ATHLETE MOBILE/WEB                    COACH WEB (Desktop-First)
─────────────────                     ─────────────────────────

/auth/welcome ─────────────────────── /auth/signin
     │                                      │
     ├─▶ /auth/signup                       │
     │                                      │
/onboarding ◀──────────────────────────────┘
     │
     ▼
┌──────────────────┐                 ┌──────────────────────────┐
│ ATHLETE APP      │                 │ COACH PORTAL              │
├──────────────────┤                 ├──────────────────────────┤
│                  │                 │                          │
│ /home            │                 │ /coach/command-center    │
│   └─▶ Readiness  │                 │   ├─▶ Alert Details      │
│   └─▶ Quick Chat │                 │   ├─▶ Priority Athletes  │
│   └─▶ Mood Log   │                 │   └─▶ Action Feed        │
│                  │                 │                          │
│ /chat            │                 │ /coach/roster            │
│   └─▶ /chat/:id  │                 │   └─▶ /coach/athlete/:id │
│   └─▶ History    │                 │       ├─▶ Timeline       │
│   └─▶ Routines   │                 │       ├─▶ Correlations   │
│                  │                 │       ├─▶ Predictions    │
│ /check-in        │                 │       └─▶ Interventions  │
│   └─▶ Mood       │                 │                          │
│   └─▶ Journal    │                 │ /coach/analytics         │
│   └─▶ Sleep      │                 │   ├─▶ Team Pulse         │
│                  │                 │   ├─▶ Correlations       │
│ /progress        │                 │   ├─▶ Forecasts          │
│   └─▶ Goals      │                 │   └─▶ Patterns           │
│   └─▶ Trends     │                 │                          │
│   └─▶ Insights   │                 │ /coach/readiness         │
│                  │                 │   ├─▶ Daily Overview     │
│ /settings        │                 │   ├─▶ Lineup Optimizer   │
│   └─▶ Privacy    │                 │   └─▶ Forecasts          │
│   └─▶ Account    │                 │                          │
│   └─▶ Notifs     │                 │ /coach/assignments       │
│                  │                 │   ├─▶ Library            │
└──────────────────┘                 │   ├─▶ Active             │
                                     │   └─▶ Submissions        │
                                     │                          │
                                     │ /coach/settings          │
                                     │   ├─▶ Team Config        │
                                     │   ├─▶ Notifications      │
                                     │   └─▶ AI Settings        │
                                     │                          │
                                     └──────────────────────────┘
```

---

## C) Visual System Specification

### Design Tokens

```css
/* ═══════════════════════════════════════════════════════════
   COLOR SYSTEM
   ═══════════════════════════════════════════════════════════ */

/* Primary Brand - Calm, Professional, Trustworthy */
--color-primary-50: #EEF6FF;
--color-primary-100: #D9EBFF;
--color-primary-200: #BCE0FF;
--color-primary-300: #8ECEFF;
--color-primary-400: #58B4FF;
--color-primary-500: #3B9EFF;  /* Primary Action */
--color-primary-600: #1E7EF5;
--color-primary-700: #1766E2;
--color-primary-800: #1952B6;
--color-primary-900: #1A468F;

/* Secondary - Warm, Supportive */
--color-secondary-500: #F59E0B;  /* Highlights, Badges */

/* Semantic - Status Colors */
--color-success-light: #D1FAE5;
--color-success-main: #10B981;
--color-success-dark: #047857;

--color-warning-light: #FEF3C7;
--color-warning-main: #F59E0B;
--color-warning-dark: #B45309;

--color-danger-light: #FEE2E2;
--color-danger-main: #EF4444;
--color-danger-dark: #B91C1C;

/* Readiness Traffic Light */
--color-readiness-green: #22C55E;   /* Score >= 75 */
--color-readiness-yellow: #EAB308;  /* Score 55-74 */
--color-readiness-red: #EF4444;     /* Score < 55 */

/* Risk Levels */
--color-risk-low: #22C55E;
--color-risk-moderate: #EAB308;
--color-risk-high: #F97316;
--color-risk-critical: #DC2626;

/* Neutrals */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;

/* ═══════════════════════════════════════════════════════════
   TYPOGRAPHY
   ═══════════════════════════════════════════════════════════ */

--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale (Mobile-First) */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* ═══════════════════════════════════════════════════════════
   SPACING
   ═══════════════════════════════════════════════════════════ */

--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* ═══════════════════════════════════════════════════════════
   EFFECTS
   ═══════════════════════════════════════════════════════════ */

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Border Radius */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

### Component Library (Extending shadcn/ui)

#### Core Components

| Component | Usage | Key Variants |
|-----------|-------|--------------|
| `Button` | Primary actions | `primary`, `secondary`, `ghost`, `danger` |
| `Card` | Container for content | `elevated`, `outlined`, `interactive` |
| `Badge` | Status indicators | `success`, `warning`, `danger`, `info` |
| `Avatar` | User/athlete photos | `sm`, `md`, `lg`, `xl` with fallback initials |
| `Input` | Form fields | `default`, `error`, `disabled` |
| `Textarea` | Multi-line input | Auto-resize, character count |
| `Select` | Dropdowns | Single, multi-select, searchable |
| `Dialog` | Modals | Centered, slide-over |
| `Toast` | Notifications | `success`, `error`, `warning`, `info` |
| `Skeleton` | Loading states | Match component shapes |

#### Domain-Specific Components

| Component | Purpose |
|-----------|---------|
| `ReadinessGauge` | Circular progress (0-100) with traffic light color |
| `MoodSlider` | 1-10 slider with emoji feedback |
| `RiskBadge` | LOW/MODERATE/HIGH/CRITICAL with color coding |
| `AthleteCard` | Compact athlete summary (photo, name, readiness, risk) |
| `ChatBubble` | Message container (user/AI, streaming support) |
| `TrendChart` | Sparkline for 7/14/30-day trends |
| `ActionFeedItem` | Alert with type icon, timestamp, severity |
| `RoutineTimer` | Countdown with audio prompts |
| `CorrelationMatrix` | Heatmap for factor relationships |

### Iconography

Use **Lucide Icons** (already in stack) with consistent sizing:
- Navigation icons: 24px
- Inline icons: 16px
- Large decorative: 48px+

### Motion Guidelines

```css
/* Micro-interactions */
.button:hover { transform: translateY(-1px); transition: var(--transition-fast); }
.card:hover { box-shadow: var(--shadow-lg); transition: var(--transition-normal); }

/* Page transitions */
.page-enter { opacity: 0; transform: translateY(8px); }
.page-enter-active { opacity: 1; transform: translateY(0); transition: var(--transition-normal); }

/* Chat message appearance */
.message-enter { opacity: 0; transform: translateY(16px); }
.message-enter-active { opacity: 1; transform: translateY(0); transition: var(--transition-slow); }

/* Streaming text (typewriter effect via CSS) */
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.typing-cursor::after { content: '▋'; animation: blink 1s infinite; }
```

---

## D) Screen-by-Screen UX Specification

### ATHLETE SCREENS

---

#### D.1 Athlete Home (`/home`)

**Purpose**: Daily landing page that surfaces what matters most today.

**Layout**:
```
┌─────────────────────────────────────────┐
│ Good morning, Sarah 👋                  │
│ Game day is tomorrow                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     TODAY'S READINESS           │   │
│  │                                  │   │
│  │         ┌───────┐               │   │
│  │         │  78   │ GREEN         │   │
│  │         └───────┘               │   │
│  │   "You're in a good place"      │   │
│  │                                  │   │
│  │   Sleep ████████░░ 8h           │   │
│  │   Mood  ██████░░░░ 7/10         │   │
│  │   Stress███░░░░░░░ 3/10         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💬 CONTINUE CHAT                │   │
│  │ "Let's work on your pre-game    │   │
│  │  routine for tomorrow..."       │   │
│  │                          [Open] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ☀️ MORNING CHECK-IN             │   │
│  │ How are you feeling today?      │   │
│  │                     [Log Mood ▶]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 TODAY'S FOCUS                │   │
│  │                                  │   │
│  │ ○ Practice breathing routine    │   │
│  │ ○ Review visualization script   │   │
│  │ ✓ Mood log (completed)          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💡 INSIGHT                      │   │
│  │ "Your mood dips 2 days before   │   │
│  │  big games. Tomorrow's session  │   │
│  │  can help prepare you."         │   │
│  │                    [Learn More] │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
│ 🏠  │  💬  │  ✓  │  📈  │  ⚙️  │
│Home │ Chat │Check│Prog │ Set │
```

**Key Features**:
1. **Readiness Score** - Prominent gauge with color coding
2. **Continue Chat CTA** - Deep link to last conversation
3. **Morning Check-in** - One-tap entry to mood logging
4. **Today's Focus** - Assignments + AI-suggested tasks
5. **Personalized Insight** - ML-generated pattern detection

**Data Sources**:
- Readiness: `ReadinessEngine.calculate_readiness()`
- Insight: `SlumpDetector` + `CorrelationEngine`
- Assignments: `/api/assignments` (filtered for athlete)

---

#### D.2 AI Chat (`/chat`)

**Purpose**: The core product - AI sports psychology sessions.

**Layout (Mobile)**:
```
┌─────────────────────────────────────────┐
│ ← AI Coach              [Session Menu ⋮]│
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Hey Sarah! I noticed you     │   │
│  │    have a big match tomorrow.   │   │
│  │    How are you feeling about    │   │
│  │    it?                          │   │
│  │                                  │   │
│  │    ⏰ 2:34 PM                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│            ┌─────────────────────────┐  │
│            │ A bit nervous honestly.│  │
│            │ Last time we played    │  │
│            │ them I made some big   │  │
│            │ mistakes.              │  │
│            │                        │  │
│            │            ⏰ 2:35 PM  │  │
│            └─────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 That makes sense. Those      │   │
│  │    memories can be heavy.       │   │
│  │                                  │   │
│  │    Let me ask - when you think  │   │
│  │    about those mistakes, what   │   │
│  │    feeling comes up strongest?  │   │
│  │                                  │   │
│  │    ▋                            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🎯 Suggested: Pre-game Routine  │   │
│  │    Your 5-minute calming ritual │   │
│  │                      [Start ▶]  │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐│
│ │ Type a message...          [🎤][➤] ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Key Features**:
1. **Streaming Responses** - Typewriter effect with cursor
2. **Session Context** - AI remembers conversation history
3. **Contextual Suggestions** - Routines, techniques surfaced when relevant
4. **Voice Input** - Microphone button for speech-to-text
5. **Session Menu** - History, new chat, export transcript

**Chat Intelligence**:
- Protocol phase tracking (CHECK_IN → CLARIFY → FORMULATION → INTERVENTION → PLAN → WRAP_UP)
- Sport context awareness (volleyball terminology, position-specific)
- Issue detection and tagging
- Evidence-based framework selection (CBT, mindfulness, imagery)

**Technical Implementation**:
- WebSocket for streaming (`/api/chat/stream-mcp`)
- `StructuredResponse` metadata for UI enhancements
- `InterventionRecommender` for technique suggestions
- `RoutineBuilder` for pre-performance routines

---

#### D.3 Check-In (`/check-in`)

**Purpose**: Quick daily logging with minimal friction.

**Layout**:
```
┌─────────────────────────────────────────┐
│ ← Check-In                   [History] │
├─────────────────────────────────────────┤
│                                         │
│  HOW ARE YOU FEELING?                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                  │   │
│  │   😞  😐  🙂  😊  🤩            │   │
│  │   1   3   5   7   10            │   │
│  │                                  │   │
│  │        [═══════●═══]             │   │
│  │              7                   │   │
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ CONFIDENCE                       │   │
│  │ How confident do you feel?       │   │
│  │        [═══════●═══]  7/10      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ STRESS                           │   │
│  │ How stressed are you?            │   │
│  │        [═══●═══════]  3/10      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ENERGY                           │   │
│  │ How's your energy level?         │   │
│  │        [═════════●═]  8/10      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ SLEEP LAST NIGHT                 │   │
│  │        [═══════●═══]  7.5 hrs   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 OPTIONAL NOTE                │   │
│  │ Anything on your mind?           │   │
│  │                                  │   │
│  │ [                              ] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         [Save Check-In]         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features**:
1. **5-Point Core Metrics** - Mood, confidence, stress, energy, sleep
2. **Emoji Feedback** - Visual reinforcement of selection
3. **Smart Defaults** - Pre-fill with yesterday's values
4. **Optional Note** - Free text for context
5. **Quick Save** - Entire check-in in < 30 seconds

**Post-Submit Behavior**:
- Show personalized insight based on entry
- If concerning patterns detected, suggest chat with AI
- Update readiness score immediately

---

#### D.4 Progress (`/progress`)

**Purpose**: Visualize growth over time, celebrate wins.

**Layout**:
```
┌─────────────────────────────────────────┐
│ ← Progress                     [Share] │
├─────────────────────────────────────────┤
│                                         │
│  THIS WEEK'S HIGHLIGHTS                 │
│  ┌─────────────────────────────────┐   │
│  │ 🎯 4 days logged  │ 🏆 Goal hit │   │
│  │ 🧠 2 AI sessions  │ 📈 Mood +12%│   │
│  └─────────────────────────────────┘   │
│                                         │
│  MOOD TREND (30 DAYS)                   │
│  ┌─────────────────────────────────┐   │
│  │     📈                          │   │
│  │   ╱╲ ╱╲    ╱╲╱─╲   ╱╲_╱        │   │
│  │ ╱   ╲╱  ╲╱╱      ╲╱╱            │   │
│  │                                  │   │
│  │  Oct     Nov     Dec     Jan    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  GOALS                                  │
│  ┌─────────────────────────────────┐   │
│  │ 🏋️ Improve pre-game routine     │   │
│  │ ████████████░░░░░░░░  65%       │   │
│  │ Due: Jan 15                      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🧠 Reduce performance anxiety   │   │
│  │ ██████░░░░░░░░░░░░░░  30%       │   │
│  │ Due: Feb 1                       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │            [+ New Goal]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  YOUR PATTERNS                          │
│  ┌─────────────────────────────────┐   │
│  │ 💡 "Your stress peaks on        │   │
│  │    Thursdays. Consider a        │   │
│  │    midweek check-in routine."   │   │
│  │                                  │   │
│  │ 💡 "Sleep below 7h correlates   │   │
│  │    with 23% lower mood next     │   │
│  │    day for you."                │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features**:
1. **Weekly Summary Cards** - Quick wins at a glance
2. **Mood Trend Chart** - 7/14/30 day selectable
3. **Goal Progress Bars** - Visual completion tracking
4. **Pattern Insights** - ML-generated personal insights

---

### COACH SCREENS

---

#### D.5 Command Center (`/coach/command-center`)

**Purpose**: Triage dashboard - "Who needs me most RIGHT NOW?"

**Layout (Desktop)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 Command Center                              Coach: Dr. Williams     │
│  ┌─────────┬──────────┬───────────┬─────────────┐         [🔔 3]       │
│  │ Roster  │Analytics │ Readiness │ Assignments │                       │
├──┴─────────┴──────────┴───────────┴─────────────┴───────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🚨 PRIORITY ATHLETES             │ │ 📊 TEAM PULSE                │  │
│  │                                   │ │                              │  │
│  │ ┌───────────────────────────────┐│ │  Avg Readiness: 72 (GREEN)  │  │
│  │ │ 🔴 CRITICAL                   ││ │  ┌─────────────────────────┐│  │
│  │ │ Sarah M. - Stress spike 48h   ││ │  │ ████████████████░░░░░  ││  │
│  │ │ Risk: HIGH  [View →]          ││ │  │ 72% Ready for Game Day  ││  │
│  │ └───────────────────────────────┘│ │  └─────────────────────────┘│  │
│  │ ┌───────────────────────────────┐│ │                              │  │
│  │ │ 🟠 HIGH                       ││ │  7-Day Mood Trend:          │  │
│  │ │ Jake T. - 3 missed check-ins  ││ │  ╱╲ ╱╲    ╱╲╱─             │  │
│  │ │ Risk: MODERATE  [View →]      ││ │  ──────────────────         │  │
│  │ └───────────────────────────────┘│ │                              │  │
│  │ ┌───────────────────────────────┐│ │  At Risk: 3 athletes        │  │
│  │ │ 🟡 MODERATE                   ││ │  Trending Down: 5 athletes  │  │
│  │ │ Emma K. - Mood decline trend  ││ │                              │  │
│  │ │ Risk: LOW  [View →]           ││ └──────────────────────────────┘  │
│  │ └───────────────────────────────┘│                                   │
│  │                                   │ ┌──────────────────────────────┐  │
│  │         [View All 156 Athletes]  │ │ 📅 UPCOMING                  │  │
│  └──────────────────────────────────┘ │                              │  │
│                                        │ • Tomorrow: vs. Oregon (VB) │  │
│  ┌──────────────────────────────────┐ │ • Wed: Practice 3pm         │  │
│  │ ⚡ ACTION FEED                    │ │ • Fri: @ Stanford (VB)      │  │
│  │                                   │ └──────────────────────────────┘  │
│  │ 2m ago   STRESS_SPIKE            │                                   │
│  │ Sarah M. reported stress 9/10    │ ┌──────────────────────────────┐  │
│  │                        [Respond] │ │ 🎯 QUICK ACTIONS             │  │
│  │                                   │ │                              │  │
│  │ 1h ago   ENGAGEMENT_DROP         │ │ [📋 Assign Task]             │  │
│  │ Jake T. hasn't logged in 3 days  │ │ [📨 Send Check-in]           │  │
│  │                        [Respond] │ │ [📊 View Analytics]          │  │
│  │                                   │ │ [🚨 Escalate to Admin]       │  │
│  │ 3h ago   SLUMP_PREDICTION        │ └──────────────────────────────┘  │
│  │ Emma K. 76% likely in 7 days     │                                   │
│  │                        [Respond] │                                   │
│  │                                   │                                   │
│  │           [Load More Actions]    │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Priority Athletes** - Sorted by risk level (CRITICAL → HIGH → MODERATE)
2. **Team Pulse** - Aggregate readiness with trend
3. **Action Feed** - Real-time alerts with quick response
4. **Upcoming Events** - Game day context
5. **Quick Actions** - One-click common tasks

**Alert Types (Action Feed)**:
- `STRESS_SPIKE` - Single metric jump
- `ENGAGEMENT_DROP` - Missed check-ins
- `SLUMP_PREDICTION` - ML prediction triggered
- `BURNOUT_RISK` - Pattern-based warning
- `CRISIS_FLAG` - Governance agent escalation

**Technical Implementation**:
- Real-time updates via WebSocket or polling (30s)
- `SlumpDetector.predict()` for predictions
- `ReadinessEngine` for team pulse
- Risk assessment from `GovernanceAgent`

---

#### D.6 Athlete Detail (`/coach/athlete/[id]`)

**Purpose**: Deep dive into individual athlete - full context for intervention decisions.

**Layout (Desktop)**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Roster          Sarah Mitchell                               │
│                             Volleyball • Setter • Junior                │
│                             Risk: HIGH  Readiness: 64 🟡                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ [Overview] [Timeline] [Correlations] [Predictions] [Interventions] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ══════════════════════════════════════════════════════════════════════ │
│  OVERVIEW TAB                                                           │
│  ══════════════════════════════════════════════════════════════════════ │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────────────┐ │
│  │ CURRENT STATUS             │  │ READINESS BREAKDOWN               │ │
│  │                            │  │                                    │ │
│  │ Archetype: OVERTHINKER     │  │ Overall: 64/100 🟡                │ │
│  │                            │  │                                    │ │
│  │ Mood: 5/10 (↓ from 7)     │  │ Mood Factor:    ███████░░░  68    │ │
│  │ Stress: 8/10 (↑ from 4)   │  │ Sleep Factor:   ████████░░  76    │ │
│  │ Confidence: 5/10 (↓)      │  │ Stress Factor:  █████░░░░░  45    │ │
│  │ Sleep: 6h (↓ from 8h)     │  │ Engagement:     ██████░░░░  62    │ │
│  │                            │  │                                    │ │
│  │ Last Check-in: Today 9am   │  │ Forecast (7d):  61 → 58 → 55     │ │
│  │ Last AI Chat: Yesterday    │  │ (Trending down)                   │ │
│  └────────────────────────────┘  └────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🚨 ACTIVE ALERTS                                                 │   │
│  │                                                                   │   │
│  │ • STRESS_SPIKE: Stress jumped from 4 → 8 in 24 hours            │   │
│  │ • SLUMP_PREDICTION: 76% likelihood of performance slump in 7 days│   │
│  │ • PATTERN: Pre-game anxiety pattern detected (3rd occurrence)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────────────┐ │
│  │ 💬 AI CHAT SUMMARY         │  │ 🎯 COACH ACTIONS                  │ │
│  │                            │  │                                    │ │
│  │ Last session: Pre-game     │  │ [📋 Assign Exercise]              │ │
│  │ anxiety discussion.        │  │ [💬 Send Message]                 │ │
│  │                            │  │ [📅 Schedule Check-in]            │ │
│  │ Key topics:                │  │ [🚨 Escalate to Admin]            │ │
│  │ • Fear of repeating        │  │ [📊 Generate Report]              │ │
│  │   mistakes from last game  │  │                                    │ │
│  │ • Overthinking in-game     │  │ ─────────────────────────         │ │
│  │   decisions                │  │                                    │ │
│  │                            │  │ Recommended Intervention:          │ │
│  │ Techniques used:           │  │ "Pre-Competition Imagery"          │ │
│  │ • Cognitive reframing      │  │ Confidence: 87%                    │ │
│  │ • Process focus            │  │ [Apply Intervention]               │ │
│  │                            │  │                                    │ │
│  │ [View Full Transcript]     │  │                                    │ │
│  └────────────────────────────┘  └────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs**:
1. **Overview** - Current snapshot (shown above)
2. **Timeline** - Chronological history (check-ins, chats, assignments)
3. **Correlations** - What factors affect this athlete (from `CorrelationEngine`)
4. **Predictions** - 7/14/30 day forecasts
5. **Interventions** - History of applied techniques and outcomes

**Key Features**:
1. **Athlete Archetype** - ML classification (OVERTHINKER, BURNOUT_RISK, etc.)
2. **Readiness Breakdown** - Dimensional view of contributing factors
3. **Active Alerts** - All current flags in one place
4. **AI Chat Summary** - Anonymized session highlights
5. **Recommended Intervention** - From `InterventionRecommender`

---

#### D.7 Analytics (`/coach/analytics`)

**Purpose**: Team-wide patterns and insights for strategic decisions.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Analytics                    [Date Range: Last 30 Days ▼]          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ TEAM MOOD HEATMAP                                                  │  │
│  │                                                                    │  │
│  │        Mon  Tue  Wed  Thu  Fri  Sat  Sun                          │  │
│  │ Week 1  🟢  🟢  🟡  🟡  🔴  🟢  🟢                               │  │
│  │ Week 2  🟢  🟢  🟢  🟡  🟡  🟢  🟢                               │  │
│  │ Week 3  🟡  🟢  🟢  🟡  🔴  🟢  🟢                               │  │
│  │ Week 4  🟢  🟡  🟢  🟡  🟡  🟢  🟢                               │  │
│  │                                                                    │  │
│  │ Pattern: Thursdays/Fridays show elevated stress                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────────────┐ │
│  │ CORRELATION MATRIX         │  │ INTERVENTION OUTCOMES             │ │
│  │                            │  │                                    │ │
│  │      Sleep Mood Stress     │  │ Breathing Exercises: 78% effective│ │
│  │ Sleep  1.0  0.7  -0.5     │  │ Cognitive Reframing: 71% effective│ │
│  │ Mood   0.7  1.0  -0.6     │  │ Imagery/Visualization: 82% eff.   │ │
│  │ Stress-0.5 -0.6   1.0     │  │ Process Focus: 75% effective      │ │
│  │                            │  │                                    │ │
│  │ Insight: Sleep is the #1  │  │ [View Detailed Outcomes]           │ │
│  │ predictor of team mood    │  │                                    │ │
│  └────────────────────────────┘  └────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ATHLETE DISTRIBUTION                                              │   │
│  │                                                                   │   │
│  │ By Archetype:                          By Risk Level:            │   │
│  │ ┌─────────────────────────┐           ┌─────────────────────────┐│   │
│  │ │ OVERTHINKER      ████ 12│           │ LOW       █████████ 142 ││   │
│  │ │ BURNOUT_RISK     ██ 6   │           │ MODERATE  ███ 9         ││   │
│  │ │ MOMENTUM_BUILDER ██████ 18│         │ HIGH      █ 3           ││   │
│  │ │ RESILIENT_WARRIOR████████ 24│       │ CRITICAL  ░ 2           ││   │
│  │ │ OTHER            ████████████ 96│   └─────────────────────────┘│   │
│  │ └─────────────────────────┘                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### D.8 Readiness (`/coach/readiness`)

**Purpose**: Game day preparation and lineup optimization.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎯 Readiness                    [Next Event: vs. Oregon (Tomorrow)]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ TEAM READINESS OVERVIEW                                          │   │
│  │                                                                   │   │
│  │     STARTERS (6)           BENCH (8)           TOTAL (14)       │   │
│  │    ┌─────────┐           ┌─────────┐          ┌─────────┐       │   │
│  │    │   72    │           │   78    │          │   75    │       │   │
│  │    │  🟢     │           │  🟢     │          │  🟢     │       │   │
│  │    └─────────┘           └─────────┘          └─────────┘       │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ INDIVIDUAL READINESS                                              │   │
│  │                                                                   │   │
│  │ Player          Position   Score  Status   Key Concern           │   │
│  │ ─────────────────────────────────────────────────────────────    │   │
│  │ Sarah M.        Setter     64 🟡  ⚠️       High stress           │   │
│  │ Emma K.         Outside    78 🟢  ✓        --                    │   │
│  │ Jake T.         Middle     71 🟢  ⚠️       Low engagement        │   │
│  │ Lisa R.         Libero     85 🟢  ✓        --                    │   │
│  │ ...                                                               │   │
│  │                                                                   │   │
│  │ [Export Readiness Report]                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🔮 LINEUP OPTIMIZER                                               │   │
│  │                                                                   │   │
│  │ Recommendation: Consider starting Lisa R. over Sarah M. for      │   │
│  │ first set. Sarah's stress levels suggest she may benefit from    │   │
│  │ entering mid-game when momentum is established.                   │   │
│  │                                                                   │   │
│  │ Confidence: 73%  |  Based on: Historical stress-performance data │   │
│  │                                                                   │   │
│  │ [Apply Recommendation]  [Ignore]  [Learn More]                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## E) Frontend Implementation Plan

### Tech Stack Confirmation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Already in use, RSC support |
| Styling | Tailwind CSS + shadcn/ui | Already in use, extensible |
| State | Zustand | Already in use, lightweight |
| Forms | React Hook Form + Zod | Already in use, type-safe |
| Charts | Recharts | shadcn/ui compatible |
| Real-time | Socket.io or SSE | Streaming chat, live updates |
| Mobile | React Native / Expo | Already in use |

### File Structure (New Components)

```
apps/web/src/
├── app/
│   ├── (athlete)/
│   │   ├── home/
│   │   │   └── page.tsx                    # NEW: Athlete landing
│   │   ├── chat/
│   │   │   ├── page.tsx                    # REFACTOR: Enhanced chat
│   │   │   └── [sessionId]/page.tsx
│   │   ├── check-in/
│   │   │   └── page.tsx                    # NEW: Daily check-in flow
│   │   └── progress/
│   │       └── page.tsx                    # NEW: Goals + trends
│   │
│   └── (coach)/
│       ├── command-center/
│       │   └── page.tsx                    # NEW: Triage dashboard
│       ├── roster/
│       │   └── page.tsx                    # REFACTOR: Enhanced roster
│       ├── athlete/
│       │   └── [id]/
│       │       └── page.tsx                # NEW: Deep dive view
│       ├── analytics/
│       │   └── page.tsx                    # REFACTOR: Team analytics
│       └── readiness/
│           └── page.tsx                    # REFACTOR: Readiness view
│
├── components/
│   ├── athlete/
│   │   ├── ReadinessGauge.tsx              # NEW
│   │   ├── MoodSlider.tsx                  # NEW
│   │   ├── InsightCard.tsx                 # NEW
│   │   ├── DailyCheckInForm.tsx            # NEW
│   │   ├── GoalProgressCard.tsx            # NEW
│   │   └── TrendChart.tsx                  # NEW
│   │
│   ├── chat/
│   │   ├── ChatInterface.tsx               # REFACTOR: Streaming + context
│   │   ├── ChatBubble.tsx                  # NEW: Styled messages
│   │   ├── StreamingText.tsx               # NEW: Typewriter effect
│   │   ├── VoiceInput.tsx                  # NEW: Speech-to-text
│   │   ├── RoutineSuggestion.tsx           # NEW: Inline routine card
│   │   └── ChatSessionMenu.tsx             # NEW: History/new/export
│   │
│   ├── coach/
│   │   ├── PriorityAthleteList.tsx         # REFACTOR
│   │   ├── ActionFeedItem.tsx              # REFACTOR
│   │   ├── TeamPulseGauge.tsx              # NEW
│   │   ├── AthleteDetailTabs.tsx           # NEW
│   │   ├── CorrelationMatrix.tsx           # REFACTOR
│   │   ├── LineupOptimizer.tsx             # NEW
│   │   └── InterventionRecommendation.tsx  # NEW
│   │
│   └── shared/
│       ├── RiskBadge.tsx                   # NEW
│       ├── TrendIndicator.tsx              # NEW
│       ├── QuickStatsGrid.tsx              # REFACTOR
│       └── EmptyState.tsx                  # Existing
│
├── hooks/
│   ├── useStreamingChat.ts                 # NEW: WebSocket chat hook
│   ├── useReadiness.ts                     # NEW: Readiness data hook
│   ├── useAthleteInsights.ts               # NEW: ML insights hook
│   └── useRealTimeAlerts.ts                # NEW: Live alert subscription
│
└── lib/
    ├── mcp-client.ts                       # NEW: MCP server API client
    └── analytics.ts                        # NEW: Tracking helpers
```

### Implementation Priorities

#### Phase 1: Core Chat Experience (Week 1-2)
1. Streaming chat with `useStreamingChat` hook
2. `ChatBubble` with typewriter animation
3. Session context persistence
4. Voice input integration (Web Speech API)

#### Phase 2: Athlete Home & Check-In (Week 2-3)
1. `ReadinessGauge` component
2. `DailyCheckInForm` with slider inputs
3. `InsightCard` for ML-generated insights
4. Quick-start chat from home

#### Phase 3: Coach Command Center (Week 3-4)
1. `PriorityAthleteList` with risk sorting
2. `ActionFeedItem` with real-time updates
3. `TeamPulseGauge` aggregate view
4. Quick action buttons

#### Phase 4: Athlete Detail Deep Dive (Week 4-5)
1. `AthleteDetailTabs` navigation
2. `CorrelationMatrix` visualization
3. `InterventionRecommendation` cards
4. AI chat summary display

#### Phase 5: Analytics & Readiness (Week 5-6)
1. Team heatmap visualization
2. `LineupOptimizer` recommendations
3. Export functionality
4. Forecast charts

---

## F) Phased Rollout Plan

### Phase 1: Foundation (Week 1-2)
**Goal**: Establish core chat experience and design system.

| Task | Priority | Effort |
|------|----------|--------|
| Set up design tokens in Tailwind config | HIGH | S |
| Create base component library (Button, Card, Badge, Avatar) | HIGH | M |
| Implement `ChatBubble` with streaming animation | HIGH | M |
| Build `useStreamingChat` hook for MCP integration | HIGH | L |
| Add voice input to chat (Web Speech API) | MEDIUM | M |
| Create `ChatSessionMenu` for history navigation | MEDIUM | S |

**Exit Criteria**: Athlete can have a streaming conversation with the AI coach.

---

### Phase 2: Athlete Daily Loop (Week 2-3)
**Goal**: Complete athlete home and check-in experience.

| Task | Priority | Effort |
|------|----------|--------|
| Build `ReadinessGauge` circular progress component | HIGH | M |
| Create `MoodSlider` with emoji feedback | HIGH | S |
| Implement `DailyCheckInForm` complete flow | HIGH | M |
| Build Athlete Home page with all sections | HIGH | L |
| Create `InsightCard` for ML insights display | MEDIUM | S |
| Add check-in → chat transition flow | MEDIUM | S |

**Exit Criteria**: Athlete can complete full daily loop (check-in → home → chat → progress).

---

### Phase 3: Coach Triage (Week 3-4)
**Goal**: Enable coaches to identify and respond to priority athletes.

| Task | Priority | Effort |
|------|----------|--------|
| Build Command Center page layout | HIGH | L |
| Create `PriorityAthleteList` with risk sorting | HIGH | M |
| Implement `ActionFeedItem` with alert types | HIGH | M |
| Build `TeamPulseGauge` aggregate component | HIGH | S |
| Add real-time updates via SSE/WebSocket | MEDIUM | L |
| Create quick action buttons (assign, message, escalate) | MEDIUM | M |

**Exit Criteria**: Coach can identify top 5 priority athletes and take action within 30 seconds.

---

### Phase 4: Deep Dive & Analytics (Week 4-5)
**Goal**: Provide comprehensive athlete view and team-wide insights.

| Task | Priority | Effort |
|------|----------|--------|
| Build Athlete Detail page with tabs | HIGH | L |
| Create Timeline view (chronological history) | HIGH | M |
| Implement `CorrelationMatrix` heatmap | MEDIUM | L |
| Build `InterventionRecommendation` card | MEDIUM | M |
| Create Team Analytics page | MEDIUM | L |
| Add Archetype distribution visualization | LOW | S |

**Exit Criteria**: Coach can understand an athlete's full history and patterns in < 2 minutes.

---

### Phase 5: Readiness & Polish (Week 5-6)
**Goal**: Game-day features and production polish.

| Task | Priority | Effort |
|------|----------|--------|
| Build Readiness page with per-athlete scores | HIGH | L |
| Implement `LineupOptimizer` recommendations | MEDIUM | L |
| Add export functionality (PDF reports) | MEDIUM | M |
| Mobile-optimize all screens | HIGH | L |
| Accessibility audit and fixes | HIGH | M |
| Performance optimization (lazy loading, caching) | MEDIUM | M |

**Exit Criteria**: Full feature parity between web and mobile, WCAG 2.1 AA compliant.

---

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Athletes | 70%+ of roster | Analytics |
| Avg. Check-in Time | < 30 seconds | Event tracking |
| Chat Sessions/Week | 3+ per athlete | Session counts |
| Coach Triage Time | < 5 seconds to identify priority | User testing |
| Athlete NPS | > 50 | Quarterly survey |

---

## Appendix: API Integration Map

| UI Feature | MCP Endpoint | Notes |
|------------|--------------|-------|
| Readiness Gauge | `ReadinessEngine.calculate_readiness()` | Real-time calc |
| Streaming Chat | `/v1/chat/stream` | WebSocket/SSE |
| Slump Prediction | `SlumpDetector.predict()` | 88.46% accuracy |
| Intervention Rec | `InterventionRecommender.recommend()` | Top 3 with scores |
| Correlations | `CorrelationEngine.analyze()` | Per-athlete factors |
| Routines | `RoutineBuilder.generate_routine()` | Sport-specific |
| Risk Assessment | `GovernanceAgent.assess_risk()` | Crisis detection |
| Team Analytics | `CoachAgent.generate_team_insights()` | Aggregated view |

---

**End of UI/UX Redesign Plan**
