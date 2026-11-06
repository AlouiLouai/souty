/**
 * SVG to PNG, with resvg. Two presets: the plain code (opaque white, no
 * fonts involved, fully deterministic) and the card (transparent outside
 * the card, text drawn with system fonts).
 */
import { Resvg } from "@resvg/resvg-js";
import { palette } from "@souty/brand/palette";

import { CARD_IMAGE_WIDTH } from "./card";

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
 * drawn with the system fonts of the machine running this, so the card PNG
 * can differ slightly between machines; the plain PNG cannot.
 */
export function rasterizeCard(svg: string): Buffer {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_IMAGE_WIDTH },
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  });
  return renderer.render().asPng();
}
