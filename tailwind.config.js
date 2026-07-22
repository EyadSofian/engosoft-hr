/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Engosoft brand — navy wordmark + azure "e"
        navy: {
          950: '#04101F',
          900: '#0A2540',
          800: '#0E3159',
          700: '#134073',
          600: '#1A5292',
        },
        brand: {
          50: '#EBF4FF',
          100: '#D6E8FF',
          200: '#ADD0FE',
          300: '#7FB4FA',
          400: '#2AA7F0',
          500: '#0F72D8',
          600: '#0B63CE',
          700: '#0B4FA8',
          800: '#0D3F81',
          900: '#0E3465',
        },
        surface: {
          DEFAULT: '#F5F8FC',
          muted: '#EDF2F9',
          card: '#FFFFFF',
        },
        ink: {
          900: '#0A2540',
          700: '#2E4059',
          500: '#5A6B85',
          400: '#8496AC',
        },
        state: {
          active: '#0F72D8',
          hold: '#F59E0B',
          done: '#10B981',
          overdue: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['var(--font-app)', 'Inter', 'Cairo', 'system-ui', 'sans-serif'],
        ar: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        en: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,37,64,0.04), 0 8px 24px -12px rgba(10,37,64,0.14)',
        cardhover: '0 2px 6px rgba(10,37,64,0.06), 0 16px 40px -16px rgba(15,114,216,0.28)',
        soft: '0 1px 3px rgba(10,37,64,0.06)',
        glow: '0 0 0 1px rgba(15,114,216,0.25), 0 10px 30px -10px rgba(15,114,216,0.45)',
        lift: '0 18px 40px -18px rgba(10,37,64,0.45)',
        bottombar: '0 -6px 24px -12px rgba(10,37,64,0.25)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.15rem',
        '3xl': '1.6rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0B4FA8 0%, #0F72D8 48%, #2AA7F0 100%)',
        'navy-gradient': 'linear-gradient(180deg, #0A2540 0%, #0E3159 55%, #134073 100%)',
        'hero-gradient': 'linear-gradient(135deg, #0A2540 0%, #0B4FA8 45%, #0F72D8 100%)',
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
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'pulse-ring': 'pulse-ring 2s infinite',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
