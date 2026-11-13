/**
 * The live feedback drawn over the camera: each hand's skeleton, and one
 * ring above both hands that shows what the sign reader is doing.
 *
 * The ring is on screen whenever a hand is, so the user always sees that
 * the app is reading them:
 *
 * - reading:   a spinning arc (hands seen, no sign leading yet), with one
 *              dot per visible hand in the middle;
 * - candidate: the arc fills as the same sign keeps winning, and the word
 *              it will say sits under the ring;
 * - said:      a full green ring with a check, and a burst on the frame
 *              the word is added.
 *
 * The only text drawn is the sign's word (the translation). Sizes are in CSS
 * pixels, so the ring looks the same on every phone, and everything is
 * kept inside the part of the frame the cropped (`object-cover`) canvas
 * actually shows.
 */
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Cyan: reads well on every skin tone and background (canvas cannot read CSS variables). */
const READING_RGB = "34, 211, 238";
/** Brand mint (--mint): the sign was said. */
const SAID_RGB = "34, 191, 160";
const WHITE_RGB = "255, 255, 255";

/** MediaPipe 21-point hand landmark connections. */
const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
/** Middle-finger knuckle: the steadiest point to join two hands by. */
const PALM_CENTER = 9;

/** Ring radius, in CSS pixels. */
const RING_RADIUS_CSS = 30;
/** Word size under the ring, in CSS pixels. */
const WORD_FONT_CSS = 24;
/** Gap between the ring and the top of the hands, in CSS pixels. */
const HAND_GAP_CSS = 14;
/** Margin kept from the visible edges, in CSS pixels. */
const EDGE_CSS = 10;
/** Time constant of the ring following the hands; higher is calmer. */
const FOLLOW_MS = 110;
/** Time constant of the arc filling up. */
const FILL_MS = 90;
/** A word that stops leading fades out over this long, instead of blinking off. */
const WORD_HOLD_MS = 450;
/**
 * How long the green "said" ring stays after the reader stops reporting the
 * sign (the user finished a moving sign, a reading dipped, or the hands
 * dropped), so the confirmation is always seen.
 */
const SAID_HOLD_MS = 800;
/** One turn of the reading spinner. */
const SPIN_MS = 1100;

/** What the sign reader says about the current window. */
export interface SignView {
  /** The leading sign's word, or null while still reading. */
  readonly word: string | null;
  /** 0..1 towards saying it; 1 once said. */
  readonly progress: number;
  /** 0..1 age of the burst right after a word is said; absent otherwise. */
  readonly lockFlash?: number;
}

export type SignPhase = "reading" | "candidate" | "said";

/** Which state the ring is in for a reader state (hands are visible). */
export function signPhase(view: SignView | null): SignPhase {
  if (!view?.word) return "reading";
  return view.progress >= 1 ? "said" : "candidate";
}

/** A rectangle in canvas pixels. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where `object-fit: cover` puts a `videoWidth` x `videoHeight` frame in a
 * `boxWidth` x `boxHeight` box: its scale and its top-left offset, in CSS
 * pixels (offsets are negative on the cropped sides).
 */
export function coverTransform(
  videoWidth: number,
  videoHeight: number,
  boxWidth: number,
  boxHeight: number
): { scale: number; offsetX: number; offsetY: number } {
  if (videoWidth <= 0 || videoHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }
  const scale = Math.max(boxWidth / videoWidth, boxHeight / videoHeight);
  return {
    scale,
    offsetX: (boxWidth - videoWidth * scale) / 2,
    offsetY: (boxHeight - videoHeight * scale) / 2,
  };
}

/** Which sides of the screen have a hand, as the user sees the preview. */
export interface HandSides {
  readonly left: boolean;
  readonly right: boolean;
}

/**
 * Screen side of each hand, from its wrist position as displayed (after the
 * front camera's mirroring). Two hands always light both sides; one hand
 * lights the side it is on. MediaPipe's handedness is not used: it depends
 * on whether the frame was mirrored, the screen position does not.
 */
