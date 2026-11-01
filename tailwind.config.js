/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pastel: {
          sage: '#D1E7DD',
          lavender: '#E2D9F3',
          coral: '#FDE2E4',
          sand: '#FFF3CD',
          mint: '#BDE8D2',
          cyan: '#BCEAF2',
          lilac: '#D9C8F4',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        studio: '18px',
      },
    },
  },
  plugins: [],
};
