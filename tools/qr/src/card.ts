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
import { CAPTION_FONT, type CardFont, fontAttributes, measureCentredText, TITLE_FONT } from "./text";

/**
 * Width of the card image. One SVG unit is one pixel of the rasterized PNG,
 * so every QR module lands on whole pixels.
 */
export const CARD_IMAGE_WIDTH = 1600;

/** Transparent margin around the card so the shadow is never clipped. */
const MARGIN = 48;
/** Souty's hard shadow: the card's own shape, shifted right and down. */
const SHADOW_OFFSET = 24;
const BORDER_WIDTH = 12;
const CORNER_RADIUS = 96;
/** Square reserved for the code, including its quiet zone. */
const QR_BOX = 1332;
/** Widest a line of text may run: the code's box minus a little air. */
const TEXT_MAX_WIDTH = QR_BOX - 96;

/** Largest sizes; a long line is set smaller so that it fits. */
const TITLE_FONT_SIZE = 124;
const CAPTION_FONT_SIZE = 72;
/** White space between the card's edge and the text, above the title and below the caption. */
const PADDING_Y = 92;

/** An axis-aligned rectangle in card image pixels. */
interface Box {
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
interface CardLayout {
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

/**
 * Largest whole font size, up to `maxSize`, at which the ink of the centred
 * text stays within the card's text width, so a long title or caption
 * shrinks instead of running into the border. Measured on the real glyphs.
 */
function fitFontSize(text: string, font: CardFont, maxSize: number): number {
  const ink = measureCentredText(escapeXml(text), font);
  const halfWidthInEms = Math.max(ink.left, ink.right);
  if (halfWidthInEms === 0) return maxSize;
  return Math.max(1, Math.floor(Math.min(maxSize, TEXT_MAX_WIDTH / 2 / halfWidthInEms)));
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
  const titleSize = fitFontSize(spec.title, TITLE_FONT, TITLE_FONT_SIZE);
  const captionSize = fitFontSize(spec.caption, CAPTION_FONT, CAPTION_FONT_SIZE);

  // The text lines sit flush against the code's box: its quiet zone is the gap.
  // Positions use the largest sizes, so the layout does not move when a line shrinks.
  const titleBaseline = MARGIN + PADDING_Y + Math.ceil(TITLE_FONT_SIZE * TITLE_FONT.ascent);
  const boxTop = titleBaseline + Math.ceil(TITLE_FONT_SIZE * TITLE_FONT.descent);
  const captionBaseline = boxTop + QR_BOX + Math.ceil(CAPTION_FONT_SIZE * CAPTION_FONT.ascent);
  const cardHeight = captionBaseline + Math.ceil(CAPTION_FONT_SIZE * CAPTION_FONT.descent) + PADDING_Y - MARGIN;
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
function centredText(text: string, centreX: number, line: TextLine, font: CardFont): string {
  return `<text x="${centreX}" y="${line.baseline}" text-anchor="middle" ${fontAttributes(font, line.fontSize)} fill="${palette.plum}">${escapeXml(text)}</text>`;
}

/**
 * Renders the slide card for a spec as an SVG document. Outside the card
 * the image is transparent. The text names Souty's two brand fonts, which
 * rasterizeCard draws from the files bundled with this tool.
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
    centredText(spec.title, centreX, layout.title, TITLE_FONT),
    `<path transform="translate(${qr.x} ${qr.y}) scale(${layout.modulePx})" shape-rendering="crispEdges" fill="${palette.plum}" d="${matrixPath(matrix)}"/>`,
    centredText(spec.caption, centreX, layout.caption, CAPTION_FONT),
    `</svg>`,
    ``,
  ].join("\n");
}
