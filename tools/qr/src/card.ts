/**
 * The "card" variant: the QR code framed the way Souty frames everything,
 * a white rounded card with a thick plum border and a hard offset shadow,
 * with a title above the code and the address below it. Made to be dropped
 * straight onto a slide of any colour.
 */
import { palette } from "@souty/brand/palette";

import { createMatrix, matrixPath, sizeWithQuietZone } from "./matrix";
import type { QrSpec } from "./spec";
import { escapeXml } from "./svg";

/**
 * Width of the card image. One SVG unit is one pixel of the rasterized PNG,
 * so every QR module lands on whole pixels.
 */
export const CARD_IMAGE_WIDTH = 1600;

/** Font stack for the card text; resolved against the generating machine's system fonts. */
const CARD_FONT_FAMILY ="Segoe UI, Arial, Helvetica, sans-serif";

/** Transparent margin around the card so the shadow is never clipped. */
const MARGIN = 48;
/** Souty's hard shadow: the card's own shape, shifted right and down. */
const SHADOW_OFFSET = 24;
const BORDER_WIDTH = 12;
const CORNER_RADIUS = 96;
/** Square reserved for the code, including its quiet zone. */
const QR_BOX = 1332;
/**
 * How far the tallest glyphs rise above the baseline and the deepest ones
 * (g, p, y) drop below it, as shares of the font size. Rounded up from the
 * fonts in the stack so that no stroke can reach into the code's quiet zone.
 */
const ASCENT_RATIO = 0.76;
const DESCENT_RATIO = 0.28;
/** Widest a line of text may run: the code's box minus a little air. */
const TEXT_MAX_WIDTH = QR_BOX - 96;
/**
 * Advance widths by class of character, as shares of the font size. Each
 * is the upper bound measured across Segoe UI and Arial at the two weights
 * the card uses, so a line fitted with them can only come out narrower than
 * estimated, never wider. The first matching class wins.
 */
