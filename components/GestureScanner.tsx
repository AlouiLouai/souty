"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, SwitchCamera, VideoOff } from "lucide-react";
import type {
  GestureRecognizer as GestureRecognizerType,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gestureToWord, IGNORED_LABELS } from "@/lib/gestureDictionary";
import { HAND_CONNECTIONS } from "@/lib/handConnections";

const TASKS_VISION_VERSION = "1.0.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL = "/models/gesture_recognizer.task";
const CONFIDENCE_THRESHOLD = 0.65;
const LOCK_HOLD_MS = 700;
const MAX_HANDS = 2;

type ScannerPhase =
  | "loading-model"
  | "requesting-camera"
  | "camera-denied"
  | "unsupported"
  | "error"
  | "ready";

type FacingMode = "user" | "environment";

interface GestureScannerProps {
  className?: string;
  paused: boolean;
  onLocked: (word: string) => void;
}

interface HandInfo {
  label: string;
  confidence: number;
  progress: number;
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

// Draws a small progress ring + gesture label anchored just above the hand's
// own on-screen position (instead of a fixed spot), so the indicator tracks
// wherever the hand actually is in frame.
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

  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + info.progress * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = `600 ${Math.max(11, r * 0.32)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(info.confidence * 100)}%`, x, y);

  const label = info.label;
  const fontSize = Math.max(12, r * 0.34);
  ctx.font = `600 ${fontSize}px sans-serif`;
  const paddingX = fontSize * 0.7;
  const textWidth = ctx.measureText(label).width;
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize * 1.8;
  const pillY = y + r + 8;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  roundRect(ctx, x - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, x, pillY + pillHeight / 2);
  ctx.restore();
}

// MediaPipe's WASM runtime logs its internal graph setup (delegate choice,
// GL context info, etc.) straight to the console at info/warn level. It's
// expected chatter, not an error — this filters it out so real warnings
// still show up.
const NOISY_LOG_PATTERNS = [
  /XNNPACK/i,
  /gl_context/i,
  /gesture_recognizer_graph/i,
  /landmark_projection_calculator/i,
  /inference_feedback_manager/i,
  /Graph successfully started running/i,
];

function isNoisyMediapipeLog(args: unknown[]) {
  const first = args[0];
  return typeof first === "string" && NOISY_LOG_PATTERNS.some((p) => p.test(first));
}

