const colors = require('./colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    colors,
    fontFamily: {
      sans: 'IBMPlexSans',
      mono: 'IBMPlexMono',
    },
  },
  plugins: [],
};
