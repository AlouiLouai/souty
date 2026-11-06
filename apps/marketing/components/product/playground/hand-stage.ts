import {
  HOLD_MS,
  LOCKED_MS,
  POSE_TWEEN_MS,
  REST_POSE,
  clamp01,
  easeInOutCubic,
  mixPose,
  poseForStep,
  withTremor,
  type HandPose,
} from "@/components/demo/hand-model";
import { paintHand } from "./paint-hand";

/** Imperative handle on the animated hand, for the component that owns the canvas. */
export interface HandStage {
  /**
   * Queues one sign. The hand moves into its next pose, the ring fills, then
   * `onLock` fires. Quick calls play one after another.
   */
  sign(onLock: () => void): void;
  /** Drops queued signs and relaxes the hand back to an open palm. */
  reset(): void;
  /** Stops every observer, listener, timer and animation frame. */
  destroy(): void;
}

interface Tween {
  readonly from: HandPose;
  readonly to: HandPose;
  readonly startedAt: number;
  /** Whether the hold-to-confirm ring accompanies this movement. */
  readonly ring: boolean;
}

/**
 * Drives the playground canvas: sizes it for the screen's pixel density,
 * animates only while the stage is on screen and the tab is visible, and
 * falls back to still frames for visitors who prefer reduced motion.
 *
 * Words are timed with timers, not frames, so a sign still locks in when the
 * stage has scrolled out of view. Returns null if the canvas cannot be drawn.
 */
export function createHandStage(stage: HTMLElement, canvas: HTMLCanvasElement): HandStage | null {
  const context = canvas.getContext("2d");
  if (!context) return null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let onScreen = typeof IntersectionObserver === "undefined";
  let frame: number | null = null;
  let timer: number | null = null;

  let settledPose = REST_POSE;
  let tween: Tween | null = null;
  let locked = false;
  let step = 0;
  let busy = false;
  const queue: Array<() => void> = [];

  const poseAt = (now: number): HandPose => {
    if (!tween) return settledPose;
    const progress = clamp01((now - tween.startedAt) / POSE_TWEEN_MS);
    return mixPose(tween.from, tween.to, easeInOutCubic(progress));
  };

  const ringAt = (now: number): number | null => {
    if (!tween?.ring) return null;
    if (locked) return 1;
    return clamp01((now - tween.startedAt - POSE_TWEEN_MS) / HOLD_MS);
  };

  const draw = () => {
    if (width === 0 || height === 0) return;
    const now = performance.now();
    const pose = poseAt(now);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    paintHand(context, {
      width,
      height,
      pose: reducedMotion.matches ? pose : withTremor(pose, now),
      ring: ringAt(now),
    });
  };

  const loop = () => {
    draw();
    frame = requestAnimationFrame(loop);
  };

  /** Runs the frame loop only when someone can see it move; otherwise leaves a still frame. */
  const syncLoop = () => {
    const animate = onScreen && !document.hidden && !reducedMotion.matches;
    if (animate) {
      if (frame === null) frame = requestAnimationFrame(loop);
      return;
    }
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    draw();
  };

  /** Repaints after a state change when no frame loop is running to pick it up. */
  const drawIfStill = () => {
    if (frame === null) draw();
  };

  const measure = () => {
    // clientWidth excludes the stage border, which is exactly the canvas box.
    width = stage.clientWidth;
    height = stage.clientHeight;
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    draw();
  };

  const clearTimer = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const after = (delay: number, callback: () => void) => {
    if (delay <= 0) {
      callback();
      return;
    }
    timer = window.setTimeout(() => {
      timer = null;
      callback();
    }, delay);
  };

  const signNext = () => {
    const onLock = queue.shift();
    if (!onLock) {
      busy = false;
      return;
    }
    busy = true;

    // Reduced motion: the pose applies at once and the word locks immediately.
    const still = reducedMotion.matches;
    const now = performance.now();
    const target = poseForStep(step);
    step += 1;
    tween = { from: poseAt(now), to: target, startedAt: now, ring: true };
    locked = false;

    after(still ? 0 : POSE_TWEEN_MS + HOLD_MS, () => {
      locked = true;
      onLock();
      drawIfStill();
      after(still ? 0 : LOCKED_MS, () => {
        settledPose = target;
        tween = null;
        locked = false;
        drawIfStill();
        signNext();
      });
    });
  };

  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
  resizeObserver?.observe(stage);

  const intersectionObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          onScreen = entries[entries.length - 1]?.isIntersecting ?? false;
          syncLoop();
        });
  intersectionObserver?.observe(stage);

  document.addEventListener("visibilitychange", syncLoop);
  reducedMotion.addEventListener("change", syncLoop);

  measure();
  syncLoop();

  return {
    sign(onLock) {
      queue.push(onLock);
      if (!busy) signNext();
    },

    reset() {
      clearTimer();
      queue.length = 0;
      busy = false;
      locked = false;
      const now = performance.now();
      if (reducedMotion.matches) {
        settledPose = REST_POSE;
        tween = null;
      } else {
        tween = { from: poseAt(now), to: REST_POSE, startedAt: now, ring: false };
      }
      drawIfStill();
    },

    destroy() {
      clearTimer();
      queue.length = 0;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", syncLoop);
      reducedMotion.removeEventListener("change", syncLoop);
    },
  };
}
