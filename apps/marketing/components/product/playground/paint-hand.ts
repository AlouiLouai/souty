import { palette } from "@souty/brand/palette";
import {
  FINGER_CHAINS,
  FINGERTIPS,
  PALM_OUTLINE,
  layoutHand,
  type HandShape,
  type Vec2,
} from "@/components/demo/hand-model";

interface HandFrame {
  /** Stage size in CSS pixels. */
  readonly width: number;
  readonly height: number;
  readonly shape: HandShape;
  /** Hold-to-confirm progress from 0 to 1, or null when no ring is shown. */
  readonly ring: number | null;
}

/** Thickness of the ink outline and of the progress ring, in CSS pixels. */
const INK = 10;

function pick(points: readonly Vec2[], indices: readonly number[]): Vec2[] {
  return indices.flatMap((index) => {
    const point = points[index];
    return point ? [point] : [];
  });
}

function trace(context: CanvasRenderingContext2D, path: readonly Vec2[], closed = false): void {
  context.beginPath();
  path.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  if (closed) context.closePath();
}

function paintRing(
  context: CanvasRenderingContext2D,
  [x, y]: Vec2,
  radius: number,
  progress: number
): void {
  context.lineWidth = INK;
  context.lineCap = "round";

  context.globalAlpha = 0.12;
  context.strokeStyle = palette.plum;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;

  if (progress <= 0) return;
  const start = -Math.PI / 2;
  context.strokeStyle = progress >= 1 ? palette.mint : palette.harissa;
  context.beginPath();
  context.arc(x, y, radius, start, start + Math.PI * 2 * Math.min(1, progress));
  context.stroke();
}

/**
 * Paints one frame of the cartoon hand: the progress ring, the sleeve, then
 * the hand in two passes (everything fat in ink, then everything again in
 * skin, slightly thinner) so the whole silhouette gets one even outline.
 * The caller clears the canvas and sets the pixel-ratio transform.
 */
export function paintHand(context: CanvasRenderingContext2D, frame: HandFrame): void {
  const { points, scale, sleeveEnd, ring } = layoutHand(frame.shape, frame.width, frame.height);
  const wrist = points[0];
  if (!wrist) return;

  if (frame.ring !== null) paintRing(context, ring.center, ring.radius, frame.ring);

  context.lineCap = "round";
  context.lineJoin = "round";

  const sleeveWidth = scale * 0.6;
  trace(context, [wrist, sleeveEnd]);
  context.strokeStyle = palette.plum;
  context.lineWidth = sleeveWidth;
  context.stroke();
  context.strokeStyle = palette.harissa;
  context.lineWidth = sleeveWidth - INK;
  context.stroke();

  const palm = pick(points, PALM_OUTLINE);
  const fingers = FINGER_CHAINS.map((chain) => pick(points, chain));
  const fingerWidth = scale * 0.2;
  const palmEdge = fingerWidth * 0.9;

  const paintPass = (color: string, grow: number) => {
    context.strokeStyle = color;
    context.fillStyle = color;
    trace(context, palm, true);
    context.fill();
    context.lineWidth = palmEdge + grow;
    context.stroke();
    context.lineWidth = fingerWidth + grow;
    for (const finger of fingers) {
      trace(context, finger);
      context.stroke();
    }
  };
  paintPass(palette.plum, INK);
  paintPass(palette.skin, 0);

  // Fingernails: a lighter dab of skin on each fingertip.
  context.fillStyle = palette.paper;
  context.globalAlpha = 0.6;
  for (const [x, y] of pick(points, FINGERTIPS)) {
    context.beginPath();
    context.arc(x, y, fingerWidth * 0.22, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}
