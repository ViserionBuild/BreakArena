/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#16162a',
          700: '#1e1e35',
          600: '#2a2a45',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        crimson: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        jade: {
          400: '#4ade80',
          500: '#22c55e',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'rank-up': 'rankUp 0.5s ease-out',
        'rank-down': 'rankDown 0.5s ease-out',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'count-up': 'countUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251,191,36,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(251,191,36,0.7)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        rankUp: {
          '0%': { transform: 'translateY(5px)', color: '#4ade80' },
          '100%': { transform: 'translateY(0)', color: 'inherit' },
        },
        rankDown: {
          '0%': { transform: 'translateY(-5px)', color: '#f87171' },
          '100%': { transform: 'translateY(0)', color: 'inherit' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        countUp: {
          '0%': { transform: 'scale(1.3)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)',
        'card-gradient': 'linear-gradient(135deg, rgba(30,30,53,0.9) 0%, rgba(22,22,42,0.95) 100%)',
      },
    },
  },
  plugins: [],
}
