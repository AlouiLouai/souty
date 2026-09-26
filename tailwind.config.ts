import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: "rgba(255,255,255,0.10)",
          lighter: "rgba(255,255,255,0.18)",
          border: "rgba(255,255,255,0.22)",
          dark: "rgba(10,12,20,0.35)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "48px",
      },
      boxShadow: {
        "glass-sm": "0 4px 16px 0 rgba(0,0,0,0.25)",
        glass: "0 8px 32px 0 rgba(0,0,0,0.35)",
        "glass-lg": "0 16px 60px 0 rgba(0,0,0,0.45)",
        "glow-white": "0 0 24px 0 rgba(255,255,255,0.35)",
        "inner-top": "inset 0 1px 0 0 rgba(255,255,255,0.35)",
      },
      keyframes: {
        blobFloatA: {
          "0%, 100%": { transform: "translate(-5%, -5%) scale(1)" },
          "33%": { transform: "translate(10%, 5%) scale(1.15)" },
          "66%": { transform: "translate(-8%, 12%) scale(0.9)" },
        },
        blobFloatB: {
          "0%, 100%": { transform: "translate(5%, 8%) scale(1.1)" },
          "40%": { transform: "translate(-12%, -6%) scale(0.85)" },
          "75%": { transform: "translate(8%, -10%) scale(1.2)" },
        },
        blobFloatC: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "50%": { transform: "translate(-10%, -14%) scale(1.25)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        floatUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideUpSheet: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "blob-a": "blobFloatA 22s ease-in-out infinite",
        "blob-b": "blobFloatB 26s ease-in-out infinite",
        "blob-c": "blobFloatC 30s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 2.2s ease-in-out infinite",
        "float-up": "floatUp 0.35s ease-out",
        "slide-up-sheet": "slideUpSheet 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
