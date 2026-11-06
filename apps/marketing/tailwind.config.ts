import type { Config } from "tailwindcss";
import brandPreset from "@souty/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        // The picture-book look: hard, un-blurred ink shadows.
        "hard-sm": "3px 3px 0 var(--plum)",
        hard: "6px 6px 0 var(--plum)",
        "hard-lg": "8px 8px 0 var(--plum)",
        press: "0 5px 0 var(--plum)",
        "press-up": "0 7px 0 var(--plum)",
        "press-down": "0 1px 0 var(--plum)",
      },
      borderWidth: {
        3: "3px",
      },
      maxWidth: {
        site: "1120px",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "rotate(0) scale(1)" },
          "50%": { transform: "rotate(8deg) scale(1.04)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0)" },
          "25%": { transform: "rotate(-14deg)" },
          "75%": { transform: "rotate(10deg)" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        soundwave: {
          "0%": { opacity: "0", transform: "translateX(-6px)" },
          "30%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateX(10px)" },
        },
        pop: {
          "0%, 15%": { transform: "scale(0) rotate(-10deg)" },
          "25%, 80%": { transform: "scale(1) rotate(-4deg)" },
          "100%": { transform: "scale(0) rotate(-10deg)" },
        },
        shake: {
          "0%, 70%, 100%": { transform: "rotate(0)" },
          "75%": { transform: "rotate(-8deg)" },
          "85%": { transform: "rotate(8deg)" },
        },
        wobble: {
          "0%, 100%": { transform: "translateY(0) rotate(-6deg)" },
          "50%": { transform: "translateY(-6px) rotate(6deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
        },
        drift: {
          from: { transform: "translateX(-30%)" },
          to: { transform: "translateX(130%)" },
        },
        "chip-in": {
          from: { transform: "scale(0) rotate(-20deg)" },
          to: { transform: "scale(1) rotate(0)" },
        },
        fly: {
          "0%": { transform: "translate(-160px, 60px) rotate(-8deg)" },
          "100%": { transform: "translate(720px, -40px) rotate(-12deg)" },
        },
        bump: {
          "0%": { transform: "scale(0.4)" },
          "100%": { transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        rise: {
          to: { transform: "translateY(-120vh) rotate(30deg)", opacity: "0" },
        },
      },
      animation: {
        blob: "blob 9s ease-in-out infinite",
        bob: "bob 3.2s ease-in-out infinite",
        "bob-fast": "bob 2.4s ease-in-out infinite",
        wave: "wave 1.6s ease-in-out infinite",
        blink: "blink 4s infinite",
        soundwave: "soundwave 1.8s ease-out infinite",
        pop: "pop 3.2s ease-in-out infinite",
        shake: "shake 2.4s ease-in-out infinite",
        wobble: "wobble 1.8s ease-in-out infinite",
        heartbeat: "heartbeat 1.2s ease-in-out infinite",
        drift: "drift 18s linear infinite",
        "chip-in": "chip-in 0.45s cubic-bezier(0.3, 1.6, 0.5, 1)",
        fly: "fly 3.5s ease-in-out forwards",
        bump: "bump 0.5s cubic-bezier(0.3, 1.6, 0.5, 1)",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
