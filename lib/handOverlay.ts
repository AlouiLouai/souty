import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Cyan #22D3EE: stays legible over any camera feed. Canvas drawing can't
// read CSS variables, so the value lives here.
const HIGHLIGHT_RGB = "34, 211, 238";

// Standard 21-point hand landmark connection graph used by MediaPipe Hands.
const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export interface HandInfo {
  label: string;
  confidence: number;
  /** 0..1 progress towards locking in the current gesture. */
  progress: number;
  /** 0..1 age of the lock-in flash, present only right after a lock-in. */
  lockFlash?: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Progress ring + gesture label anchored just above the hand itself, so the
// indicator tracks wherever the hand is in frame.
function drawHandLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  info: HandInfo,
  canvasWidth: number
) {
  const r = Math.max(20, canvasWidth * 0.035);

  ctx.save();
  ctx.lineWidth = Math.max(3, r * 0.18);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${HIGHLIGHT_RGB}, 0.95)`;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + info.progress * Math.PI * 2);
  ctx.stroke();

  // Expanding flash ring right after lock-in, so the confirmation is
  // visible at the hand itself without looking down at the panel.
  if (info.lockFlash !== undefined && info.lockFlash < 1) {
    const t = info.lockFlash;
    ctx.strokeStyle = `rgba(${HIGHLIGHT_RGB}, ${0.9 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(x, y, r + t * r * 1.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = `600 ${Math.max(11, r * 0.32)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(info.confidence * 100)}%`, x, y);

  const fontSize = Math.max(12, r * 0.34);
  ctx.font = `600 ${fontSize}px sans-serif`;
  const paddingX = fontSize * 0.7;
  const pillWidth = ctx.measureText(info.label).width + paddingX * 2;
  const pillHeight = fontSize * 1.8;
  const pillY = y + r + 8;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  roundRect(ctx, x - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${HIGHLIGHT_RGB})`;
  ctx.fillText(info.label, x, pillY + pillHeight / 2);
  ctx.restore();
}

/**
 * Renders each hand's skeleton plus its progress ring/label. `mirrored`
 * must match whether the <video> is CSS-mirrored (front camera), since the
 * canvas itself never is.
 */
export function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  hands: NormalizedLandmark[][],
  handInfos: ReadonlyArray<HandInfo | null>,
  mirrored: boolean
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const toX = mirrored ? (x: number) => width - x * width : (x: number) => x * width;
  const lineWidth = Math.max(2, width * 0.0035);
  const dotRadius = Math.max(2.5, width * 0.006);

  hands.forEach((landmarks, i) => {
    const points = landmarks.map((p) => ({ px: toX(p.x), py: p.y * height }));

    // Dark halo under the white skeleton keeps it visible against both
    // light and dark backgrounds (skin tones, clothing, lighting).
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = points[a];
      const p2 = points[b];
      if (!p1 || !p2) continue;
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    ctx.lineWidth = lineWidth + 2.5;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.stroke();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.stroke();

    for (const [fill, radius] of [
      ["rgba(0, 0, 0, 0.55)", dotRadius + 1.5],
      ["rgba(255, 255, 255, 0.95)", dotRadius],
    ] as const) {
      ctx.fillStyle = fill;
      for (const { px, py } of points) {
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const info = handInfos[i];
    if (!info || points.length === 0) return;
    const xs = points.map((p) => p.px);
    const minY = Math.min(...points.map((p) => p.py));
    const anchorX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const anchorY = Math.max(minY - height * 0.08, height * 0.08);
    drawHandLabel(ctx, anchorX, anchorY, info, width);
  });
}
