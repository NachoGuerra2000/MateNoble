/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mate: {
          50:  '#f0faf2',
          100: '#d8f3dc',
          200: '#ace5b5',
          300: '#74cf86',
          400: '#40b356',
          500: '#2d9142',
          600: '#237535',
          700: '#1c5c2a',
          800: '#164721',
          900: '#0e2e15',
        },
      },
    },
  },
  plugins: [],
};