const GLYPH_WIDTH_CLASSES: ReadonlyArray<readonly [members: RegExp, width: number]> = [
  [/[ !'(),.:;I[\]`fijlrt{|}]/, 0.4],
  [/[%&@MWm]/, 1.01],
  [/[A-Z+<=>^~w]/, 0.8],
  [/[\x20-\x7E]/, 0.62],
];
/** Width assumed for anything outside Basic Latin (accented letters, ligatures). */
const WIDEST_GLYPH_WIDTH = 1.01;

const TITLE_FONT_SIZE = 116;
const TITLE_FONT_WEIGHT = 700;
const CAPTION_FONT_SIZE = 72;
const CAPTION_FONT_WEIGHT = 600;
/** White space between the card's edge and the text, above the title and below the caption. */
const PADDING_Y = 92;

/** An axis-aligned rectangle in card image pixels. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A line of centred text: its baseline and fitted font size. */
interface TextLine {
  readonly baseline: number;
  readonly fontSize: number;
}

/** Where everything sits on the card image, in pixels. */
export interface CardLayout {
  readonly width: number;
  readonly height: number;
  /** The card's outer edge (border included). */
  readonly card: Box;
  /** The code with its quiet zone. */
  readonly qr: Box;
  /** Side of one QR module. */
  readonly modulePx: number;
  readonly title: TextLine;
  readonly caption: TextLine;
  /** Widest either line of text may be, centred on the card. */
  readonly textMaxWidth: number;
}

/** Upper bound for the advance width of one character, as a share of the font size. */
function glyphWidth(character: string): number {
  const match = GLYPH_WIDTH_CLASSES.find(([members]) => members.test(character));
  return match === undefined ? WIDEST_GLYPH_WIDTH : match[1];
}

/**
 * Largest font size, up to `maxSize`, at which the text is sure to fit the
 * card, so a long title or caption shrinks instead of running into the
 * border.
 */
function fitFontSize(text: string, maxSize: number): number {
  const widthInEms = Array.from(text).reduce((sum, character) => sum + glyphWidth(character), 0);
  return Math.floor(Math.min(maxSize, TEXT_MAX_WIDTH / widthInEms));
}

/**
 * Computes the card geometry for a symbol of `side` modules (quiet zone
 * included). The module size is the largest whole number of pixels that
 * fits the code's box, so modules stay pixel-perfect for any QR version.
 */
export function cardLayout(side: number, spec: Pick<QrSpec, "title" | "caption">): CardLayout {
  const cardWidth = CARD_IMAGE_WIDTH - 2 * MARGIN - SHADOW_OFFSET;
  const modulePx = Math.max(1, Math.floor(QR_BOX / side));
  const qrSize = modulePx * side;
  const titleSize = fitFontSize(spec.title, TITLE_FONT_SIZE);
  const captionSize = fitFontSize(spec.caption, CAPTION_FONT_SIZE);

  // The text lines sit flush against the code's box: its quiet zone is the gap.
  const titleBaseline = MARGIN + PADDING_Y + Math.ceil(TITLE_FONT_SIZE * ASCENT_RATIO);
  const boxTop = titleBaseline + Math.ceil(TITLE_FONT_SIZE * DESCENT_RATIO);
  const captionBaseline = boxTop + QR_BOX + Math.ceil(CAPTION_FONT_SIZE * ASCENT_RATIO);
  const cardHeight = captionBaseline + Math.ceil(CAPTION_FONT_SIZE * DESCENT_RATIO) + PADDING_Y - MARGIN;
  const inset = Math.floor((QR_BOX - qrSize) / 2);

  return {
    width: CARD_IMAGE_WIDTH,
    height: cardHeight + 2 * MARGIN + SHADOW_OFFSET,
    card: { x: MARGIN, y: MARGIN, width: cardWidth, height: cardHeight },
    qr: {
      x: MARGIN + (cardWidth - QR_BOX) / 2 + inset,
      y: boxTop + inset,
      width: qrSize,
      height: qrSize,
    },
    modulePx,
    title: { baseline: titleBaseline, fontSize: titleSize },
    caption: { baseline: captionBaseline, fontSize: captionSize },
    textMaxWidth: TEXT_MAX_WIDTH,
  };
}

/** A rounded rectangle element. */
function roundedRect(box: Box, radius: number, attributes: string): string {
  return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${radius}" ${attributes}/>`;
}

/** Shrinks a box by the same amount on every side. */
function insetBox(box: Box, amount: number): Box {
  return {
    x: box.x + amount,
    y: box.y + amount,
    width: box.width - 2 * amount,
    height: box.height - 2 * amount,
  };
}

/** A line of text centred on the card. */
function centredText(text: string, centreX: number, line: TextLine, weight: number): string {
  return `<text x="${centreX}" y="${line.baseline}" text-anchor="middle" font-family="${CARD_FONT_FAMILY}" font-size="${line.fontSize}" font-weight="${weight}" fill="${palette.plum}">${escapeXml(text)}</text>`;
}

/**
 * Renders the slide card for a spec as an SVG document. Outside the card
 * the image is transparent. The SVG text is deterministic; how its two text
 * lines look depends on the fonts of whatever renders it.
 */
export function renderCardSvg(spec: QrSpec): string {
  const matrix = createMatrix(spec.url);
  const layout = cardLayout(sizeWithQuietZone(matrix), spec);
  const { card, qr } = layout;
  const centreX = card.x + card.width / 2;
  const shadow: Box = { ...card, x: card.x + SHADOW_OFFSET, y: card.y + SHADOW_OFFSET };
  const label = escapeXml(`${spec.title}: QR code for ${spec.url}`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" role="img" aria-label="${label}">`,
    `<title>${label}</title>`,
    roundedRect(shadow, CORNER_RADIUS, `fill="${palette.plum}"`),
    roundedRect(
      insetBox(card, BORDER_WIDTH / 2),
      CORNER_RADIUS - BORDER_WIDTH / 2,
      `fill="${palette.paper}" stroke="${palette.plum}" stroke-width="${BORDER_WIDTH}"`,
    ),
    centredText(spec.title, centreX, layout.title, TITLE_FONT_WEIGHT),
    `<path transform="translate(${qr.x} ${qr.y}) scale(${layout.modulePx})" shape-rendering="crispEdges" fill="${palette.plum}" d="${matrixPath(matrix)}"/>`,
    centredText(spec.caption, centreX, layout.caption, CAPTION_FONT_WEIGHT),
    `</svg>`,
    ``,
  ].join("\n");
}
