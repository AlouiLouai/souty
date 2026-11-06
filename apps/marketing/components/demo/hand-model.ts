/**
 * Geometry of the cartoon hand that draws signs.
 *
 * A hand is 21 landmarks laid out like MediaPipe's (wrist, then four points
 * per finger, thumb first), which is what the real app tracks. Shapes come
 * from two places:
 *
 * - Tunisian Sign Language signs use real hands from the dataset the app
 *   learned from (`TUNSL_HANDSHAPES` in @souty/vocabulary).
 * - The universal gestures (open palm, fist, thumbs up...) and the resting
 *   hand are built from a small finger-curl model, since they are plain
 *   "which fingers are up" shapes.
 *
 * Everything here is pure math: no DOM, no canvas, no timers.
 */
import { HAND_LANDMARK_COUNT, TUNSL_HANDSHAPES } from "@souty/vocabulary";

export type Vec2 = readonly [x: number, y: number];
export type Vec3 = readonly [x: number, y: number, z: number];

/**
 * 21 landmarks in hand units: x to the right, y up, z towards the viewer,
 * centred on the middle of the hand, with a palm about one unit long.
 */
export type HandShape = readonly Vec3[];

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

/** Time the hand takes to move into a shape. */
export const POSE_TWEEN_MS = 450;
/** Time the shape is held while the ring fills: the real app's hold-to-confirm delay. */
export const HOLD_MS = 700;
/** Time the full ring stays on screen once the word is locked in. */
export const LOCKED_MS = 350;

/** Furthest a landmark may sit from the centre, so every shape fits its frame. */
const MAX_REACH = 1.25;

function at(shape: HandShape, index: number): Vec3 {
  return shape[index] ?? [0, 0, 0];
}

/**
 * Brings any 21 landmarks into hand units: centred on their bounding box,
 * scaled to a palm one unit long, then shrunk if a long reach (a pointing
 * finger, a spread hand) would leave the frame.
 */
