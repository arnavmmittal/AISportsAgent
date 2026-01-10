# AI Sports Agent - Design System Guidelines

**Version 1.0** | Athletic Minimalism Design System

## Overview

This design system provides a distinctive, professional athletic minimalist aesthetic for the AI Sports Agent platform. Inspired by Whoop and Strava but with our own unique identity, it emphasizes data visualization, semantic colors, and professional polish.

---

## Core Principles

### 1. **Data-First Design**
- Visualize metrics with charts, sparklines, and radial progress
- Numbers tell the story - make them prominent and animated
- Replace text-heavy cards with visual data displays
- Every metric should be instantly scannable

### 2. **Semantic Colors**
- Colors signal meaning, not decoration
- Primary (blue) = brand, main actions
- Success (green) = positive outcomes, readiness
- Warning (amber) = caution, moderate concern
- Danger (red) = critical, urgent attention
- Info (cyan) = neutral information, sleep
- Secondary (purple) = accent, confidence

### 3. **Professional Motion**
- Spring physics animations (no jarring transforms)
- Vertical offset (`y: -3`) instead of scale transforms
- Stagger children for list reveals
- AnimatedCounters for all numeric values
- Micro-interactions that delight without distracting

### 4. **Athletic Minimalism**
- Clean, focused interfaces
- Generous whitespace
- Professional typography (Sora/Inter/JetBrains Mono)
- No emoji in production UI
- No rainbow gradients or decorative colors

---

## Component Selection Guide

### Cards

**When to use each variant:**

- **`default`** - Standard content container
  ```tsx
  <Card variant="default" padding="md">
  ```

- **`elevated`** - Prominent content, metrics, dashboards
  ```tsx
  <Card variant="elevated" padding="lg">
  ```

- **`glass`** - Overlays, modals, floating panels
  ```tsx
  <Card variant="glass" padding="md">
  ```

- **`flat`** - Subtle containers, backgrounds
  ```tsx
  <Card variant="flat" padding="sm">
  ```

- **`metric`** - Data-focused cards with primary accent
  ```tsx
  <Card variant="metric" padding="lg">
  ```

- **`gradient`** - Navigation cards, call-to-action sections
  ```tsx
  <Card variant="gradient" padding="lg">
  ```

### Buttons

**Variant usage:**

- **`primary`** - Main actions, CTAs
- **`secondary`** - Secondary actions
- **`outline`** - Tertiary actions
- **`ghost`** - Minimal actions, links
- **`danger`** - Destructive actions

```tsx
<Button variant="primary" size="md">
  Complete Check-In
</Button>
```

### Badges

**Status indicators:**

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Moderate</Badge>
<Badge variant="danger" pulse>Critical</Badge>
```

**Use `pulse` prop for urgent status.**

---

## Data Visualization Components

### RadialProgress

**For:** Goal completion, readiness scores, percentages

```tsx
<RadialProgress
  value={78}
  max={100}
  size="lg"
  color="primary"
  label="Free Throw %"
  animated
/>
```

**Sizes:** `sm` (60px), `md` (100px), `lg` (140px), `xl` (200px)

---

### Sparkline

**For:** 7-day trends, mini charts

```tsx
<Sparkline
  data={[7.2, 7.8, 6.5, 8.0, 7.5, 8.2, 7.9]}
  height={40}
  width={120}
  color="primary"
  showDots={false}
  showArea={true}
/>
```

**Keep compact** - max width 150px, max height 60px

---

### AnimatedCounter

**For:** ALL numeric values (required)

```tsx
<AnimatedCounter
  value={7.8}
  decimals={1}
  suffix="/10"
  className="text-3xl"
/>
```

**Never display static numbers.** Always use AnimatedCounter for:
- Scores, averages, percentages
- Streaks, counts, totals
- Any numeric metric

---

### ActivityRing

**For:** Multi-metric overview (2-4 metrics)

```tsx
<ActivityRing
  rings={[
    { value: 78, max: 100, color: 'primary', label: 'Mood' },
    { value: 65, max: 100, color: 'success', label: 'Confidence' },
    { value: 40, max: 100, color: 'warning', label: 'Stress' }
  ]}
  size="xl"
  showLabels
  animated
/>
```

**Best for:** Dashboard overview cards

---

### MetricCard

**For:** Featured metrics with trends and sparklines

```tsx
<MetricCard
  label="Wellbeing Score"
  value={7.8}
  decimals={1}
  suffix="/10"
  trend="up"
  trendValue="+0.5"
  sparkline={[7.2, 7.8, 6.5, 8.0, 7.5, 8.2, 7.9]}
  gradient="primary"
  icon={<Heart className="w-5 h-5" />}
