/**
 * Centralized theme constants for consistent styling
 * AI Sports Agent - Premium Athletic Design System (Lovable)
 */

export const Colors = {
  // Primary - Deep Blue (Trust, Focus, Professionalism)
  primary: '#1E40AF', // hsl(217 91% 40%)
  primaryLight: '#3B82F6', // hsl(217 91% 60%) - Bright Blue
  primaryDark: '#1E3A8A',

  // Secondary/Accent
  secondary: '#3B82F6', // Bright Blue
  accent: '#5BA3F5', // Light Blue hsl(213 94% 68%)

  // Chrome Silver
  chrome: '#BFBFBF', // hsl(0 0% 75%)
  chromeDark: '#8F8F8F',

  // Grayscale - Dark with blue tint
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8', // hsl(215 20% 65%) - muted foreground
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155', // hsl(215 25% 27%) - muted
  gray800: '#1E293B', // hsl(217 33% 17%) - card
  gray900: '#0F1419', // hsl(210 29% 8%) - background

  // Semantic
  success: '#10B981', // hsl(160 84% 39%)
  successLight: '#D1FAE5',
  warning: '#F59E0B', // hsl(38 92% 50%)
  warningLight: '#FEF3C7',
  error: '#EF4444', // hsl(0 84% 60%)
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Backgrounds - Dark with blue tint
  background: '#0F1419', // hsl(210 29% 8%)
  backgroundSecondary: '#1E293B', // hsl(217 33% 17%)
  card: '#1E293B',
  cardElevated: '#334155',

  // Borders
  border: '#2D3E50', // hsl(217 33% 25%)
  borderLight: '#334155',

  // Text - Light on dark
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8', // hsl(215 20% 65%)
  textTertiary: '#64748B',
  textInverse: '#0F1419',
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
