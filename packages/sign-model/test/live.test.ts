import { describe, expect, it } from "vitest";
import { FrameSampler, SignDecoder, WindowBuffer, type Frame } from "../src";

describe("FrameSampler", () => {
  it("takes every other frame of a 30 fps camera at 15 fps", () => {
    const sampler = new FrameSampler(15);
    const counts = Array.from({ length: 30 }, (_, i) => sampler.offer(i * (1000 / 30)).count);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(15);
    expect(counts.every((c) => c <= 1)).toBe(true);
  });

  it("repeats frames on a slow device so time keeps its scale", () => {
    const sampler = new FrameSampler(15);
    sampler.offer(0);
    expect(sampler.offer(200).count).toBe(3); // 200 ms = 3 samples at 15 fps
  });

  it("reports a long pause as a gap", () => {
    const sampler = new FrameSampler(15);
    sampler.offer(0);
    expect(sampler.offer(5000)).toEqual({ count: 1, gap: true });
    expect(sampler.offer(5000 + 1000 / 15).count).toBe(1);
  });
});

describe("WindowBuffer", () => {
  const f = (id: number): Frame => [Float32Array.of(id), null];

  it("pads a short window on the left with its oldest frame", () => {
    const buf = new WindowBuffer(4);
    buf.push(f(1));
    buf.push(f(2));
    expect(buf.window().map((fr) => fr[0]?.[0])).toEqual([1, 1, 1, 2]);
  });

  it("keeps only the last frames", () => {
    const buf = new WindowBuffer(3);
    for (let i = 1; i <= 5; i++) buf.push(f(i));
    expect(buf.window().map((fr) => fr[0]?.[0])).toEqual([3, 4, 5]);
    expect(buf.newest()?.[0]?.[0]).toBe(5);
  });

  it("is empty after clear", () => {
    const buf = new WindowBuffer(3);
    buf.push(f(1));
    buf.clear();
    expect(buf.window()).toEqual([]);
  });
});

describe("SignDecoder", () => {
  const labels = ["none", "baladya", "wzara", "untranslated"];
  const make = () =>
    new SignDecoder({
      labels,
      negativeLabel: "none",
      minConfidence: 0.6,
      consecutiveHits: 3,
      isEmittable: (l) => l !== "untranslated",
    });
  const p = (label: string, conf = 0.9) => labels.map((l) => (l === label ? conf : (1 - conf) / 3));

  it("emits once after enough confident wins in a row", () => {
    const d = make();
    expect(d.update(p("baladya")).emitted).toBeNull();
    expect(d.update(p("baladya")).progress).toBeCloseTo(2 / 3);
    expect(d.update(p("baladya")).emitted).toBe("baladya");
    for (let i = 0; i < 10; i++) expect(d.update(p("baladya")).emitted).toBeNull();
  });

  it("needs the wins to be consecutive and confident", () => {
    const d = make();
    d.update(p("baladya"));
    d.update(p("baladya"));
    d.update(p("baladya", 0.5));
    d.update(p("baladya"));
    expect(d.update(p("baladya")).emitted).toBeNull();
    expect(d.update(p("baladya")).emitted).toBe("baladya");
  });

  it("says the same sign again after a pause", () => {
    const d = make();
    for (let i = 0; i < 3; i++) d.update(p("baladya"));
    d.update(p("none"));
    d.update(p("baladya"));
    d.update(p("baladya"));
    expect(d.update(p("baladya")).emitted).toBe("baladya");
  });

  it("does not re-arm on a low-confidence flicker", () => {
    const d = make();
    for (let i = 0; i < 3; i++) d.update(p("baladya"));
    d.update(p("wzara", 0.4));
    for (let i = 0; i < 5; i++) expect(d.update(p("baladya")).emitted).toBeNull();
  });

  it("moves on to a different sign", () => {
    const d = make();
    for (let i = 0; i < 3; i++) d.update(p("baladya"));
    d.update(p("wzara"));
    d.update(p("wzara"));
    expect(d.update(p("wzara")).emitted).toBe("wzara");
  });

  it("never emits the negative class or a label without a word", () => {
    const d = make();
    for (let i = 0; i < 10; i++) {
      expect(d.update(p("none")).emitted).toBeNull();
      expect(d.update(p("untranslated")).emitted).toBeNull();
    }
  });

  it("forgets the last sign on reset", () => {
    const d = make();
    for (let i = 0; i < 3; i++) d.update(p("baladya"));
    d.reset();
    d.update(p("baladya"));
    d.update(p("baladya"));
    expect(d.update(p("baladya")).emitted).toBe("baladya");
  });
});
