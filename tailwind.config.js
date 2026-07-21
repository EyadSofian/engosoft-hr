/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Engosoft brand — deep navy + azure swoosh
        navy: {
          950: '#050f1f',
          900: '#071a33',
          800: '#0b2547',
          700: '#12335f',
          600: '#1a4478',
        },
        brand: {
          50: '#eaf3ff',
          100: '#d3e6ff',
          200: '#a9ccff',
          300: '#78acfb',
          400: '#4f93f7',
          500: '#2a7df0',
          600: '#1366e6',
          700: '#0f52c0',
          800: '#123f8f',
          900: '#13376f',
        },
        cyan: {
          accent: '#17b5e8',
        },
        surface: {
          DEFAULT: '#f4f7fc',
          muted: '#eef2f9',
          card: '#ffffff',
        },
        ink: {
          900: '#0c1a2e',
          700: '#31415a',
          500: '#5a6b85',
          400: '#8091a8',
        },
        state: {
          active: '#2a7df0',
          hold: '#f59e0b',
          done: '#10b981',
          overdue: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['var(--font-app)', 'Inter', 'Cairo', 'system-ui', 'sans-serif'],
        ar: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        en: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(12,26,46,0.04), 0 8px 24px -12px rgba(12,26,46,0.14)',
        cardhover: '0 2px 6px rgba(12,26,46,0.06), 0 16px 40px -16px rgba(19,102,230,0.28)',
        soft: '0 1px 3px rgba(12,26,46,0.06)',
        glow: '0 0 0 1px rgba(42,125,240,0.25), 0 10px 30px -10px rgba(42,125,240,0.45)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.15rem',
        '3xl': '1.6rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1366e6 0%, #2a7df0 45%, #17b5e8 100%)',
        'navy-gradient': 'linear-gradient(180deg, #071a33 0%, #0b2547 55%, #0d2c56 100%)',
        'hero-gradient': 'linear-gradient(135deg, #0f52c0 0%, #1366e6 40%, #17b5e8 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.55)' },
          '70%': { boxShadow: '0 0 0 7px rgba(16,185,129,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
    },
  },
  plugins: [],
};
