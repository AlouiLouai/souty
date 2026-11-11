"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, RefreshCw, VideoOff } from "lucide-react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { frameFromHands, LiveSignReader } from "@souty/sign-model";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusDialog } from "@/components/StatusDialog";
import { gestureToWord, hasWord } from "@/lib/gestureDictionary";
import { drawHandOverlay } from "@/lib/handOverlay";
import { subscribeLoadProgress } from "@/lib/assets";
import { getRecognizer, type SignRecognizer } from "@/lib/recognizer";
import { cn } from "@/lib/utils";

const LOCK_FLASH_MS = 400;
/**
 * Caps hand tracking at ~25 fps so low-end phones keep the UI responsive.
 * The sign model samples these frames down to its own 15 fps.
 */
const MIN_FRAME_INTERVAL_MS = 40;

const FAILURE_TITLES = {
  "camera-denied": "الكاميرا محظورة",
  unsupported: "المتصفح غير مدعوم",
  error: "فشل بدء التشغيل",
} as const;

type FailurePhase = keyof typeof FAILURE_TITLES;
type ScannerPhase = "starting" | "ready" | FailurePhase;
type FacingMode = "user" | "environment";

const FAILURE_MESSAGES: Record<FailurePhase, string> = {
  "camera-denied":
    "تم رفض الوصول إلى الكاميرا أو أنه غير متاح. فعّل إذن الكاميرا من إعدادات المتصفح — سيستأنف الماسح تلقائيًا فور منح الإذن.",
  unsupported: "هذا المتصفح لا يدعم الوصول إلى الكاميرا.",
  error: "تعذّر تحميل نموذج التعرف على الإشارات. تحقق من الاتصال وأعد المحاولة.",
};

interface GestureScannerProps {
  className?: string;
  paused: boolean;
  onLocked: (word: string) => void;
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
 * Live camera feed with on-device sign recognition. The camera and the
 * model load in parallel. Both hands are tracked every frame, and the sign
 * model reads the last ~2 s of their shape and movement, so signs can move
 * and use two hands. A word is emitted once the same sign wins several
 * readings in a row.
 */
export default function GestureScanner({
  className,
  paused,
  onLocked,
  onHandPresenceChange,
  onCameraSwitched,
}: GestureScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognizerRef = useRef<SignRecognizer | null>(null);
  const readerRef = useRef<LiveSignReader | null>(null);
  const flashRef = useRef<{ label: string; start: number } | null>(null);
  const wasPausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastFrameAtRef = useRef(0);
  const lastHandPresentRef = useRef<boolean | null>(null);

  const [phase, setPhase] = useState<ScannerPhase>("starting");
  const [modelReady, setModelReady] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");

  const pausedRef = useLatest(paused);
  const onLockedRef = useLatest(onLocked);
  const onHandPresenceChangeRef = useLatest(onHandPresenceChange);
  const facingModeRef = useLatest(facingMode);
  const onCameraSwitchedRef = useLatest(onCameraSwitched);

  const handleResult = useCallback(
    (result: HandLandmarkerResult, video: HTMLVideoElement, now: number) => {
      const handPresent = result.landmarks.length > 0;
      if (lastHandPresentRef.current !== handPresent) {
        lastHandPresentRef.current = handPresent;
        onHandPresenceChangeRef.current?.(handPresent);
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
        navigator.vibrate?.(50);
        onLockedRef.current(gestureToWord(state.emitted));
      }
      const flash = flashRef.current;
      const flashAge = flash ? (now - flash.start) / LOCK_FLASH_MS : undefined;
      if (flashAge !== undefined && flashAge >= 1) flashRef.current = null;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const label = state?.label ?? null;
      drawHandOverlay(
        ctx,
        result.landmarks,
        label && state
          ? {
              label: gestureToWord(label),
              confidence: state.confidence,
              progress: state.progress,
              lockFlash: flash?.label === label && flashAge !== undefined && flashAge < 1 ? flashAge : undefined,
            }
          : null,
        facingModeRef.current === "user"
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
  }, [handleResult, pausedRef]);

  /** Replaces any running stream; `ideal` constraints degrade gracefully. */
  const startCamera = useCallback(async (mode: FacingMode) => {
    stopStream(streamRef.current);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
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
        if (isCancelled()) return;
        console.error("Camera permission error", err);
        setPhase("camera-denied");
      }
    },
    [detectLoop, facingModeRef, startCamera]
  );

  // Mount-only: camera and model start together, neither waits for the other.
  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      return;
    }

    void connectCamera(() => cancelled);
    getRecognizer()
      .then((recognizer) => {
        if (cancelled) return;
        recognizerRef.current = recognizer;
        readerRef.current = new LiveSignReader(recognizer.net, recognizer.meta, hasWord);
        setModelReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load sign model", err);
        setPhase("error");
      });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stopStream(streamRef.current);
      recognizerRef.current = null;
      readerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => subscribeLoadProgress(setLoadPercent), []);

  const switchCamera = useCallback(() => {
    if (phase !== "ready") return;
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    startCamera(nextMode)
      .then(() => {
        readerRef.current?.reset(); // the other camera sees hands mirrored
        setFacingMode(nextMode);
        onCameraSwitchedRef.current?.();
      })
      .catch((err) => console.error("Failed to switch camera", err));
  }, [facingModeRef, onCameraSwitchedRef, phase, startCamera]);

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

  return (
    <Card className={cn("relative overflow-hidden p-0", className)}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          facingMode === "user" && "scale-x-[-1]"
        )}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

      {phase === "ready" && (
        <Button
          onClick={switchCamera}
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 z-10 bg-background/60"
          aria-label="تبديل الكاميرا"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      {phase === "ready" && !modelReady && (
        <div
          dir="rtl"
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto flex w-fit items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جارٍ تحميل نموذج الإشارات… {loadPercent}%
        </div>
      )}

      {phase === "ready" && paused && (
        <div className="pointer-events-none absolute inset-0 z-[15] flex flex-col items-center justify-center gap-3 bg-background/65">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-card/90">
            <Pause className="h-7 w-7 text-foreground" />
          </div>
          <p dir="rtl" className="font-display text-base font-bold text-foreground">
            المسح متوقف
          </p>
        </div>
      )}

      {phase === "starting" && (
        <StatusDialog
          className="z-20"
          icon={<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-foreground" />}
          titleClassName="text-sm font-medium"
          title="جارٍ تشغيل الكاميرا…"
        />
      )}

      {phase in FAILURE_TITLES && (
        <StatusDialog
          className="z-20"
          icon={<VideoOff className="mx-auto mb-3 h-8 w-8 text-destructive" />}
          titleClassName="font-display text-sm font-bold"
          title={FAILURE_TITLES[phase as FailurePhase]}
          message={FAILURE_MESSAGES[phase as FailurePhase]}
          action={
            phase === "camera-denied" && (
              <Button onClick={() => void connectCamera()} size="sm">
                إعادة محاولة الكاميرا
              </Button>
            )
          }
        />
      )}
    </Card>
  );
}
