/**
 * Centralized theme constants for consistent styling
 * Flow Sports Coach - Premium Athletic Design System (Lovable)
 */

// Dark theme colors (default) — synced with web globals.css dark mode
const darkColors = {
  // Primary - Deep Navy (Trust, Stability, Performance)
  primary: '#1A3A6B',
  primaryLight: '#2A5A9B',
  primaryDark: '#0F2647',

  // Secondary/Accent - Electric Teal (Growth, Progress, Energy)
  secondary: '#2A5A9B',
  accent: '#14B8A6',

  // Chrome Silver
  chrome: '#BFBFBF',
  chromeDark: '#8F8F8F',

  // Grayscale
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F1419',

  // Semantic - Proper status colors matching web
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#EAB308',
  warningLight: '#422006',
  error: '#EF4444',
  errorLight: '#450A0A',
  info: '#38BDF8',
  infoLight: '#082F49',

  // Backgrounds - Dark
  background: '#0F1419',
  backgroundSecondary: '#1E293B',
  card: '#1E293B',
  cardElevated: '#334155',

  // Borders
  border: '#2D3E50',
  borderLight: '#334155',

  // Text - Light on dark
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F1419',
};

// Light theme colors — synced with web globals.css light mode
const lightColors = {
  // Primary - Deep Navy
  primary: '#1A3A6B',
  primaryLight: '#2A5A9B',
  primaryDark: '#0F2647',

  // Secondary/Accent - Electric Teal
  secondary: '#2A5A9B',
  accent: '#14B8A6',

  // Chrome Silver
  chrome: '#BFBFBF',
  chromeDark: '#8F8F8F',

  // Grayscale
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F1419',

  // Semantic - Proper status colors matching web
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#CA8A04',
  warningLight: '#FEF9C3',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Backgrounds - Light
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  card: '#FFFFFF',
  cardElevated: '#F1F5F9',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text - Dark on light
  textPrimary: '#0F1419',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
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
  // Blue glow effects for Lovable design
  blueGlow: {
    shadowColor: '#1A3A6B', // Primary navy
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  blueGlowSmall: {
    shadowColor: '#1A3A6B', // Primary navy
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Chrome glow effect
  chromeGlow: {
    shadowColor: '#BFBFBF', // Chrome silver
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
};
