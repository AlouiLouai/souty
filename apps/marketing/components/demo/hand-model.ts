/**
 * Geometry of the cartoon hand in the sign playground.
 *
 * The hand is a 21-landmark skeleton laid out like MediaPipe's (wrist, then
 * four points per finger, thumb first), which is what the real app tracks.
 * Everything here is pure math: no DOM, no canvas, no timers.
 */

export type Vec2 = readonly [x: number, y: number];
export type Vec3 = readonly [x: number, y: number, z: number];

/** How far each finger is folded, thumb first: 0 is straight, 1 is fully curled. */
export type FingerCurls = readonly [number, number, number, number, number];

export interface HandPose {
  readonly curl: FingerCurls;
  /** How far the fingers fan out; 1 is relaxed. */
  readonly spread: number;
}

interface Finger {
  /** Knuckle position in hand units, before the hand is centered. */
  readonly base: Vec3;
  /** Resting direction in degrees, 0 pointing straight up. */
  readonly angle: number;
  /** Length of each of the three bones, knuckle to tip. */
  readonly bones: readonly [number, number, number];
  readonly thumb?: boolean;
}

export const FINGERS: readonly Finger[] = [
  { base: [-0.3, 0.3, 0.06], angle: -48, bones: [0.34, 0.3, 0.26], thumb: true },
  { base: [-0.24, 0.86, 0], angle: -9, bones: [0.46, 0.28, 0.22] },
  { base: [-0.02, 0.92, 0], angle: 0, bones: [0.5, 0.32, 0.24] },
  { base: [0.19, 0.86, 0], angle: 8, bones: [0.46, 0.3, 0.22] },
  { base: [0.37, 0.72, 0], angle: 18, bones: [0.36, 0.23, 0.19] },
];

/** The open hand the playground starts from and returns to. */
export const REST_POSE: HandPose = { curl: [0, 0, 0, 0, 0], spread: 1.25 };

/**
 * Hand shapes the playground cycles through. They are drawings that explain
 * the idea, not real Tunisian Sign Language signs.
 */
export const POSES: readonly HandPose[] = [
  { curl: [0.95, 0, 0, 1, 1], spread: 2.1 },
  { curl: [0.85, 0, 1, 1, 1], spread: 1 },
  { curl: [0.55, 0.52, 0, 0, 0], spread: 1.4 },
  { curl: [0.75, 1, 1, 1, 1], spread: 1 },
  { curl: [0, 1, 1, 1, 0], spread: 1.6 },
  { curl: [0.9, 0, 0, 0, 1], spread: 1.3 },
];

/** Landmark indices, MediaPipe order. */
export const PALM_OUTLINE: readonly number[] = [0, 1, 5, 9, 13, 17];
export const FINGER_CHAINS: readonly (readonly number[])[] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];
export const FINGERTIPS: readonly number[] = [4, 8, 12, 16, 20];

/** Time the hand takes to move into a pose. */
export const POSE_TWEEN_MS = 450;
/** Time the pose is held while the ring fills: the real app's hold-to-confirm delay. */
export const HOLD_MS = 700;
/** Time the full ring stays on screen once the word is locked in. */
export const LOCKED_MS = 350;

const DEGREES = Math.PI / 180;
/** Degrees each joint of a finger bends when fully curled. */
const JOINT_BEND: readonly number[] = [85, 105, 75];
/** Vertical offset that centers the hand on its palm rather than its wrist. */
const PALM_CENTER_Y = 0.72;

/** The pose for the nth word signed, starting where the reference demo starts. */
export function poseForStep(step: number): HandPose {
  return POSES[(step + 1) % POSES.length] ?? REST_POSE;
}

/** The 21 landmarks of a pose, in hand units centered on the palm. */
export function handPoints(pose: HandPose): Vec3[] {
  const points: Vec3[] = [[0, 0, 0]];

  FINGERS.forEach((finger, index) => {
    const curl = pose.curl[index] ?? 0;
    let [x, y, z] = finger.base;
    points.push([x, y, z]);

    let bend = 0;
    finger.bones.forEach((length, joint) => {
      let heading: number;
      let lift: number;
      if (finger.thumb) {
        // The thumb sweeps across the palm as it curls instead of folding down.
        heading = (finger.angle + curl * (55 + 18 * joint)) * DEGREES;
        lift = curl * (22 + 16 * joint) * DEGREES;
      } else {
        heading = finger.angle * pose.spread * DEGREES;
        bend += curl * (JOINT_BEND[joint] ?? 0) * DEGREES;
        lift = bend;
      }
      x += length * Math.sin(heading) * Math.cos(lift);
      y += length * Math.cos(heading) * Math.cos(lift);
      z += length * Math.sin(lift);
      points.push([x, y, z]);
    });
  });

  return points.map(([x, y, z]) => [x, y - PALM_CENTER_Y, z]);
}

export interface HandLayout {
  /** The 21 landmarks in canvas pixels. */
  readonly points: readonly Vec2[];
  /** Pixels per hand unit. */
  readonly scale: number;
  /** The progress ring drawn around the hand. */
  readonly ring: { readonly center: Vec2; readonly radius: number };
}

/** Places a pose on a stage of the given size, with a light perspective. */
export function layoutHand(pose: HandPose, width: number, height: number): HandLayout {
  const scale = width * 0.27;
  const centerX = width / 2;
  const centerY = height * 0.6;

  const points = handPoints(pose).map(([x, y, z]): Vec2 => {
    const depth = 1 / (1 - z * 0.2);
    return [centerX + x * scale * depth, centerY - y * scale * depth];
  });

  return {
    points,
    scale,
    ring: { center: [centerX, centerY - 0.25 * scale], radius: scale * 1.25 },
  };
}

/** Cubic ease in and out, for progress between 0 and 1. */
export function easeInOutCubic(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The pose `amount` of the way from one pose to another. */
export function mixPose(from: HandPose, to: HandPose, amount: number): HandPose {
  const mix = (start: number, end: number) => start + (end - start) * amount;
  return {
    curl: [
      mix(from.curl[0], to.curl[0]),
      mix(from.curl[1], to.curl[1]),
      mix(from.curl[2], to.curl[2]),
      mix(from.curl[3], to.curl[3]),
      mix(from.curl[4], to.curl[4]),
    ],
    spread: mix(from.spread, to.spread),
  };
}

/** A pose with the faint tremor of a living hand at the given clock time. */
export function withTremor(pose: HandPose, timeMs: number): HandPose {
  const tremor = Math.sin(timeMs / 400) * 0.012;
  const shake = (curl: number) => Math.max(0, curl + tremor);
  return {
    curl: [
      shake(pose.curl[0]),
      shake(pose.curl[1]),
      shake(pose.curl[2]),
      shake(pose.curl[3]),
      shake(pose.curl[4]),
    ],
    spread: pose.spread,
  };
}