export function handSides(hands: readonly NormalizedLandmark[][], mirrored: boolean): HandSides {
  const xs = hands
    .map((landmarks) => landmarks[0]?.x)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
    .map((x) => (mirrored ? 1 - x : x));
  if (xs.length >= 2) return { left: true, right: true };
  const [x] = xs;
  if (x === undefined) return { left: false, right: false };
  return x < 0.5 ? { left: true, right: false } : { left: false, right: true };
}

/** Exponential approach of `from` to `to` over `dt` ms with time constant `tau`. */
export function approach(from: number, to: number, dt: number, tau: number): number {
  if (!Number.isFinite(from) || dt <= 0) return to;
  return to + (from - to) * Math.exp(-dt / tau);
}

function clamp(value: number, min: number, max: number) {
  return max < min ? (min + max) / 2 : Math.min(max, Math.max(min, value));
}

/** The page's display font, so the word on the camera matches the sentence. */
function displayFont(): string {
  if (typeof document === "undefined") return "sans-serif";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return value ? `${value}, sans-serif` : "sans-serif";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface Point {
  readonly px: number;
  readonly py: number;
}

/**
 * Draws the overlay frame by frame. Keep one per canvas: it remembers where
 * the ring was, so it glides after the hands instead of jumping, and the
 * last word, so it fades instead of blinking when one reading dips.
 */
export class HandOverlay {
  private anchorX = Number.NaN;
  private anchorY = Number.NaN;
  private shownProgress = 0;
  private lastNow = Number.NaN;
  private lastWord: { word: string; at: number } | null = null;
  private font: string | null = null;
  /** The ring sits below the hands (they are too close to the top for it to fit above). */
  private below = false;
  /** The last word said, kept on screen for SAID_HOLD_MS. */
  private said: { word: string; at: number } | null = null;

  /** Forget the ring's position and word (camera switched, scanner paused). */
  reset() {
    this.anchorX = Number.NaN;
    this.anchorY = Number.NaN;
    this.shownProgress = 0;
    this.lastWord = null;
    this.below = false;
    this.said = null;
  }

  /** The view to draw: the reader's, or the word just said while it is held. */
  private resolveView(view: SignView | null, now: number): SignView | null {
    if (signPhase(view) === "said" && view?.word) {
      this.said = { word: view.word, at: now };
      return view;
    }
    const held = this.said && now - this.said.at < SAID_HOLD_MS ? this.said : null;
    // A different sign starting to fill takes over at once.
    if (!held || (view?.word && view.word !== held.word)) {
      this.said = null;
      return view;
    }
    return { word: held.word, progress: 1, lockFlash: view?.lockFlash };
  }

  /**
   * Draws one frame. The canvas backing store should be its CSS size times
   * devicePixelRatio (not the camera's resolution) so the word stays sharp.
   * @param mirrored Must match whether the <video> is CSS-mirrored (front camera).
   * @param now The frame's clock, in ms.
   * @param video The camera frame's size, to map landmarks the way the
   *   `object-fit: cover` video shows them.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    hands: readonly NormalizedLandmark[][],
    readerView: SignView | null,
    mirrored: boolean,
    now: number,
    video: { readonly width: number; readonly height: number }
  ) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    const dt = Number.isFinite(this.lastNow) ? Math.min(250, now - this.lastNow) : 0;
    this.lastNow = now;

    const view = this.resolveView(readerView, now);
    const phase = signPhase(view);
    // With no hands, only a word that was just said stays (where it was).
    if (hands.length === 0 && (phase !== "said" || !Number.isFinite(this.anchorX))) {
      this.reset();
      return;
    }

    const cssWidth = ctx.canvas.clientWidth || width;
    const cssHeight = ctx.canvas.clientHeight || height;
    const pxPerCss = cssWidth > 0 ? width / cssWidth : 1;
    const css = (value: number) => value * pxPerCss;
    const videoWidth = video.width > 0 ? video.width : cssWidth;
    const videoHeight = video.height > 0 ? video.height : cssHeight;
    const cover = coverTransform(videoWidth, videoHeight, cssWidth, cssHeight);
    const handPoints = hands.map((landmarks) =>
      landmarks.map((p) => ({
        px: (cover.offsetX + (mirrored ? 1 - p.x : p.x) * videoWidth * cover.scale) * pxPerCss,
        py: (cover.offsetY + p.y * videoHeight * cover.scale) * pxPerCss,
      }))
    );
    const rect: Rect = { x: 0, y: 0, width, height };

    const toneRgb = phase === "said" ? SAID_RGB : phase === "candidate" ? READING_RGB : WHITE_RGB;
    if (handPoints.length >= 2) this.drawLink(ctx, handPoints, css, now, toneRgb);
    for (const points of handPoints) this.drawSkeleton(ctx, points, css, toneRgb);

    const r = css(RING_RADIUS_CSS);
    const fontSize = css(WORD_FONT_CSS);
    const pillHeight = fontSize * 1.7;
    const edge = css(EDGE_CSS);
    const all = handPoints.flat();
    if (all.length > 0) {
      // Ring: centred over both hands, kept inside what the user can see.
      const xs = all.map((p) => p.px);
      const ys = all.map((p) => p.py);
      const targetX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const minX = rect.x + r + edge;
      const maxX = rect.x + rect.width - r - edge;
      const minY = rect.y + r + edge;
      const maxY = rect.y + rect.height - r - pillHeight - edge * 2;
      // Above the hands; below them (over the arms) when they are too high
      // for that, so the ring never sits on the fingers. Hysteresis keeps it
      // from flapping between the two around the edge.
      const aboveY = Math.min(...ys) - css(HAND_GAP_CSS) - pillHeight - r;
      const belowY = Math.max(...ys) + css(HAND_GAP_CSS) + r;
      if (!this.below && aboveY < minY - r * 0.5) this.below = true;
      else if (this.below && aboveY > minY + r * 0.5) this.below = false;
      const targetY = this.below ? belowY : aboveY;
      this.anchorX = clamp(approach(this.anchorX, targetX, dt, FOLLOW_MS), minX, maxX);
      this.anchorY = clamp(approach(this.anchorY, targetY, dt, FOLLOW_MS), minY, maxY);
    }

    const target = phase === "reading" ? 0 : (view?.progress ?? 0);
    this.shownProgress = target < this.shownProgress ? target : approach(this.shownProgress, target, dt, FILL_MS);

    this.drawRing(ctx, r, phase, handPoints.length, view?.lockFlash, now);

    // The word: the live one, or the last one fading out after a dip.
    let word = view?.word ?? null;
    let alpha = 1;
    if (word) {
      this.lastWord = { word, at: now };
    } else if (this.lastWord && now - this.lastWord.at < WORD_HOLD_MS) {
      word = this.lastWord.word;
      alpha = 1 - (now - this.lastWord.at) / WORD_HOLD_MS;
    } else {
      this.lastWord = null;
    }
    if (word) this.drawWord(ctx, word, fontSize, pillHeight, r, rect, edge, alpha, phase === "said");
  }

  private drawSkeleton(
    ctx: CanvasRenderingContext2D,
    points: readonly Point[],
    css: (value: number) => number,
    toneRgb: string
  ) {
    const lineWidth = css(3);
    const dotRadius = css(3.5);

    // Dark halo keeps the skeleton visible on any background and skin tone.
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = points[a];
      const p2 = points[b];
      if (!p1 || !p2) continue;
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth + css(2.5);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.stroke();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${toneRgb}, 0.95)`;
    ctx.stroke();

    for (const [fill, radius] of [
      ["rgba(0, 0, 0, 0.55)", dotRadius + css(1.5)],
      [`rgba(${toneRgb}, 1)`, dotRadius],
    ] as const) {
      ctx.fillStyle = fill;
      for (const { px, py } of points) {
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** A moving dashed line between the hands: both are read as one sign. */
  private drawLink(
    ctx: CanvasRenderingContext2D,
    hands: readonly (readonly Point[])[],
    css: (value: number) => number,
    now: number,
    toneRgb: string
  ) {
    const a = hands[0]?.[PALM_CENTER];
    const b = hands[1]?.[PALM_CENTER];
    if (!a || !b) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.setLineDash([css(2), css(12)]);
    ctx.lineDashOffset = -now / 40;
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.lineWidth = css(7);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.stroke();
    ctx.lineWidth = css(4);
    ctx.strokeStyle = `rgba(${toneRgb}, 0.9)`;
    ctx.stroke();
    ctx.restore();
  }

  private drawRing(
    ctx: CanvasRenderingContext2D,
    r: number,
    phase: SignPhase,
    handCount: number,
    lockFlash: number | undefined,
    now: number
  ) {
    const x = this.anchorX;
    const y = this.anchorY;
    const stroke = r * 0.2;
    ctx.save();

    // Dark disc so the ring reads on a bright wall too.
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    ctx.arc(x, y, r + stroke, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    ctx.lineWidth = stroke;
    ctx.strokeStyle = `rgba(${WHITE_RGB}, 0.22)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    if (phase === "reading") {
      // Spinner: "I see you, I am reading".
      const turn = ((now % SPIN_MS) / SPIN_MS) * Math.PI * 2;
      ctx.strokeStyle = `rgba(${WHITE_RGB}, 0.95)`;
      ctx.beginPath();
      ctx.arc(x, y, r, startAngle + turn, startAngle + turn + Math.PI * 0.55);
      ctx.stroke();

      // One dot per hand seen.
      const dot = r * 0.16;
      const count = Math.min(2, handCount);
      ctx.fillStyle = `rgba(${WHITE_RGB}, 0.95)`;
      for (let i = 0; i < count; i++) {
        const offset = count === 2 ? (i === 0 ? -1 : 1) * dot * 1.6 : 0;
        ctx.beginPath();
        ctx.arc(x + offset, y, dot, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const rgb = phase === "said" ? SAID_RGB : READING_RGB;
      const progress = phase === "said" ? 1 : Math.max(0.04, this.shownProgress);
      ctx.strokeStyle = `rgba(${rgb}, 1)`;
      ctx.beginPath();
      ctx.arc(x, y, r, startAngle, startAngle + progress * Math.PI * 2);
      ctx.stroke();

      if (phase === "said") {
        // Check mark.
        ctx.lineWidth = stroke * 0.95;
        ctx.strokeStyle = `rgba(${WHITE_RGB}, 1)`;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y + r * 0.02);
        ctx.lineTo(x - r * 0.1, y + r * 0.3);
        ctx.lineTo(x + r * 0.42, y - r * 0.28);
        ctx.stroke();
      } else {
        // A soft pulse in the middle while the sign fills.
        const pulse = 0.5 + 0.5 * Math.sin(now / 160);
        ctx.fillStyle = `rgba(${rgb}, ${0.35 + 0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, r * (0.26 + 0.06 * pulse), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Burst right after the word is said.
    if (lockFlash !== undefined && lockFlash < 1) {
      const t = lockFlash;
      ctx.lineWidth = stroke * (1 - t * 0.6);
      ctx.strokeStyle = `rgba(${SAID_RGB}, ${0.95 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(x, y, r + stroke + t * r * 1.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWord(
    ctx: CanvasRenderingContext2D,
    word: string,
    fontSize: number,
    pillHeight: number,
    r: number,
    rect: Rect,
    edge: number,
    alpha: number,
    said: boolean
  ) {
    this.font ??= displayFont();
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = `800 ${fontSize}px ${this.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    const paddingX = fontSize * 0.75;
    const pillWidth = Math.min(rect.width - edge * 2, ctx.measureText(word).width + paddingX * 2);
    const x = clamp(this.anchorX, rect.x + edge + pillWidth / 2, rect.x + rect.width - edge - pillWidth / 2);
    const pillY = this.anchorY + r * 1.2 + edge * 0.4;

    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    roundRect(ctx, x - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, fontSize * 0.08);
    ctx.strokeStyle = `rgba(${said ? SAID_RGB : READING_RGB}, 0.9)`;
    ctx.stroke();

    ctx.fillStyle = `rgba(${WHITE_RGB}, 1)`;
    ctx.fillText(word, x, pillY + pillHeight / 2, pillWidth - paddingX);
    ctx.restore();
  }
}
