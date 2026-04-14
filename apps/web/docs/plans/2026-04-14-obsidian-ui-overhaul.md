# Obsidian UI Overhaul — Coach Portal

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the coach portal from a generic SaaS dashboard into a premium sports analytics command center that coaches are compelled to explore.

**Architecture:** Pure token-level color overhaul (globals.css) + component-level upgrades using 21st.dev patterns (SpotlightCard, AnimatedNumberFlip). No new dependencies except Motion (framer-motion). All changes flow through the existing HSL custom property system.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, Recharts, Lucide Icons, framer-motion (new), existing shadcn/ui primitives.

---

## Design Philosophy: "Obsidian"

**The rule:** The data is the spectacle. Not gradients, not decoration, not color. Big numbers, clean surfaces, one accent color.

### Color System

| Token | Light Mode | Dark Mode | Rationale |
|-------|-----------|-----------|-----------|
| `--background` | `30 10% 98%` (warm snow) | `0 0% 3%` (true black #080808) | Warm & clean / deep & immersive |
| `--foreground` | `20 15% 10%` (warm black) | `30 10% 93%` (warm white) | Readable, warm undertone both modes |
| `--card` | `0 0% 100%` (pure white) | `0 0% 7%` (#121212) | Cards float on bg, minimal elevation |
| `--card-foreground` | `20 15% 10%` | `30 10% 93%` | Matches foreground |
| `--border` | `30 8% 90%` (warm gray) | `0 0% 12%` (subtle edge) | Hair-thin, warm not blue |
| `--muted` | `30 8% 95%` | `0 0% 10%` | Secondary surfaces |
| `--muted-foreground` | `20 5% 45%` | `0 0% 50%` | Subdued text |
| `--primary` | `24 95% 48%` (ember) | `24 100% 60%` (bright ember) | THE accent — warm, sporty, distinctive |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | White on ember |
| `--secondary` | `30 8% 93%` | `0 0% 12%` | Neutral surface |
| `--accent` | `152 69% 38%` (keep emerald) | `152 72% 52%` | Secondary semantic — health/positive |
| `--ring` | `24 95% 48%` | `24 100% 60%` | Focus ring = ember |
| `--sidebar` | `20 10% 8%` (near-black warm) | `0 0% 4%` (deepest black) | Sidebar always dark |
| `--sidebar-accent` | `24 95% 48%` | `24 100% 60%` | Active nav = ember |

**Key changes from current:**
- Background: Blue-gray (`230 22% 7%`) → True black (`0 0% 3%`) in dark mode
- Primary: Indigo (`234 75% 56%`) → Ember orange (`24 95% 48%`)
- All blue undertones eliminated — warm neutrals throughout
- Card surfaces: Gray-blue (`228 20% 13%`) → Pure dark (`0 0% 7%`)
- Sidebar: Blue-charcoal → Warm near-black

### What Gets Removed
- ALL `.gradient-hero*` classes and their dark variants
- ALL `.glow-*` classes
- `.glass-surface` (replaced with simple `bg-card` + border)
- `.noise-overlay` (unnecessary decoration)
- Every inline gradient in component files (`bg-gradient-to-*`, `linear-gradient`)

### What Gets Added
- `SpotlightCard` component — mouse-tracking ember glow on hover (the ONE premium interaction)
- `AnimatedNumberFlip` — mechanical counter for all dashboard stats
- Larger stat typography — hero numbers at 48px+
- Smooth `framer-motion` page transitions and staggered reveals

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install framer-motion**
```bash
cd apps/web && pnpm add framer-motion
```

**Step 2: Verify installation**
```bash
pnpm ls framer-motion
```

**Step 3: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add framer-motion for UI overhaul"
```

---

## Task 2: Color System Overhaul (globals.css)

**Files:**
- Modify: `apps/web/src/app/globals.css`

This is the highest-impact, lowest-risk change. Every component using design tokens updates automatically.

**Step 1: Replace `:root` color tokens**

Replace the light mode color block (lines 34-66) with:

```css
/* Primary — Ember (Energy, Competition, Action) */
--primary: 24 95% 48%;
--primary-foreground: 0 0% 100%;

/* Secondary — Warm neutral surface */
--secondary: 30 8% 93%;
--secondary-foreground: 20 15% 14%;

/* Accent — Emerald (Health, Growth, Vitality) — kept */
--accent: 152 69% 38%;
--accent-foreground: 0 0% 100%;
--accent-muted: 152 40% 92%;

/* Background — Warm snow */
--background: 30 10% 98%;
--foreground: 20 15% 10%;

/* Card — Pure white */
--card: 0 0% 100%;
--card-foreground: 20 15% 10%;

/* Popover */
--popover: 0 0% 100%;
--popover-foreground: 20 15% 10%;

/* Muted — Warm secondary */
--muted: 30 8% 95%;
--muted-foreground: 20 5% 45%;

/* Borders — Warm, not blue */
--border: 30 8% 90%;
--input: 30 8% 92%;
--ring: 24 95% 48%;
```

**Step 2: Replace `.dark` color tokens**

Replace the dark mode color block with:

```css
.dark {
  /* Primary — Bright Ember */
  --primary: 24 100% 60%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 0 0% 12%;
  --secondary-foreground: 30 10% 90%;

  /* Accent — Emerald */
  --accent: 152 72% 52%;
  --accent-foreground: 0 0% 100%;
  --accent-muted: 152 35% 12%;

  /* Background — True black */
  --background: 0 0% 3%;
  --foreground: 30 10% 93%;

  /* Card — Dark surface, not gray */
  --card: 0 0% 7%;
  --card-foreground: 30 10% 93%;

  /* Popover */
  --popover: 0 0% 7%;
  --popover-foreground: 30 10% 93%;

  /* Muted */
  --muted: 0 0% 10%;
  --muted-foreground: 0 0% 50%;

  /* Borders — Subtle, just visible */
  --border: 0 0% 14%;
  --input: 0 0% 12%;
  --ring: 24 100% 60%;
```

**Step 3: Update sidebar tokens (both modes)**

Light mode sidebar:
```css
--sidebar: 20 10% 8%;
--sidebar-foreground: 30 8% 60%;
--sidebar-primary: 0 0% 100%;
--sidebar-primary-foreground: 20 10% 8%;
--sidebar-accent: 24 95% 48%;
--sidebar-accent-foreground: 0 0% 100%;
--sidebar-border: 20 8% 14%;
--sidebar-ring: 24 95% 48%;
```

Dark mode sidebar:
```css
--sidebar: 0 0% 4%;
--sidebar-foreground: 0 0% 50%;
--sidebar-primary: 0 0% 100%;
--sidebar-primary-foreground: 0 0% 4%;
--sidebar-accent: 24 100% 60%;
--sidebar-accent-foreground: 0 0% 100%;
--sidebar-border: 0 0% 10%;
--sidebar-ring: 24 100% 60%;
```

**Step 4: Update chart palette to match ember theme**

Light mode:
```css
--chart-1: 24 95% 48%;     /* Ember (primary) */
--chart-2: 152 69% 38%;    /* Emerald (accent) */
--chart-3: 38 92% 50%;     /* Amber (warm) */
--chart-4: 0 72% 51%;      /* Red (alert) */
--chart-5: 20 15% 35%;     /* Warm gray */
--chart-6: 346 77% 49%;    /* Rose */
```

Dark mode:
```css
--chart-1: 24 100% 60%;
--chart-2: 152 72% 52%;
--chart-3: 45 93% 55%;
--chart-4: 0 78% 62%;
--chart-5: 20 10% 55%;
--chart-6: 346 77% 55%;
```

**Step 5: Remove gradient and glow utility classes**

Delete these blocks entirely:
- `.gradient-primary`
- `.gradient-success`
- `.gradient-hero` (and `.dark .gradient-hero`)
- `.gradient-hero-emerald` (and `.dark .gradient-hero-emerald`)
- `.gradient-hero-warm`
- `.gradient-hero-danger`
- `.glow-primary` (and `.dark .glow-primary`)
- `.glow-success` (and `.dark .glow-success`)
- `.glow-danger`
- `.glass-surface`
- `.noise-overlay::before`

**Step 6: Update the design system comment header**

```css
/* ═══════════════════════════════════════════════════════════════════════════
   FLOW SPORTS COACH - DESIGN SYSTEM v5.0 — "OBSIDIAN"
   Ember accent on true-black / warm-white surfaces. No gradients.
   ═══════════════════════════════════════════════════════════════════════════ */
```

**Step 7: Verify build**
```bash
cd apps/web && pnpm build
```

**Step 8: Commit**
```bash
git add src/app/globals.css
git commit -m "design: Obsidian color system — ember accent, true black dark mode, no gradients"
```

---

## Task 3: Create SpotlightCard Component

**Files:**
- Create: `apps/web/src/components/shared/ui/spotlight-card.tsx`

This is the ONE premium interaction in the system. Mouse-tracking ember glow that follows the cursor. Used on dashboard stat cards and key interactive surfaces.

**Step 1: Create the component**

```tsx
'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'hsl(24 95% 48% / 0.08)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card transition-colors',
        className
      )}
    >
      {/* Spotlight gradient that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/components/shared/ui/spotlight-card.tsx
git commit -m "feat: add SpotlightCard with mouse-tracking ember glow"
```

---

## Task 4: Create AnimatedNumber Component

**Files:**
- Create: `apps/web/src/components/shared/ui/animated-number.tsx`

Mechanical number flip animation for all stat values. Uses framer-motion for smooth spring physics.

**Step 1: Create the component**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
  duration = 1.2,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className={cn('stat-value tabular-nums', className)}>
      {display}
    </motion.span>
  );
}
```

**Step 2: Commit**
```bash
git add src/components/shared/ui/animated-number.tsx
git commit -m "feat: add AnimatedNumber with spring physics counter"
```

---

## Task 5: Rewrite EnhancedDashboard — Hero Stats

**Files:**
- Modify: `apps/web/src/components/coach/EnhancedDashboard.tsx`

The dashboard is the first thing coaches see. This is where the "wow" moment happens.

**Design:**
- Top row: 4 SpotlightCards with BIG animated numbers (48px). No gradients, no radial rings.
  - Team Readiness (% score, ember accent if >70, destructive if <50)
  - Total Athletes (count)
  - Average Mood (score /10)
  - Needs Attention (count, destructive color)
- Main area: Recharts AreaChart with ember fill (clean, single color area)
- Sidebar: Action items list (simple, no decorative cards)
- Crisis alerts: Red left-border accent bar, not gradient header

**Key principles for the rewrite:**
1. Remove ALL `gradient-hero*` class usage
2. Remove ALL `RadialRing` SVG components
3. Remove ALL `.glow-*` class usage
4. Replace stat display divs with `<SpotlightCard>` + `<AnimatedNumber>`
5. Stat numbers should be `text-5xl` (48px) using `stat-value` class
6. Card backgrounds: plain `bg-card` with `border border-border`
7. Area chart: single ember color fill, no gradient multi-color
8. Use `framer-motion` `<motion.div>` for staggered entry instead of CSS `.stagger-*` classes

**Step 1: Remove RadialRing component and gradient imports**

Delete the `RadialRing` function component entirely.

**Step 2: Rewrite the hero stats row**

```tsx
{/* Hero Stats */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <SpotlightCard className="p-6">
    <p className="text-sm text-muted-foreground mb-1">Team Readiness</p>
    <AnimatedNumber
      value={readinessScore}
      suffix="%"
      className="text-5xl text-foreground"
    />
  </SpotlightCard>
  {/* ... repeat for other 3 stats */}
</div>
```

**Step 3: Simplify the area chart**

- Remove gradient `<defs>` and `<linearGradient>` elements
- Use single ember color: `stroke="hsl(24, 95%, 48%)"` with `fillOpacity={0.08}`
- Keep axes minimal: light grid lines, no heavy borders

**Step 4: Simplify action items / crisis alerts**

- Crisis alerts: `border-l-4 border-destructive bg-card p-4` (no gradient header)
- Action items: Simple list with dot indicators, no pulse animation

**Step 5: Verify dashboard renders**
```bash
pnpm dev
# Open http://localhost:3000/coach/dashboard
```

**Step 6: Commit**
```bash
git add src/components/coach/EnhancedDashboard.tsx
git commit -m "design: rewrite dashboard — SpotlightCards, AnimatedNumbers, no gradients"
```

---

## Task 6: Update Sidebar Brand Icon (Both Layouts)

**Files:**
- Modify: `apps/web/src/app/coach/layout.tsx`
- Modify: `apps/web/src/app/student/layout.tsx`

**Step 1: Replace gradient brand icon with solid ember**

In both layout files, find the Brain icon container div and change:
```tsx
// FROM:
className="... gradient-hero ..."

// TO:
className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center cursor-pointer mb-8 transition-all hover:scale-110"
```

Remove any `hover:shadow-lg hover:shadow-[hsl(var(--sidebar-accent))]/30` glow effects.

**Step 2: Commit**
```bash
git add src/app/coach/layout.tsx src/app/student/layout.tsx
git commit -m "design: sidebar brand icon — solid ember, no gradient"
```

---

## Task 7: Audit & Fix Hardcoded Colors in Coach Components

**Files to audit:** All 57 files under `apps/web/src/components/coach/`

**What to find and replace:**

| Pattern | Replace With |
|---------|-------------|
| `text-gray-*` | `text-foreground` or `text-muted-foreground` |
| `bg-gray-*` | `bg-muted` or `bg-card` |
| `border-gray-*` | `border-border` |
| `text-blue-*` | `text-primary` |
| `bg-blue-*` | `bg-primary` or `bg-primary/10` |
| `border-blue-*` | `border-primary` |
| `text-indigo-*` | `text-primary` |
| `bg-indigo-*` | `bg-primary` |
| `text-green-*` | `text-accent` or `text-success` |
| `bg-green-*` | `bg-accent` or `bg-success-muted` |
| `text-red-*` | `text-destructive` |
| `bg-red-*` | `bg-destructive` or `bg-destructive-muted` |
| `text-yellow-*` | `text-warning` |
| `bg-yellow-*` | `bg-warning-muted` |
| `text-orange-*` | `text-primary` (it's ember now) |
| `bg-orange-*` | `bg-primary` |
| `text-purple-*` | Map to appropriate token |
| `text-white` (on colored bg) | `text-primary-foreground` |
| `gradient-hero*` | Remove, use `bg-primary` or `bg-card` |
| `glow-*` | Remove entirely |
| `glass-surface` | `bg-card border border-border` |

**Process:**
1. Run `grep -r "text-gray\|bg-gray\|border-gray\|text-blue\|bg-blue\|text-indigo\|bg-indigo\|gradient-hero\|glow-\|glass-surface" src/components/coach/` to find all instances
2. Replace each with the appropriate design token
3. Verify no visual regressions

**Step: Commit**
```bash
git add src/components/coach/
git commit -m "design: replace all hardcoded colors with design tokens in coach components"
```

---

## Task 8: Update Athletes Page

**Files:**
- Modify: `apps/web/src/app/coach/athletes/page.tsx`
- Modify: `apps/web/src/components/coach/roster/AthleteCard.tsx`
- Modify: `apps/web/src/components/coach/roster/AthleteGrid.tsx`
- Modify: `apps/web/src/components/coach/roster/FilterBar.tsx`

**Changes:**
- Athlete cards: Use `<SpotlightCard>` wrapper for each athlete card
- Remove any gradient backgrounds on athlete cards
- Stats inside cards: Use `<AnimatedNumber>` for mood/readiness scores
- Filter bar pills: `bg-card border border-border` when inactive, `bg-primary text-primary-foreground` when active (ember, not blue)
- Search input: Warm border (`border-border`), ember focus ring

**Commit:**
```bash
git commit -m "design: athletes page — SpotlightCards, ember filter pills, token colors"
```

---

## Task 9: Update Readiness Page

**Files:**
- Modify: `apps/web/src/app/coach/readiness/page.tsx`
- Modify: `apps/web/src/components/coach/analytics/TeamHeatmap.tsx`
- Modify: `apps/web/src/components/coach/team-analytics/ReadinessDashboard.tsx`
- Modify: `apps/web/src/components/coach/team-analytics/ReadinessScoreCard.tsx`

**Changes:**
- Heatmap cells: Keep the green/yellow/red traffic light system (semantic, not decorative)
- Summary stat cards at top: `<SpotlightCard>` + `<AnimatedNumber>`
- Remove any gradient headers or glow effects
- Filter pills: Match athletes page (ember active state)
- Table: Clean borders, warm neutrals, no colored row backgrounds except readiness indicators

**Commit:**
```bash
git commit -m "design: readiness page — clean heatmap, SpotlightCard stats"
```

---

## Task 10: Update Assignments Page

**Files:**
- Modify: `apps/web/src/app/coach/assignments/page.tsx`
- Modify: `apps/web/src/components/coach/assignments/ActiveAssignments.tsx`
- Modify: `apps/web/src/components/coach/assignments/AssignmentLibrary.tsx`

**Changes:**
- Assignment cards: Clean `bg-card border border-border`, no gradients
- Status badges: Use semantic colors (success for completed, warning for pending, destructive for overdue)
- Tab navigation: Ember underline for active tab, not blue
- List items: Subtle hover with `hover:bg-muted/50`

**Commit:**
```bash
git commit -m "design: assignments page — clean cards, ember active states"
```

---

## Task 11: Update AI Insights Page

**Files:**
- Modify: `apps/web/src/app/coach/ai-insights/page.tsx`
- Modify: `apps/web/src/components/coach/insights/*.tsx` (7 files)

**Changes:**
- Insight cards: `<SpotlightCard>` for primary insight cards
- AI-generated badges: Small ember dot or `bg-primary/10 text-primary` pill
- Chart components: Ember primary color in all charts
- Remove any decorative gradients or glows

**Commit:**
```bash
git commit -m "design: AI insights page — SpotlightCards, ember chart colors"
```

---

## Task 12: Update Alerts Page

**Files:**
- Modify: `apps/web/src/app/coach/alerts/page.tsx`
- Modify: `apps/web/src/components/coach/alerts/AlertsPanel.tsx`
- Modify: `apps/web/src/components/coach/alerts/AlertRulesPanel.tsx`

**Changes:**
- Alert items: Left border accent (`border-l-4`) with semantic color (destructive for crisis, warning for moderate, accent for low)
- No gradient headers
- Clean card surfaces

**Commit:**
```bash
git commit -m "design: alerts page — semantic border accents, no gradients"
```

---

## Task 13: Update Settings Page

**Files:**
- Modify: `apps/web/src/app/coach/settings/page.tsx`
- Modify: `apps/web/src/components/coach/settings/*.tsx` (3 files)

**Changes:**
- Section cards: Clean `bg-card border border-border rounded-xl`
- Form inputs: Warm borders, ember focus ring
- Toggle switches: Ember color when active
- Save buttons: `bg-primary text-primary-foreground` (ember)

**Commit:**
```bash
git commit -m "design: settings page — warm inputs, ember accents"
```

---

## Task 14: Update Athlete Detail Page

**Files:**
- Modify: `apps/web/src/app/coach/athletes/[id]/page.tsx`
- Modify: `apps/web/src/components/coach/AthleteDetailView.tsx`

**Changes:**
- Profile header: Clean, no gradient background. Large name typography. Ember accent on key metrics.
- Stat cards: `<SpotlightCard>` + `<AnimatedNumber>` for mood, confidence, stress
- Charts: Ember primary series color
- Timeline/history: Clean list with subtle separators

**Commit:**
```bash
git commit -m "design: athlete detail — SpotlightCard stats, clean profile header"
```

---

## Task 15: Update Shared UI Components

**Files:**
- Modify: `apps/web/src/components/shared/ui/stat-card.tsx`
- Modify: `apps/web/src/components/coach/ui/StatCard.tsx`

**Changes:**
- Remove any gradient or glow usage from stat card components
- Integrate `<AnimatedNumber>` as the default value renderer
- Wrap with `<SpotlightCard>` or accept a `spotlight` prop

**Commit:**
```bash
git commit -m "design: shared stat cards — AnimatedNumber integration"
```

---

## Task 16: Update CoachDashboard (Secondary Dashboard Component)

**Files:**
- Modify: `apps/web/src/components/coach/dashboard/CoachDashboard.tsx`

**Changes:**
- Same treatment as EnhancedDashboard: no gradients, SpotlightCards, AnimatedNumbers
- Ensure consistency with the primary dashboard

**Commit:**
```bash
git commit -m "design: CoachDashboard component — consistent Obsidian style"
```

---

## Task 17: Final Cleanup & Verification

**Step 1: Search for any remaining gradient/glow usage**
```bash
grep -rn "gradient-hero\|gradient-primary\|gradient-success\|glow-\|glass-surface\|noise-overlay" src/
```
Fix any remaining instances.

**Step 2: Search for remaining hardcoded Tailwind colors**
```bash
grep -rn "text-gray-\|bg-gray-\|text-blue-\|bg-blue-\|text-indigo-\|bg-indigo-" src/components/coach/ src/app/coach/
```
Fix any remaining instances.

**Step 3: Build check**
```bash
pnpm build
```
Must pass with zero errors.

**Step 4: Visual verification checklist**
- [ ] Dashboard: SpotlightCards glow ember on hover, numbers animate in
- [ ] Dark mode: True black background, no gray cards, ember accents pop
- [ ] Light mode: Warm white, no blue tints, ember is the only color that demands attention
- [ ] All pages: No gradients anywhere
- [ ] Sidebar: Dark surface, ember active states, clean tooltips
- [ ] Charts: Ember primary color in all chart series
- [ ] Mobile: All changes look correct at 375px width
- [ ] iPad: Layout works at 1024px+ (landscape triggers lg: breakpoint)

**Step 5: Commit**
```bash
git commit -m "design: final Obsidian cleanup — verify no gradients, no hardcoded colors"
```

---

## Implementation Sequence

```
Task 1 (deps) → Task 2 (colors) → Task 3 (SpotlightCard) → Task 4 (AnimatedNumber)
                                         ↓
                    ┌────────────────────┼────────────────────┐
                    ↓                    ↓                    ↓
              Task 5 (Dashboard)   Task 6 (Sidebar)    Task 7 (Color Audit)
                    ↓                    ↓                    ↓
              ┌─────┴─────┐       Task 8-14 (Pages)    Task 15-16 (Shared)
              ↓           ↓              ↓                    ↓
         Task 17 (Final Verification — after all above complete)
```

Tasks 5-16 can be parallelized after Tasks 1-4 are complete.

---

## Critical Constraint

**Zero gradients in the final output.** If you find yourself writing `linear-gradient`, `bg-gradient-to-*`, `.gradient-*`, or any gradient class — stop. Use a flat color token instead. The SpotlightCard radial glow is the ONLY gradient in the entire system, and it's programmatic (mouse-following), not decorative.
