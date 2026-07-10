/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F4F5F7",
        ink: "#1A1D26",
        accent: "#2F6FED",
        healthy: "#1F9D63",
        atrisk: "#E6A23C",
        critical: "#D64545",
        card: "#FFFFFF",
        border: "#D8DCE6",
        muted: "#5C6478",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1100px",
      },
    },
  },
  plugins: [],
};
