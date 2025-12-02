/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0a0a', // Rich Black
          surface: '#121212', // Charcoal
          lighter: '#1e1e1e',
        },
        primary: {
          DEFAULT: '#BF953F', // Gold
          hover: '#AA771C',
        },
        secondary: {
          DEFAULT: '#C0C0C0', // Silver
        },
        gold: {
          light: '#FCF6BA',
          DEFAULT: '#BF953F',
          dark: '#AA771C',
        },
        silver: {
          light: '#EEF2F3',
          DEFAULT: '#C0C0C0',
          dark: '#A0A0A0',
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
        'gold-gradient': "linear-gradient(135deg, #BF953F 0%, #FCF6BA 50%, #BF953F 100%)",
        'silver-gradient': "linear-gradient(135deg, #C0C0C0 0%, #EEF2F3 50%, #C0C0C0 100%)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      }
    },
  },
  plugins: [],
}
// Forced reload for dark theme
