/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        display: ["var(--font-syne)", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "#0a0b0e",
          secondary: "#111318",
          tertiary: "#181c24",
          elevated: "#1e232f",
        },
        border: {
          subtle: "rgba(255,255,255,0.07)",
          default: "rgba(255,255,255,0.12)",
          strong: "rgba(255,255,255,0.20)",
          focus: "rgba(255,255,255,0.35)",
        },
        text: {
          primary: "#e8eaf0",
          secondary: "#9098b0",
          muted: "#5a6278",
        },
        accent: {
          green: "#00c97a",
          red: "#ff4757",
          blue: "#409eff",
          amber: "#ffa502",
          purple: "#a29bfe",
          pink: "#fd79a8",
          cyan: "#00d4aa",
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "flash-green": "flash-green 0.5s ease-out forwards",
        "flash-red": "flash-red 0.5s ease-out forwards",
        "slide-in": "slide-in 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "pulse-dot": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "flash-green": {
          "0%": { backgroundColor: "rgba(0,201,122,0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-red": {
          "0%": { backgroundColor: "rgba(255,71,87,0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "slide-in": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
