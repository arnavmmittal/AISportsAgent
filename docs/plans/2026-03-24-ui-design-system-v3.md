# Flow Sports Coach - UI Design System v3.0

## Design Direction: Modern Athletic, Clean & Technical

**Target:** University-wide adoption across all collegiate athletics programs
**Primary Users:** Student-athletes (mobile-first), Coaches/Sports Psychologists (web)
**Aesthetic:** WHOOP meets Headspace - performance-focused yet supportive

---

## 1. Design Principles

### 1.1 Core Principles

1. **Performance, Not Wellness** - Athletes want to optimize, not just feel better. Every element should feel like a professional tool.

2. **Data Speaks, Interface Recedes** - The UI is the container. Readiness scores, progress, and conversation content are the stars.

3. **Calm Confidence** - Bold enough to command respect, calm enough for vulnerable conversations about anxiety and pressure.

4. **Mobile-First, Desktop-Enhanced** - Athletes chat on phones. Coaches monitor on desktops. Design for both, prioritize mobile.

5. **Institutional Trust** - Athletic directors and compliance officers approve purchases. The UI must feel enterprise-ready.

### 1.2 What We're Moving Away From

| Old Pattern | Problem | New Direction |
|-------------|---------|---------------|
| Gradient backgrounds (`from-blue-50 via-purple-50`) | Feels like consumer wellness app | Solid, confident colors |
| Emoji in UI (`💪`, `🎯`) | Juvenile, unprofessional | Icons only, no emoji in chrome |
| Bouncing dot loaders | Playful, not premium | Subtle pulse/line animations |
| Heavy border-radius (`rounded-3xl`) | Soft, unserious | Moderate radius (12-16px) |
| Multiple competing gradients | Visual noise | Single accent color system |
| 4-card empty state grid | Overwhelming, choice paralysis | Single clear prompt |

---

## 2. Color System

### 2.1 Primary Palette: Deep Navy + Electric Teal

```css
:root {
  /* Primary - Deep Navy (Trust, Stability, Performance) */
  --primary: 220 60% 15%;           /* #0d1a2d - Deep navy */
  --primary-hover: 220 60% 20%;     /* Slightly lighter on hover */
  --primary-foreground: 0 0% 98%;   /* Near-white text */

  /* Accent - Electric Teal (Growth, Progress, Energy) */
  --accent: 172 66% 50%;            /* #2dd4bf - Electric teal */
  --accent-hover: 172 66% 45%;
  --accent-muted: 172 40% 90%;      /* Soft teal for backgrounds */
  --accent-foreground: 220 60% 10%; /* Dark text on accent */

  /* Neutral - Cool Grays (Technical, Clean) */
  --background: 220 14% 96%;        /* #f3f4f6 - Cool off-white */
  --foreground: 220 20% 10%;        /* #181d27 - Near-black */
  --card: 0 0% 100%;                /* Pure white cards */
  --card-foreground: 220 20% 10%;

  --muted: 220 14% 92%;             /* #e5e7eb */
  --muted-foreground: 220 10% 40%;  /* #5b6478 */

  --border: 220 13% 87%;            /* #d4d7dd */
  --input: 220 13% 91%;             /* #e2e4e9 */
  --ring: 172 66% 50%;              /* Teal focus rings */
}

.dark {
  /* Dark mode - True dark with navy tints */
  --primary: 172 66% 50%;           /* Teal becomes primary in dark */
  --primary-foreground: 220 60% 5%;

  --accent: 172 66% 60%;            /* Brighter teal */
  --accent-muted: 172 30% 15%;

  --background: 220 40% 5%;         /* #07090d - True dark */
  --foreground: 220 10% 92%;        /* #e8eaed */
  --card: 220 40% 8%;               /* #0d1117 - Elevated dark */
  --card-foreground: 220 10% 92%;

  --muted: 220 30% 12%;             /* #161d2a */
  --muted-foreground: 220 10% 55%;  /* #858d9d */

  --border: 220 30% 15%;            /* #1c2636 */
  --input: 220 30% 12%;
  --ring: 172 66% 50%;
}
```

### 2.2 Semantic Colors (Unchanged from v2)

Keep the existing traffic light system - it's well-designed:

