/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#171a21",
        border: "#262b35",
        accent: "#3b82f6",
      },
    },
  },
  plugins: [],
};
