import type { Config } from "tailwindcss";

/**
 * Shared Tailwind preset. Maps the semantic tokens from tokens.css onto
 * Tailwind color names and wires the two brand typefaces, so both apps
 * style with the same vocabulary (bg-background, text-foreground,
 * font-display...). Apps add their own content globs and extensions.
 *
 * Fonts are loaded per app with next/font and exposed as the
 * --font-sans / --font-display CSS variables this preset reads.
 */
const preset = {
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        highlight: {
          DEFAULT: "var(--highlight)",
          foreground: "var(--highlight-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Raw palette, for decorative use where no semantic role fits.
        sky: "var(--sky)",
        paper: "var(--paper)",
        plum: { DEFAULT: "var(--plum)", soft: "var(--plum-soft)" },
        harissa: "var(--harissa)",
        sun: "var(--sun)",
        mint: "var(--mint)",
        lilac: "var(--lilac)",
        pink: "var(--pink)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
