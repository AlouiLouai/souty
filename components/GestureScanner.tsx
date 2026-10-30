"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, RefreshCw, VideoOff } from "lucide-react";
import type {
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusDialog } from "@/components/StatusDialog";
import { gestureToWord, IGNORED_LABELS } from "@/lib/gestureDictionary";
import { drawHandOverlay, type HandInfo } from "@/lib/handOverlay";
import { silenceMediapipeLogs } from "@/lib/mediapipeConsole";
import { cn } from "@/lib/utils";

// Self-hosted (copied from node_modules/@mediapipe/tasks-vision/wasm) rather
// than CDN-fetched: required for real offline support and removes a
// third-party supply-chain dependency.
const WASM_URL = "/wasm";
const MODEL_URL = "/models/gesture_recognizer.task";
const CONFIDENCE_THRESHOLD = 0.65;
const LOCK_HOLD_MS = 700;
const LOCK_FLASH_MS = 400;
const MAX_HANDS = 2;

const CAMERA_DENIED_MESSAGE =
  "تم رفض الوصول إلى الكاميرا أو أنه غير متاح. فعّل إذن الكاميرا " +
  "من إعدادات المتصفح — سيستأنف الماسح تلقائيًا فور منح الإذن.";

const FAILURE_TITLES = {
  "camera-denied": "الكاميرا محظورة",
  unsupported: "المتصفح غير مدعوم",
  error: "فشل بدء التشغيل",
} as const;

type FailurePhase = keyof typeof FAILURE_TITLES;
type ScannerPhase = "loading-model" | "requesting-camera" | "ready" | FailurePhase;
type FacingMode = "user" | "environment";

interface GestureScannerProps {
  className?: string;
  paused: boolean;
  onLocked: (word: string) => void;
  /** Called only when hand presence in frame changes, not every frame. */
  onHandPresenceChange?: (present: boolean) => void;
}

interface HandTracking {
  candidate: { label: string; start: number };
  lastLocked?: string;
  flashStart?: number;
}

async function createRecognizer(): Promise<GestureRecognizer> {
  const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const create = (delegate: "GPU" | "CPU") =>
    GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numHands: MAX_HANDS,
    });
  // GPU is much faster but unavailable on some devices/browsers.
  return create("GPU").catch(() => create("CPU"));
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

