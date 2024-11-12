/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fall: 'fall 3s linear forwards', // Falling animation lasts for 3 seconds
      },
      keyframes: {
        fall: {
          '0%': { top: '-10%' }, // Start above the screen
          '100%': { top: '110%' }, // End below the screen
        },
      },
    },
  },
  plugins: [],
};
