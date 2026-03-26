/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      /* ══════════════════════════════════════════════════════════════════════
         TYPOGRAPHY - Inter, Clean & Technical
         ══════════════════════════════════════════════════════════════════════ */
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.006em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.017em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '-0.011em',
        'wide': '0.05em',
      },
      /* ══════════════════════════════════════════════════════════════════════
         COLORS - Complete semantic color system
         ══════════════════════════════════════════════════════════════════════ */
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          muted: 'hsl(var(--destructive-muted))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          muted: 'hsl(var(--accent-muted))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Semantic Status Colors */
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--success-muted))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          muted: 'hsl(var(--info-muted))',
        },
        /* Readiness Traffic Light System */
        readiness: {
          green: {
            DEFAULT: 'hsl(var(--readiness-green))',
            bg: 'hsl(var(--readiness-green-bg))',
          },
          yellow: {
            DEFAULT: 'hsl(var(--readiness-yellow))',
            bg: 'hsl(var(--readiness-yellow-bg))',
          },
          red: {
            DEFAULT: 'hsl(var(--readiness-red))',
            bg: 'hsl(var(--readiness-red-bg))',
          },
        },
        /* Risk Level Colors */
        risk: {
          low: {
            DEFAULT: 'hsl(var(--risk-low))',
            bg: 'hsl(var(--risk-low-bg))',
          },
          moderate: {
            DEFAULT: 'hsl(var(--risk-moderate))',
            bg: 'hsl(var(--risk-moderate-bg))',
          },
          high: {
            DEFAULT: 'hsl(var(--risk-high))',
            bg: 'hsl(var(--risk-high-bg))',
          },
          critical: {
            DEFAULT: 'hsl(var(--risk-critical))',
            bg: 'hsl(var(--risk-critical-bg))',
          },
        },
        /* Athlete Archetype Colors */
        archetype: {
          overthinker: 'hsl(var(--archetype-overthinker))',
          burnout: 'hsl(var(--archetype-burnout))',
          momentum: 'hsl(var(--archetype-momentum))',
          inconsistent: 'hsl(var(--archetype-inconsistent))',
          avoider: 'hsl(var(--archetype-avoider))',
          resilient: 'hsl(var(--archetype-resilient))',
          lost: 'hsl(var(--archetype-lost))',
          perfectionist: 'hsl(var(--archetype-perfectionist))',
        },
        /* Sidebar */
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        /* Chart Colors */
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
          '6': 'hsl(var(--chart-6))',
        },
      },
      /* ══════════════════════════════════════════════════════════════════════
         SPACING & SIZING - Max 16px radius for professional feel
         ══════════════════════════════════════════════════════════════════════ */
      borderRadius: {
        'sm': 'var(--radius-sm)',   /* 6px */
        'md': 'var(--radius-md)',   /* 8px */
        'lg': 'var(--radius-lg)',   /* 12px */
        'xl': 'var(--radius-xl)',   /* 16px */
        DEFAULT: 'var(--radius)',   /* 12px - shadcn default */
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'glow-accent': '0 0 20px hsl(var(--accent) / 0.25)',
        'glow-success': '0 0 20px hsl(var(--success) / 0.25)',
      },
      /* ══════════════════════════════════════════════════════════════════════
         ANIMATIONS - Smooth, physics-based (no bouncing)
         ══════════════════════════════════════════════════════════════════════ */
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'message-in': 'messageIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'breathe': 'breathe 3s ease-in-out infinite',
        'pulse-width': 'pulseWidth 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        messageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        pulseWidth: {
          '0%, 100%': { width: '20%', opacity: '0.5' },
          '50%': { width: '60%', opacity: '1' },
        },
      },
      /* ══════════════════════════════════════════════════════════════════════
         TRANSITIONS
         ══════════════════════════════════════════════════════════════════════ */
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
