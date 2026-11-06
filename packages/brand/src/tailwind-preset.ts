import type { Config } from "tailwindcss";

/**
 * A Tailwind colour backed by a token from tokens.css. It reads the token's
 * RGB channels (--name-rgb) rather than its hex value, so opacity modifiers
 * work: bg-background/60, ring-highlight/90, text-foreground/80.
 *
 * Plain rgb() with a slash alpha is used, not color-mix(), because it works
 * on every browser the PWA supports, including older phones.
 */
function token(name: string): string {
  return `rgb(var(--${name}-rgb) / <alpha-value>)`;
}

/**
 * Shared Tailwind preset. Maps the semantic tokens from tokens.css onto
 * Tailwind color names and wires the two brand typefaces, so both apps
 * style with the same vocabulary (bg-background, text-foreground,
 * font-display...). Apps add their own content globs and extensions.
 *
 * Fonts are loaded per app from @souty/brand/fonts and exposed as the
 * --font-sans / --font-display CSS variables this preset reads.
 */
const preset = {
  theme: {
    extend: {
      colors: {
        border: token("border"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        highlight: {
          DEFAULT: token("highlight"),
          foreground: token("highlight-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        // Raw palette, for decorative use where no semantic role fits.
        sky: token("sky"),
        paper: token("paper"),
        plum: { DEFAULT: token("plum"), soft: token("plum-soft") },
        harissa: token("harissa"),
        sun: token("sun"),
        mint: token("mint"),
        lilac: token("lilac"),
        pink: token("pink"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
