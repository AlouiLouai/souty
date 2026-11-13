import { describe, expect, it } from "vitest";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { approach, coverTransform, HandOverlay, handSides, signPhase } from "./handOverlay";

/** A flat hand of 21 landmarks around (cx, cy), normalized coordinates. */
function hand(cx: number, cy: number): NormalizedLandmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: cx + ((i % 5) - 2) * 0.02,
    y: cy - Math.floor(i / 5) * 0.03,
    z: 0,
    visibility: 1,
  }));
}

interface Arc {
  x: number;
  y: number;
  r: number;
  start: number;
  end: number;
}

/** A 640x480 camera frame. */
const VIDEO = { width: 640, height: 480 };
/** Ring radius in canvas px for the default context (1 canvas px per CSS px). */
const RING_R = 30;

/**
 * Records what the overlay draws; every other canvas call is a no-op.
 * Defaults: a 360x480 CSS box (a portrait phone), 1 device px per CSS px.
 */
function recordingContext(cssWidth = 360, cssHeight = 480, dpr = 1) {
  const calls = { arcs: [] as Arc[], texts: [] as string[] };
  const canvas = { width: cssWidth * dpr, height: cssHeight * dpr, clientWidth: cssWidth, clientHeight: cssHeight };
  const target: Record<string, unknown> = {
    canvas,
    arc: (x: number, y: number, r: number, start: number, end: number) => void calls.arcs.push({ x, y, r, start, end }),
    fillText: (text: string) => void calls.texts.push(text),
    strokeText: (text: string) => void calls.texts.push(text),
    measureText: (text: string) => ({ width: text.length * 10 }),
  };
  const ctx = new Proxy(target, {
    get: (t, key: string) => (key in t ? t[key] : () => {}),
    set: (t, key: string, value) => {
      t[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const ringArcs = (arcs: Arc[], r = RING_R) => arcs.filter((a) => Math.abs(a.r - r) < 1e-6);
const isPartial = (a: Arc) => a.end - a.start < Math.PI * 2 - 1e-6;

describe("FR-12 sign feedback ring", () => {
  it("is drawn whenever a hand is visible, even before any sign leads, as a spinner", () => {
    const { ctx, calls } = recordingContext();
    new HandOverlay().draw(ctx, [hand(0.5, 0.6)], null, true, 0, VIDEO);
    const ring = ringArcs(calls.arcs);
    expect(ring.some((a) => !isPartial(a))).toBe(true); // track
    expect(ring.some(isPartial)).toBe(true); // spinning arc
    expect(calls.texts).toEqual([]);
  });

  it("sits centred between two hands read together", () => {
    const { ctx, calls } = recordingContext();
    new HandOverlay().draw(ctx, [hand(0.3, 0.6), hand(0.7, 0.6)], null, true, 0, VIDEO);
    // Cover: the 640 px frame is cropped to the middle 360 px; both hands mirror around 320 -> 180.
    const [track] = ringArcs(calls.arcs);
    expect(track?.x).toBeCloseTo(180, 0);
  });

  it("shows only the word as text: no percentage, no label", () => {
    const { ctx, calls } = recordingContext();
    new HandOverlay().draw(ctx, [hand(0.5, 0.6)], { word: "سبيطار", progress: 0.66 }, true, 0, VIDEO);
    expect(calls.texts).toEqual(["سبيطار"]);
  });

  it("fades a word out instead of blinking when one reading dips", () => {
    const overlay = new HandOverlay();
    const { ctx, calls } = recordingContext();
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "دار", progress: 0.33 }, true, 0, VIDEO);
    overlay.draw(ctx, [hand(0.5, 0.6)], null, true, 100, VIDEO);
    expect(calls.texts).toEqual(["دار", "دار"]);
    overlay.draw(ctx, [hand(0.5, 0.6)], null, true, 1000, VIDEO);
    expect(calls.texts).toEqual(["دار", "دار"]);
  });

  it("keeps the word just said, in green with its check, after the reader moves on", () => {
    const overlay = new HandOverlay();
    const { ctx, calls } = recordingContext();
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "لا", progress: 1 }, true, 0, VIDEO);
    // The sign ended: the next reading is not confident.
    calls.arcs.length = 0;
    overlay.draw(ctx, [hand(0.5, 0.6)], null, true, 300, VIDEO);
    expect(calls.texts.at(-1)).toBe("لا");
    // Said: a full progress ring (no partial spinner arc).
    expect(ringArcs(calls.arcs).some(isPartial)).toBe(false);
  });

  it("keeps the word just said on screen when the hands drop right away", () => {
    const overlay = new HandOverlay();
    const { ctx, calls } = recordingContext();
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "لا", progress: 1, lockFlash: 0 }, true, 0, VIDEO);
    overlay.draw(ctx, [], null, true, 200, VIDEO);
    expect(calls.texts).toEqual(["لا", "لا"]);
    // ...until the hold ends, then the overlay is empty.
    const before = calls.arcs.length;
    overlay.draw(ctx, [], null, true, 2000, VIDEO);
    expect(calls.arcs.length).toBe(before);
  });

  it("lets a new sign take over from the held one at once", () => {
    const overlay = new HandOverlay();
    const { ctx, calls } = recordingContext();
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "لا", progress: 1 }, true, 0, VIDEO);
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "دار", progress: 0.33 }, true, 100, VIDEO);
    expect(calls.texts.at(-1)).toBe("دار");
  });

  it("draws nothing and forgets the word once the hands leave", () => {
    const overlay = new HandOverlay();
    const { ctx, calls } = recordingContext();
    overlay.draw(ctx, [hand(0.5, 0.6)], { word: "دار", progress: 0.5 }, true, 0, VIDEO);
    const arcs = calls.arcs.length;
    overlay.draw(ctx, [], null, true, 16, VIDEO);
    expect(calls.arcs.length).toBe(arcs);
    overlay.draw(ctx, [hand(0.5, 0.6)], null, true, 32, VIDEO);
    expect(calls.texts).toEqual(["دار"]);
  });

  it("sits above the hands, or below them when they are near the top", () => {
    const ringY = (arcs: Arc[]) => ringArcs(arcs)[0]?.y;

    const low = recordingContext();
    new HandOverlay().draw(low.ctx, [hand(0.5, 0.8)], null, true, 0, VIDEO);
    expect(ringY(low.calls.arcs)).toBeLessThan(0.8 * 480 - 0.15 * 480);

    const high = recordingContext();
    new HandOverlay().draw(high.ctx, [hand(0.5, 0.2)], null, true, 0, VIDEO);
    expect(ringY(high.calls.arcs)).toBeGreaterThan(0.2 * 480);
  });

  it("draws at device resolution: sizes scale with devicePixelRatio", () => {
    const { ctx, calls } = recordingContext(360, 480, 3);
    new HandOverlay().draw(ctx, [hand(0.5, 0.6)], null, true, 0, VIDEO);
    expect(ringArcs(calls.arcs, RING_R * 3).length).toBeGreaterThan(0);
  });

  it("names the ring's state from the reader's", () => {
    expect(signPhase(null)).toBe("reading");
    expect(signPhase({ word: null, progress: 0 })).toBe("reading");
    expect(signPhase({ word: "لا", progress: 0.33 })).toBe("candidate");
    expect(signPhase({ word: "لا", progress: 1 })).toBe("said");
  });
});

