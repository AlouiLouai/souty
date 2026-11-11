import { HAND_VALUES, LANDMARK_COUNT, type Frame, type Hand } from "./features";

/** One hand as MediaPipe's HandLandmarker reports it. */
export interface DetectedHand {
  /** Top handedness category name: "Left" or "Right". */
  readonly handedness: string | undefined;
  /** 21 normalized landmarks. */
  readonly landmarks: ReadonlyArray<{ readonly x: number; readonly y: number; readonly z: number }>;
}

function toHand(landmarks: DetectedHand["landmarks"], aspect: number): Hand | null {
  if (landmarks.length < LANDMARK_COUNT) return null;
  const hand = new Float32Array(HAND_VALUES);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const p = landmarks[i]!;
    hand[i * 3] = p.x * aspect;
    hand[i * 3 + 1] = p.y;
    hand[i * 3 + 2] = p.z * aspect;
  }
  return hand;
}

/**
 * Puts up to two detected hands into the model's two slots, with the same
 * rule as the notebook's `assign_slots`: "Left" goes to slot 0, "Right" to
 * slot 1, and when both hands get the same label the one with the smaller
 * wrist x takes slot 0.
 *
 * @param aspect Frame width / height. x and z are multiplied by it.
 */
export function frameFromHands(hands: readonly DetectedHand[], aspect: number): Frame {
  const slotted = hands
    .slice(0, 2)
    .map((h) => ({ left: h.handedness === "Left", hand: toHand(h.landmarks, aspect) }))
    .filter((h): h is { left: boolean; hand: Hand } => h.hand !== null);

  const [a, b] = slotted;
  if (!a) return [null, null];
  if (!b) return a.left ? [a.hand, null] : [null, a.hand];
  if (a.left !== b.left) return a.left ? [a.hand, b.hand] : [b.hand, a.hand];
  return a.hand[0]! <= b.hand[0]! ? [a.hand, b.hand] : [b.hand, a.hand];
}

export function handCount(frame: Frame): number {
  return (frame[0] ? 1 : 0) + (frame[1] ? 1 : 0);
}
