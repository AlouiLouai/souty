import { existsSync, readFileSync } from "node:fs";

import { palette } from "@souty/brand/palette";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { buildAssets } from "./assets";
import { CARD_IMAGE_WIDTH, cardLayout, renderCardSvg } from "./card";
import { createMatrix, QUIET_ZONE_MODULES, sizeWithQuietZone } from "./matrix";
import { PLAIN_PNG_WIDTH, rasterizeCard, rasterizePlain } from "./raster";
import { parseSpec, parseSpecList, type QrSpec } from "./spec";
import { renderQrSvg } from "./svg";
import { CAPTION_FONT, CARD_FONT_OPTIONS, measureCentredText, TITLE_FONT } from "./text";
import { decodePng, pngDimensions, type Rgb } from "./verify";

const APP_URL = "https://souty.vercel.app";
const APP_SPEC = parseSpec({ name: "souty-app", url: APP_URL, caption: "souty.vercel.app", title: "Try Souty" });

/** A realistic worst case: a deep link with tracking parameters, about 300 characters. */
const LONG_URL = `https://souty.vercel.app/en/roadmap?utm_source=pitch-deck&utm_medium=qr&utm_campaign=social-tech-challenge-2026&ref=${"abcdefghij".repeat(18)}`;
const LONG_SPEC = parseSpec({ name: "long", url: LONG_URL, title: "A much longer card title", caption: "souty.vercel.app/en/roadmap?utm_source=pitch" });

const WHITE: Rgb = [255, 255, 255];
const PLUM: Rgb = [0x2a, 0x18, 0x46];

/** Reads one pixel of a decoded PNG as [red, green, blue, alpha]. */
function pixelAt(image: PNG, x: number, y: number): number[] {
  const offset = (y * image.width + x) * 4;
  return Array.from(image.data.subarray(offset, offset + 4));
}

const OPAQUE_WHITE = 0xffffffff;

/** Packs a colour and an alpha byte into one 0xRRGGBBAA number, as pixelValue returns them. */
function rgba(colour: Rgb, alpha = 255): number {
  return ((colour[0] << 24) | (colour[1] << 16) | (colour[2] << 8) | alpha) >>> 0;
}

/**
 * Reads one pixel of a decoded PNG as a single 0xRRGGBBAA number. The image
 * tests visit millions of pixels, so nothing is allocated per pixel.
 */
function pixelValue(image: PNG, x: number, y: number): number {
  return image.data.readUInt32BE((y * image.width + x) * 4);
}

/** Counts the pixels of a rectangle that are not opaque white. */
function inkedPixels(image: PNG, left: number, top: number, width: number, height: number): number {
  let inked = 0;
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      if (pixelValue(image, x, y) !== OPAQUE_WHITE) inked += 1;
    }
  }
  return inked;
}

/**
 * Counts inked pixels in the frame of the given thickness just inside a
 * square: where the quiet zone has to be.
 */
function inkInFrame(image: PNG, left: number, top: number, side: number, thickness: number): number {
  return (
    inkedPixels(image, left, top, side, thickness) +
    inkedPixels(image, left, top + side - thickness, side, thickness) +
    inkedPixels(image, left, top, thickness, side) +
    inkedPixels(image, left + side - thickness, top, thickness, side)
  );
}

/** Shrinks a PNG by averaging blocks of pixels, like a phone photographing the slide from far away. */
function shrink(png: Buffer, factor: number): Buffer {
  const source = PNG.sync.read(png);
  const target = new PNG({ width: Math.floor(source.width / factor), height: Math.floor(source.height / factor) });
  const blockArea = factor * factor;
  for (let y = 0; y < target.height; y += 1) {
    for (let x = 0; x < target.width; x += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let sum = 0;
        for (let dy = 0; dy < factor; dy += 1) {
          const rowStart = ((y * factor + dy) * source.width + x * factor) * 4 + channel;
          for (let dx = 0; dx < factor; dx += 1) sum += source.data[rowStart + dx * 4] ?? 0;
        }
        target.data[(y * target.width + x) * 4 + channel] = Math.round(sum / blockArea);
      }
    }
  }
  return PNG.sync.write(target);
}