```css
:root {
  /* Readiness - Traffic Light System */
  --readiness-green: 142 71% 45%;
  --readiness-yellow: 45 93% 47%;
  --readiness-red: 0 72% 51%;

  /* Risk Levels */
  --risk-low: 142 71% 45%;
  --risk-moderate: 45 93% 47%;
  --risk-high: 25 95% 53%;
  --risk-critical: 0 72% 51%;

  /* Status */
  --success: 142 71% 45%;
  --warning: 45 93% 47%;
  --destructive: 0 72% 51%;
  --info: 199 89% 48%;
}
```

### 2.3 Color Usage Rules

1. **Navy is the anchor** - Headers, navigation, primary buttons in light mode
2. **Teal is the action** - CTAs, links, progress indicators, focus states
3. **Grays do the work** - Backgrounds, borders, secondary text
4. **Signal colors are sacred** - Only use green/yellow/red for actual status data
5. **No gradients in UI chrome** - Solid colors only. Gradients reserved for marketing.

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

**Why Inter:**
- Designed for screens, exceptional legibility at small sizes
- Variable font with granular weight control
- Tabular figures for data/metrics
- Neutral personality lets content speak

### 3.2 Type Scale (Clean & Technical)

```css
/* Headings - Semibold, tight tracking */
--text-4xl: 2.25rem;    /* 36px - Hero/page titles */
--text-3xl: 1.875rem;   /* 30px - Section headers */
--text-2xl: 1.5rem;     /* 24px - Card titles */
--text-xl: 1.25rem;     /* 20px - Subsections */
--text-lg: 1.125rem;    /* 18px - Emphasis */

/* Body - Regular weight, comfortable reading */
--text-base: 1rem;      /* 16px - Primary body */
--text-sm: 0.875rem;    /* 14px - Secondary text */
--text-xs: 0.75rem;     /* 12px - Captions, timestamps */

/* Line heights */
--leading-tight: 1.25;  /* Headings */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.65; /* Long-form reading (chat messages) */

/* Letter spacing */
--tracking-tight: -0.02em;  /* Headings */
--tracking-normal: -0.011em; /* Body */
--tracking-wide: 0.05em;     /* Labels, all-caps */
```

### 3.3 Typography Application

| Element | Size | Weight | Tracking | Case |
|---------|------|--------|----------|------|
| Page title | 4xl | 600 | tight | Sentence |
| Section header | 2xl | 600 | tight | Sentence |
| Card title | xl | 500 | normal | Sentence |
| Body text | base | 400 | normal | Sentence |
| Chat message | base | 400 | normal | Sentence |
| Button label | sm | 500 | wide | Sentence |
| Input label | sm | 500 | normal | Sentence |
| Caption/meta | xs | 400 | normal | Sentence |
| Status badge | xs | 600 | wide | UPPERCASE |

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
/* 4px base unit */
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
```

### 4.2 Chat-Specific Spacing

```css
/* Message spacing */
--message-padding-x: 1rem;      /* 16px horizontal padding */
--message-padding-y: 0.75rem;   /* 12px vertical padding */
--message-gap: 1rem;            /* 16px between messages */
--message-group-gap: 1.5rem;    /* 24px between different senders */

/* Input area */
--input-height-min: 3rem;       /* 48px minimum */
--input-height-max: 8rem;       /* 128px maximum expansion */
--input-padding: 1rem;          /* 16px internal padding */

/* Mobile safe areas */
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
```

### 4.3 Border Radius

```css
/* Consistent radius scale */
--radius-sm: 0.375rem;  /* 6px - Small elements, badges */
--radius-md: 0.5rem;    /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - Cards, message bubbles */
--radius-xl: 1rem;      /* 16px - Modals, large cards */
--radius-full: 9999px;  /* Pills, avatars */
```

**Note:** No `rounded-3xl` (24px). Maximum radius is 16px for professional feel.

---

## 5. Chat Interface Specification

### 5.1 Layout Structure

```
┌─────────────────────────────────────┐
│  Status Bar (native)                │
├─────────────────────────────────────┤
│  Header: "Flow Coach" + menu        │  44-56px
├─────────────────────────────────────┤
│                                     │
│  Messages Area (scrollable)         │  flex-1
│                                     │
│  ┌─────────────────────────────┐   │
│  │ AI message bubble           │   │
│  └─────────────────────────────┘   │
│                                     │
│       ┌─────────────────────────┐   │
│       │ User message bubble    │   │
│       └─────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Input Dock                         │  auto (56-128px)
│  [Voice] [  Type a message...  ] [→]│
├─────────────────────────────────────┤
│  Home indicator (iOS)               │
└─────────────────────────────────────┘
```

### 5.2 Message Bubbles

**AI Coach Messages (Left-aligned):**
```css
.message-ai {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm); /* Subtle corner mark */
  padding: var(--message-padding-y) var(--message-padding-x);
  max-width: 85%;
  color: var(--foreground);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.dark .message-ai {
  background: var(--card);
  border-color: var(--border);
}
```

**User Messages (Right-aligned):**
```css
.message-user {
  background: var(--primary);
  border-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-sm); /* Subtle corner mark */
  padding: var(--message-padding-y) var(--message-padding-x);
  max-width: 85%;
  color: var(--primary-foreground);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  margin-left: auto;
}

