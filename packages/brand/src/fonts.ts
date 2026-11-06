import localFont from "next/font/local";

/**
 * Souty's two typefaces, self-hosted.
 *
 * - Readex Pro: body text.
 * - Baloo Bhaijaan 2: display / headings.
 *
 * Both cover Arabic and Latin. The files are the Google Fonts subsets
 * (redistributed under the SIL Open Font License, see ../fonts), committed
 * here so builds never depend on the Google Fonts API and the PWA can
 * precache them for offline use.
 *
 * Each subset is its own font face, limited by `unicode-range`, so a page
 * only downloads the scripts it actually renders. The four families are
 * combined into --font-sans / --font-display in tokens.css.
 *
 * `adjustFontFallback` is off on purpose: the generated fallback face has
 * no unicode-range, so it would sit between the Latin and Arabic faces in
 * the stack and capture Arabic text before the Arabic webfont could.
 *
 * next/font requires every option to be a literal, hence the repeated
 * ranges below.
 */
const sansLatin = localFont({
  src: "../fonts/readex-pro-latin-wght-normal.woff2",
  weight: "160 700",
  style: "normal",
  display: "swap",
  variable: "--font-sans-latin",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const sansArabic = localFont({
  src: "../fonts/readex-pro-arabic-wght-normal.woff2",
  weight: "160 700",
  style: "normal",
  display: "swap",
  variable: "--font-sans-arabic",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC",
    },
  ],
});

const displayLatin = localFont({
  src: "../fonts/baloo-bhaijaan-2-latin-wght-normal.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-display-latin",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const displayArabic = localFont({
  src: "../fonts/baloo-bhaijaan-2-arabic-wght-normal.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-display-arabic",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC",
    },
  ],
});

/**
 * Class names that define the font CSS variables. Put this on <html>;
 * tokens.css turns them into --font-sans and --font-display.
 */
export const fontVariables = [
  sansLatin.variable,
  sansArabic.variable,
  displayLatin.variable,
  displayArabic.variable,
].join(" ");