describe("plain SVG", () => {
  it("is byte-identical for the same input", () => {
    expect(renderQrSvg(APP_URL)).toBe(renderQrSvg(APP_URL));
    expect(renderQrSvg(APP_URL)).not.toBe(renderQrSvg(`${APP_URL}/`));
  });

  it("is a single plum path on white that scales from a viewBox", () => {
    const svg = renderQrSvg(APP_URL);
    const side = sizeWithQuietZone(createMatrix(APP_URL));
    expect(svg).toContain(`viewBox="0 0 ${side} ${side}"`);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain(`<rect width="${side}" height="${side}" fill="${palette.paper}"/>`);
    expect(svg.match(/<path /g)).toHaveLength(1);
    expect(svg).toContain(`<path fill="${palette.plum}"`);
  });

  it("keeps every module at least four modules away from the edge", () => {
    const svg = renderQrSvg(APP_URL);
    const matrix = createMatrix(APP_URL);
    const starts = Array.from(svg.matchAll(/M(\d+) (\d+)h(\d+)/g), (match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
      length: Number(match[3]),
    }));
    expect(starts.length).toBeGreaterThan(0);
    expect(Math.min(...starts.map((run) => run.x))).toBe(QUIET_ZONE_MODULES);
    expect(Math.min(...starts.map((run) => run.y))).toBe(QUIET_ZONE_MODULES);
    expect(Math.max(...starts.map((run) => run.x + run.length))).toBe(QUIET_ZONE_MODULES + matrix.size);
    expect(Math.max(...starts.map((run) => run.y))).toBe(QUIET_ZONE_MODULES + matrix.size - 1);
  });

  it("escapes the address in its accessible label", () => {
    const svg = renderQrSvg("https://example.org/?a=1&b=<2>");
    expect(svg).toContain("QR code for https://example.org/?a=1&amp;b=&lt;2&gt;");
  });

  it("uses the smallest symbol that fits the app address at level Q", () => {
    const matrix = createMatrix(APP_URL);
    expect(matrix.version).toBe(3);
    expect(matrix.size).toBe(29);
  });
});

describe("plain PNG", () => {
  const png = rasterizePlain(renderQrSvg(APP_URL));

  it("decodes to exactly the address it was made from", () => {
    expect(decodePng(png)).toBe(APP_URL);
  });

  it("is 2048 px square, opaque, and identical on every run", () => {
    expect(pngDimensions(png)).toEqual({ width: PLAIN_PNG_WIDTH, height: PLAIN_PNG_WIDTH });
    const image = PNG.sync.read(png);
    expect(pixelAt(image, 0, 0)).toEqual([...WHITE, 255]);
    expect(rasterizePlain(renderQrSvg(APP_URL)).equals(png)).toBe(true);
  });

  it("has a clean white quiet zone of four modules, then the plum finder pattern", () => {
    const image = PNG.sync.read(png);
    const modulePx = image.width / sizeWithQuietZone(createMatrix(APP_URL));
    const quietPx = Math.floor(QUIET_ZONE_MODULES * modulePx);
    expect(inkInFrame(image, 0, 0, image.width, quietPx)).toBe(0);
    const firstModuleCentre = Math.round((QUIET_ZONE_MODULES + 0.5) * modulePx);
    expect(pixelAt(image, firstModuleCentre, firstModuleCentre)).toEqual([...PLUM, 255]);
  });

  it("uses hard-edged modules: only plum and white pixels", () => {
    const image = PNG.sync.read(png);
    const colours = new Set<number>();
    for (let offset = 0; offset < image.data.length; offset += 4) {
      colours.add(image.data.readUInt32BE(offset));
    }
    expect([...colours].sort()).toEqual([rgba(PLUM), rgba(WHITE)].sort());
  });

  it("still decodes when seen small, at under five pixels per module", () => {
    const small = shrink(png, 12);
    expect(pngDimensions(small).width).toBeLessThan(5 * sizeWithQuietZone(createMatrix(APP_URL)));
    expect(decodePng(small)).toBe(APP_URL);
  });
});

