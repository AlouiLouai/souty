import { describe, expect, it } from "vitest";
import { frameFromHands, handCount, HAND_VALUES, NUM_FEATURES, SLOT_FEATURES, windowFeatures, type Frame } from "../src";

/** A deterministic, hand-sized set of 21 points with its wrist at (x, y). */
function hand(x: number, y: number, size = 0.1): Float32Array {
  const h = new Float32Array(HAND_VALUES);
  for (let i = 0; i < 21; i++) {
    h[i * 3] = x + size * Math.sin(i) * 0.5;
    h[i * 3 + 1] = y - size * (i / 9);
    h[i * 3 + 2] = 0.01 * i;
  }
  return h;
}

const shift = (h: Float32Array, dx: number, dy: number) =>
  h.map((v, i) => (i % 3 === 0 ? v + dx : i % 3 === 1 ? v + dy : v));

describe("windowFeatures", () => {
  it("is all zeros when no hand is seen", () => {
    const f = windowFeatures(Array<Frame>(8).fill([null, null]));
    expect(f).toHaveLength(8 * NUM_FEATURES);
    expect(f.every((v) => v === 0)).toBe(true);
  });

  it("zeros a missing slot and flags a present one", () => {
    const f = windowFeatures([[hand(0.5, 0.5), null]]);
    expect(f[HAND_VALUES + 2]).toBe(1);
    expect(f.subarray(SLOT_FEATURES).every((v) => v === 0)).toBe(true);
  });

  it("puts the wrist at the origin of the shape values", () => {
    const f = windowFeatures([[hand(0.3, 0.6), null]]);
    expect([f[0], f[1], f[2]]).toEqual([0, 0, 0]);
  });

  it("does not depend on where the signer stands or how far away", () => {
    const a = [hand(0.3, 0.5), hand(0.6, 0.5)] as const;
    const base = windowFeatures([[a[0], a[1]], [shift(a[0], 0.02, 0), a[1]]]);
    const moved = windowFeatures([
      [shift(a[0], 0.2, 0.1), shift(a[1], 0.2, 0.1)],
      [shift(a[0], 0.22, 0.1), shift(a[1], 0.2, 0.1)],
    ]);
    for (let i = 0; i < base.length; i++) expect(moved[i]).toBeCloseTo(base[i]!, 4);
  });

  it("encodes movement in the wrist position values", () => {
    const f = windowFeatures([[hand(0.3, 0.5), null], [hand(0.5, 0.5), null]]);
    const x0 = f[HAND_VALUES]!;
    const x1 = f[NUM_FEATURES + HAND_VALUES]!;
    expect(x1).toBeGreaterThan(x0);
    expect(x0 + x1).toBeCloseTo(0, 5); // relative to the window's mean wrist
  });

  it("clips to [-10, 10]", () => {
    const f = windowFeatures([[hand(0, 0), null], [hand(50, 0), null]]);
    expect(Math.max(...f)).toBeLessThanOrEqual(10);
    expect(Math.min(...f)).toBeGreaterThanOrEqual(-10);
  });
});

describe("frameFromHands", () => {
  const pts = (x: number) => Array.from({ length: 21 }, (_, i) => ({ x, y: 0.5 + i * 0.01, z: 0.1 }));

  it("scales x and z by the aspect ratio", () => {
    const [left] = frameFromHands([{ handedness: "Left", landmarks: pts(0.5) }], 4 / 3);
    expect(left?.[0]).toBeCloseTo(0.5 * (4 / 3), 6);
    expect(left?.[1]).toBeCloseTo(0.5, 6);
    expect(left?.[2]).toBeCloseTo(0.1 * (4 / 3), 6);
  });

  it("puts Left in slot 0 and Right in slot 1", () => {
    const [a, b] = frameFromHands([{ handedness: "Right", landmarks: pts(0.2) }], 1);
    expect(a).toBeNull();
    expect(b?.[0]).toBeCloseTo(0.2);
    const two = frameFromHands(
      [
        { handedness: "Right", landmarks: pts(0.2) },
        { handedness: "Left", landmarks: pts(0.8) },
      ],
      1
    );
    expect(two[0]?.[0]).toBeCloseTo(0.8);
    expect(two[1]?.[0]).toBeCloseTo(0.2);
  });

  it("breaks a handedness clash by wrist x", () => {
    const frame = frameFromHands(
      [
        { handedness: "Left", landmarks: pts(0.7) },
        { handedness: "Left", landmarks: pts(0.3) },
      ],
      1
    );
    expect(frame[0]?.[0]).toBeCloseTo(0.3);
    expect(frame[1]?.[0]).toBeCloseTo(0.7);
    expect(handCount(frame)).toBe(2);
  });

  it("ignores incomplete hands and extra hands", () => {
    expect(handCount(frameFromHands([{ handedness: "Left", landmarks: pts(0.5).slice(0, 5) }], 1))).toBe(0);
    expect(handCount(frameFromHands([]  , 1))).toBe(0);
  });
});
