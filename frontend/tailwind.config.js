/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E53935",
        background: "#FFFFFF",
        text: "#111111",
        secondary: "#666666",
        border: "#F1F1F1",
        panel: "#FAFAFA",
        accent: "#E53935",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px 0 rgba(0, 0, 0, 0.02)",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.01), 0 1px 2px -1px rgba(0, 0, 0, 0.01)",
      },
    },
  },
  plugins: [],
};