describe("card", () => {
  const svg = renderCardSvg(APP_SPEC);
  const png = rasterizeCard(svg);
  const layout = cardLayout(sizeWithQuietZone(createMatrix(APP_URL)), APP_SPEC);

  it("renders the same SVG for the same spec, with the title and caption", () => {
    expect(renderCardSvg(APP_SPEC)).toBe(svg);
    expect(svg).toContain(">Try Souty</text>");
    expect(svg).toContain(">souty.vercel.app</text>");
  });

  it("escapes card text", () => {
    const spec: QrSpec = { ...APP_SPEC, title: "Sign & speak <now>" };
    expect(renderCardSvg(spec)).toContain(">Sign &amp; speak &lt;now&gt;</text>");
  });

  it("decodes to exactly the address on a white slide and on a dark one", () => {
    expect(decodePng(png)).toBe(APP_URL);
    expect(decodePng(png, PLUM)).toBe(APP_URL);
  });

  it("is about 1600 px wide with a transparent margin around the card", () => {
    expect(pngDimensions(png)).toEqual({ width: CARD_IMAGE_WIDTH, height: layout.height });
    const image = PNG.sync.read(png);
    const corners = [
      pixelAt(image, 0, 0),
      pixelAt(image, image.width - 1, 0),
      pixelAt(image, 0, image.height - 1),
      pixelAt(image, image.width - 1, image.height - 1),
    ];
    for (const corner of corners) expect(corner[3]).toBe(0);
  });

  it("puts every module on whole pixels and keeps the quiet zone clear of text and border", () => {
    expect(Number.isInteger(layout.qr.x)).toBe(true);
    expect(Number.isInteger(layout.qr.y)).toBe(true);
    expect(layout.modulePx).toBe(36);
    const image = PNG.sync.read(png);
    const quietPx = QUIET_ZONE_MODULES * layout.modulePx;
    expect(inkInFrame(image, layout.qr.x, layout.qr.y, layout.qr.width, quietPx)).toBe(0);
    const firstModuleCentre = quietPx + layout.modulePx / 2;
    expect(pixelAt(image, layout.qr.x + firstModuleCentre, layout.qr.y + firstModuleCentre)).toEqual([...PLUM, 255]);
  });

  it("keeps the code inside the card for any symbol size", () => {
    for (const side of [29, 37, 65, 185]) {
      const { card, qr } = cardLayout(side, APP_SPEC);
      expect(qr.x).toBeGreaterThan(card.x);
      expect(qr.x + qr.width).toBeLessThan(card.x + card.width);
      expect(qr.y + qr.height).toBeLessThan(card.y + card.height);
    }
  });

  it("draws the title above the code and the caption below it", () => {
    const image = PNG.sync.read(png);
    const left = layout.card.x + (layout.card.width - layout.textMaxWidth) / 2;
    const titleTop = layout.card.y + 40;
    const captionTop = layout.qr.y + layout.qr.height;
    expect(inkedPixels(image, left, titleTop, layout.textMaxWidth, layout.qr.y - titleTop)).toBeGreaterThan(1000);
    expect(inkedPixels(image, left, captionTop, layout.textMaxWidth, layout.caption.baseline - captionTop)).toBeGreaterThan(1000);
  });

  it("shrinks long text instead of letting it overflow", () => {
    const short = cardLayout(37, APP_SPEC);
    const long = cardLayout(37, LONG_SPEC);
    expect(long.title.fontSize).toBeLessThan(short.title.fontSize);
    expect(long.caption.fontSize).toBeLessThan(short.caption.fontSize);
  });

  it("keeps even the widest possible text clear of the border", () => {
    const widest: QrSpec = { ...APP_SPEC, title: "W".repeat(28), caption: "W".repeat(44) };
    const image = PNG.sync.read(rasterizeCard(renderCardSvg(widest)));
    const borderClearance = 40;
    const gutter = (layout.card.width - layout.textMaxWidth) / 2 - borderClearance;
    const textRight = layout.card.x + (layout.card.width + layout.textMaxWidth) / 2;
    const top = layout.card.y + 100;
    const rows = layout.card.height - 200;
    expect(inkedPixels(image, layout.card.x + borderClearance, top, gutter, rows)).toBe(0);
    expect(inkedPixels(image, textRight, top, gutter, rows)).toBe(0);
  });
});

