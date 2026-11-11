/**
 * Turning a live camera stream into words: resample frames to the model's
 * fps, keep the last window, and decide when a sign is said.
 */

import { windowFeatures, type Frame } from "./features";
import { handCount } from "./landmarks";
import type { SignModelMeta } from "./meta";
import type { SignNet } from "./signnet";

/**
 * Resamples irregular camera frames to a fixed rate, like the notebook does
 * for video clips. The model learned movement at 15 fps, so a slow device
 * repeats a frame to keep time instead of speeding the sign up.
 */
export class FrameSampler {
  private next = -Infinity;
  private readonly step: number;

  constructor(
    fps: number,
    /** A gap longer than this (a paused tab, a stalled camera) restarts sampling. */
    private readonly maxGapMs = 1000,
    /** Upper bound on repeats for one late frame. */
    private readonly maxRepeat = 4
  ) {
    this.step = 1000 / fps;
  }

  /**
   * How many samples this frame fills: 0 if it is early, 1 normally, more if
   * frames were missed. `gap` is true when sampling restarted after a long
   * pause, so the caller should drop its old window.
   */
  offer(timeMs: number): { count: number; gap: boolean } {
    if (timeMs + 1e-6 < this.next) return { count: 0, gap: false };
    const late = timeMs - this.next;
    if (!Number.isFinite(late) || late > this.maxGapMs) {
      const gap = Number.isFinite(late);
      this.next = timeMs + this.step;
      return { count: 1, gap };
    }
    const count = Math.min(this.maxRepeat, Math.floor(late / this.step + 1e-6) + 1);
    this.next += count * this.step;
    if (timeMs + 1e-6 >= this.next) this.next = timeMs + this.step; // fell further behind than maxRepeat
    return { count, gap: false };
  }

  reset() {
    this.next = -Infinity;
  }
}

/** The last `size` sampled frames. */
export class WindowBuffer {
  private readonly frames: Frame[] = [];

  constructor(readonly size: number) {}

  push(frame: Frame) {
    this.frames.push(frame);
    if (this.frames.length > this.size) this.frames.shift();
  }

  get length() {
    return this.frames.length;
  }

  newest(): Frame | undefined {
    return this.frames[this.frames.length - 1];
  }

  /**
   * Exactly `size` frames, oldest first. A short buffer is padded on the
   * left with copies of its oldest frame, like the notebook's evaluation
   * windows (right-aligned: the window ends now).
   */
  window(): Frame[] {
    const first = this.frames[0];
    if (!first) return [];
    return [...Array<Frame>(this.size - this.frames.length).fill(first), ...this.frames];
  }

  clear() {
    this.frames.length = 0;
  }
}

export interface DecoderOptions {
  readonly labels: readonly string[];
  readonly negativeLabel: string;
  readonly minConfidence: number;
  readonly consecutiveHits: number;
  /** Labels that may be emitted. Others count as "no sign" (e.g. no word for them yet). */
  readonly isEmittable?: (label: string) => boolean;
}

export interface DecoderState {
  /** The sign currently winning with enough confidence, or null. */
  readonly label: string | null;
  readonly confidence: number;
  /** 0..1 towards emission. */
  readonly progress: number;
  /** Set on the one update that emits a sign. */
  readonly emitted: string | null;
}

/**
 * Emits a sign once it wins `consecutiveHits` evaluations in a row with at
 * least `minConfidence`. It is not emitted again until another sign or
 * "no sign" has won in between, so holding a sign says it once.
 */
export class SignDecoder {
  private candidate: string | null = null;
  private hits = 0;
  private lastEmitted: string | null = null;

  constructor(private readonly options: DecoderOptions) {}

  update(probs: ArrayLike<number>): DecoderState {
    const { labels, negativeLabel, minConfidence, consecutiveHits, isEmittable } = this.options;
    let best = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i]! > probs[best]!) best = i;
    const top = labels[best] ?? negativeLabel;
    const confidence = probs[best] ?? 0;
    const isSign = top !== negativeLabel && (isEmittable?.(top) ?? true);
    const confident = isSign && confidence >= minConfidence;

    // "No sign" winning, or a different sign winning clearly, re-arms the last word.
    if (!isSign || (confident && top !== this.lastEmitted)) this.lastEmitted = null;

    if (!confident) {
      this.candidate = null;
      this.hits = 0;
      return { label: null, confidence, progress: 0, emitted: null };
    }
    this.hits = top === this.candidate ? this.hits + 1 : 1;
    this.candidate = top;

    let emitted: string | null = null;
    if (this.hits >= consecutiveHits && top !== this.lastEmitted) {
      emitted = top;
      this.lastEmitted = top;
    }
    const done = top === this.lastEmitted;
    return { label: top, confidence, progress: done ? 1 : this.hits / consecutiveHits, emitted };
  }

  /** Hands left the frame: forget everything, so the same sign can be said again. */
  reset() {
    this.candidate = null;
    this.hits = 0;
    this.lastEmitted = null;
  }
}

const IDLE: DecoderState = { label: null, confidence: 0, progress: 0, emitted: null };

/**
 * The whole live path: camera frames in, decoder state out. Feed it every
 * landmark result; it samples at the model's fps, runs the network every
 * `stride_frames` samples while a hand is visible, and decodes.
 */
export class LiveSignReader {
  private readonly sampler: FrameSampler;
  private readonly buffer: WindowBuffer;
  private readonly decoder: SignDecoder;
  private sinceRun = 0;
  private handlessSamples = 0;
  private state: DecoderState = IDLE;

  constructor(
    private readonly net: SignNet,
    private readonly meta: SignModelMeta,
    isEmittable?: (label: string) => boolean,
    /** Hand-less samples (about 200 ms at 15 fps) after which the sign in progress is dropped. */
    private readonly handlessReset = 3
  ) {
    if (net.numClasses !== meta.labels.length) {
      throw new Error(`model has ${net.numClasses} outputs but meta lists ${meta.labels.length} labels`);
    }
    if (net.featuresPerFrame !== meta.num_features) throw new Error("model and meta disagree on features");
    this.sampler = new FrameSampler(meta.fps);
    this.buffer = new WindowBuffer(meta.window_frames);
    this.decoder = new SignDecoder({
      labels: meta.labels,
      negativeLabel: meta.negative_label,
      minConfidence: meta.decoding.min_confidence,
      consecutiveHits: meta.decoding.consecutive_hits,
      isEmittable,
    });
  }

  /** @returns the current state; `emitted` is set only on the call that emits. */
  push(frame: Frame, timeMs: number): DecoderState {
    const { count, gap } = this.sampler.offer(timeMs);
    if (gap) this.reset(false);
    if (count === 0) return { ...this.state, emitted: null };

    for (let i = 0; i < count; i++) this.buffer.push(frame);
    this.sinceRun += count;

    if (handCount(frame) === 0) {
      this.handlessSamples += count;
      if (this.handlessSamples >= this.handlessReset) {
        this.decoder.reset();
        this.state = IDLE;
      }
      return { ...this.state, emitted: null };
    }
    this.handlessSamples = 0;

    if (this.sinceRun < this.meta.decoding.stride_frames) return { ...this.state, emitted: null };
    this.sinceRun = 0;
    this.state = this.decoder.update(this.net.probabilities(windowFeatures(this.buffer.window())));
    return this.state;
  }

  /** Drops the window and decoding state (camera switched, scanner paused). */
  reset(resetSampler = true) {
    if (resetSampler) this.sampler.reset();
    this.buffer.clear();
    this.decoder.reset();
    this.sinceRun = 0;
    this.handlessSamples = 0;
    this.state = IDLE;
  }
}