/>
```

**Use for:** Home dashboard, progress summaries

---

### HeatmapCalendar

**For:** 30-day patterns, consistency tracking

```tsx
<HeatmapCalendar
  data={logs.map(log => ({
    date: log.date,
    value: log.mood,
    label: `Mood: ${log.mood}/10`
  }))}
  startDate={thirtyDaysAgo}
  colorScale="primary"
  cellSize={16}
  gap={4}
/>
```

**Best for:** Mood tracking, habit consistency

---

## Color System

### Design Tokens (HSL)

**ALWAYS use CSS variables, never hardcoded colors.**

```tsx
// ❌ WRONG - Hardcoded Tailwind colors
className="bg-blue-600 text-purple-500"
className="bg-gradient-to-r from-pink-500 to-indigo-600"

// ✅ CORRECT - Semantic design tokens
className="bg-primary-600 dark:bg-primary-500"
className="text-success-600 dark:text-success-400"
```

### Color Usage Rules

| Color | When to Use | Example |
|-------|-------------|---------|
| `primary-*` | Brand, main actions, mood | Wellbeing score, check-in buttons |
| `success-*` | Positive outcomes, goals complete | Goal progress, high readiness |
| `warning-*` | Caution, moderate concern | Stress levels, moderate risk |
| `danger-*` | Critical, urgent | High stress, missed check-ins |
| `info-*` | Neutral info, sleep | Sleep tracking, informational cards |
| `secondary-*` | Accent, confidence | Confidence metrics, secondary actions |
| `gray-*` | Text, borders, backgrounds | Body text, card borders |

### Gradient Usage

**NEVER use hardcoded gradients.**

```tsx
// ❌ WRONG
className="bg-gradient-to-r from-blue-600 to-purple-600"

// ✅ CORRECT - Use semantic variants
<Card variant="metric" /> // Has primary gradient built-in
<MetricCard gradient="primary" />
```

**Only use gradients in:**
- MetricCard `gradient` prop
- Card `metric` variant
- Design system utilities (`.gradient-primary`, `.gradient-hero`)

---

## Typography

### Font Families

```tsx
// Display headings - Sora (geometric, professional)
className="font-display font-semibold"

// Body text - Inter (readable, clean)
className="font-body"

// Numbers, metrics - JetBrains Mono (tabular)
className="font-mono tabular-nums"
```

### Typography Scale

```tsx
// Page titles
className="text-4xl md:text-5xl font-display font-bold"

// Section headings
className="text-xl font-display font-semibold"

// Card titles
className="text-lg font-display font-semibold"

// Body text
className="text-sm font-body"

// Metrics (use AnimatedCounter)
<AnimatedCounter className="text-3xl font-display" />
```

**Always use:**
- `font-display` for headings
- `font-body` for paragraphs
- `font-mono` with `tabular-nums` for numbers

---

## Motion Patterns

### Import Shared Variants

```tsx
import { fadeInUp, staggerContainer, hoverLift } from '@/design-system/motion';
```

### Page Load Animations

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

### Hover Interactions

**NEVER use `hover:scale-*` transforms.**

```tsx
// ❌ WRONG
className="hover:scale-105"

// ✅ CORRECT - Vertical offset only
<motion.div whileHover={hoverLift.hover}>
  <Card />
</motion.div>
```

**Hover lift rule:** Only `y` offset (-3px), never scale.

### Available Motion Patterns

- **`fadeInUp`** - Fade in from bottom (list items)
- **`fadeInDown`** - Fade in from top (notifications)
- **`slideInRight`** - Slide from right (panels)
- **`slideInLeft`** - Slide from left (panels)
- **`staggerContainer`** - Parent for staggered children
- **`hoverLift`** - Vertical offset hover
- **`pulse`** - Attention-grabbing pulse

---

## Icons

### Lucide React (Required)

**NEVER use emoji in production UI.**

```tsx
// ❌ WRONG
<span>❤️ Mood</span>
<div className="text-6xl">🎯</div>

// ✅ CORRECT
import { Heart, Target } from 'lucide-react';
<Heart className="w-5 h-5 text-primary-600" />
<Target className="w-8 h-8 text-success-600" />
```

### Common Icon Mappings

| Concept | Icon | Color |
|---------|------|-------|
| Mood | `Heart` | `primary-600` |
| Stress | `Brain` | `warning-600` |
| Sleep | `Moon` | `info-600` |
| Confidence | `Zap` | `success-600` |
| Goals | `Target` | `primary-600` |
| Trend up | `TrendingUp` | `success-600` |
| Trend down | `TrendingDown` | `danger-600` |
| Activity | `Activity` | `secondary-600` |

### Icon Sizing

```tsx
// Small (inline) - 16px
<Icon className="w-4 h-4" />

