/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        pastel: {
          blue: '#a8d8ea',
          pink: '#ffdada',
          green: '#c8e6c9',
          yellow: '#fff9c4',
          purple: '#e1bee7',
        },
        collable: {
          peach: '#F7C7BB',
          teal: '#175C64',
          light: '#EEF2F2',
          dark: '#0E3A40',
        },
      },
    },
  },
  plugins: [],
}