export function fitShape(points: readonly Vec3[]): HandShape {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = (from: number, to: number) => Math.hypot(at(points, to)[0] - at(points, from)[0], at(points, to)[1] - at(points, from)[1]);
  // A palm seen edge-on looks short; its width across the knuckles does not, so take the larger.
  const palm = Math.max(span(0, 9), span(5, 17) * 1.25, 1e-6);
  const centred = points.map(([x, y, z]): Vec3 => [(x - centerX) / palm, (y - centerY) / palm, z / palm]);
  const reach = Math.max(...centred.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
  const shrink = reach > MAX_REACH ? MAX_REACH / reach : 1;
  return centred.map(([x, y, z]): Vec3 => [x * shrink, y * shrink, z * shrink]);
}

// ---- Finger-curl model, for the resting hand and the universal gestures ----

/** How far each finger is folded, thumb first: 0 is straight, 1 is fully curled. */
type FingerCurls = readonly [number, number, number, number, number];

interface Pose {
  readonly curl: FingerCurls;
  /** How far the fingers fan out; 1 is relaxed. */
  readonly spread: number;
  /** Turns the whole hand, in degrees clockwise. */
  readonly turn?: number;
}

interface Finger {
  /** Knuckle position, with the wrist at the origin. */
  readonly base: Vec3;
  /** Resting direction in degrees, 0 pointing straight up. */
  readonly angle: number;
  /** Length of each of the three bones, knuckle to tip. */
  readonly bones: readonly [number, number, number];
  readonly thumb?: boolean;
}

const FINGERS: readonly Finger[] = [
  { base: [-0.3, 0.3, 0.06], angle: -48, bones: [0.34, 0.3, 0.26], thumb: true },
  { base: [-0.24, 0.86, 0], angle: -9, bones: [0.46, 0.28, 0.22] },
  { base: [-0.02, 0.92, 0], angle: 0, bones: [0.5, 0.32, 0.24] },
  { base: [0.19, 0.86, 0], angle: 8, bones: [0.46, 0.3, 0.22] },
  { base: [0.37, 0.72, 0], angle: 18, bones: [0.36, 0.23, 0.19] },
];

const DEGREES = Math.PI / 180;
/** Degrees each joint of a finger bends when fully curled. */
const JOINT_BEND: readonly number[] = [85, 105, 75];

function poseShape(pose: Pose): HandShape {
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

  const turn = (pose.turn ?? 0) * DEGREES;
  const turned = points.map(([x, y, z]): Vec3 => [x * Math.cos(turn) + y * Math.sin(turn), y * Math.cos(turn) - x * Math.sin(turn), z]);
  return fitShape(turned);
}

/** The open hand the playground starts from and returns to. */
export const REST_SHAPE: HandShape = poseShape({ curl: [0, 0, 0, 0, 0], spread: 1.25 });

/**
 * The ten universal gestures, by model label. Thumbs up and down are a fist
 * with the thumb out, turned so the thumb points up or down.
 */
const UNIVERSAL_SHAPES: Readonly<Record<string, HandShape>> = {
  Open_Palm: REST_SHAPE,
  Closed_Fist: poseShape({ curl: [0.9, 1, 1, 1, 1], spread: 1 }),
  Thumb_Up: poseShape({ curl: [0, 1, 1, 1, 1], spread: 1, turn: 62 }),
  Thumb_Down: poseShape({ curl: [0, 1, 1, 1, 1], spread: 1, turn: 242 }),
  Victory: poseShape({ curl: [0.95, 0, 0, 1, 1], spread: 2.1 }),
  Pointing_Up: poseShape({ curl: [0.85, 0, 1, 1, 1], spread: 1 }),
  OK_Sign: poseShape({ curl: [0.55, 0.52, 0, 0, 0], spread: 1.4 }),
  Three_Fingers: poseShape({ curl: [0.9, 0, 0, 0, 1], spread: 1.3 }),
  Four_Fingers: poseShape({ curl: [0.95, 0, 0, 0, 0], spread: 1.3 }),
  Shaka_Sign: poseShape({ curl: [0, 1, 1, 1, 0], spread: 1.6 }),
};

/**
 * The hand shape for a sign, by model label: the real dataset hand for a
 * Tunisian Sign Language sign, the modelled gesture for a universal one.
 * Returns null for a label with no known shape.
 */
export function shapeForSign(label: string): HandShape | null {
  if (Object.prototype.hasOwnProperty.call(TUNSL_HANDSHAPES, label)) {
    const landmarks = TUNSL_HANDSHAPES[label];
    if (landmarks && landmarks.length === HAND_LANDMARK_COUNT) return fitShape(landmarks);
  }
  if (Object.prototype.hasOwnProperty.call(UNIVERSAL_SHAPES, label)) {
    return UNIVERSAL_SHAPES[label] ?? null;
  }
  return null;
}

// ---- Placing a shape on a surface ----

export interface HandLayout {
  /** The 21 landmarks in surface pixels. */
  readonly points: readonly Vec2[];
  /** Pixels per hand unit. */
  readonly scale: number;
  /** Where the sleeve runs to from the wrist: away from the fingers, off the surface. */
  readonly sleeveEnd: Vec2;
  /** The progress ring drawn around the hand. */
  readonly ring: { readonly center: Vec2; readonly radius: number };
}

/** Share of the surface width that one hand unit takes. */
const UNIT_SHARE = 0.25;

/** Places a shape on a surface of the given size, with a light perspective. */
export function layoutHand(shape: HandShape, width: number, height: number): HandLayout {
  const scale = width * UNIT_SHARE;
  const centerX = width / 2;
  const centerY = height * 0.56;

  const points = shape.map(([x, y, z]): Vec2 => {
    const depth = 1 / (1 - z * 0.2);
    return [centerX + x * scale * depth, centerY - y * scale * depth];
  });

  // The forearm continues the line from the knuckles through the wrist.
  const wrist = points[0] ?? [centerX, centerY];
  const knuckles = [5, 9, 13, 17].map((index) => points[index] ?? wrist);
  const palmX = knuckles.reduce((sum, point) => sum + point[0], 0) / knuckles.length;
  const palmY = knuckles.reduce((sum, point) => sum + point[1], 0) / knuckles.length;
  const length = Math.hypot(wrist[0] - palmX, wrist[1] - palmY) || 1;
  const reach = width + height;
  const sleeveEnd: Vec2 = [wrist[0] + ((wrist[0] - palmX) / length) * reach, wrist[1] + ((wrist[1] - palmY) / length) * reach];

  return { points, scale, sleeveEnd, ring: { center: [centerX, centerY], radius: scale * 1.62 } };
}

/** Cubic ease in and out, for progress between 0 and 1. */
export function easeInOutCubic(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The shape `amount` of the way from one shape to another. */
export function mixShape(from: HandShape, to: HandShape, amount: number): HandShape {
  return from.map((start, index): Vec3 => {
    const end = at(to, index);
    return [start[0] + (end[0] - start[0]) * amount, start[1] + (end[1] - start[1]) * amount, start[2] + (end[2] - start[2]) * amount];
  });
}

/** A shape with the faint sway of a living hand at the given clock time. */
export function withTremor(shape: HandShape, timeMs: number): HandShape {
  const sway = Math.sin(timeMs / 400) * 0.012;
  return shape.map(([x, y, z]): Vec3 => [x + sway * y, y - sway * x, z]);
}