.dark .message-user {
  background: var(--accent);
  color: var(--accent-foreground);
}
```

### 5.3 AI Coach Avatar

```css
.coach-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.coach-avatar-icon {
  width: 18px;
  height: 18px;
  color: white;
  /* Use a simple pulse/wave icon - not a cartoon face */
}
```

**Rules:**
- Show avatar only for first message in a group from AI
- No avatar for user messages (they know who they are)
- Avatar sits outside the bubble, aligned to top

### 5.4 Input Dock

```css
.input-dock {
  background: var(--card);
  border-top: 1px solid var(--border);
  padding: var(--space-3) var(--space-4);
  padding-bottom: calc(var(--space-3) + var(--safe-area-bottom));
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-height: 44px;
  max-height: 128px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--background);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  resize: none;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px hsl(var(--accent) / 0.1);
}

.button-voice,
.button-send {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.button-voice {
  background: var(--muted);
  color: var(--muted-foreground);
}

.button-voice:hover,
.button-voice.active {
  background: var(--accent);
  color: var(--accent-foreground);
}

.button-send {
  background: var(--accent);
  color: var(--accent-foreground);
}

.button-send:hover {
  background: var(--accent-hover);
}

.button-send:disabled {
  background: var(--muted);
  color: var(--muted-foreground);
  cursor: not-allowed;
}
```

### 5.5 Streaming Indicator

Replace bouncing dots with a subtle pulsing line:

```css
.streaming-indicator {
  height: 2px;
  background: var(--accent);
  border-radius: var(--radius-full);
  animation: pulse-width 1.5s ease-in-out infinite;
  margin-top: var(--space-2);
}

@keyframes pulse-width {
  0%, 100% { width: 20%; opacity: 0.5; }
  50% { width: 60%; opacity: 1; }
}
```

### 5.6 Empty State

Replace the 4-card grid with a single, focused prompt:

```jsx
<div className="empty-state">
  <div className="coach-avatar-large">
    {/* Animated subtle pulse */}
  </div>
  <h2>Ready when you are</h2>
  <p>What's on your mind heading into your next competition?</p>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-8);
  text-align: center;
}

.empty-state h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--foreground);
  margin-top: var(--space-6);
  margin-bottom: var(--space-2);
}

.empty-state p {
  font-size: var(--text-base);
  color: var(--muted-foreground);
  max-width: 280px;
}

.coach-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: subtle-pulse 3s ease-in-out infinite;
}

@keyframes subtle-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}
```

---

## 6. Widgets & Cards

### 6.1 Action Plan Widget

```css
.widget-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-top: var(--space-4);
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.widget-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--foreground);
}

.widget-collapse-button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--muted);
  color: var(--muted-foreground);
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.action-item:last-child {
  border-bottom: none;
}

.action-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  margin-top: 2px;
}

.action-checkbox.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.action-text {
  font-size: var(--text-sm);
  color: var(--foreground);
  line-height: var(--leading-normal);
}

.action-timeframe {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-3);
}
```

### 6.2 Practice Drill Card

```css
.drill-card {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  color: var(--primary-foreground);
  margin-top: var(--space-4);
}

