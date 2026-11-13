"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppWindow,
  Camera,
  CloudOff,
  Hand,
  Loader2,
  Play,
  RotateCw,
  Settings,
  SwitchCamera,
  VideoOff,
  X,
} from "lucide-react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { frameFromHands, LiveSignReader } from "@souty/sign-model";
import { Flow, IconTile } from "@/components/Pictograms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusDialog } from "@/components/StatusDialog";
import { gestureToWord, hasWord } from "@/lib/gestureDictionary";
import { HandOverlay, handSides, type HandSides } from "@/lib/handOverlay";
import { subscribeLoadProgress } from "@/lib/assets";
import { getRecognizer, type SignRecognizer } from "@/lib/recognizer";
import { cn } from "@/lib/utils";

const LOCK_FLASH_MS = 500;
/**
 * Caps hand tracking at ~25 fps so low-end phones keep the UI responsive.
 * The sign model samples these frames down to its own 15 fps.
 */
const MIN_FRAME_INTERVAL_MS = 40;

/** Arabic names of each failure, for screen readers only. */
const FAILURE_LABELS = {
  "camera-denied": "الكاميرا مسكّرة: حلّ الإذن متاعها من إعدادات المتصفح",
  unsupported: "المتصفح هذا ما يخدمش بالكاميرا: حلّ التطبيق في متصفح آخر",
  error: "النموذج ما تحمّلش: ثبّت في الإنترنت وعاود",
} as const;

/** Camera state. The model loads separately (see `ModelStatus`). */
type ScannerPhase = "starting" | "ready" | "camera-denied" | "unsupported";
type ModelStatus = "loading" | "ready" | "failed";
type FacingMode = "user" | "environment";

const NO_HANDS: HandSides = { left: false, right: false };

/** The two indicator tokens, left one mirrored so they read as a pair. */
const INDICATOR_SIDES = [
  { side: "left", flip: "-scale-x-100" },
  { side: "right", flip: "" },
] as const;

interface GestureScannerProps {
  className?: string;
  paused: boolean;
  /** A sign was said: its word, and the model label it came from. */
  onLocked: (word: string, label: string) => void;
  /** Tapping the paused camera view resumes. */
  onResume?: () => void;
  /** Fires only when hand presence changes, not every frame. */
  onHandPresenceChange?: (present: boolean) => void;
  /** Fires after the user successfully switches between front and back camera. */
  onCameraSwitched?: () => void;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Keeps a ref pointed at the latest value, for use inside the RAF loop. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Two hand icons in the corner of the camera, lit for each side of the
 * screen where a hand is seen: the user knows at a glance that both hands
 * count, and whether the camera sees them.
 */
function HandsIndicator({ sides, loading }: { sides: HandSides; loading: boolean }) {
  // Lit: solid cyan, like the ring. Off: dashed, still fully visible on any background.
  const lit = "border-solid border-white bg-[rgb(34_211_238)] text-black";
  const unlit = "border-dashed border-white bg-black/70 text-white";
  return (
    <div
      aria-hidden="true"
      dir="ltr"
      className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5"
    >
      {INDICATOR_SIDES.map(({ side, flip }) => {
        const on = sides[side];
        return (
          <span
            key={side}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-150",
              on ? lit : unlit
            )}
          >
            <Hand className={cn("h-5 w-5", flip)} strokeWidth={2.4} />
          </span>
        );
      })}
      {loading && <Loader2 className="h-5 w-5 animate-spin text-white drop-shadow" strokeWidth={2.6} />}
    </div>
  );
}

/**
 * Live camera feed with on-device sign recognition. The camera and the
 * model load in parallel. Both hands are tracked every frame, and the sign
 * model reads the last ~2 s of their shape and movement, so signs can move
 * and use two hands. A word is emitted once the same sign wins several
 * readings in a row; the ring over the hands shows each step of that.
 */