export default function GestureScanner({
  className,
  paused,
  onLocked,
  onHandPresenceChange,
}: GestureScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const handsRef = useRef<Map<string, HandTracking>>(new Map());
  const lastHandPresentRef = useRef<boolean | null>(null);

  const [phase, setPhase] = useState<ScannerPhase>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");

  const pausedRef = useLatest(paused);
  const onLockedRef = useLatest(onLocked);
  const onHandPresenceChangeRef = useLatest(onHandPresenceChange);
  const facingModeRef = useLatest(facingMode);

  const fail = useCallback((nextPhase: FailurePhase, message: string) => {
    setPhase(nextPhase);
    setErrorMessage(message);
  }, []);

  const handleResult = useCallback(
    (result: GestureRecognizerResult) => {
      const now = performance.now();
      const hands = handsRef.current;
      const seenKeys = new Set<string>();
      const handInfos: Array<HandInfo | null> = result.gestures.map(() => null);

      const handPresent = result.landmarks.length > 0;
      if (lastHandPresentRef.current !== handPresent) {
        lastHandPresentRef.current = handPresent;
        onHandPresenceChangeRef.current?.(handPresent);
      }

      result.gestures.forEach((gestures, i) => {
        const top = gestures[0];
        if (!top || IGNORED_LABELS.has(top.categoryName) || top.score < CONFIDENCE_THRESHOLD) {
          return;
        }

        const label = top.categoryName;
        const handKey = result.handedness[i]?.[0]?.categoryName ?? `hand-${i}`;
        seenKeys.add(handKey);

        const tracking = hands.get(handKey);
        const start = tracking?.candidate.label === label ? tracking.candidate.start : now;
        const next: HandTracking = { ...tracking, candidate: { label, start } };
        if (next.flashStart !== undefined && now - next.flashStart > LOCK_FLASH_MS) {
          next.flashStart = undefined;
        }

        const progress = Math.min((now - start) / LOCK_HOLD_MS, 1);
        if (progress >= 1 && next.lastLocked !== label) {
          next.lastLocked = label;
          next.flashStart = now;
          // Tactile confirmation where supported (no-op on iOS Safari).
          navigator.vibrate?.(50);
          onLockedRef.current(gestureToWord(label));
        }
        hands.set(handKey, next);

        handInfos[i] = {
          label: gestureToWord(label),
          confidence: top.score,
          progress,
          lockFlash:
            next.flashStart !== undefined ? (now - next.flashStart) / LOCK_FLASH_MS : undefined,
        };
      });

      // A hand that leaves frame (or drops below threshold) resets, so the
      // same sign can be locked in again when it comes back.
      for (const key of hands.keys()) {
        if (!seenKeys.has(key)) hands.delete(key);
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !video || !ctx) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      drawHandOverlay(ctx, result.landmarks, handInfos, facingModeRef.current === "user");
    },
    [facingModeRef, onHandPresenceChangeRef, onLockedRef]
  );

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;

    // Always reschedule: one bad frame (transient WASM error) must not
    // silently kill the loop.
    try {
      if (!video || !recognizer || video.readyState < 2 || pausedRef.current) return;
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        handleResult(recognizer.recognizeForVideo(video, performance.now()));
      }
    } catch (err) {
      console.error("Gesture detection frame failed, continuing", err);
    } finally {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
  }, [handleResult, pausedRef]);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(detectLoop);
  }, [detectLoop]);

  // Replaces any running stream. `ideal` (not exact) so devices without a
  // matching camera degrade gracefully instead of failing.
  const startCamera = useCallback(async (mode: FacingMode) => {
    stopStream(streamRef.current);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
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

  /** Requests the camera and starts detection; returns false if unmounted meanwhile. */
  const connectCamera = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      setErrorMessage(null);
      setPhase("requesting-camera");
      try {
        await startCamera(facingModeRef.current);
        if (isCancelled()) {
          stopStream(streamRef.current);
          return;
        }
        setPhase("ready");
        startLoop();
      } catch (err) {
        if (isCancelled()) return;
        console.error("Camera permission error", err);
        fail("camera-denied", CAMERA_DENIED_MESSAGE);
      }
    },
    [facingModeRef, fail, startCamera, startLoop]
  );

  // Mount-only lifecycle: load model, then camera. Later camera retries go
  // through connectCamera directly.
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    const restoreConsole = silenceMediapipeLogs();

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        fail("unsupported", "هذا المتصفح لا يدعم الوصول إلى الكاميرا.");
        return;
      }

      try {
        const recognizer = await createRecognizer();
        if (cancelled) {
          recognizer.close();
          return;
        }
        recognizerRef.current = recognizer;
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load gesture model", err);
        fail(
          "error",
          "تعذّر تحميل نموذج التعرف على الإشارات. تأكد من وجود الملف " +
            "public/models/gesture_recognizer.task (راجع public/models/README.md)."
        );
        return;
      }

      await connectCamera(isCancelled);
    })();

    return () => {
      cancelled = true;
      restoreConsole();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      stopStream(streamRef.current);
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = useCallback(() => {
    if (phase !== "ready") return;
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    startCamera(nextMode)
      .then(() => setFacingMode(nextMode))
      .catch((err) => console.error("Failed to switch camera", err));
  }, [facingModeRef, phase, startCamera]);

  // Resume automatically when the user grants camera access from the
  // browser's own UI (site settings) after having blocked it.
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
      .catch(() => {
        // This browser can't query the "camera" permission.
      });

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
          className="absolute right-3 top-3 z-10 bg-background/60 backdrop-blur-sm"
          aria-label="تبديل الكاميرا"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      {/* Paused state shown where the user is looking. pointer-events-none
          keeps the flip-camera button tappable. */}
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

      {(phase === "loading-model" || phase === "requesting-camera") && (
        <StatusDialog
          className="z-20"
          icon={<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-foreground" />}
          titleClassName="text-sm font-medium"
          title={phase === "loading-model" ? "جارٍ تحميل نموذج الإشارات…" : "جارٍ طلب إذن الكاميرا…"}
          message={phase === "loading-model" ? "قد يستغرق التحميل الأول بضع ثوانٍ." : undefined}
        />
      )}

      {phase in FAILURE_TITLES && (
        <StatusDialog
          className="z-20"
          icon={<VideoOff className="mx-auto mb-3 h-8 w-8 text-destructive" />}
          titleClassName="font-display text-sm font-bold"
          title={FAILURE_TITLES[phase as FailurePhase]}
          message={errorMessage}
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
