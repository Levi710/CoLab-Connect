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
          DEFAULT: '#0b0f19',
          surface: '#13161f', // Darker surface to avoid "white box" look
          lighter: '#1e293b',
        },
        primary: {
          DEFAULT: '#4285F4', // Google Blue
          hover: '#3367D6',
        },
        secondary: {
          DEFAULT: '#A142F4', // Google Purple
        },
        accent: {
          DEFAULT: '#24C1E0', // Google Teal
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
// Forced reload for dark theme
