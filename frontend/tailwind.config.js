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
          50: '#f0fdfd',
          100: '#0d9488',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#185B64',
          950: '#164e63',
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