export default function GestureScanner({
  className,
  paused,
  onLocked,
  onResume,
  onHandPresenceChange,
  onCameraSwitched,
}: GestureScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognizerRef = useRef<SignRecognizer | null>(null);
  const readerRef = useRef<LiveSignReader | null>(null);
  const overlayRef = useRef(new HandOverlay());
  const flashRef = useRef<{ label: string; start: number } | null>(null);
  const wasPausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastFrameAtRef = useRef(0);
  const lastHandPresentRef = useRef<boolean | null>(null);
  const sidesKeyRef = useRef("00");
  const mountedRef = useRef(true);
  /** Canvas size in CSS pixels, kept by a ResizeObserver (no layout reads per frame). */
  const canvasCssRef = useRef({ width: 0, height: 0 });
  /** Bumped by every camera request; a stream from an older request is stopped. */
  const cameraRequestRef = useRef(0);
  const switchingRef = useRef(false);

  const [phase, setPhase] = useState<ScannerPhase>("starting");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const modelReady = modelStatus === "ready";
  const [loadPercent, setLoadPercent] = useState(0);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [sides, setSides] = useState<HandSides>(NO_HANDS);

  const pausedRef = useLatest(paused);
  const onLockedRef = useLatest(onLocked);
  const onHandPresenceChangeRef = useLatest(onHandPresenceChange);
  const facingModeRef = useLatest(facingMode);
  const onCameraSwitchedRef = useLatest(onCameraSwitched);

  /** Clears the drawing and the hand indicator (paused, camera switched). */
  const clearOverlay = useCallback(() => {
    overlayRef.current.reset();
    // Re-announce presence on the next frame, so the idle reminder can re-arm.
    lastHandPresentRef.current = null;
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (sidesKeyRef.current !== "00") {
      sidesKeyRef.current = "00";
      setSides(NO_HANDS);
    }
  }, []);

  const handleResult = useCallback(
    (result: HandLandmarkerResult, video: HTMLVideoElement, now: number) => {
      const handPresent = result.landmarks.length > 0;
      if (lastHandPresentRef.current !== handPresent) {
        lastHandPresentRef.current = handPresent;
        onHandPresenceChangeRef.current?.(handPresent);
      }

      const mirrored = facingModeRef.current === "user";
      const nextSides = handSides(result.landmarks, mirrored);
      const sidesKey = `${nextSides.left ? 1 : 0}${nextSides.right ? 1 : 0}`;
      if (sidesKey !== sidesKeyRef.current) {
        sidesKeyRef.current = sidesKey;
        setSides(nextSides);
      }

      const reader = readerRef.current;
      const frame = frameFromHands(
        result.landmarks.map((landmarks, i) => ({
          landmarks,
          handedness: result.handedness[i]?.[0]?.categoryName,
        })),
        video.videoWidth / video.videoHeight
      );
      const state = reader?.push(frame, now);

      if (state?.emitted) {
        flashRef.current = { label: state.emitted, start: now };
        navigator.vibrate?.(60);
        onLockedRef.current(gestureToWord(state.emitted), state.emitted);
      }
      const flash = flashRef.current;
      const flashAge = flash ? (now - flash.start) / LOCK_FLASH_MS : undefined;
      const lockFlash = flashAge !== undefined && flashAge < 1 ? flashAge : undefined;
      if (lockFlash === undefined) flashRef.current = null;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      // Backing store at device resolution, so the ring and word stay sharp.
      const dpr = window.devicePixelRatio || 1;
      const { width: cssWidth, height: cssHeight } = canvasCssRef.current;
      const backingWidth = Math.round((cssWidth || video.videoWidth) * dpr);
      const backingHeight = Math.round((cssHeight || video.videoHeight) * dpr);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      const label = state?.label ?? null;
      overlayRef.current.draw(
        ctx,
        result.landmarks,
        label && state
          ? {
              word: gestureToWord(label),
              progress: state.progress,
              lockFlash: flash?.label === label ? lockFlash : undefined,
            }
          : flash && lockFlash !== undefined
            ? // The reader already moved on; finish the burst on the word just said.
              { word: gestureToWord(flash.label), progress: 1, lockFlash }
            : null,
        mirrored,
        now,
        { width: video.videoWidth, height: video.videoHeight }
      );
    },
    [facingModeRef, onHandPresenceChangeRef, onLockedRef]
  );

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    const now = performance.now();

    // Always reschedule: one bad frame must not kill the loop.
    try {
      // A paused scanner starts from an empty window when it resumes.
      if (pausedRef.current !== wasPausedRef.current) {
        wasPausedRef.current = pausedRef.current;
        readerRef.current?.reset();
        clearOverlay();
      }
      if (
        video &&
        recognizer &&
        video.readyState >= 2 &&
        !pausedRef.current &&
        now - lastFrameAtRef.current >= MIN_FRAME_INTERVAL_MS &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastFrameAtRef.current = now;
        lastVideoTimeRef.current = video.currentTime;
        handleResult(recognizer.landmarker.detectForVideo(video, now), video, now);
      }
    } catch (err) {
      console.error("Sign detection frame failed, continuing", err);
    } finally {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  }, [clearOverlay, handleResult, pausedRef]);

  /** Replaces any running stream; `ideal` constraints degrade gracefully. */
  const startCamera = useCallback(async (mode: FacingMode) => {
    const request = ++cameraRequestRef.current;
    stopStream(streamRef.current);
    streamRef.current = null;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
    // A newer request (or unmount) superseded this one: never leave its camera on.
    if (request !== cameraRequestRef.current || !mountedRef.current) {
      stopStream(stream);
      throw new DOMException("Camera request superseded", "AbortError");
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      await video.play().catch(() => {});
    }
  }, []);

  const connectCamera = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      setPhase("starting");
      try {
        await startCamera(facingModeRef.current);
        if (isCancelled()) {
          stopStream(streamRef.current);
          return;
        }
        setPhase("ready");
        if (rafRef.current === null) rafRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        if (isCancelled() || (err instanceof DOMException && err.name === "AbortError")) return;
        console.error("Camera permission error", err);
        setPhase("camera-denied");
      }
    },
    [detectLoop, facingModeRef, startCamera]
  );

  /** Loads (or re-tries) the model; a failed load is not cached by getRecognizer. */
  const loadModel = useCallback(() => {
    setModelStatus("loading");
    getRecognizer()
      .then((recognizer) => {
        if (!mountedRef.current) return;
        recognizerRef.current = recognizer;
        readerRef.current = new LiveSignReader(recognizer.net, recognizer.meta, hasWord);
        setModelStatus("ready");
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        console.error("Failed to load sign model", err);
        setModelStatus("failed");
      });
  }, []);

  // Mount-only: camera and model start together, neither waits for the other.
  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      return;
    }

    void connectCamera(() => cancelled);
    loadModel();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stopStream(streamRef.current);
      recognizerRef.current = null;
      readerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => subscribeLoadProgress(setLoadPercent), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) canvasCssRef.current = { width: entry.contentRect.width, height: entry.contentRect.height };
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const switchCamera = useCallback(() => {
    if (phase !== "ready" || switchingRef.current) return;
    switchingRef.current = true;
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    startCamera(nextMode)
      .then(() => {
        readerRef.current?.reset(); // the other camera sees hands mirrored
        clearOverlay();
        setFacingMode(nextMode);
        onCameraSwitchedRef.current?.();
      })
      .catch((err) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) console.error("Failed to switch camera", err);
      })
      .finally(() => {
        switchingRef.current = false;
      });
  }, [clearOverlay, facingModeRef, onCameraSwitchedRef, phase, startCamera]);

  // Resume automatically once access is granted from the browser's own UI.
  useEffect(() => {
    if (phase !== "camera-denied" || !navigator.permissions?.query) return;

    let status: PermissionStatus | null = null;
    let cancelled = false;
    const handleChange = () => {
      if (status?.state === "granted") void connectCamera();
    };

    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        status.addEventListener("change", handleChange);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      status?.removeEventListener("change", handleChange);
    };
  }, [phase, connectCamera]);

  const retryButton = (onClick: () => void, label: string) => (
    <Button onClick={onClick} size="icon" className="h-16 w-16" aria-label={label}>
      <RotateCw className="h-7 w-7" strokeWidth={2.4} />
    </Button>
  );

  return (
    <Card className={cn("relative overflow-hidden p-0", className)}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn("absolute inset-0 h-full w-full object-cover", facingMode === "user" && "scale-x-[-1]")}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {phase === "ready" && !paused && <HandsIndicator sides={sides} loading={!modelReady} />}

      {phase === "ready" && (
        <Button
          onClick={switchCamera}
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 z-10 h-12 w-12 bg-background/70"
          aria-label="بدّل الكاميرا"
        >
          <SwitchCamera className="h-6 w-6" strokeWidth={2.2} />
        </Button>
      )}

      {phase === "ready" && modelStatus === "loading" && (
        <div
          role="progressbar"
          aria-label="النموذج قاعد يتحمّل"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={loadPercent}
          className="pointer-events-none absolute inset-x-6 bottom-4 z-10 flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-2"
        >
          <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin text-foreground" />
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" dir="rtl">
            <span
              className="block h-full rounded-full bg-highlight transition-[width] duration-300"
              style={{ width: `${Math.max(4, loadPercent)}%` }}
            />
          </span>
        </div>
      )}

      {phase === "ready" && paused && (
        <div className="absolute inset-0 z-[15] flex items-center justify-center bg-background/65">
          <Button
            onClick={onResume}
            size="icon"
            className="h-24 w-24 animate-pop-in"
            aria-label="كمّل المسح"
          >
            <Play className="h-11 w-11 translate-x-0.5" fill="currentColor" strokeWidth={2} />
          </Button>
        </div>
      )}

      {phase === "starting" && (
        <StatusDialog
          className="z-20"
          ariaLabel="الكاميرا قاعدة تتحلّ"
          icon={
            <span aria-hidden="true" className="relative flex h-20 w-20 items-center justify-center">
              <Loader2 className="absolute inset-0 h-20 w-20 animate-spin text-highlight" strokeWidth={1.5} />
              <Camera className="h-9 w-9 text-foreground" strokeWidth={2.2} />
            </span>
          }
        />
      )}

      {phase === "camera-denied" && (
        <StatusDialog
          className="z-20"
          ariaLabel={FAILURE_LABELS["camera-denied"]}
          icon={<VideoOff aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />}
          action={retryButton(() => void connectCamera(), "عاود جرّب الكاميرا")}
        >
          <Flow
            steps={[
              <IconTile key="settings" icon={Settings} />,
              <IconTile key="camera" icon={Camera} className="bg-mint text-white" />,
            ]}
          />
        </StatusDialog>
      )}

      {phase === "unsupported" && (
        <StatusDialog
          className="z-20"
          ariaLabel={FAILURE_LABELS.unsupported}
          icon={<VideoOff aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />}
        >
          <span aria-hidden="true" className="relative">
            <IconTile icon={AppWindow} />
            <X className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-destructive p-0.5 text-white" strokeWidth={3} />
          </span>
        </StatusDialog>
      )}

      {(phase === "ready" || phase === "starting") && modelStatus === "failed" && (
        <StatusDialog
          className="z-20"
          ariaLabel={FAILURE_LABELS.error}
          icon={<CloudOff aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />}
          action={retryButton(loadModel, "عاود حمّل النموذج")}
        />
      )}
    </Card>
  );
}
