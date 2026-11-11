/**
 * The browser port must reproduce the training notebook exactly. Fixtures
 * and model come straight from the notebook's export: the raw landmark
 * windows, the features Python computed for them, and the probabilities
 * PyTorch/ONNX gave. Regenerate `parity_fixtures.json` with every retrain.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LiveSignReader, NUM_FEATURES, parseSignModelMeta, SignNet, signNetFromOnnx, windowFeatures, type Frame } from "../src";

const MODELS = new URL("../../../apps/pwa/public/models/", import.meta.url);

interface Fixtures {
  tolerance: number;
  cases: Array<{
    label: string;
    frames: Array<[number[][] | null, number[][] | null]>;
    features: number[][];
    probs: number[];
  }>;
}

const fixtures = JSON.parse(readFileSync(new URL("./parity_fixtures.json", import.meta.url), "utf8")) as Fixtures;
const meta = parseSignModelMeta(JSON.parse(readFileSync(new URL("sign_model.meta.json", MODELS), "utf8")));
const net = new SignNet(signNetFromOnnx(new Uint8Array(readFileSync(new URL("sign_model.onnx", MODELS)))));

const toFrame = ([a, b]: [number[][] | null, number[][] | null]): Frame => [
  a && Float32Array.from(a.flat()),
  b && Float32Array.from(b.flat()),
];

/**
 * Largest error, relative to max(1, |expected|) when `relative`. Features
 * need that: the fixture stores landmarks rounded to 6 decimals, and shape
 * values divide by the palm size, so a tiny (far or mis-detected) hand
 * magnifies that rounding on large values.
 */
function maxDiff(actual: ArrayLike<number>, expected: ArrayLike<number>, relative = false) {
  expect(actual.length).toBe(expected.length);
  let max = 0;
  for (let i = 0; i < actual.length; i++) {
    const scale = relative ? Math.max(1, Math.abs(expected[i]!)) : 1;
    max = Math.max(max, Math.abs(actual[i]! - expected[i]!) / scale);
  }
  return max;
}

describe("parity with the training notebook", () => {
  it("has fixtures, including a two-handed window", () => {
    expect(fixtures.cases.length).toBeGreaterThan(0);
    expect(fixtures.cases.some((c) => c.frames.some(([a, b]) => a && b))).toBe(true);
  });

  it("matches the shipped meta file", () => {
    expect(net.numClasses).toBe(meta.labels.length);
    expect(net.featuresPerFrame).toBe(NUM_FEATURES);
    expect(meta.labels[0]).toBe(meta.negative_label);
    for (const c of fixtures.cases) {
      expect(c.frames).toHaveLength(meta.window_frames);
      expect(meta.labels).toContain(c.label);
    }
  });

  it.each(fixtures.cases.map((c, i) => [i, c] as const))("reproduces the features of case %i", (_, c) => {
    const features = windowFeatures(c.frames.map(toFrame));
    expect(maxDiff(features, c.features.flat(), true)).toBeLessThan(fixtures.tolerance);
  });

  it.each(fixtures.cases.map((c, i) => [i, c] as const))("reproduces the probabilities of case %i", (_, c) => {
    const probs = net.probabilities(windowFeatures(c.frames.map(toFrame)));
    expect(maxDiff(probs, c.probs)).toBeLessThan(fixtures.tolerance);
  });
});

describe("live reading with the shipped model", () => {
  it("says a held sign exactly once, and only after it is confidently recognized", () => {
    const c = fixtures.cases.find((x) => x.label === "baladya") ?? fixtures.cases[0]!;
    const best = c.probs.indexOf(Math.max(...c.probs));
    const reader = new LiveSignReader(net, meta);
    const said: string[] = [];
    // The fixture window replayed as a 30 fps camera, three times over.
    const frames = c.frames.map(toFrame);
    for (let i = 0; i < frames.length * 6; i++) {
      const state = reader.push(frames[Math.floor(i / 2) % frames.length]!, (i * 1000) / 30);
      if (state.emitted) said.push(state.emitted);
    }
    if (c.probs[best]! >= meta.decoding.min_confidence && meta.labels[best] !== meta.negative_label) {
      expect(said[0]).toBe(meta.labels[best]);
    }
    expect(said.length).toBeLessThanOrEqual(2);
  });

  it("runs a window in a few milliseconds", () => {
    const features = windowFeatures(fixtures.cases[0]!.frames.map(toFrame));
    for (let i = 0; i < 5; i++) net.probabilities(features); // warm up
    const start = performance.now();
    const runs = 50;
    for (let i = 0; i < runs; i++) net.probabilities(features);
    const ms = (performance.now() - start) / runs;
    console.log(`SignNet forward: ${ms.toFixed(2)} ms per window`);
    expect(ms).toBeLessThan(50);
  });
});

describe("ONNX reader", () => {
  it("rejects a file that is not a SignNet export", () => {
    expect(() => signNetFromOnnx(new Uint8Array([0x3a, 0x00]))).toThrow();
    expect(() => signNetFromOnnx(new Uint8Array([1, 2, 3]))).toThrow();
  });
});