describe("card fonts", () => {
  /** Tall accents, deep descenders and the widest letters the card text may contain. */
  const STRESS_TEXT = "ÀÉÎÕÜÇŒŠŽ ABCQJWM gjpqyç |()[]{}@Åß";

  it("come only from the files bundled with the tool, never from the machine", () => {
    expect(CARD_FONT_OPTIONS.loadSystemFonts).toBe(false);
    expect(CARD_FONT_OPTIONS.fontFiles).toHaveLength(2);
    for (const file of CARD_FONT_OPTIONS.fontFiles) expect(existsSync(file), file).toBe(true);
  });

  it("are two different faces, so each family name resolves to its own file", () => {
    const title = measureCentredText("Souty", TITLE_FONT);
    const caption = measureCentredText("Souty", CAPTION_FONT);
    expect(title.right).toBeGreaterThan(0);
    expect(caption.right).toBeGreaterThan(0);
    expect(Math.abs(title.right - caption.right)).toBeGreaterThan(0.01);
  });

  it("keep every glyph within the ascent and descent the layout reserves", () => {
    for (const font of [TITLE_FONT, CAPTION_FONT]) {
      const ink = measureCentredText(STRESS_TEXT, font);
      expect(ink.above, font.family).toBeGreaterThan(0.6);
      expect(ink.above, font.family).toBeLessThanOrEqual(font.ascent);
      expect(ink.below, font.family).toBeLessThanOrEqual(font.descent);
    }
  });

  it("keep accented capitals and descenders out of the code's quiet zone", () => {
    const spec: QrSpec = { ...APP_SPEC, title: "ÉÀÇ gjpqy Çà", caption: "ÉÀÇ gjpqy.example/Ça" };
    const accented = cardLayout(sizeWithQuietZone(createMatrix(APP_URL)), spec);
    const image = PNG.sync.read(rasterizeCard(renderCardSvg(spec)));
    const quietPx = QUIET_ZONE_MODULES * accented.modulePx;
    expect(inkInFrame(image, accented.qr.x, accented.qr.y, accented.qr.width, quietPx)).toBe(0);
  });

  it("measure text with no ink as empty", () => {
    expect(measureCentredText("   ", TITLE_FONT)).toEqual({ left: 0, right: 0, above: 0, below: 0 });
  });
});

describe("a long address", () => {
  it("round-trips through the plain PNG and the card PNG", () => {
    expect(LONG_URL.length).toBeGreaterThan(280);
    expect(createMatrix(LONG_URL).version).toBeGreaterThan(10);
    expect(decodePng(rasterizePlain(renderQrSvg(LONG_URL)))).toBe(LONG_URL);
    expect(decodePng(rasterizeCard(renderCardSvg(LONG_SPEC)))).toBe(LONG_URL);
  });
});

describe("buildAssets", () => {
  it("produces the four files of a code, and both PNGs decode", () => {
    const assets = buildAssets(APP_SPEC);
    expect(assets.map((asset) => asset.fileName)).toEqual([
      "souty-app.svg",
      "souty-app.png",
      "souty-app-card.svg",
      "souty-app-card.png",
    ]);
    for (const asset of assets.filter((candidate) => candidate.format === "png")) {
      expect(decodePng(asset.contents)).toBe(APP_URL);
    }
  });
});

describe("codes.json", () => {
  it("is valid and opens the live app", () => {
    const codes: unknown = JSON.parse(readFileSync(new URL("../codes.json", import.meta.url), "utf8"));
    const specs = parseSpecList(codes);
    expect(specs[0]).toEqual(APP_SPEC);
  });
});
