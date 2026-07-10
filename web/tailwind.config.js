/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: "#0a0a0a",
        elevated: "#111111",
        ink: "#ededed",
        muted: "#888888",
        faint: "#666666",
        border: "#333333",
        accent: "#0070f3",
        healthy: "#50e3c2",
        atrisk: "#f5a623",
        critical: "#e00",
      },
      fontFamily: {
        sans: ['"Geist"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1120px",
      },
      fontSize: {
        "label-14": ["14px", { lineHeight: "20px", letterSpacing: "-0.01em" }],
        "label-13": ["13px", { lineHeight: "18px", letterSpacing: "-0.01em" }],
        "copy-14": ["14px", { lineHeight: "22px", letterSpacing: "-0.006em" }],
      },
    },
  },
  plugins: [],
};
