/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        streakBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-4px) scale(1.08)' },
        },
      },
      animation: {
        'page-enter': 'pageEnter 220ms ease-out',
        'streak-bounce': 'streakBounce 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
