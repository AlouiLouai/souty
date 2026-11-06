/**
 * SVG to PNG, with resvg. Two presets: the plain code (opaque white, no
 * fonts involved) and the card (transparent outside the card, text drawn
 * with the two bundled brand fonts). Neither reads the machine's fonts, so
 * both come out the same wherever they are generated.
 */
import { Resvg } from "@resvg/resvg-js";
import { palette } from "@souty/brand/palette";

import { CARD_IMAGE_WIDTH } from "./card";
import { CARD_FONT_OPTIONS } from "./text";

/** Width of the plain PNG: large enough to stay sharp full-screen on a 4K projector. */
export const PLAIN_PNG_WIDTH = 2048;

/**
 * Rasterizes the plain QR SVG onto an opaque white background, so the code
 * keeps its quiet zone on a slide of any colour.
 */
export function rasterizePlain(svg: string): Buffer {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: PLAIN_PNG_WIDTH },
    background: palette.paper,
    font: { loadSystemFonts: false },
  });
  return renderer.render().asPng();
}

/**
 * Rasterizes the card SVG at its natural size, one SVG unit per pixel,
 * keeping the margin around the card transparent. The two text lines are
 * drawn with the fonts bundled in ../fonts, never with system fonts.
 */
export function rasterizeCard(svg: string): Buffer {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_IMAGE_WIDTH },
    font: CARD_FONT_OPTIONS,
  });
  return renderer.render().asPng();
}
