/**
 * SignNet's forward pass (training notebook, step 7), in plain TypeScript.
 *
 *   x (T × F), dx = frame-to-frame difference (0 for the first frame)
 *   h = GELU(LayerNorm([x, dx] · W + b))                    T × C
 *   3 × { h += GELU(pointwise(depthwise_k5(h))) }           BatchNorm is folded into depthwise by the export
 *   a = softmax_t(h · w_attn + b_attn)
 *   logits = head([Σ_t a_t h_t, max_t h_t])
 *
 * About 5 M multiply-adds per window: a few milliseconds on a phone.
 */

export interface SignNetBlock {
  /** Depthwise conv, [C, 1, K]. */
  readonly dwW: Float32Array;
  readonly dwB: Float32Array;
  /** Pointwise conv, [C_out, C_in, 1]. */
  readonly pwW: Float32Array;
  readonly pwB: Float32Array;
}

export interface SignNetWeights {
  /** Input width: 2 × features per frame (values and their velocity). */
  readonly nIn: number;
  readonly width: number;
  readonly nClasses: number;
  readonly kernel: number;
  /** Input projection, [nIn, width]. */
  readonly inW: Float32Array;
  readonly inB: Float32Array;
  readonly lnG: Float32Array;
  readonly lnB: Float32Array;
  readonly lnEps: number;
  readonly blocks: readonly SignNetBlock[];
  /** Attention scores, [width, 1]. */
  readonly attnW: Float32Array;
  readonly attnB: number;
  /** Classifier, [nClasses, 2 × width]. */
  readonly headW: Float32Array;
  readonly headB: Float32Array;
}

/**
 * erf, Abramowitz and Stegun 7.1.26 (max error 1.5e-7). Math has no erf, and
 * the notebook's GELU is the exact, erf-based one.
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-ax * ax));
}

const gelu = (x: number) => 0.5 * x * (1 + erf(x / Math.SQRT2));

export class SignNet {
  readonly numClasses: number;
  readonly featuresPerFrame: number;
  private readonly w: SignNetWeights;
  /** Pointwise weights transposed to [C_in, C_out], for a contiguous inner loop. */
  private readonly pwT: Float32Array[];

  constructor(weights: SignNetWeights) {
    if (weights.nIn % 2) throw new Error("SignNet input width must be even (values + velocity)");
    this.w = weights;
    this.numClasses = weights.nClasses;
    this.featuresPerFrame = weights.nIn / 2;
    const c = weights.width;
    this.pwT = weights.blocks.map(({ pwW }) => {
      const t = new Float32Array(c * c);
      for (let o = 0; o < c; o++) for (let i = 0; i < c; i++) t[i * c + o] = pwW[o * c + i]!;
      return t;
    });
  }

  /** @param features `frames × featuresPerFrame`, row-major (see `windowFeatures`). */
  logits(features: Float32Array): Float32Array {
    const { nIn, width: c, kernel, inW, inB, lnG, lnB, lnEps, blocks, attnW, attnB, headW, headB, nClasses } = this.w;
    const f = this.featuresPerFrame;
    if (features.length === 0 || features.length % f) {
      throw new Error(`expected a multiple of ${f} features, got ${features.length}`);
    }
    const frames = features.length / f;

    // Input projection over [x, dx], then LayerNorm and GELU.
    let h = new Float32Array(frames * c);
    for (let t = 0; t < frames; t++) {
      const row = t * c;
      for (let o = 0; o < c; o++) h[row + o] = inB[o]!;
      for (let i = 0; i < nIn; i++) {
        const j = i < f ? i : i - f;
        const x = features[t * f + j]!;
        const v = i < f ? x : t === 0 ? 0 : x - features[(t - 1) * f + j]!;
        if (v === 0) continue; // missing hands are zeros: skip them
        const wRow = i * c;
        for (let o = 0; o < c; o++) h[row + o] = h[row + o]! + v * inW[wRow + o]!;
      }
      let mean = 0;
      for (let o = 0; o < c; o++) mean += h[row + o]!;
      mean /= c;
      let variance = 0;
      for (let o = 0; o < c; o++) variance += (h[row + o]! - mean) ** 2;
      const inv = 1 / Math.sqrt(variance / c + lnEps);
      for (let o = 0; o < c; o++) h[row + o] = gelu((h[row + o]! - mean) * inv * lnG[o]! + lnB[o]!);
    }

    // Residual depthwise-separable temporal convolutions ("same" padding).
    const pad = kernel >> 1;
    const dw = new Float32Array(frames * c);
    const pw = new Float32Array(c);
    blocks.forEach(({ dwW, dwB, pwB }, b) => {
      const pwT = this.pwT[b]!;
      for (let t = 0; t < frames; t++) {
        for (let ch = 0; ch < c; ch++) {
          let s = dwB[ch]!;
          for (let k = 0; k < kernel; k++) {
            const src = t + k - pad;
            if (src >= 0 && src < frames) s += dwW[ch * kernel + k]! * h[src * c + ch]!;
          }
          dw[t * c + ch] = s;
        }
      }
      const next = new Float32Array(frames * c);
      for (let t = 0; t < frames; t++) {
        pw.set(pwB);
        for (let i = 0; i < c; i++) {
          const v = dw[t * c + i]!;
          const wRow = i * c;
          for (let o = 0; o < c; o++) pw[o] = pw[o]! + v * pwT[wRow + o]!;
        }
        for (let o = 0; o < c; o++) next[t * c + o] = h[t * c + o]! + gelu(pw[o]!);
      }
      h = next;
    });

    // Attention pooling and max pooling over time.
    const scores = new Float32Array(frames);
    let maxScore = -Infinity;
    for (let t = 0; t < frames; t++) {
      let s = attnB;
      for (let ch = 0; ch < c; ch++) s += h[t * c + ch]! * attnW[ch]!;
      scores[t] = s;
      if (s > maxScore) maxScore = s;
    }
    let total = 0;
    for (let t = 0; t < frames; t++) {
      const e = Math.exp(scores[t]! - maxScore);
      scores[t] = e;
      total += e;
    }
    const pooled = new Float32Array(2 * c);
    for (let ch = 0; ch < c; ch++) pooled[c + ch] = -Infinity;
    for (let t = 0; t < frames; t++) {
      const a = scores[t]! / total;
      for (let ch = 0; ch < c; ch++) {
        const v = h[t * c + ch]!;
        pooled[ch] = pooled[ch]! + a * v;
        if (v > pooled[c + ch]!) pooled[c + ch] = v;
      }
    }

    const logits = new Float32Array(nClasses);
    for (let k = 0; k < nClasses; k++) {
      let s = headB[k]!;
      const row = k * 2 * c;
      for (let j = 0; j < 2 * c; j++) s += headW[row + j]! * pooled[j]!;
      logits[k] = s;
    }
    return logits;
  }

  /** Softmax of `logits(features)`. */
  probabilities(features: Float32Array): Float32Array {
    return softmax(this.logits(features));
  }
}

export function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  const out = new Float32Array(logits.length);
  let total = 0;
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i]! - max);
    out[i] = e;
    total += e;
  }
  for (let i = 0; i < out.length; i++) out[i] = out[i]! / total;
  return out;
}
