# Enterprise Platform Architecture - Complete Rebuild

**Version**: 2.0
**Date**: 2025-12-13
**Branch**: `feature/enterprise-platform-upgrade`

---

## Executive Summary

This document outlines the complete architectural redesign of the AI Sports Agent platform with four core modules:

1. **Tasks & Goals Module** - AI-powered task management with sports psychology integration
2. **Settings Section** - Professional user preferences and configuration
3. **Coach & Athlete Authentication** - Separate signup flows with role-based routing
4. **Error Handling Framework** - Enterprise-grade error management system

**Design Principles**:
- ✅ **Sports Psychology First**: Every feature grounded in mental performance science
- ✅ **AI-Enhanced**: Intelligent suggestions, pattern detection, performance insights
- ✅ **Modular & Scalable**: Clean separation of concerns, easy to extend
- ✅ **User-Centric**: Intuitive UX for athletes and coaches
- ✅ **Enterprise-Grade**: Robust error handling, logging, monitoring

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Module 1: Tasks & Goals](#module-1-tasks--goals)
3. [Module 2: Settings Section](#module-2-settings-section)
4. [Module 3: Coach & Athlete Auth](#module-3-coach--athlete-auth)
5. [Module 4: Error Handling Framework](#module-4-error-handling-framework)
6. [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces)
7. [Backend API Specifications](#backend-api-specifications)
8. [Frontend Components](#frontend-components)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Testing Strategy](#testing-strategy)

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App (React Native/Expo)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Auth Flow   │  │  Dashboard   │  │   Settings   │         │
│  │ Coach/Athlete│  │   (Home)     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Tasks/Goals  │  │     Chat     │  │  Assignments │         │
│  │   Module     │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Error Handling Framework (Global)               │   │
│  │  ErrorBanner | SuccessBanner | Logger | Retry Logic    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ REST API / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Next.js API Routes (TypeScript)      FastAPI (Python)         │
│  ┌────────────────────┐              ┌─────────────────┐       │
│  │  /api/auth/*       │              │  AI/MCP Agents  │       │
│  │  /api/tasks/*      │◄────────────►│  Voice Chat     │       │
│  │  /api/goals/*      │              │  KB Retrieval   │       │
│  │  /api/settings/*   │              └─────────────────┘       │
│  │  /api/users/*      │                                        │
│  └────────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL (Supabase)              Redis Cache                │
│  ┌────────────────────┐             ┌─────────────────┐        │
│  │  Users             │             │  Session Data   │        │
│  │  Tasks             │             │  Rate Limits    │        │
│  │  Goals             │             │  Temp Storage   │        │
│  │  Settings          │             └─────────────────┘        │
│  │  Assignments       │                                        │
│  │  Chat Sessions     │                                        │
│  └────────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Confirmation

**Mobile Frontend**:
- React Native 0.81.5 + Expo SDK 54
- TypeScript 5.7.3
- Expo Router for navigation
- Zustand for state management
- React Query for data fetching
- Axios for HTTP requests

**Backend**:
- Next.js 14 API Routes (TypeScript) - CRUD operations
- FastAPI (Python) - AI/MCP agents, voice chat
- Prisma ORM for PostgreSQL
- SQLAlchemy for Python models

**Database**:
- PostgreSQL 15+ (Supabase hosted)
- Redis (optional, for caching)

**Authentication**:
- JWT tokens stored in SecureStore
- Role-based access control (ATHLETE, COACH, ADMIN)

---

## Module 1: Tasks & Goals

### Overview

Transform basic goal tracking into a comprehensive AI-enhanced task management system that optimizes cognitive load, builds discipline patterns, and prepares athletes for peak performance states.

### Sports Psychology Foundation

**Core Principles**:
1. **Cognitive Load Management**: Prevent mental fatigue by intelligently distributing tasks
2. **Discipline Pattern Building**: Track completion habits to identify commitment levels
3. **Mental Readiness Optimization**: Daily tasks prepare athletes for optimal performance
4. **Goal Hierarchy**: Long-term goals → Short-term milestones → Daily actions

**Research Grounding**:
- Locke & Latham's Goal-Setting Theory
- Baumeister's Ego Depletion research
- Flow State prerequisites (Csikszentmihalyi)

### Feature Specifications

#### 1.1 Goal Hierarchy System

```
Long-Term Goals (3-12 months)
    ↓
Short-Term Goals (1-4 weeks)
    ↓
Daily Tasks (actionable items)
```

**Long-Term Goals**:
- Category: PERFORMANCE | MENTAL | ACADEMIC | PERSONAL
- Timeline: 3-12 months
- Measurable target (e.g., "Improve free throw % from 65% to 80%")
- Breakdown into 3-5 short-term milestones

**Short-Term Goals**:
- Linked to parent long-term goal
- Timeline: 1-4 weeks
- Concrete, measurable outcomes
- Automatically suggest daily tasks

**Daily Tasks**:
- Linked to short-term goal (optional)
- Priority: HIGH | MEDIUM | LOW
- Estimated time: 15m, 30m, 1h, 2h+
- Due date/time
- Tags: #practice, #mental, #recovery, #academic
- Completion %: 0%, 25%, 50%, 75%, 100%
- Notes/reflections

#### 1.2 AI-Powered Features

**Auto-Suggestions** (`GET /api/tasks/suggestions`):
```typescript
// Based on athlete's current goals, sport, and performance patterns
{
  "suggestions": [
    {
      "task": "10-minute pre-practice visualization",
      "reason": "You mentioned pre-game anxiety in chat. Visualization helps.",
      "priority": "HIGH",
      "estimatedTime": "15m",
      "tags": ["#mental", "#practice"],
      "linkedGoal": "goal-uuid-123"
    },
    {
      "task": "Review game film from last match",
      "reason": "Part of your weekly preparation routine",
      "priority": "MEDIUM",
      "estimatedTime": "1h",
      "tags": ["#performance", "#preparation"]
    }
  ]
}
```

**Pattern Detection** (`GET /api/tasks/patterns`):
```typescript
{
  "patterns": {
    "completionRate": {
      "overall": 0.72,  // 72% completion rate
      "byCategory": {
        "PERFORMANCE": 0.85,
        "MENTAL": 0.65,  // Low - flag for intervention
        "ACADEMIC": 0.70
      },
      "byTimeOfDay": {
        "morning": 0.80,   // Most productive
        "afternoon": 0.65,
        "evening": 0.60
      }
    },
    "disciplineStreak": {
      "current": 5,  // 5 days in a row completing tasks
      "longest": 14,
      "trend": "improving"
    },
    "cognitiveLoad": {
      "currentWeek": 12,  // Total hours of tasks
      "recommendation": "You're at optimal load. Don't add more tasks.",
      "status": "OPTIMAL"  // LOW | OPTIMAL | HIGH | OVERLOAD
    },
    "procrastinationRisk": [
      {
        "task": "Complete psychology homework",
        "riskLevel": "HIGH",
        "reason": "Postponed 3 times, deadline approaching"
      }
    ]
  }
}
```

**Performance Reflections** (AI-generated prompts):
```typescript
{
  "reflectionPrompts": [
    {
      "type": "completion",
      "prompt": "You completed your visualization practice today. How did it impact your focus during drills?",
      "taskId": "task-uuid-123"
    },
    {
      "type": "pattern",
      "prompt": "You've completed mental training 5 days straight - a new record! What's helped you stay consistent?",
      "pattern": "disciplineStreak"
    },
    {
      "type": "cognitive_load",
      "prompt": "You're at 18 hours of tasks this week (high load). Which tasks could be postponed to reduce stress?",
      "recommendation": "REDUCE_LOAD"
    }
  ]
}
```

#### 1.3 UI/UX Layout

**Tasks Tab** (`apps/mobile/app/(tabs)/tasks.tsx`):

```
┌─────────────────────────────────────────┐
│  Tasks & Goals               [+ Add]    │
├─────────────────────────────────────────┤
│                                         │
│  Today's Tasks                    3/5   │
│  ┌─────────────────────────────────┐   │
│  │ ☑ Morning visualization   #mental│   │
│  │   Completed 8:30 AM             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Review opponent film    HIGH  │   │
│  │   Due: 3:00 PM • 1h  #performance│  │
│  │   [Start] [Postpone]            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Complete stats homework  MED  │   │
│  │   Due: Tonight • 30m  #academic │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  AI Suggestions (based on your goals)  │
│  ┌─────────────────────────────────┐   │
│  │ 💡 Pre-practice breathing       │   │
│  │    You mentioned anxiety in chat│   │
│  │    [Add to Tasks]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Short-Term Goals (This Month)         │
│  ┌─────────────────────────────────┐   │
│  │ 🎯 Improve FT% to 75%      68%  │   │
│  │    3 weeks left                 │   │
│  │    [View Details]               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🧠 Build pre-game routine  40%  │   │
│  │    [Add Daily Task]             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [View All Goals] [Patterns]           │
│                                         │
└─────────────────────────────────────────┘
```

**Task Detail View**:

```
┌─────────────────────────────────────────┐
│  ← Review opponent film                 │
├─────────────────────────────────────────┤
│                                         │
│  Priority: HIGH                         │
│  Estimated Time: 1 hour                 │
│  Due: Today, 3:00 PM                    │
│                                         │
│  Linked Goal:                           │
│  → Improve defensive positioning (75%)  │
│                                         │
│  Tags: #performance #preparation        │
│                                         │
│  Notes:                                 │
│  ┌─────────────────────────────────┐   │
│  │ Focus on their pick-and-roll    │   │
│  │ plays and transition defense.   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Attachments: (none)                    │
│  [+ Add Attachment]                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Mark Complete] [Edit] [Delete]        │
│                                         │
└─────────────────────────────────────────┘
```

**Patterns Dashboard**:

```
┌─────────────────────────────────────────┐
│  ← Your Discipline Patterns             │
├─────────────────────────────────────────┤
│                                         │
│  Completion Rate: 72%                   │
│  ╔════════════════════════════╗        │
│  ║█████████████████░░░░░░░░░░░║        │
│  ╚════════════════════════════╝        │
│  Up 8% from last month 📈               │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  By Category:                           │
│  Performance:  85% ████████            │
│  Mental:       65% ██████ (needs focus)│
│  Academic:     70% ███████             │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Discipline Streak: 🔥 5 days          │
│  Best Streak: 14 days                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Cognitive Load: OPTIMAL ✅             │
│  This week: 12 hours of tasks          │
│  Recommendation: You're at the sweet   │
│  spot. Don't add more tasks.           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Procrastination Risk:                 │
│  ⚠️ "Complete psych homework"          │
│     Postponed 3 times, due tomorrow    │
│                                         │
└─────────────────────────────────────────┘
```

### Data Model

See [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces) section below.

---

## Module 2: Settings Section

### Overview

Professional, comprehensive settings interface for user preferences, AI personalization, privacy controls, and account management.

### Feature Specifications

#### 2.1 Settings Categories

**Profile Settings**:
- Name, email (read-only after signup)
- Profile photo upload
- Sport, position, year (athletes only)
- Sports coached, organization (coaches only)
- Bio/about me

**Notification Preferences**:
- Push notifications toggle (global on/off)
- Task reminders (15m before, 1h before, day before)
- Goal milestone notifications
- Assignment notifications (coaches only)
- Chat message notifications
- Weekly summary emails
- Crisis alert notifications (coaches only)

**Privacy Settings**:
- Allow coach to view chat summaries (athletes only)
- Share mood logs with coach (athletes only)
- Share goal progress with coach (athletes only)
- Data retention preferences
- Export my data (GDPR compliance)
- Delete my account

**AI Personalization**:
- Conversation style: Supportive | Direct | Balanced
- Language formality: Casual | Professional
- AI response length: Concise | Detailed
- Enable auto-suggestions for tasks
- Enable pattern detection insights
- Voice chat preferences (speed, accent)

**Sport-Specific Configurations**:
- Primary sport: [dropdown]
- Secondary sports: [multi-select]
- Competition level: High School | College | Professional
- Season status: Pre-season | In-season | Off-season | Post-season
- Training focus areas: [tags]

**Session History & Data**:
- View all chat sessions
- Export chat history (PDF/JSON)
- View mood log history
- Export goals and tasks (CSV)
- View analytics dashboard

**Account Management**:
- Change password
- Email preferences
- Two-factor authentication (future)
- Connected accounts (future: wearables)

**Theme & Display**:
- Dark mode / Light mode / Auto
- Font size: Small | Medium | Large
- Color scheme preferences

#### 2.2 UI/UX Layout

**Settings Tab** (`apps/mobile/app/(tabs)/settings.tsx`):

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│                                         │
│  PROFILE                                │
│  ┌─────────────────────────────────┐   │
│  │  [Photo] Sarah Johnson          │   │
│  │  Basketball • Junior            │   │
│  │  sarah.j@university.edu         │   │
│  │                          [Edit] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  NOTIFICATIONS                    ──────│
│  Push Notifications            [ON]     │
│  Task Reminders                [ON]     │
│  Weekly Summaries              [ON]     │
│                                         │
│  PRIVACY                          ──────│
│  Share chat summaries (coach)  [ON]     │
│  Share mood logs               [OFF]    │
│  Share goal progress           [ON]     │
│                                         │
│  AI PERSONALIZATION               ──────│
│  Conversation Style:   Supportive ▼     │
│  Response Length:      Detailed ▼       │
│  Auto-suggestions              [ON]     │
│                                         │
│  SPORT CONFIGURATION              ──────│
│  Primary Sport:        Basketball       │
│  Season Status:        In-Season        │
│  Training Focus:       [Edit Tags]      │
│                                         │
│  DATA & HISTORY                   ──────│
│  › View Chat History                    │
│  › Export My Data                       │
│  › Analytics Dashboard                  │
│                                         │
│  ACCOUNT                          ──────│
│  › Change Password                      │
│  › Manage Email Preferences             │
│  › Delete Account                       │
│                                         │
│  APPEARANCE                       ──────│
│  Theme:                Dark Mode ▼      │
│  Font Size:            Medium ▼         │
│                                         │
│  ABOUT                            ──────│
│  App Version:          2.0.0            │
│  Privacy Policy                         │
│  Terms of Service                       │
│  Contact Support                        │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Log Out]                              │
│                                         │
└─────────────────────────────────────────┘
```

**Notification Settings Detail**:

```
┌─────────────────────────────────────────┐
│  ← Notification Settings                │
├─────────────────────────────────────────┤
│                                         │
│  Push Notifications                     │
│  ────────────────── [ON]                │
│  Enable all push notifications          │
│                                         │
│  Task Reminders              [ON]       │
│  ┌─────────────────────────────────┐   │
│  │ Remind me:                      │   │
│  │ ☑ 15 minutes before             │   │
│  │ ☑ 1 hour before                 │   │
│  │ ☐ Day before                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Goal Milestones             [ON]       │
│  Get notified when you reach goal       │
│  milestones and completion targets.     │
│                                         │
│  Assignment Notifications    [ON]       │
│  New assignments from your coach        │
│                                         │
│  Chat Messages               [OFF]      │
│  AI responses in ongoing chats          │
│                                         │
│  Weekly Summary Email        [ON]       │
│  Sent every Sunday at 6:00 PM          │
│  [Change Schedule]                      │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Quiet Hours (Beta)                     │
│  ┌─────────────────────────────────┐   │
│  │ From: 10:00 PM                  │   │
│  │ To:   7:00 AM                   │   │
│  │ No notifications during these   │   │
│  │ hours (except crisis alerts)    │   │
│  └─────────────────────────────────┘   │
│  [Enable Quiet Hours]                   │
│                                         │
└─────────────────────────────────────────┘
```

### Data Model

See [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces) section below.

---

## Module 3: Coach & Athlete Auth

### Overview

Completely separate signup and login flows for coaches vs athletes, with role-specific onboarding and data collection.

### Feature Specifications

#### 3.1 Welcome Screen (Unauthenticated)

**Route**: `apps/mobile/app/(auth)/welcome.tsx`

```
┌─────────────────────────────────────────┐
│                                         │
│          [App Logo/Icon]                │
│                                         │
│      AI Sports Agent                    │
│   Mental Performance Made Accessible    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  I am a...                              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         🏀 ATHLETE              │   │
│  │  Get 24/7 mental performance    │   │
│  │  support from AI coach          │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         🎓 COACH                │   │
│  │  Monitor your athletes' mental  │   │
│  │  health and team insights       │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Already have an account?               │
│  [Sign In]                              │
│                                         │
└─────────────────────────────────────────┘
```

#### 3.2 Athlete Signup Flow

**Route**: `apps/mobile/app/(auth)/signup/athlete.tsx`

**Step 1: Basic Info**
```
┌─────────────────────────────────────────┐
│  ← Create Athlete Account    [1/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Full Name *                            │
│  ┌─────────────────────────────────┐   │
│  │ Sarah Johnson                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Email Address *                        │
│  ┌─────────────────────────────────┐   │
│  │ sarah.j@university.edu          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Password *                             │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••                      │   │
│  └─────────────────────────────────┘   │
│  Must be at least 8 characters          │
│                                         │
│  Confirm Password *                     │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Next: Sport Info]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Sport Info**
```
┌─────────────────────────────────────────┐
│  ← Sport Information          [2/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Primary Sport *                        │
│  ┌─────────────────────────────────┐   │
│  │ Basketball               ▼      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Position *                             │
│  ┌─────────────────────────────────┐   │
│  │ Point Guard              ▼      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Year *                                 │
│  ┌─────────────────────────────────┐   │
│  │ Junior                   ▼      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Team/Organization (optional)           │
│  ┌─────────────────────────────────┐   │
│  │ University Basketball Team      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Age                                    │
│  ┌─────────────────────────────────┐   │
│  │ 20                              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Next: Privacy Settings]               │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Privacy & Consent**
```
┌─────────────────────────────────────────┐
│  ← Privacy Settings           [3/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Coach Access                           │
│                                         │
│  ☑ Allow my coach to view anonymized   │
│    chat summaries                       │
│                                         │
│  ☐ Allow my coach to view my mood      │
│    logs and trends                      │
│                                         │
│  ☐ Allow my coach to view my goal      │
│    progress                             │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Terms & Conditions                     │
│                                         │
│  ☑ I agree to the Terms of Service     │
│    and Privacy Policy                   │
│                                         │
│  ☑ I understand that this is NOT a     │
│    replacement for professional        │
│    mental health care                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Create Account]                       │
│                                         │
│  By creating an account, you consent    │
│  to data collection as outlined in      │
│  our Privacy Policy.                    │
│                                         │
└─────────────────────────────────────────┘
```

#### 3.3 Coach Signup Flow

**Route**: `apps/mobile/app/(auth)/signup/coach.tsx`

**Step 1: Basic Info**
```
┌─────────────────────────────────────────┐
│  ← Create Coach Account       [1/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Full Name *                            │
│  ┌─────────────────────────────────┐   │
│  │ Dr. Michael Chen                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Email Address *                        │
│  ┌─────────────────────────────────┐   │
│  │ mchen@university.edu            │   │
│  └─────────────────────────────────┘   │
│  (Use your official organization email) │
│                                         │
│  Password *                             │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Confirm Password *                     │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Next: Coaching Info]                  │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Coaching Info**
```
┌─────────────────────────────────────────┐
│  ← Coaching Information       [2/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Sports You Coach * (select all)        │
│  ┌─────────────────────────────────┐   │
│  │ ☑ Basketball                    │   │
│  │ ☐ Football                      │   │
│  │ ☐ Soccer                        │   │
│  │ ☐ Volleyball                    │   │
│  │ ☐ Track & Field                 │   │
│  │ [+ Add Custom Sport]            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Organization/School *                  │
│  ┌─────────────────────────────────┐   │
│  │ University of Washington        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Title/Role *                           │
│  ┌─────────────────────────────────┐   │
│  │ Sports Psychologist      ▼      │   │
│  └─────────────────────────────────┘   │
│  Options: Sports Psychologist,          │
│  Head Coach, Assistant Coach, etc.      │
│                                         │
│  Years of Experience                    │
│  ┌─────────────────────────────────┐   │
│  │ 8                               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Certifications (optional)              │
│  ┌─────────────────────────────────┐   │
│  │ CMPC, PhD Sport Psychology      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Next: Verification]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Verification & Consent**
```
┌─────────────────────────────────────────┐
│  ← Verification               [3/3]      │
├─────────────────────────────────────────┤
│                                         │
│  Organization Email Verification        │
│                                         │
│  We've sent a verification code to:     │
│  mchen@university.edu                   │
│                                         │
│  Enter Code:                            │
│  ┌─────────────────────────────────┐   │
│  │ [_] [_] [_] [_] [_] [_]         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Didn't receive? [Resend Code]          │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Privacy & Ethics                       │
│                                         │
│  ☑ I will only view athlete data with   │
│    explicit consent                     │
│                                         │
│  ☑ I understand FERPA/HIPAA compliance  │
│    requirements                         │
│                                         │
│  ☑ I will use this platform to support  │
│    athletes, not surveil them           │
│                                         │
│  ☑ I agree to the Coach Code of Conduct │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Create Coach Account]                 │
│                                         │
└─────────────────────────────────────────┘
```

#### 3.4 Unified Login Screen

**Route**: `apps/mobile/app/(auth)/login.tsx`

```
┌─────────────────────────────────────────┐
│  ← Sign In                              │
├─────────────────────────────────────────┤
│                                         │
│  Email Address                          │
│  ┌─────────────────────────────────┐   │
│  │ user@email.com                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Password                               │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Forgot Password?]                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Sign In]                              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Don't have an account?                 │
│  [Sign Up as Athlete] [Sign Up as Coach]│
│                                         │
└─────────────────────────────────────────┘
```

#### 3.5 Role-Based Routing After Login

```typescript
// After successful login, route based on user.role
if (user.role === 'ATHLETE') {
  router.replace('/(tabs)/dashboard');  // Athlete dashboard
} else if (user.role === 'COACH') {
  router.replace('/(coach)/dashboard');  // Coach dashboard
} else if (user.role === 'ADMIN') {
  router.replace('/(admin)/dashboard');  // Admin dashboard
}
```

### Data Model

See [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces) section below.

---

## Module 4: Error Handling Framework

### Overview

Enterprise-grade error handling system with user-friendly messages, technical logging, reusable components, and automatic retry logic.

### Feature Specifications

#### 4.1 Error Categories

**Network Errors**:
- Connection timeout
- Server unreachable
- Network disconnected
- Request timeout

**Authentication Errors**:
- Invalid credentials
- Token expired
- Unauthorized access
- Account suspended

**Validation Errors**:
- Invalid email format
- Password too weak
- Required field missing
- Invalid input format

**Server Errors**:
- 500 Internal Server Error
- 503 Service Unavailable
- 429 Too Many Requests (rate limiting)
- Database connection failed

**Client Errors**:
- Component crash
- State corruption
- Cache failure
- Unexpected data format

#### 4.2 Error Handling Strategy

**User-Facing Messages** (Simple, actionable):
```typescript
const USER_FRIENDLY_MESSAGES = {
  NETWORK_ERROR: "Couldn't connect to the server. Check your internet connection.",
  AUTH_EXPIRED: "Your session has expired. Please sign in again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Something went wrong on our end. We're working on it.",
  RATE_LIMIT: "You're doing that too quickly. Please wait a moment.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
};
```

**Technical Logging** (Detailed, for debugging):
```typescript
interface ErrorLog {
  id: string;
  timestamp: string;
  errorType: ErrorType;
  message: string;
  stack?: string;
  userId?: string;
  context: {
    route: string;
    action: string;
    requestId?: string;
    deviceInfo: DeviceInfo;
  };
  metadata?: Record<string, any>;
}

// Log to backend for monitoring
await logError({
  errorType: 'NETWORK_ERROR',
  message: error.message,
  stack: error.stack,
  userId: currentUser?.id,
  context: {
    route: pathname,
    action: 'FETCH_TASKS',
    requestId: response.headers['x-request-id'],
    deviceInfo: {
      platform: Platform.OS,
      version: Platform.Version,
      appVersion: Constants.expoConfig?.version
    }
  }
});
```

#### 4.3 Reusable UI Components

**ErrorBanner Component** (`apps/mobile/components/ui/ErrorBanner.tsx`):

```typescript
interface ErrorBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Usage:
<ErrorBanner
  message="Couldn't load your tasks. Check your connection."
  type="error"
  dismissible={true}
  action={{
    label: "Retry",
    onPress: () => refetch()
  }}
/>
```

Visual:
```
┌─────────────────────────────────────────┐
│  ❌ Couldn't load your tasks. Check     │
│     your connection.                    │
│                         [Retry] [✕]     │
└─────────────────────────────────────────┘
```

**SuccessBanner Component** (`apps/mobile/components/ui/SuccessBanner.tsx`):

```typescript
interface SuccessBannerProps {
  message: string;
  autoDismiss?: boolean;
  duration?: number;  // milliseconds
}

// Usage:
<SuccessBanner
  message="Task completed! 🎉"
  autoDismiss={true}
  duration={3000}
/>
```

Visual:
```
┌─────────────────────────────────────────┐
│  ✅ Task completed! 🎉                  │
└─────────────────────────────────────────┘
```

**ErrorView Component** (Full-screen error state):

```typescript
interface ErrorViewProps {
  title: string;
  description: string;
  icon?: 'network' | 'server' | 'generic';
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Usage:
<ErrorView
  title="No Internet Connection"
  description="Make sure you're connected to WiFi or cellular data."
  icon="network"
  action={{
    label: "Try Again",
    onPress: () => refetch()
  }}
/>
```

Visual:
```
┌─────────────────────────────────────────┐
│                                         │
│            [Network Icon]               │
│                                         │
│      No Internet Connection             │
│                                         │
│  Make sure you're connected to WiFi     │
│  or cellular data.                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      [Try Again]                │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### 4.4 Automatic Retry Logic

```typescript
// Retry utility with exponential backoff
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;  // milliseconds
  maxDelay: number;
  exponential: boolean;
  retryOn?: (error: Error) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponential: true,
    retryOn: (error) => error.name === 'NetworkError'
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if we shouldn't
      if (options.retryOn && !options.retryOn(lastError)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === options.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = options.exponential
        ? Math.min(options.baseDelay * Math.pow(2, attempt), options.maxDelay)
        : options.baseDelay;

      console.log(`Retry attempt ${attempt + 1}/${options.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage:
const tasks = await withRetry(
  () => apiClient.get('/api/tasks'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    exponential: true
  }
);
```

#### 4.5 Global Error Handler

```typescript
// apps/mobile/lib/errorHandler.ts

import { Alert } from 'react-native';

export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance() {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handle(error: Error, context?: ErrorContext) {
    // 1. Log to backend
    await this.logError(error, context);

    // 2. Show user-friendly message
    const userMessage = this.getUserMessage(error);
    this.showError(userMessage);

    // 3. Track analytics (optional)
    this.trackError(error, context);

    // 4. Check if critical (requires immediate action)
    if (this.isCritical(error)) {
      this.handleCriticalError(error);
    }
  }

  private getUserMessage(error: Error): string {
    if (error.name === 'NetworkError') {
      return USER_FRIENDLY_MESSAGES.NETWORK_ERROR;
    }
    if (error.name === 'AuthenticationError') {
      return USER_FRIENDLY_MESSAGES.AUTH_EXPIRED;
    }
    if (error.name === 'ValidationError') {
      return USER_FRIENDLY_MESSAGES.VALIDATION_ERROR;
    }
    if (error.name === 'ServerError') {
      return USER_FRIENDLY_MESSAGES.SERVER_ERROR;
    }
    return USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR;
  }

  private showError(message: string) {
    Alert.alert('Error', message, [
      { text: 'OK', style: 'default' }
    ]);
  }

  private async logError(error: Error, context?: ErrorContext) {
    try {
      await fetch(`${API_URL}/api/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          context
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private isCritical(error: Error): boolean {
    return error.name === 'CrisisDetectedError' ||
           error.name === 'DataCorruptionError';
  }

  private handleCriticalError(error: Error) {
    // Escalate to support team, show urgent message, etc.
    Alert.alert(
      'Critical Error',
      'A critical issue occurred. Our team has been notified.',
      [{ text: 'OK', style: 'destructive' }]
    );
  }
}

// Global error boundary hook
export function useErrorHandler() {
  return {
    handle: (error: Error, context?: ErrorContext) => {
      ErrorHandler.getInstance().handle(error, context);
    }
  };
}
```

### Data Model

See [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces) section below.

---

## Data Models & TypeScript Interfaces

### Database Schema Extensions (Prisma)

```prisma
// apps/web/prisma/schema.prisma

// ===== TASKS & GOALS MODULE =====

model Task {
  id              String        @id @default(uuid())
  athleteId       String
  title           String
  description     String?
  category        TaskCategory  @default(OTHER)
  priority        TaskPriority  @default(MEDIUM)
  status          TaskStatus    @default(TODO)
  estimatedTime   Int?          // minutes
  dueDate         DateTime?
  completionPct   Int           @default(0)  // 0-100
  notes           String?
  tags            String[]      // ["#mental", "#practice"]
  attachments     Json?         // URLs to files

  // AI features
  aiSuggested     Boolean       @default(false)
  aiReason        String?       // Why AI suggested this

  // Linking
  goalId          String?       // Link to parent goal
  goal            Goal?         @relation(fields: [goalId], references: [id])

  // Metadata
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  completedAt     DateTime?

  athlete         Athlete       @relation(fields: [athleteId], references: [userId])

  @@index([athleteId, dueDate])
  @@index([status])
  @@index([goalId])
}

model Goal {
  id              String        @id @default(uuid())
  athleteId       String
  title           String
  description     String?
  category        GoalCategory
  type            GoalType      @default(SHORT_TERM)  // LONG_TERM | SHORT_TERM
  status          GoalStatus    @default(IN_PROGRESS)

  // Progress tracking
  targetMetric    String?       // "Free throw %"
  currentValue    Float?        // 68.0
  targetValue     Float?        // 75.0
  unit            String?       // "%"
  completionPct   Int           @default(0)  // Auto-calculated

  // Timeline
  startDate       DateTime      @default(now())
  targetDate      DateTime?
  completedAt     DateTime?

  // Hierarchy
  parentGoalId    String?       // Link to long-term goal
  parentGoal      Goal?         @relation("GoalHierarchy", fields: [parentGoalId], references: [id])
  childGoals      Goal[]        @relation("GoalHierarchy")

  // Related tasks
  tasks           Task[]

  // Metadata
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  athlete         Athlete       @relation(fields: [athleteId], references: [userId])

  @@index([athleteId])
  @@index([status])
  @@index([type])
  @@index([parentGoalId])
}

model TaskPattern {
  id              String        @id @default(uuid())
  athleteId       String
  weekStart       DateTime      // Start of week

  // Completion metrics
  totalTasks      Int
  completedTasks  Int
  completionRate  Float         // 0.0 - 1.0

  // By category
  performanceRate Float?
  mentalRate      Float?
  academicRate    Float?

  // Time analysis
  mostProductiveTime String?     // "morning" | "afternoon" | "evening"
  avgTasksPerDay  Float?

  // Discipline tracking
  currentStreak   Int           @default(0)
  longestStreak   Int           @default(0)

  // Cognitive load
  totalHours      Float?        // Total estimated time
  loadStatus      String?       // "LOW" | "OPTIMAL" | "HIGH" | "OVERLOAD"

  // Calculated at
  calculatedAt    DateTime      @default(now())

  athlete         Athlete       @relation(fields: [athleteId], references: [userId])

  @@unique([athleteId, weekStart])
  @@index([athleteId, weekStart])
}

// ===== SETTINGS MODULE =====

model UserSettings {
  id                    String   @id @default(uuid())
  userId                String   @unique

  // Notifications
  pushEnabled           Boolean  @default(true)
  taskReminders         Boolean  @default(true)
  taskReminderTimes     String[] @default(["15m", "1h"])  // ["15m", "1h", "1d"]
  goalMilestones        Boolean  @default(true)
  assignmentNotifs      Boolean  @default(true)
  chatMessages          Boolean  @default(false)
  weeklyEmail           Boolean  @default(true)
  weeklyEmailDay        String   @default("Sunday")
  weeklyEmailTime       String   @default("18:00")

  // Privacy
  shareChatsWithCoach   Boolean  @default(false)
  shareMoodWithCoach    Boolean  @default(false)
  shareGoalsWithCoach   Boolean  @default(false)

  // AI Personalization
  conversationStyle     String   @default("supportive")  // supportive | direct | balanced
  languageFormality     String   @default("casual")      // casual | professional
  responseLength        String   @default("detailed")    // concise | detailed
  autoSuggestions       Boolean  @default(true)
  patternDetection      Boolean  @default(true)

  // Sport config (athlete only)
  primarySport          String?
  secondarySports       String[] @default([])
  competitionLevel      String?  // high_school | college | professional
  seasonStatus          String?  // pre_season | in_season | off_season | post_season
  trainingFocusAreas    String[] @default([])

  // Theme & display
  theme                 String   @default("dark")  // light | dark | auto
  fontSize              String   @default("medium")  // small | medium | large

  // Metadata
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ===== ERROR LOGGING =====

model ErrorLog {
  id              String   @id @default(uuid())
  userId          String?
  errorType       String   // NETWORK_ERROR, AUTH_ERROR, etc.
  errorName       String
  errorMessage    String
  errorStack      String?

  // Context
  route           String?
  action          String?
  requestId       String?

  // Device info
  platform        String?  // ios | android
  platformVersion String?
  appVersion      String?

  // Metadata
  metadata        Json?

  // Timestamps
  timestamp       DateTime @default(now())

  @@index([userId, timestamp])
  @@index([errorType, timestamp])
}

// ===== ENUMS =====

enum TaskCategory {
  PERFORMANCE
  MENTAL
  ACADEMIC
  RECOVERY
  PERSONAL
  OTHER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  POSTPONED
  CANCELLED
}

enum GoalType {
  LONG_TERM   // 3-12 months
  SHORT_TERM  // 1-4 weeks
}

// GoalCategory and GoalStatus already exist in schema
```

### TypeScript Interfaces (Mobile App)

```typescript
// apps/mobile/types/tasks.ts

export interface Task {
  id: string;
  athleteId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime?: number;  // minutes
  dueDate?: string;  // ISO date string
  completionPct: number;  // 0-100
  notes?: string;
  tags: string[];  // ["#mental", "#practice"]
  attachments?: Attachment[];

  // AI features
  aiSuggested: boolean;
  aiReason?: string;

  // Linking
  goalId?: string;
  goal?: Goal;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  athleteId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  status: GoalStatus;

  // Progress
  targetMetric?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  completionPct: number;

  // Timeline
  startDate: string;
  targetDate?: string;
  completedAt?: string;

  // Hierarchy
  parentGoalId?: string;
  parentGoal?: Goal;
  childGoals?: Goal[];

  // Related
  tasks?: Task[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface TaskPattern {
  id: string;
  athleteId: string;
  weekStart: string;

  totalTasks: number;
  completedTasks: number;
  completionRate: number;  // 0.0 - 1.0

  performanceRate?: number;
  mentalRate?: number;
  academicRate?: number;

  mostProductiveTime?: 'morning' | 'afternoon' | 'evening';
  avgTasksPerDay?: number;

  currentStreak: number;
  longestStreak: number;

  totalHours?: number;
  loadStatus?: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';

  calculatedAt: string;
}

export interface TaskSuggestion {
  task: string;
  reason: string;
  priority: TaskPriority;
  estimatedTime: string;
  tags: string[];
  linkedGoal?: string;
}

export interface ReflectionPrompt {
  type: 'completion' | 'pattern' | 'cognitive_load';
  prompt: string;
  taskId?: string;
  pattern?: string;
  recommendation?: string;
}

export type TaskCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'RECOVERY' | 'PERSONAL' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
export type GoalType = 'LONG_TERM' | 'SHORT_TERM';
export type GoalCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

interface Attachment {
  url: string;
  type: string;
  name: string;
}
```

```typescript
// apps/mobile/types/settings.ts

export interface UserSettings {
  id: string;
  userId: string;

  // Notifications
  pushEnabled: boolean;
  taskReminders: boolean;
  taskReminderTimes: string[];  // ["15m", "1h", "1d"]
  goalMilestones: boolean;
  assignmentNotifs: boolean;
  chatMessages: boolean;
  weeklyEmail: boolean;
  weeklyEmailDay: string;
  weeklyEmailTime: string;

  // Privacy
  shareChatsWithCoach: boolean;
  shareMoodWithCoach: boolean;
  shareGoalsWithCoach: boolean;

  // AI Personalization
  conversationStyle: 'supportive' | 'direct' | 'balanced';
  languageFormality: 'casual' | 'professional';
  responseLength: 'concise' | 'detailed';
  autoSuggestions: boolean;
  patternDetection: boolean;

  // Sport config
  primarySport?: string;
  secondarySports: string[];
  competitionLevel?: 'high_school' | 'college' | 'professional';
  seasonStatus?: 'pre_season' | 'in_season' | 'off_season' | 'post_season';
  trainingFocusAreas: string[];

  // Theme
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

```typescript
// apps/mobile/types/auth.ts

export interface AthleteSignupData {
  // Step 1: Basic Info
  name: string;
  email: string;
  password: string;

  // Step 2: Sport Info
  sport: string;
  position: string;
  year: string;  // Freshman, Sophomore, Junior, Senior
  team?: string;
  age?: number;

  // Step 3: Privacy
  consentCoachView: boolean;
  consentMoodShare: boolean;
  consentGoalsShare: boolean;
  agreedToTerms: boolean;
  understoodDisclaimer: boolean;
}

export interface CoachSignupData {
  // Step 1: Basic Info
  name: string;
  email: string;
  password: string;

  // Step 2: Coaching Info
  sportsCoached: string[];
  organization: string;
  title: string;
  yearsExperience?: number;
  certifications?: string;

  // Step 3: Verification
  verificationCode: string;
  agreedToCodeOfConduct: boolean;
  understoodPrivacy: boolean;
  understoodCompliance: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  athlete?: AthleteProfile;
  coach?: CoachProfile;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AthleteProfile {
  sport: string;
  position: string;
  year: string;
  team?: string;
  age?: number;
  consentCoachView: boolean;
}

export interface CoachProfile {
  sportsCoached: string[];
  organization: string;
  title: string;
  yearsExperience?: number;
  certifications?: string;
}
```

```typescript
// apps/mobile/types/errors.ts

export interface AppError extends Error {
  type: ErrorType;
  userMessage: string;
  technical: string;
  context?: ErrorContext;
  retryable: boolean;
}

export type ErrorType =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  route: string;
  action: string;
  userId?: string;
  requestId?: string;
  deviceInfo: DeviceInfo;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  platformVersion: string;
  appVersion: string;
}

export interface ErrorLog {
  id: string;
  userId?: string;
  errorType: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  route?: string;
  action?: string;
  requestId?: string;
  platform?: string;
  platformVersion?: string;
  appVersion?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
```

---

## Backend API Specifications

### Authentication Endpoints

```typescript
// POST /api/auth/signup/athlete
interface AthleteSignupRequest {
  name: string;
  email: string;
  password: string;
  sport: string;
  position: string;
  year: string;
  team?: string;
  age?: number;
  consentCoachView: boolean;
  consentMoodShare: boolean;
  consentGoalsShare: boolean;
}

interface AthleteSignupResponse {
  user: User;
  token: string;
}

// POST /api/auth/signup/coach
interface CoachSignupRequest {
  name: string;
  email: string;
  password: string;
  sportsCoached: string[];
  organization: string;
  title: string;
  yearsExperience?: number;
  certifications?: string;
  verificationCode: string;
}

interface CoachSignupResponse {
  user: User;
  token: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// POST /api/auth/verify-email
interface VerifyEmailRequest {
  email: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

// POST /api/auth/verify-code
interface VerifyCodeRequest {
  email: string;
  code: string;
}

interface VerifyCodeResponse {
  valid: boolean;
}
```

### Tasks & Goals Endpoints

```typescript
// GET /api/tasks?athleteId=xxx&status=TODO&dueDate=2025-12-13
interface GetTasksRequest {
  athleteId: string;
  status?: TaskStatus;
  dueDate?: string;
  goalId?: string;
  limit?: number;
  offset?: number;
}

interface GetTasksResponse {
  tasks: Task[];
  total: number;
}

// POST /api/tasks
interface CreateTaskRequest {
  athleteId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedTime?: number;
  dueDate?: string;
  tags?: string[];
  goalId?: string;
}

interface CreateTaskResponse {
  task: Task;
}

// PUT /api/tasks/:id
interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  completionPct?: number;
  notes?: string;
  dueDate?: string;
}

interface UpdateTaskResponse {
  task: Task;
}

// DELETE /api/tasks/:id
interface DeleteTaskResponse {
  success: boolean;
}

// GET /api/tasks/suggestions?athleteId=xxx
interface GetTaskSuggestionsResponse {
  suggestions: TaskSuggestion[];
}

// GET /api/tasks/patterns?athleteId=xxx&weekStart=2025-12-08
interface GetTaskPatternsResponse {
  patterns: TaskPattern;
}

// GET /api/goals?athleteId=xxx&type=LONG_TERM
interface GetGoalsRequest {
  athleteId: string;
  type?: GoalType;
  status?: GoalStatus;
  parentGoalId?: string;
}

interface GetGoalsResponse {
  goals: Goal[];
}

// POST /api/goals
interface CreateGoalRequest {
  athleteId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  targetMetric?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  targetDate?: string;
  parentGoalId?: string;
}

interface CreateGoalResponse {
  goal: Goal;
}

// PUT /api/goals/:id
interface UpdateGoalRequest {
  title?: string;
  description?: string;
  status?: GoalStatus;
  currentValue?: number;
  completionPct?: number;
}

interface UpdateGoalResponse {
  goal: Goal;
}

// DELETE /api/goals/:id
interface DeleteGoalResponse {
  success: boolean;
}
```

### Settings Endpoints

```typescript
// GET /api/settings/:userId
interface GetSettingsResponse {
  settings: UserSettings;
}

// PUT /api/settings/:userId
interface UpdateSettingsRequest {
  // Any UserSettings fields can be updated
  pushEnabled?: boolean;
  taskReminders?: boolean;
  shareChatsWithCoach?: boolean;
  conversationStyle?: string;
  theme?: string;
  // ... etc
}

interface UpdateSettingsResponse {
  settings: UserSettings;
}

// POST /api/settings/:userId/export-data
interface ExportDataResponse {
  downloadUrl: string;
  expiresAt: string;
}
```

### Error Logging Endpoint

```typescript
// POST /api/errors/log
interface LogErrorRequest {
  userId?: string;
  errorType: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  route?: string;
  action?: string;
  requestId?: string;
  platform?: string;
  platformVersion?: string;
  appVersion?: string;
  metadata?: Record<string, any>;
}

interface LogErrorResponse {
  id: string;
  logged: boolean;
}
```

---

## Frontend Components

### Component File Structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── welcome.tsx                  ✅ EXISTS (needs update)
│   │   ├── login.tsx                    ✅ EXISTS (needs update)
│   │   ├── signup/
│   │   │   ├── athlete.tsx              🆕 CREATE
│   │   │   └── coach.tsx                🆕 CREATE
│   ├── (tabs)/
│   │   ├── dashboard.tsx                ✅ EXISTS
│   │   ├── chat.tsx                     ✅ EXISTS
│   │   ├── tasks.tsx                    🆕 CREATE (replace goals.tsx)
│   │   ├── assignments.tsx              ✅ EXISTS
│   │   ├── mood.tsx                     ✅ EXISTS
│   │   └── settings.tsx                 🔄 REBUILD
│   ├── (coach)/
│   │   └── dashboard.tsx                🆕 CREATE
│   └── index.tsx                        ✅ EXISTS
│
├── components/
│   ├── auth/
│   │   ├── AthleteSignupForm.tsx        🆕 CREATE
│   │   └── CoachSignupForm.tsx          🆕 CREATE
│   ├── tasks/
│   │   ├── TaskList.tsx                 🆕 CREATE
│   │   ├── TaskCard.tsx                 🆕 CREATE
│   │   ├── TaskDetailModal.tsx          🆕 CREATE
│   │   ├── AddTaskModal.tsx             🆕 CREATE
│   │   ├── GoalList.tsx                 🆕 CREATE
│   │   ├── GoalCard.tsx                 🆕 CREATE
│   │   ├── AddGoalModal.tsx             🆕 CREATE
│   │   ├── TaskSuggestions.tsx          🆕 CREATE
│   │   └── PatternsDashboard.tsx        🆕 CREATE
│   ├── settings/
│   │   ├── SettingsList.tsx             🆕 CREATE
│   │   ├── NotificationSettings.tsx     🆕 CREATE
│   │   ├── PrivacySettings.tsx          🆕 CREATE
│   │   ├── AIPersonalization.tsx        🆕 CREATE
│   │   ├── SportConfiguration.tsx       🆕 CREATE
│   │   └── ProfileSettings.tsx          🆕 CREATE
│   └── ui/
│       ├── ErrorBanner.tsx              🆕 CREATE
│       ├── SuccessBanner.tsx            🆕 CREATE
│       ├── ErrorView.tsx                ✅ EXISTS (needs update)
│       ├── LoadingScreen.tsx            ✅ EXISTS
│       ├── Card.tsx                     ✅ EXISTS
│       ├── GradientBackground.tsx       ✅ EXISTS
│       └── GradientCard.tsx             ✅ EXISTS
│
├── lib/
│   ├── auth.ts                          ✅ EXISTS (needs update)
│   ├── api/
│   │   ├── tasks.ts                     🆕 CREATE
│   │   ├── goals.ts                     🆕 CREATE
│   │   ├── settings.ts                  🆕 CREATE
│   │   └── errors.ts                    🆕 CREATE
│   ├── errorHandler.ts                  🆕 CREATE
│   └── retry.ts                         🆕 CREATE
│
└── types/
    ├── tasks.ts                         🆕 CREATE
    ├── settings.ts                      🆕 CREATE
    ├── auth.ts                          🔄 UPDATE
    └── errors.ts                        🆕 CREATE
```

### Key Component Implementations

#### TaskCard Component

```typescript
// apps/mobile/components/tasks/TaskCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, TaskPriority } from '../../types/tasks';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export function TaskCard({ task, onPress, onToggleComplete }: TaskCardProps) {
  const priorityColor = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#dc2626'
  }[task.priority];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.status === 'COMPLETED' && styles.checkboxCompleted
        ]}
        onPress={onToggleComplete}
      >
        {task.status === 'COMPLETED' && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            task.status === 'COMPLETED' && styles.titleCompleted
          ]}
        >
          {task.title}
        </Text>

        {task.dueDate && (
          <Text style={styles.dueDate}>
            Due: {new Date(task.dueDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        )}

        {task.estimatedTime && (
          <Text style={styles.time}>{task.estimatedTime}m</Text>
        )}

        {/* Tags */}
        <View style={styles.tags}>
          {task.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Priority Badge */}
      <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
        <Text style={styles.priorityText}>{task.priority}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  dueDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#9ca3af',
  },
  tags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
```

#### ErrorBanner Component

```typescript
// apps/mobile/components/ui/ErrorBanner.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface ErrorBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function ErrorBanner({
  message,
  type = 'error',
  dismissible = true,
  onDismiss,
  action
}: ErrorBannerProps) {
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const backgroundColor = {
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6'
  }[type];

  const icon = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>

      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}

      {dismissible && onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    marginLeft: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    color: '#fff',
  },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation & Error Handling (Week 1)

**Goal**: Build robust error handling framework and update authentication

**Tasks**:
1. ✅ Create feature branch `feature/enterprise-platform-upgrade`
2. 🔄 Update Prisma schema with new models (Task, Goal, TaskPattern, UserSettings, ErrorLog)
3. 🔄 Run migrations: `npx prisma migrate dev --name add_enterprise_models`
4. 🔄 Create TypeScript types (`types/tasks.ts`, `types/settings.ts`, `types/errors.ts`)
5. 🔄 Implement error handling framework:
   - `lib/errorHandler.ts`
   - `lib/retry.ts`
   - `components/ui/ErrorBanner.tsx`
   - `components/ui/SuccessBanner.tsx`
   - Update `components/ui/ErrorView.tsx`
6. 🔄 Update authentication flows:
   - Update `app/(auth)/welcome.tsx` with role selection
   - Create `app/(auth)/signup/athlete.tsx`
   - Create `app/(auth)/signup/coach.tsx`
   - Update `app/(auth)/login.tsx`
   - Update `lib/auth.ts` with new signup functions

**Deliverables**:
- Error handling components functional
- Athlete & coach signup flows complete
- Role-based routing working
- All code committed and pushed

### Phase 2: Tasks & Goals Module (Week 2-3)

**Goal**: Complete AI-powered task and goal management system

**Tasks**:
1. 🔄 Backend API endpoints:
   - `apps/web/src/app/api/tasks/route.ts` (GET, POST)
   - `apps/web/src/app/api/tasks/[id]/route.ts` (PUT, DELETE)
   - `apps/web/src/app/api/tasks/suggestions/route.ts`
   - `apps/web/src/app/api/tasks/patterns/route.ts`
   - `apps/web/src/app/api/goals/route.ts` (GET, POST)
   - `apps/web/src/app/api/goals/[id]/route.ts` (PUT, DELETE)
2. 🔄 Frontend components:
   - `components/tasks/TaskList.tsx`
   - `components/tasks/TaskCard.tsx`
   - `components/tasks/TaskDetailModal.tsx`
   - `components/tasks/AddTaskModal.tsx`
   - `components/tasks/GoalList.tsx`
   - `components/tasks/GoalCard.tsx`
   - `components/tasks/AddGoalModal.tsx`
   - `components/tasks/TaskSuggestions.tsx`
   - `components/tasks/PatternsDashboard.tsx`
3. 🔄 API client functions:
   - `lib/api/tasks.ts`
   - `lib/api/goals.ts`
4. 🔄 Main tab screen:
   - Replace `app/(tabs)/goals.tsx` with `app/(tabs)/tasks.tsx`
   - Implement task list view
   - Implement patterns dashboard
   - Implement goal hierarchy view

**AI Integration**:
- Implement task suggestion algorithm (OpenAI)
- Pattern detection calculation
- Cognitive load analysis
- Reflection prompt generation

**Deliverables**:
- Full task CRUD functionality
- Goal hierarchy system working
- AI suggestions displaying
- Pattern dashboard showing insights
- All code committed and pushed

### Phase 3: Settings Section (Week 4)

**Goal**: Professional settings interface with all preferences

**Tasks**:
1. 🔄 Backend API:
   - `apps/web/src/app/api/settings/[userId]/route.ts` (GET, PUT)
   - `apps/web/src/app/api/settings/[userId]/export-data/route.ts`
2. 🔄 Frontend components:
   - `components/settings/SettingsList.tsx`
   - `components/settings/ProfileSettings.tsx`
   - `components/settings/NotificationSettings.tsx`
   - `components/settings/PrivacySettings.tsx`
   - `components/settings/AIPersonalization.tsx`
   - `components/settings/SportConfiguration.tsx`
3. 🔄 API client:
   - `lib/api/settings.ts`
4. 🔄 Rebuild tab screen:
   - Complete overhaul of `app/(tabs)/settings.tsx`
   - Implement all settings sections
   - Add data export functionality

**Deliverables**:
- All settings categories functional
- User preferences persisting correctly
- Data export working
- UI polished and professional
- All code committed and pushed

### Phase 4: Polish & Testing (Week 5)

**Goal**: Refinement, testing, and deployment preparation

**Tasks**:
1. 🔄 Integration testing:
   - Test all user flows end-to-end
   - Test error handling scenarios
   - Test with demo accounts
2. 🔄 UI/UX polish:
   - Consistent styling across all screens
   - Loading states
   - Empty states
   - Success feedback
3. 🔄 Performance optimization:
   - Lazy loading
   - Caching strategies
   - Image optimization
4. 🔄 Documentation:
   - Update README with new features
   - API documentation
   - User guide
5. 🔄 Prepare for merge:
   - Final commit and push
   - Create pull request with detailed description
   - Request user review

**Deliverables**:
- All features tested and working
- UI/UX polished
- Documentation complete
- Ready for production deployment

---

## Testing Strategy

### Unit Tests

**Backend (Jest + Supertest)**:
```typescript
// apps/web/src/app/api/tasks/__tests__/route.test.ts

describe('POST /api/tasks', () => {
  it('creates a new task for athlete', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${athleteToken}`)
      .send({
        athleteId: 'athlete-123',
        title: 'Review game film',
        category: 'PERFORMANCE',
        priority: 'HIGH',
        estimatedTime: 60,
        dueDate: '2025-12-14T15:00:00Z',
        tags: ['#performance', '#preparation']
      });

    expect(response.status).toBe(201);
    expect(response.body.task).toHaveProperty('id');
    expect(response.body.task.title).toBe('Review game film');
  });

  it('returns 401 for unauthenticated request', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        athleteId: 'athlete-123',
        title: 'Test task'
      });

    expect(response.status).toBe(401);
  });
});
```

**Frontend (React Testing Library)**:
```typescript
// apps/mobile/components/tasks/__tests__/TaskCard.test.tsx

