/**
 * Souty's picture-book palette as plain values, for places CSS variables
 * cannot reach (canvas drawing, generated images, QR codes, manifests).
 * Keep in sync with tokens.css: the CSS file is the source for styling,
 * this file is the source for everything rendered outside the cascade.
 */
export const palette = {
  sky: "#E9ECFF",
  paper: "#FFFFFF",
  plum: "#2A1846",
  plumSoft: "#5D4E7A",
  harissa: "#FF5A3C",
  sun: "#FFC83A",
  mint: "#22BFA0",
  lilac: "#B9A8FF",
  pink: "#FFB4C8",
  skin: "#F2B48B",
  skinLine: "#B9683F",
} as const;

export type PaletteColor = keyof typeof palette;
