/**
 * Centralized theme constants for consistent styling
 * Flow Sports Coach - Premium Athletic Design System (Lovable)
 */

// Dark theme colors (default)
const darkColors = {
  // Primary - Deep Blue (Trust, Focus, Professionalism)
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',

  // Secondary/Accent
  secondary: '#3B82F6',
  accent: '#5BA3F5',

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

  // Semantic - Professional palette (blue/silver/steel)
  success: '#3B82F6', // secondary (bright blue) - was green
  successLight: '#DBEAFE',
  warning: '#94A3B8', // muted-foreground (steel gray) - was orange
  warningLight: '#CBD5E1',
  error: '#94A3B8', // muted-foreground (steel gray) - was red
  errorLight: '#CBD5E1',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

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

// Light theme colors
const lightColors = {
  // Primary - Deep Blue
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',

  // Secondary/Accent
  secondary: '#3B82F6',
  accent: '#5BA3F5',

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

  // Semantic - Professional palette (blue/silver/steel)
  success: '#3B82F6', // secondary (bright blue) - was green
  successLight: '#DBEAFE',
  warning: '#94A3B8', // muted-foreground (steel gray) - was orange
  warningLight: '#CBD5E1',
  error: '#94A3B8', // muted-foreground (steel gray) - was red
  errorLight: '#CBD5E1',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

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
    shadowColor: '#1E40AF', // Primary blue
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  blueGlowSmall: {
    shadowColor: '#1E40AF', // Primary blue
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
