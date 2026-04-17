/**
 * Centralized theme constants for consistent styling
 * Flow Sports Coach — Obsidian Design System v5.0 (Mobile)
 *
 * Adapted from web globals.css for mobile context:
 * - Muted primary/accent (large surfaces stay neutral, color used sparingly)
 * - Warmer neutrals for a calming, wellness-appropriate feel
 * - Same semantic colors as web for brand consistency
 */

// Dark theme colors (default for athletes) — Obsidian v5.0 mobile dark
const darkColors = {
  // Primary — Soft Ember (used for buttons, CTAs, interactive elements only)
  primary: '#D4732E',
  primaryLight: '#E8914D',
  primaryDark: '#B85E1F',

  // Accent — Muted Emerald (health, growth, wellness indicators)
  secondary: '#1A1A1A',
  accent: '#34B87A',

  // Chrome
  chrome: '#737373',
  chromeDark: '#525252',

  // Grayscale — warm neutral (no blue undertones)
  gray50: '#F5F5F4',
  gray100: '#E7E5E4',
  gray200: '#D6D3D1',
  gray300: '#A8A29E',
  gray400: '#78716C',
  gray500: '#57534E',
  gray600: '#3D3936',
  gray700: '#292524',
  gray800: '#1C1917',
  gray900: '#0C0A09',

  // Semantic — visible on dark surfaces, not neon
  success: '#34B87A',
  successLight: '#0D2818',
  warning: '#E5A828',
  warningLight: '#231D0D',
  error: '#DC5454',
  errorLight: '#230D0D',
  info: '#3B8FE3',
  infoLight: '#0D1823',

  // Backgrounds — Deep charcoal (warmer than true black)
  background: '#0C0A09',
  backgroundSecondary: '#1C1917',
  card: '#1C1917',
  cardElevated: '#292524',

  // Borders — Warm, subtle
  border: '#292524',
  borderLight: '#3D3936',

  // Text — Warm light
  textPrimary: '#F5F5F4',
  textSecondary: '#A8A29E',
  textTertiary: '#78716C',
  textInverse: '#0C0A09',
};

// Light theme colors (for coaches) — Obsidian v5.0 mobile light
const lightColors = {
  // Primary — Warm Ember (softer than web for mobile readability)
  primary: '#C95D12',
  primaryLight: '#D4732E',
  primaryDark: '#A84D0E',

  // Accent — Emerald
  secondary: '#F5F5F4',
  accent: '#1D9A5B',

  // Chrome
  chrome: '#A8A29E',
  chromeDark: '#78716C',

  // Grayscale — warm Stone palette
  gray50: '#FAFAF9',
  gray100: '#F5F5F4',
  gray200: '#E7E5E4',
  gray300: '#D6D3D1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
  gray700: '#44403C',
  gray800: '#292524',
  gray900: '#1C1917',

  // Semantic — WCAG AA compliant
  success: '#1D9A5B',
  successLight: '#ECFDF5',
  warning: '#D4930A',
  warningLight: '#FEFCE8',
  error: '#C53030',
  errorLight: '#FEF2F2',
  info: '#2B7BD5',
  infoLight: '#EFF6FF',

  // Backgrounds — Warm snow
  background: '#FAFAF9',
  backgroundSecondary: '#F5F5F4',
  card: '#FFFFFF',
  cardElevated: '#F5F5F4',

  // Borders — Warm neutral
  border: '#E7E5E4',
  borderLight: '#F5F5F4',

  // Text — Warm dark
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#A8A29E',
  textInverse: '#FFFFFF',
};

// Default export (dark theme for backwards compatibility)
export const Colors = darkColors;

// Function to get theme-aware colors
export const getThemeColors = (isDark: boolean = true) => {
  return isDark ? darkColors : lightColors;
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 8, // 0.5rem
  md: 10, // calc(0.75rem - 2px)
  lg: 12, // 0.75rem (base)
  xl: 16, // calc(0.75rem + 4px)
  xxl: 20, // calc(0.75rem + 8px)
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  // Warm glow for primary actions
  primaryGlow: {
    shadowColor: '#D4732E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  // Subtle accent glow for health indicators
  accentGlow: {
    shadowColor: '#34B87A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
