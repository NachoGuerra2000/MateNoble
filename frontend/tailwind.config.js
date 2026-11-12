/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde oliva del logo (#474d33 = mate-700) y crema de sus líneas (mate-50)
        mate: {
          50:  '#f8f8f1',
          100: '#eeefe2',
          200: '#dadcc6',
          300: '#bcc09c',
          400: '#959b70',
          500: '#727a4e',
          600: '#5b623e',
          700: '#474d33',
          800: '#393e29',
          900: '#26291b',
        },
        whatsapp: '#1f9d4f',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Segoe UI', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