async function withSuppressedMediapipeLogs<T>(fn: () => Promise<T>): Promise<T> {
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.info = (...args: unknown[]) => {
    if (!isNoisyMediapipeLog(args)) originalInfo(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (!isNoisyMediapipeLog(args)) originalWarn(...args);
  };
  console.log = (...args: unknown[]) => {
    if (!isNoisyMediapipeLog(args)) originalLog(...args);
  };

  try {
    return await fn();
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
    console.log = originalLog;
  }
}

export default function GestureScanner({
  className = "",
  paused,
  onLocked,
}: GestureScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const recognizerRef = useRef<GestureRecognizerType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const candidatesRef = useRef<Map<string, { label: string; start: number }>>(
    new Map()
  );
  const lastLockedRef = useRef<Map<string, string>>(new Map());
  const pausedRef = useRef(paused);
  const onLockedRef = useRef(onLocked);
  const facingModeRef = useRef<FacingMode>("user");

  const [phase, setPhase] = useState<ScannerPhase>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    onLockedRef.current = onLocked;
  }, [onLocked]);

  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);

  // Renders the hand skeleton plus a per-hand progress ring/label directly
  // onto the canvas, anchored to that hand's own landmarks so it tracks the
  // hand wherever it moves (rather than sitting in one fixed screen spot).
  // The front camera's video is mirrored via a CSS scaleX(-1) (standard
  // selfie-view convention), but the canvas itself is NOT — so x
  // coordinates are mirrored manually here to line up with it. The back
  // camera isn't CSS-mirrored (you're filming someone else, not yourself),
  // so landmarks are drawn unmirrored to match.
  const drawOverlay = useCallback(
    (result: GestureRecognizerResult, handInfos: Array<HandInfo | null>) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!result.landmarks?.length) return;

      const mirroredX =
        facingModeRef.current === "user"
          ? (x: number) => canvas.width - x * canvas.width
          : (x: number) => x * canvas.width;

      result.landmarks.forEach((landmarks, i) => {
        ctx.lineWidth = Math.max(2, canvas.width * 0.0035);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        for (const [a, b] of HAND_CONNECTIONS) {
          const p1 = landmarks[a];
          const p2 = landmarks[b];
          if (!p1 || !p2) continue;
          ctx.moveTo(mirroredX(p1.x), p1.y * canvas.height);
          ctx.lineTo(mirroredX(p2.x), p2.y * canvas.height);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        for (const point of landmarks) {
          const px = mirroredX(point.x);
          const py = point.y * canvas.height;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2.5, canvas.width * 0.006), 0, Math.PI * 2);
          ctx.fill();
        }

        const info = handInfos[i];
        if (!info) return;
        const anchorX = (minX + maxX) / 2;
        const anchorY = Math.max(minY - canvas.height * 0.08, canvas.height * 0.08);
        drawHandLabel(ctx, anchorX, anchorY, info, canvas.width);
      });
    },
    []
  );

  const handleResult = useCallback(
    (result: GestureRecognizerResult) => {
      const now = performance.now();
      const seenKeys = new Set<string>();
      const handCount = result.gestures?.length ?? 0;
      const handInfos: Array<HandInfo | null> = new Array(handCount).fill(null);

      for (let i = 0; i < handCount; i++) {
        const top = result.gestures[i]?.[0];
        if (
          !top ||
          IGNORED_LABELS.has(top.categoryName) ||
          top.score < CONFIDENCE_THRESHOLD
        ) {
          continue;
        }

        const handKey = result.handedness?.[i]?.[0]?.categoryName ?? `hand-${i}`;
        seenKeys.add(handKey);

        const existing = candidatesRef.current.get(handKey);
        const start =
          existing?.label === top.categoryName ? existing.start : now;
        candidatesRef.current.set(handKey, { label: top.categoryName, start });

        const progress = Math.min((now - start) / LOCK_HOLD_MS, 1);
        handInfos[i] = {
          label: gestureToWord(top.categoryName),
          confidence: top.score,
          progress,
        };

        if (
          progress >= 1 &&
          lastLockedRef.current.get(handKey) !== top.categoryName
        ) {
          lastLockedRef.current.set(handKey, top.categoryName);
          onLockedRef.current(gestureToWord(top.categoryName));
        }
      }

      for (const key of candidatesRef.current.keys()) {
        if (!seenKeys.has(key)) {
          candidatesRef.current.delete(key);
          lastLockedRef.current.delete(key);
        }
      }

      drawOverlay(result, handInfos);
    },
    [drawOverlay]
  );

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;

    if (!video || !recognizer || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    if (pausedRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = recognizer.recognizeForVideo(video, performance.now());
      handleResult(result);
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [handleResult]);

  // Requests a camera stream for the given facing mode and wires it up to
  // the <video> element. Stops whatever stream is currently running first,
  // so this is also what powers switching between front/back cameras.
  // `ideal` (not an exact/required constraint) so it degrades gracefully
  // on devices that don't have a matching camera (e.g. a laptop webcam
  // asked for "environment") instead of hard-failing.
  const startCamera = useCallback(async (mode: FacingMode) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === "undefined") return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase("unsupported");
        setErrorMessage(
          "هذا المتصفح لا يدعم الوصول إلى الكاميرا."
        );
        return;
      }

      setPhase("loading-model");
      try {
        const { FilesetResolver, GestureRecognizer } = await import(
          "@mediapipe/tasks-vision"
        );

        const recognizer = await withSuppressedMediapipeLogs(async () => {
          const vision = await FilesetResolver.forVisionTasks(WASM_URL);
          try {
            return await GestureRecognizer.createFromOptions(vision, {
              baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
              runningMode: "VIDEO",
              numHands: MAX_HANDS,
            });
          } catch {
            return await GestureRecognizer.createFromOptions(vision, {
              baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
              runningMode: "VIDEO",
              numHands: MAX_HANDS,
            });
          }
        });

        if (cancelled) {
          recognizer.close();
          return;
        }
        recognizerRef.current = recognizer;
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load gesture model", err);
        setPhase("error");
        setErrorMessage(
          "تعذّر تحميل نموذج التعرف على الإشارات. تأكد من وجود الملف " +
            "public/models/gesture_recognizer.task (راجع public/models/README.md)."
        );
        return;
      }

      setPhase("requesting-camera");
      try {
        await startCamera(facingModeRef.current);
        if (cancelled) {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          return;
        }
        setPhase("ready");
        rafRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        if (cancelled) return;
        console.error("Camera permission error", err);
        setPhase("camera-denied");
        setErrorMessage(
          "تم رفض الوصول إلى الكاميرا أو أنه غير متاح. فعّل إذن الكاميرا " +
            "من إعدادات المتصفح — سيستأنف الماسح تلقائيًا فور منح الإذن."
        );
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryCamera = useCallback(() => {
    setErrorMessage(null);
    setPhase("requesting-camera");
    startCamera(facingModeRef.current)
      .then(() => {
        setPhase("ready");
        rafRef.current = requestAnimationFrame(detectLoop);
      })
      .catch((err) => {
        console.error(err);
        setPhase("camera-denied");
        setErrorMessage(
          "تم رفض الوصول إلى الكاميرا أو أنه غير متاح. فعّل إذن الكاميرا " +
            "من إعدادات المتصفح — سيستأنف الماسح تلقائيًا فور منح الإذن."
        );
      });
  }, [detectLoop, startCamera]);

  const switchCamera = useCallback(() => {
    if (phase !== "ready") return;
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    startCamera(nextMode)
      .then(() => setFacingMode(nextMode))
      .catch((err) => {
        console.error("Failed to switch camera", err);
      });
  }, [phase, startCamera]);

  // If the browser exposes the Permissions API, watch for the user flipping
  // camera access on from their browser's own UI (address-bar padlock,
  // site settings) after having blocked it, and resume without requiring
  // a manual retry tap.
  useEffect(() => {
    if (phase !== "camera-denied") return;
    if (!navigator.permissions?.query) return;

    let status: PermissionStatus | null = null;
    let cancelled = false;

    const handleChange = () => {
      if (status?.state === "granted") retryCamera();
    };

    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        status.addEventListener("change", handleChange);
      })
      .catch(() => {
        // Permissions API doesn't support querying "camera" in this browser.
      });

    return () => {
      cancelled = true;
      status?.removeEventListener("change", handleChange);
    };
  }, [phase, retryCamera]);

  const showOverlayMessage = phase !== "ready";

  return (
    <Card
      ref={containerRef}
      className={`relative overflow-hidden p-0 ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${
          facingMode === "user" ? "scale-x-[-1]" : ""
        }`}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {phase === "ready" && (
        <Button
          onClick={switchCamera}
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 z-10 bg-background/60 backdrop-blur-sm"
          aria-label="تبديل الكاميرا"
        >
          <SwitchCamera className="h-4 w-4" />
        </Button>
      )}

      {showOverlayMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center">
            {phase === "loading-model" && (
              <>
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-foreground" />
                <p className="text-sm font-medium text-foreground">
                  جارٍ تحميل نموذج الإشارات…
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  قد يستغرق التحميل الأول بضع ثوانٍ.
                </p>
              </>
            )}
            {phase === "requesting-camera" && (
              <>
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-foreground" />
                <p className="text-sm font-medium text-foreground">
                  جارٍ طلب إذن الكاميرا…
                </p>
              </>
            )}
            {(phase === "camera-denied" ||
              phase === "error" ||
              phase === "unsupported") && (
              <>
                <VideoOff className="mx-auto mb-3 h-8 w-8 text-destructive" />
                <p className="text-sm font-semibold text-foreground">
                  {phase === "camera-denied"
                    ? "الكاميرا محظورة"
                    : phase === "unsupported"
                    ? "المتصفح غير مدعوم"
                    : "فشل بدء التشغيل"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {errorMessage}
                </p>
                {phase === "camera-denied" && (
                  <Button onClick={retryCamera} size="sm" className="mt-4">
                    إعادة محاولة الكاميرا
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