.drill-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.drill-icon {
  width: 40px;
  height: 40px;
  background: hsl(var(--accent) / 0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drill-title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.drill-skill {
  font-size: var(--text-sm);
  opacity: 0.8;
}

.drill-step {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.drill-step-number {
  width: 24px;
  height: 24px;
  background: hsl(var(--accent) / 0.2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drill-step-text {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.drill-cta {
  margin-top: var(--space-4);
  width: 100%;
  height: 44px;
  background: var(--accent);
  color: var(--accent-foreground);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-sm);
}
```

---

## 7. Crisis Alert Treatment

Replace the alarming gradient with calm but serious styling:

```css
.crisis-banner {
  background: var(--card);
  border-left: 4px solid hsl(var(--warning));
  padding: var(--space-4) var(--space-5);
  margin: var(--space-4);
  border-radius: var(--radius-md);
}

.crisis-banner.critical {
  border-left-color: hsl(var(--destructive));
}

.crisis-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.crisis-icon {
  width: 24px;
  height: 24px;
  color: hsl(var(--warning));
}

.crisis-banner.critical .crisis-icon {
  color: hsl(var(--destructive));
}

.crisis-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--foreground);
}

.crisis-message {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  line-height: var(--leading-normal);
}

.crisis-action {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--accent);
}
```

---

## 8. Animations

### 8.1 Core Timing

```css
/* Transition durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Easing functions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 8.2 Message Animations

```css
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation: message-in var(--duration-normal) var(--ease-out);
}
```

### 8.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Responsive Breakpoints

```css
/* Mobile-first breakpoints */
--screen-sm: 640px;   /* Large phones */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Laptops */
--screen-xl: 1280px;  /* Desktops */
```

### 9.1 Chat Responsive Behavior

| Breakpoint | Message max-width | Input behavior | Spacing |
|------------|-------------------|----------------|---------|
| Mobile (<640px) | 85% | Single row, expands | Spacious |
| Tablet (640-1024px) | 75% | Multi-row default | Moderate |
| Desktop (>1024px) | 65% | Multi-row, side context panel | Comfortable |

---

## 10. Implementation Checklist

### Phase 1: Foundation (Do First)
- [ ] Update CSS variables in `globals.css` with new color system
- [ ] Update `tailwind.config.js` to reference new variables
- [ ] Remove all gradient classes from chat interface
- [ ] Remove emoji from UI (keep only in actual chat content)
- [ ] Update border-radius scale (max 16px)

### Phase 2: Chat Interface
- [ ] Restyle message bubbles (new colors, corner treatment)
- [ ] Simplify AI coach avatar (remove cartoon elements)
- [ ] Replace bouncing dots with pulsing line indicator
- [ ] Redesign empty state (single prompt, not grid)
- [ ] Update input dock styling

### Phase 3: Widgets
- [ ] Restyle action plan widget with new card treatment
- [ ] Update practice drill card (primary color scheme)
- [ ] Restyle routine builder widget
- [ ] Update crisis alert banner (calm but serious)

### Phase 4: Polish
- [ ] Audit all animations (remove bouncing, add easing)
- [ ] Test dark mode thoroughly
- [ ] Verify mobile safe areas
- [ ] Test with reduced motion preference
- [ ] Accessibility audit (contrast ratios, focus states)

---

## 11. Visual Reference

### Color Palette Summary

```
LIGHT MODE:
┌─────────────────────────────────────────┐
│ Background: #f3f4f6 (cool off-white)    │
│ Card: #ffffff (pure white)              │
│ Primary: #0d1a2d (deep navy)            │
│ Accent: #2dd4bf (electric teal)         │
│ Text: #181d27 (near-black)              │
│ Muted: #5b6478 (cool gray)              │
└─────────────────────────────────────────┘

DARK MODE:
┌─────────────────────────────────────────┐
│ Background: #07090d (true dark)         │
│ Card: #0d1117 (elevated dark)           │
│ Primary: #2dd4bf (teal)                 │
│ Accent: #5eead4 (bright teal)           │
│ Text: #e8eaed (off-white)               │
│ Muted: #858d9d (medium gray)            │
└─────────────────────────────────────────┘
```

### Typography Quick Reference

```
Page Title:     Inter 36px/1.25 Semibold -0.02em
Section Head:   Inter 24px/1.25 Semibold -0.02em
Card Title:     Inter 20px/1.3 Medium
Body:           Inter 16px/1.5 Regular -0.011em
Chat Message:   Inter 16px/1.65 Regular -0.011em
Button:         Inter 14px/1.25 Medium 0.05em
Caption:        Inter 12px/1.5 Regular
Badge:          Inter 12px/1.25 Semibold 0.05em UPPERCASE
```

---

*Design System v3.0 - Modern Athletic, Clean & Technical*
*For Flow Sports Coach - University-wide adoption*
*Created: 2026-03-24*
