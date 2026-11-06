/**
 * Proof that a generated image scans: decode the PNG with an independent
 * QR reader (jsQR, not the library that drew it) and hand back the text.
 */
import jsQR from "jsqr";
import { PNG } from "pngjs";

/** An opaque colour as red, green and blue bytes. */
export type Rgb = readonly [red: number, green: number, blue: number];

const WHITE: Rgb = [255, 255, 255];
const CHANNELS = 4;

/**
 * Flattens RGBA pixels onto an opaque backdrop. A scanner never sees
 * transparency, it sees whatever the slide shows through it, so the card's
 * transparent margin has to be given a colour before decoding.
 */
function flatten(pixels: Uint8Array, backdrop: Rgb): Uint8ClampedArray {
  const flat = new Uint8ClampedArray(pixels.length);
  for (let offset = 0; offset < pixels.length; offset += CHANNELS) {
    const alpha = (pixels[offset + 3] ?? 255) / 255;
    backdrop.forEach((channel, index) => {
      const value = pixels[offset + index] ?? 0;
      flat[offset + index] = Math.round(value * alpha + channel * (1 - alpha));
    });
    flat[offset + 3] = 255;
  }
  return flat;
}

/**
 * Decodes the QR code in a PNG and returns its text, or null when no code
 * can be read. `backdrop` is the slide colour assumed behind transparent
 * pixels (white by default).
 */
export function decodePng(png: Buffer, backdrop: Rgb = WHITE): string | null {
  const image = PNG.sync.read(png);
  const pixels = flatten(image.data, backdrop);
  const result = jsQR(pixels, image.width, image.height, { inversionAttempts: "dontInvert" });
  return result === null ? null : result.data;
}

/** Byte offsets of the width and height fields in a PNG's leading IHDR chunk. */
const IHDR_WIDTH_OFFSET = 16;
const IHDR_HEIGHT_OFFSET = 20;

/** Pixel dimensions of a PNG, read from its header without decoding the image. */
export function pngDimensions(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(IHDR_WIDTH_OFFSET), height: png.readUInt32BE(IHDR_HEIGHT_OFFSET) };
}
