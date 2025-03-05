// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          'primary-green': '#006633',
          'accent-gold': '#FFD700',
          'error-red': '#D32F2F',
          'background-gray': '#F5F5F5',
        },
      },
    },
    plugins: [],
  };