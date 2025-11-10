import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'grid-kings': {
          bg: '#1A1A1A',
          gold: '#D2B83E',
          'gold-light': '#E5C94F',
          red: '#B42518',
          'red-light': '#C53829',
        },
      },
      backgroundImage: {
        'grid-kings-gradient': 'linear-gradient(to right, #D2B83E, #B42518)',
        'grid-kings-gradient-hover': 'linear-gradient(to right, #E5C94F, #C53829)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-once': 'pulse 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
