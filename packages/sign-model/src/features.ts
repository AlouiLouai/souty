/**
 * The feature contract shared with the training notebook
 * (`training/kaggle_pipeline.ipynb`, step 6, `window_features`). Any change
 * here must match a retrain, and `test/parity.test.ts` checks it against the
 * notebook's own output.
 */

export const LANDMARK_COUNT = 21;
/** 21 landmarks × (x, y, z). */
export const HAND_VALUES = LANDMARK_COUNT * 3;
/** Per hand slot: 63 shape values, 2 wrist position values, 1 presence flag. */
export const SLOT_FEATURES = HAND_VALUES + 3;
export const NUM_FEATURES = 2 * SLOT_FEATURES;

const CLIP = 10;
const MIN_PALM = 1e-3;

/**
 * One detected hand: 21 landmarks × (x, y, z), flattened. x and z are
 * multiplied by the frame's width / height, so all three axes are in
 * image-height units.
 */
export type Hand = Float32Array;

/** Slot 0 is the hand MediaPipe labels "Left", slot 1 is "Right". `null` means not detected. */
export type Frame = readonly [Hand | null, Hand | null];

/** 2D distance from the wrist (landmark 0) to the middle-finger base (landmark 9). */
function palmSize(hand: Hand): number {
  return Math.max(Math.hypot(hand[27]! - hand[0]!, hand[28]! - hand[1]!), MIN_PALM);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

const clip = (v: number) => (v > CLIP ? CLIP : v < -CLIP ? -CLIP : v);

/**
 * Maps a window of frames to `(frames × 132)` features, row-major.
 *
 * Per slot: each landmark minus the wrist, divided by that frame's palm size
 * (hand shape); the wrist minus the window anchor, divided by the window
 * scale (where the hand is and how it moves); then 1 for present. A missing
 * hand is all zeros. Everything is clipped to [-10, 10].
 */
export function windowFeatures(window: readonly Frame[]): Float32Array {
  const out = new Float32Array(window.length * NUM_FEATURES);
  const palms: number[] = [];
  let anchorX = 0;
  let anchorY = 0;
  for (const frame of window) {
    for (const hand of frame) {
      if (!hand) continue;
      palms.push(palmSize(hand));
      anchorX += hand[0]!;
      anchorY += hand[1]!;
    }
  }
  if (palms.length === 0) return out;
  anchorX /= palms.length;
  anchorY /= palms.length;
  const scale = Math.max(median(palms), MIN_PALM);

  window.forEach((frame, t) => {
    frame.forEach((hand, slot) => {
      if (!hand) return;
      const base = t * NUM_FEATURES + slot * SLOT_FEATURES;
      const palm = palmSize(hand);
      for (let j = 0; j < HAND_VALUES; j++) {
        out[base + j] = clip((hand[j]! - hand[j % 3]!) / palm);
      }
      out[base + HAND_VALUES] = clip((hand[0]! - anchorX) / scale);
      out[base + HAND_VALUES + 1] = clip((hand[1]! - anchorY) / scale);
      out[base + HAND_VALUES + 2] = 1;
    });
  });
  return out;
}
