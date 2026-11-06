/**
 * The plain QR code as a standalone SVG: plum ink on white, nothing else.
 * Byte-identical for the same input on any machine.
 */
import { palette } from "@souty/brand/palette";

import { createMatrix, matrixPath, sizeWithQuietZone } from "./matrix";

/** Nominal size of one module when the SVG is opened at its natural size. */
const DISPLAY_MODULE_PX = 32;

/** Escapes text for use in SVG element content or a double-quoted attribute. */
export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Renders the QR code for a string as an SVG document. The viewBox is in
 * module units, so the image scales to any slide size without blurring;
 * crispEdges keeps every module a hard-edged square when it is rasterized.
 */
export function renderQrSvg(text: string): string {
  const matrix = createMatrix(text);
  const side = sizeWithQuietZone(matrix);
  const displaySide = side * DISPLAY_MODULE_PX;
  const label = escapeXml(`QR code for ${text}`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${displaySide}" height="${displaySide}" shape-rendering="crispEdges" role="img" aria-label="${label}">`,
    `<title>${label}</title>`,
    `<rect width="${side}" height="${side}" fill="${palette.paper}"/>`,
    `<path fill="${palette.plum}" d="${matrixPath(matrix)}"/>`,
    `</svg>`,
    ``,
  ].join("\n");
}