describe("coverTransform", () => {
  it("crops the sides of a landscape frame on a portrait phone", () => {
    expect(coverTransform(640, 480, 360, 480)).toEqual({ scale: 1, offsetX: -140, offsetY: 0 });
  });

  it("crops the top and bottom of a portrait frame in a wide box", () => {
    const { scale, offsetX, offsetY } = coverTransform(480, 640, 960, 640);
    expect(scale).toBe(2);
    expect(offsetX).toBe(0);
    expect(offsetY).toBe(-320);
  });

  it("is the identity before layout", () => {
    expect(coverTransform(640, 480, 0, 0)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });
});

describe("handSides", () => {
  it("lights the side of the screen a single hand is on, after mirroring", () => {
    // Raw x 0.2 is on the right of a mirrored (front camera) preview.
    expect(handSides([hand(0.2, 0.5)], true)).toEqual({ left: false, right: true });
    expect(handSides([hand(0.2, 0.5)], false)).toEqual({ left: true, right: false });
  });

  it("lights both sides for two hands", () => {
    expect(handSides([hand(0.2, 0.5), hand(0.3, 0.5)], true)).toEqual({ left: true, right: true });
  });

  it("lights nothing with no hands", () => {
    expect(handSides([], true)).toEqual({ left: false, right: false });
  });
});

describe("approach", () => {
  it("starts at the target and then eases towards it", () => {
    expect(approach(Number.NaN, 10, 16, 100)).toBe(10);
    const next = approach(0, 10, 100, 100);
    expect(next).toBeGreaterThan(5);
    expect(next).toBeLessThan(10);
  });
});
