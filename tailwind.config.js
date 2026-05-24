/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ink scale — warm near-blacks
        ink: {
          950: '#0c0a09',
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          600: '#57534e',
          500: '#78716c',
          400: '#a8a29e',
          300: '#d6d3d1',
          200: '#e7e5e4',
          100: '#f5f5f4',
        },
        // Canvas backgrounds
        canvas: {
          primary: '#0c0a09',
          surface: '#131210',
          elevated: '#1c1917',
        },
        // Aurora accents — ElevenLabs pastels for dark mode
        aurora: {
          mint: '#5fb8a3',
          'mint-subtle': 'rgba(95,184,163,0.15)',
          peach: '#d4a88c',
          'peach-subtle': 'rgba(212,168,140,0.15)',
          lavender: '#9d8bb8',
          'lavender-subtle': 'rgba(157,139,184,0.15)',
          sky: '#7da8c8',
          'sky-subtle': 'rgba(125,168,200,0.15)',
          rose: '#c494a4',
          'rose-subtle': 'rgba(196,148,164,0.15)',
        },
        // Text colors
        text: {
          primary: '#fafaf9',
          secondary: '#a8a29e',
          tertiary: '#78716c',
          muted: '#57534e',
        },
        // Action colors
        action: {
          primary: '#292524',
          'primary-hover': '#3d3833',
          'primary-active': '#1c1917',
          text: '#fafaf9',
        },
        // Semantic colors (aurora-based)
        success: '#5fb8a3',
        warning: '#d4a88c',
        error: '#c494a4',
        info: '#7da8c8',
        // Hairline borders
        hairline: 'rgba(255,255,255,0.06)',
        'hairline-strong': 'rgba(255,255,255,0.10)',
        'hairline-active': 'rgba(255,255,255,0.18)',
        // Legacy aliases for backward compatibility
        dark: {
          bg: '#0c0a09',
          elevated: '#1c1917',
          border: 'rgba(255,255,255,0.06)',
        },
        accent: {
          blue: '#7da8c8',
          green: '#5fb8a3',
          red: '#c494a4',
          yellow: '#d4a88c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          '"Fira Code"',
          'Menlo',
          'Monaco',
          '"Courier New"',
          'monospace',
        ],
      },
      borderRadius: {
        'pill': '9999px',
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'xxl': '24px',
      },
      fontSize: {
        'mega': ['48px', { lineHeight: '1.05', letterSpacing: '-1.44px' }],
        'xl-display': ['36px', { lineHeight: '1.08', letterSpacing: '-0.72px' }],
        'lg-display': ['28px', { lineHeight: '1.12', letterSpacing: '-0.28px' }],
        'md-display': ['20px', { lineHeight: '1.35', letterSpacing: '0' }],
        'sm-display': ['18px', { lineHeight: '1.44', letterSpacing: '0.18px' }],
        'body': ['15px', { lineHeight: '1.5', letterSpacing: '0.15px' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '0' }],
        'label': ['11px', { lineHeight: '1.3', letterSpacing: '0.88px' }],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.5)',
        'md': '0 4px 12px rgba(0,0,0,0.4)',
        'lg': '0 8px 30px rgba(0,0,0,0.5)',
        'aurora-mint': '0 0 20px rgba(95,184,163,0.2)',
        'aurora-lavender': '0 0 20px rgba(157,139,184,0.2)',
        'aurora-peach': '0 0 20px rgba(212,168,140,0.2)',
        'aurora-sky': '0 0 20px rgba(125,168,200,0.2)',
        'aurora-rose': '0 0 20px rgba(196,148,164,0.2)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(10px, -10px)' },
          '50%': { transform: 'translate(-5px, 5px)' },
          '75%': { transform: 'translate(-10px, -5px)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 4px rgba(157,139,184,0.4), 0 0 12px rgba(157,139,184,0.15)',
          },
          '50%': {
            boxShadow: '0 0 8px rgba(157,139,184,0.6), 0 0 24px rgba(157,139,184,0.3)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-in-plain': 'fade-in-plain 0.25s ease-out both',
        'slide-in-left': 'slide-in-left 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
        'slide-in-up': 'slide-in-up 0.25s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'aurora-drift': 'aurora-drift 20s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
