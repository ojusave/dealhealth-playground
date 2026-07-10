/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#080A0F",
        surface: "#0F1219",
        elevated: "#161B26",
        ink: "#F4F6FA",
        muted: "#8B93A7",
        faint: "#5C6478",
        accent: "#6C8CFF",
        "accent-glow": "#4F6BFF",
        healthy: "#34D399",
        atrisk: "#FBBF24",
        critical: "#F87171",
        border: "#252D3D",
        "border-bright": "#364055",
        openai: "#10A37F",
        anthropic: "#D97757",
        xai: "#A3A3A3",
        render: "#5E6AD2",
      },
      fontFamily: {
        sans: ["\"DM Sans\"", "system-ui", "sans-serif"],
        display: ["\"Instrument Sans\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1280px",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(108, 140, 255, 0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px -20px rgba(0,0,0,0.6)",
        lift: "0 20px 50px -24px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "hero-glow": "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(94,106,210,0.22), transparent)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
