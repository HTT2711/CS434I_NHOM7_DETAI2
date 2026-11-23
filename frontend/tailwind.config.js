/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0b1329',
          950: '#070c18',
          900: '#0b1329',
          850: '#0f172a',
          800: '#17223b',
          700: '#1e293b',
          600: '#334155',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        gold: {
          DEFAULT: '#dfc9a5',
          50: '#fbf9f5',
          100: '#f5ede1',
          200: '#ebd9bf',
          300: '#dfc9a5',
          400: '#cdb185',
          500: '#bfa072',
          600: '#9e7f50',
          foreground: '#0b1329',
        },
        primary: {
          DEFAULT: '#0b1329',
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0b1329',
          600: '#070c18',
          700: '#040710',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
