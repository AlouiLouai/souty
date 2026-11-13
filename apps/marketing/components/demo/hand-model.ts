/**
 * Placing and animating the cartoon hand that draws signs. The hand shapes
 * themselves (real TunSL hands and the modelled universal gestures) live in
 * @souty/vocabulary, shared with the PWA; they are re-exported here.
 *
 * Everything here is pure math: no DOM, no canvas, no timers.
 */
import {
  type HandShape,
  type Vec2,
  type Vec3,
} from "@souty/vocabulary";

export {
  FINGER_CHAINS,
  FINGERTIPS,
  PALM_OUTLINE,
  REST_SHAPE,
  shapeForSign,
  type HandShape,
  type Vec2,
  type Vec3,
} from "@souty/vocabulary";

/** Time the hand takes to move into a shape. */
export const POSE_TWEEN_MS = 450;
/** Time the shape is held while the ring fills: the real app's hold-to-confirm delay. */
export const HOLD_MS = 700;
/** Time the full ring stays on screen once the word is locked in. */
export const LOCKED_MS = 350;

function at(shape: HandShape, index: number): Vec3 {
  return shape[index] ?? [0, 0, 0];
}

// ---- Placing a shape on a surface ----

interface HandLayout {
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
