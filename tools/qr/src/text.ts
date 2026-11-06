/**
 * The card's typefaces and how its text is measured.
 *
 * The two Souty brand fonts are bundled with this tool (../fonts, SIL Open
 * Font License) and are the only fonts the rasterizer may use. System fonts
 * are never consulted, so a card renders the same on a Windows laptop and on
 * a Linux CI runner, and text can be fitted by measuring the real glyphs
 * instead of estimating their widths.
 */
import { fileURLToPath } from "node:url";

import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";

/** A bundled typeface, with the vertical reach of its tallest and deepest glyphs. */
export interface CardFont {
  /** Family name as stored in the font file. */
  readonly family: string;
  readonly weight: number;
  /**
   * How far ink can rise above the baseline (accented capitals such as "É")
   * and drop below it ("g", "ç"), as shares of the font size. Upper bounds
   * for the characters a card may contain; a test measures them.
   */
  readonly ascent: number;
  readonly descent: number;
}

/** Display face, used for the card title: Baloo Bhaijaan 2 ExtraBold. */
export const TITLE_FONT: CardFont = { family: "Baloo Bhaijaan 2", weight: 800, ascent: 0.87, descent: 0.23 };

/** Text face, used for the address under the code: Readex Pro SemiBold. */
export const CAPTION_FONT: CardFont = { family: "Readex Pro", weight: 600, ascent: 0.94, descent: 0.25 };

function bundledFont(fileName: string): string {
  return fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url));
}

/** resvg font settings: the bundled files only, never the machine's fonts. */
export const CARD_FONT_OPTIONS: NonNullable<ResvgRenderOptions["font"]> & { fontFiles: string[] } = {
  loadSystemFonts: false,
  fontFiles: [bundledFont("BalooBhaijaan2-ExtraBold.ttf"), bundledFont("ReadexPro-SemiBold.ttf")],
  defaultFontFamily: CAPTION_FONT.family,
};

/** Where the ink of a centred line of text lands, relative to its anchor point. */
export interface InkExtents {
  /** Furthest ink to the left of the centre. */
  readonly left: number;
  /** Furthest ink to the right of the centre. */
  readonly right: number;
  /** Furthest ink above the baseline. */
  readonly above: number;
  /** Furthest ink below the baseline. */
  readonly below: number;
}

/** Font size the measurements are taken at; extents scale linearly with size. */
const MEASURE_FONT_SIZE = 1000;
/** Anchor point, far enough from the origin that no glyph reaches a negative coordinate. */
const ANCHOR_X = 100_000;
const ANCHOR_Y = 4000;

/** The attributes that select a bundled font for an SVG text element. */
export function fontAttributes(font: CardFont, fontSize: number): string {
  return `font-family="${font.family}" font-size="${fontSize}" font-weight="${font.weight}"`;
}

/**
 * Measures the ink of `text` set in `font`, centred on an anchor, per unit
 * of font size (multiply by a font size to get pixels). `text` must already
 * be XML-escaped. Text with no ink (spaces only) measures as zero.
 */
export function measureCentredText(escapedText: string, font: CardFont): InkExtents {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * ANCHOR_X}" height="${2 * ANCHOR_Y}">` +
    `<text x="${ANCHOR_X}" y="${ANCHOR_Y}" text-anchor="middle" ${fontAttributes(font, MEASURE_FONT_SIZE)}>${escapedText}</text>` +
    `</svg>`;
  const box = new Resvg(svg, { font: CARD_FONT_OPTIONS }).getBBox();
  if (box === undefined) return { left: 0, right: 0, above: 0, below: 0 };
  return {
    left: (ANCHOR_X - box.x) / MEASURE_FONT_SIZE,
    right: (box.x + box.width - ANCHOR_X) / MEASURE_FONT_SIZE,
    above: (ANCHOR_Y - box.y) / MEASURE_FONT_SIZE,
    below: (box.y + box.height - ANCHOR_Y) / MEASURE_FONT_SIZE,
  };
}