import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Review game film',
    category: 'PERFORMANCE',
    priority: 'HIGH',
    status: 'TODO',
    estimatedTime: 60,
    tags: ['#performance'],
    completionPct: 0,
    createdAt: '2025-12-13T10:00:00Z',
    updatedAt: '2025-12-13T10:00:00Z',
  };

  it('renders task title', () => {
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={jest.fn()} onToggleComplete={jest.fn()} />
    );

    expect(getByText('Review game film')).toBeTruthy();
  });

  it('calls onToggleComplete when checkbox pressed', () => {
    const onToggleComplete = jest.fn();
    const { getByTestId } = render(
      <TaskCard
        task={mockTask}
        onPress={jest.fn()}
        onToggleComplete={onToggleComplete}
      />
    );

    fireEvent.press(getByTestId('task-checkbox'));
    expect(onToggleComplete).toHaveBeenCalled();
  });
});
```

### Integration Tests

**End-to-End User Flows**:
```typescript
// apps/mobile/__tests__/e2e/athlete-signup.test.ts

import { by, device, element, expect } from 'detox';

describe('Athlete Signup Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete athlete signup successfully', async () => {
    // Welcome screen
    await expect(element(by.text('I am a...'))).toBeVisible();
    await element(by.text('ATHLETE')).tap();

    // Step 1: Basic info
    await element(by.id('name-input')).typeText('Test Athlete');
    await element(by.id('email-input')).typeText('test@athlete.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('confirm-password-input')).typeText('password123');
    await element(by.text('Next: Sport Info')).tap();

    // Step 2: Sport info
    await element(by.id('sport-select')).tap();
    await element(by.text('Basketball')).tap();
    await element(by.id('position-select')).tap();
    await element(by.text('Point Guard')).tap();
    await element(by.id('year-select')).tap();
    await element(by.text('Junior')).tap();
    await element(by.text('Next: Privacy Settings')).tap();

    // Step 3: Privacy
    await element(by.id('consent-coach-view')).tap();
    await element(by.id('consent-terms')).tap();
    await element(by.id('consent-disclaimer')).tap();
    await element(by.text('Create Account')).tap();

    // Should navigate to dashboard
    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### Manual Testing Checklist

**Authentication**:
- [ ] Athlete signup flow completes successfully
- [ ] Coach signup flow completes successfully
- [ ] Email verification works for coaches
- [ ] Login works for both roles
- [ ] Role-based routing directs to correct dashboard
- [ ] Logout clears tokens and redirects to welcome

**Tasks & Goals**:
- [ ] Can create new task
- [ ] Can edit task
- [ ] Can mark task complete
- [ ] Can delete task
- [ ] Tasks filter by status
- [ ] AI suggestions display correctly
- [ ] Pattern dashboard shows accurate data
- [ ] Can create long-term goal
- [ ] Can create short-term goal linked to long-term
- [ ] Can create task linked to goal
- [ ] Goal completion % calculates correctly

**Settings**:
- [ ] All notification settings save
- [ ] Privacy settings save
- [ ] AI personalization saves
- [ ] Theme changes apply immediately
- [ ] Data export downloads file
- [ ] Profile settings update correctly

**Error Handling**:
- [ ] Network error shows appropriate banner
- [ ] Auth error redirects to login
- [ ] Validation errors show inline
- [ ] Server error shows generic message
- [ ] Retry logic works for network failures
- [ ] Error logs sent to backend

---

## Sports Psychology Optimization

### Cognitive Load Management

**Theory**: Baumeister's Ego Depletion suggests that willpower and decision-making capacity are finite resources. Overloading athletes with too many tasks leads to decision fatigue and reduced performance.

**Implementation**:
```typescript
function calculateCognitiveLoad(tasks: Task[]): {
  totalHours: number;
  status: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';
  recommendation: string;
} {
  const totalHours = tasks.reduce((sum, task) => {
    return sum + (task.estimatedTime || 0);
  }, 0) / 60;

  // Research shows optimal task load is 10-15 hours/week
  let status: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';
  let recommendation: string;

  if (totalHours < 8) {
    status = 'LOW';
    recommendation = 'You have capacity for more productive tasks. Consider adding mental training or skill development.';
  } else if (totalHours >= 8 && totalHours <= 15) {
    status = 'OPTIMAL';
    recommendation = "You're at the sweet spot. Don't add more tasks to avoid cognitive overload.";
  } else if (totalHours > 15 && totalHours <= 20) {
    status = 'HIGH';
    recommendation = 'Your task load is high. Consider postponing lower-priority items or delegating.';
  } else {
    status = 'OVERLOAD';
    recommendation = 'ALERT: You have too many tasks. This will lead to stress and reduced performance. Remove or postpone tasks immediately.';
  }

  return { totalHours, status, recommendation };
}
```

### Discipline Pattern Detection

**Theory**: Consistent behavior builds habits. Tracking completion streaks and identifying procrastination patterns helps athletes build self-regulation skills.

**Implementation**:
```typescript
function detectDisciplinePatterns(tasks: Task[]): {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  procrastinationRisk: Array<{ task: Task; riskLevel: string; reason: string }>;
} {
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = completedCount / tasks.length;

  // Calculate streak (consecutive days with completed tasks)
  const tasksByDate = groupTasksByDate(tasks);
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedDates = Object.keys(tasksByDate).sort().reverse();
  for (const date of sortedDates) {
    const dayTasks = tasksByDate[date];
    const hasCompletedTask = dayTasks.some(t => t.status === 'COMPLETED');

    if (hasCompletedTask) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }
  }

  // Identify procrastination risks
  const procrastinationRisk = tasks
    .filter(t => t.status === 'POSTPONED')
    .map(t => {
      const postponeCount = getPostponeCount(t.id);  // From history
      const daysUntilDue = t.dueDate ? daysDiff(new Date(), new Date(t.dueDate)) : null;

      let riskLevel = 'LOW';
      let reason = '';

      if (postponeCount >= 3 && daysUntilDue && daysUntilDue <= 2) {
        riskLevel = 'HIGH';
        reason = `Postponed ${postponeCount} times, deadline in ${daysUntilDue} days`;
      } else if (postponeCount >= 2) {
        riskLevel = 'MEDIUM';
        reason = `Postponed ${postponeCount} times`;
      }

      return { task: t, riskLevel, reason };
    })
    .filter(r => r.riskLevel !== 'LOW');

  return { completionRate, currentStreak, longestStreak, procrastinationRisk };
}
```

### Mental Readiness Scoring

**Theory**: Flow State Theory (Csikszentmihalyi) suggests optimal performance occurs when challenge matches skill level and distractions are minimized. Daily task completion prepares athletes mentally for competition.

**Implementation**:
```typescript
function calculateMentalReadiness(
  tasks: Task[],
  moodLogs: MoodLog[],
  goals: Goal[]
): {
  score: number;  // 0-100
  level: 'Low' | 'Moderate' | 'High' | 'Peak';
  factors: Array<{ factor: string; impact: number; description: string }>;
} {
  let score = 50;  // Baseline
  const factors: Array<{ factor: string; impact: number; description: string }> = [];

  // Task completion impact (+/- 15 points)
  const completionRate = tasks.filter(t => t.status === 'COMPLETED').length / tasks.length;
  const taskImpact = (completionRate - 0.5) * 30;
  score += taskImpact;
  factors.push({
    factor: 'Task Completion',
    impact: taskImpact,
    description: `${(completionRate * 100).toFixed(0)}% of tasks completed`
  });

  // Mood trend impact (+/- 20 points)
  const recentMood = moodLogs.slice(0, 7).map(m => m.mood);
  const avgMood = recentMood.reduce((sum, m) => sum + m, 0) / recentMood.length;
  const moodImpact = (avgMood - 5) * 4;  // Scale from 1-10 to -16 to +20
  score += moodImpact;
  factors.push({
    factor: 'Mood Trend',
    impact: moodImpact,
    description: `7-day average mood: ${avgMood.toFixed(1)}/10`
  });

  // Goal progress impact (+/- 10 points)
  const avgGoalProgress = goals.reduce((sum, g) => sum + g.completionPct, 0) / goals.length;
  const goalImpact = (avgGoalProgress - 50) / 5;
  score += goalImpact;
  factors.push({
    factor: 'Goal Progress',
    impact: goalImpact,
    description: `Average goal completion: ${avgGoalProgress.toFixed(0)}%`
  });

  // Cognitive load impact (+/- 10 points)
  const { status: loadStatus } = calculateCognitiveLoad(tasks);
  let loadImpact = 0;
  if (loadStatus === 'LOW') loadImpact = -5;
  if (loadStatus === 'OPTIMAL') loadImpact = +10;
  if (loadStatus === 'HIGH') loadImpact = -5;
  if (loadStatus === 'OVERLOAD') loadImpact = -15;
  score += loadImpact;
  factors.push({
    factor: 'Cognitive Load',
    impact: loadImpact,
    description: `Task load is ${loadStatus.toLowerCase()}`
  });

  // Determine level
  let level: 'Low' | 'Moderate' | 'High' | 'Peak';
  if (score < 40) level = 'Low';
  else if (score < 60) level = 'Moderate';
  else if (score < 80) level = 'High';
  else level = 'Peak';

  return { score: Math.max(0, Math.min(100, score)), level, factors };
}
```

---

## Conclusion

This architecture document provides a comprehensive blueprint for rebuilding the AI Sports Agent platform with enterprise-grade features focused on task management, settings, authentication, and error handling.

**Key Outcomes**:
1. ✅ **Tasks & Goals**: AI-powered task management grounded in sports psychology
2. ✅ **Settings**: Professional, comprehensive user preferences
3. ✅ **Authentication**: Separate, intuitive flows for coaches and athletes
4. ✅ **Error Handling**: Robust, user-friendly error management

**Next Steps**:
- Begin implementation Phase 1 (Foundation & Error Handling)
- Continuous commits and pushes to feature branch
- User review and approval before merge to main

**Sports Psychology Impact**:
- Reduces cognitive overload through smart task distribution
- Builds discipline through streak tracking and pattern insights
- Prepares athletes for peak performance through mental readiness scoring
- Provides coaches with actionable insights while respecting athlete privacy

---

**Document Prepared By**: Claude Sonnet 4.5
**Last Updated**: 2025-12-13
**Status**: Ready for Implementation
