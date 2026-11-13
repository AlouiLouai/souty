import type { Config } from "tailwindcss";
import brandPreset from "@souty/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        floatUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        /** A hand waving hello: "show your hands". */
        wave: {
          "0%, 60%, 100%": { transform: "rotate(0deg)" },
          "10%, 30%": { transform: "rotate(14deg)" },
          "20%, 40%": { transform: "rotate(-8deg)" },
        },
        /** A hand rising into the camera frame. */
        rise: {
          "0%": { transform: "translateY(55%)", opacity: "0" },
          "35%, 75%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0" },
        },
        /** Points at what to tap (start side, in reading order). */
        nudge: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-5px)" },
        },
        nudgeUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        /** Sound bars while the sentence is spoken. */
        soundBar: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        popIn: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2.2s ease-in-out infinite",
        "float-up": "floatUp 0.35s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        wave: "wave 2.4s ease-in-out infinite",
        rise: "rise 2.4s ease-out infinite",
        nudge: "nudge 1.1s ease-in-out infinite",
        "nudge-up": "nudgeUp 1.1s ease-in-out infinite",
        "sound-bar": "soundBar 0.7s ease-in-out infinite",
        "pop-in": "popIn 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