// Medium (labels) - 20px
<Icon className="w-5 h-5" />

// Large (cards) - 32px
<Icon className="w-8 h-8" />

// Hero (empty states) - 64px
<Icon className="w-16 h-16" />
```

---

## Accessibility

### WCAG AA Compliance

- **Contrast ratios:** Minimum 4.5:1 for text
- **Interactive elements:** Minimum 44×44px touch targets
- **Focus states:** Visible `focus:ring-2 focus:ring-primary-500`
- **ARIA labels:** All icons need `aria-label`

### Example

```tsx
<button
  className="px-6 py-3 min-h-[44px] focus:ring-2 focus:ring-primary-500"
  aria-label="Complete daily check-in"
>
  <Heart className="w-5 h-5" aria-hidden="true" />
  Check In
</button>
```

---

## Dark Mode

### Always Support Both Modes

```tsx
// Text colors
className="text-gray-900 dark:text-gray-100"

// Backgrounds
className="bg-white dark:bg-gray-900"

// Borders
className="border-gray-200 dark:border-gray-800"

// Semantic colors (auto-adjust)
className="text-primary-600 dark:text-primary-500"
```

### Testing Checklist

- [ ] All text readable in both modes
- [ ] Sufficient contrast in both modes
- [ ] Icons visible in both modes
- [ ] Hover states work in both modes

---

## Common Patterns

### Dashboard Card

```tsx
<motion.div variants={fadeInUp}>
  <Card variant="elevated" padding="lg" hover>
    <div className="flex flex-col items-center">
      <Heart className="w-8 h-8 text-primary-600 dark:text-primary-500 mb-3" />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
        Average Mood
      </span>
      <AnimatedCounter
        value={7.8}
        decimals={1}
        suffix="/10"
        className="text-3xl font-display"
      />
      <Sparkline
        data={[7.2, 7.8, 6.5, 8.0, 7.5, 8.2, 7.9]}
        height={40}
        width={120}
        color="primary"
        className="mt-3"
      />
    </div>
  </Card>
</motion.div>
```

### List with Stagger Animation

```tsx
<motion.div variants={staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      <motion.div whileHover={hoverLift.hover}>
        <Card variant="flat" padding="md">
          {/* Content */}
        </Card>
      </motion.div>
    </motion.div>
  ))}
</motion.div>
```

---

## Anti-Patterns (DO NOT DO)

### ❌ Hardcoded Colors

```tsx
// NEVER use specific Tailwind colors directly
className="bg-blue-600 text-purple-500"
className="from-pink-500 to-indigo-600"
```

### ❌ Emoji in UI

```tsx
// NEVER use emoji
<span>😊 Happy</span>
<div>🎯 Goals</div>
```

### ❌ Scale Transforms

```tsx
// NEVER use scale on hover
className="hover:scale-105"
transform: 'scale(1.05)'
```

### ❌ Static Numbers

```tsx
// NEVER display numbers without animation
<span>{stats.wellbeingScore}</span>
```

### ❌ Inconsistent Fonts

```tsx
// NEVER mix font families inconsistently
// (e.g., Arial, Roboto, system fonts)
```

---

## Checklist Before Shipping

### Visual Consistency

- [ ] No hardcoded Tailwind colors
- [ ] All gradients use design tokens
- [ ] No emoji usage
- [ ] No `hover:scale-*` transforms
- [ ] All numbers use AnimatedCounter
- [ ] All headings use `font-display`
- [ ] All body text uses `font-body`
- [ ] All metrics use `font-mono tabular-nums`

### Accessibility

- [ ] WCAG AA contrast ratios
- [ ] All icons have proper colors
- [ ] Dark mode tested and works
- [ ] Focus states visible
- [ ] Touch targets ≥44px

### Performance

- [ ] Lighthouse score >90
- [ ] Animations run at >30fps
- [ ] No layout shift during animations
- [ ] Images optimized

---

## Resources

- **Figma:** [Design System Library](#)
- **Icons:** [Lucide React](https://lucide.dev)
- **Motion:** [Framer Motion](https://www.framer.com/motion/)
- **Typography:** [Sora](https://fonts.google.com/specimen/Sora), [Inter](https://rsms.me/inter/), [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

---

**Last Updated:** 2026-01-10
**Maintained by:** AI Sports Agent Design Team
**Questions?** See `/design-system/components` for implementation examples.
