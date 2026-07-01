/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B22222",
        background: "#FFFFFF",
        text: "#111111",
        secondary: "#666666",
        border: "#EFEFEF",
        panel: "#FFFFFF",
        accent: "#B22222",
      },
      fontFamily: {
        serif: ["Libre Baskerville", "Georgia", "Times New Roman", "Times", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        none: "none",
        soft: "0 2px 8px 0 rgba(0, 0, 0, 0.01)",
      },
    },
  },
  plugins: [],
};
