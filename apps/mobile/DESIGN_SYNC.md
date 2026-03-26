# Mobile Design Sync — Web ↔ React Native

> Reference for keeping mobile UI visually consistent with the web overhaul (feature/ui-overhaul-21st).
> This documents design decisions, not code to copy — adapt patterns to React Native idioms.

---

## Color Token Mapping

Web CSS variables → mobile `constants/theme.ts`:

| Web Token (HSL) | Purpose | Mobile Dark | Mobile Light |
|-----------------|---------|-------------|--------------|
| `--background` | Page bg | `#0F1419` (gray900) | `#FFFFFF` |
| `--foreground` | Primary text | `#FFFFFF` (textPrimary) | `#0F1419` |
| `--card` | Card bg | `#1E293B` (card) | `#FFFFFF` |
| `--primary` | Brand / CTA | `#1E40AF` (primary) | `#1E40AF` |
| `--primary-foreground` | Text on primary | `#FFFFFF` | `#FFFFFF` |
| `--muted` | Subtle bg | `#334155` (cardElevated) | `#F1F5F9` |
| `--muted-foreground` | Secondary text | `#94A3B8` (textSecondary) | `#64748B` |
| `--accent` (teal) | Accent / highlights | `#14B8A6` | `#14B8A6` |
| `--border` | Borders | `#2D3E50` (border) | `#E2E8F0` |
| `--destructive` | Error / danger | `#EF4444` | `#EF4444` |
| `--sidebar-*` | N/A on mobile | — | — |

**Note**: Web uses navy/teal palette. Mobile currently uses blue/silver. Consider aligning mobile to match web's teal accent (`#14B8A6`) for brand consistency.

---

## Typography

| Level | Web (Inter) | Mobile Equivalent |
|-------|-------------|-------------------|
| h1 | 30px / bold / -0.02em | fontSize: 30, fontWeight: '700', letterSpacing: -0.6 |
| h2 | 24px / semibold / -0.015em | fontSize: 24, fontWeight: '600', letterSpacing: -0.36 |
| h3 | 20px / semibold / -0.01em | fontSize: 20, fontWeight: '600', letterSpacing: -0.2 |
| body | 16px / normal / 1.6 lh | fontSize: 16, lineHeight: 25.6 |
| small | 14px / medium | fontSize: 14, fontWeight: '500' |
| caption | 12px / medium | fontSize: 12, fontWeight: '500' |

Font: **Inter** (web) maps to system font on mobile, or install `expo-google-fonts/inter`.

---

## Spacing System

4px grid, matching Tailwind's default scale:

| Tailwind | px | RN Usage |
|----------|-----|----------|
| p-1 | 4 | Fine margins |
| p-2 | 8 | Icon padding |
| p-3 | 12 | Input padding |
| p-4 | 16 | Card padding |
| p-6 | 24 | Section padding |
| p-8 | 32 | Page margins |

---

## Component Mapping

| Web Component | Mobile Equivalent | Notes |
|--------------|-------------------|-------|
| `<Sidebar>` (shadcn) | Bottom Tab Navigator | Mobile uses tabs, not sidebar |
| `<MobileBottomNav>` | Bottom Tab Navigator | Direct equivalent, 5 items max |
| `<ChatBubble>` | Custom ChatBubble component | Keep same variant logic (sent/received) |
| `<ChatMessageList>` | FlatList with auto-scroll | `inverted={false}`, `onContentSizeChange` scroll |
| `<ChatInput>` | TextInput with auto-grow | `multiline`, `maxHeight: 128` |
| `<StatCard>` | Custom Card component | Same layout: title, value, trend, progress bar |
| `<Card>` (shadcn) | Custom Card with shadow | `borderRadius: 12, elevation: 2` |
| `<Button>` (shadcn) | Pressable with variants | Match primary/ghost/outline variants |
| `<Skeleton>` | Animated.View with shimmer | Use `react-native-reanimated` |

---

## Animation Curves

| Web (CSS) | React Native (Animated/Reanimated) |
|-----------|-------------------------------------|
| `cubic-bezier(0.16, 1, 0.3, 1)` | `Easing.bezier(0.16, 1, 0.3, 1)` — spring-like deceleration |
| `ease-in-out` 200ms | `withTiming(value, { duration: 200, easing: Easing.inOut(Easing.ease) })` |
| `ease-out` 300ms | `withTiming(value, { duration: 300, easing: Easing.out(Easing.ease) })` |
| `prefers-reduced-motion` | `AccessibilityInfo.isReduceMotionEnabled()` |

---

## Touch Targets

Web enforces 44px minimum touch targets. Mobile should use **48px** (Material Design) or **44pt** (Apple HIG):

```ts
const TOUCH_TARGET = { minHeight: 44, minWidth: 44 };
```

---

## Dark Mode

Web toggles via `className="dark"` on `<html>`. Mobile should use `useColorScheme()` from React Native and map to the appropriate color set in `theme.ts`.

---

*Updated: 2026-03-25 — Aligned with feature/ui-overhaul-21st branch*
