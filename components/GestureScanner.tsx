"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GestureRecognizer as GestureRecognizerType,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { gestureToWord, IGNORED_LABELS } from "@/lib/gestureDictionary";
import { HAND_CONNECTIONS } from "@/lib/handConnections";
import type { RecognizedGesture, ScannerPhase } from "@/lib/types";

const TASKS_VISION_VERSION = "1.0.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL = "/models/gesture_recognizer.task";
const CONFIDENCE_THRESHOLD = 0.65;
const LOCK_HOLD_MS = 700;
const MAX_HANDS = 2;

interface GestureScannerProps {
  className?: string;
  paused: boolean;
  onLocked: (gesture: RecognizedGesture) => void;
}

interface LiveHand {
  key: string;
  label: string;
  confidence: number;
  progress: number;
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

  const [phase, setPhase] = useState<ScannerPhase>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveHands, setLiveHands] = useState<LiveHand[]>([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    onLockedRef.current = onLocked;
  }, [onLocked]);

  const drawLandmarks = useCallback((result: GestureRecognizerResult) => {
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

    for (const landmarks of result.landmarks) {
      ctx.lineWidth = Math.max(2, canvas.width * 0.0035);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      for (const point of landmarks) {
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          Math.max(2.5, canvas.width * 0.006),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }, []);

  const handleResult = useCallback(
    (result: GestureRecognizerResult) => {
      drawLandmarks(result);

      const now = performance.now();
      const seenKeys = new Set<string>();
      const nextLiveHands: LiveHand[] = [];
      const handCount = result.gestures?.length ?? 0;

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
        nextLiveHands.push({
          key: handKey,
          label: top.categoryName,
          confidence: top.score,
          progress,
        });

        if (
          progress >= 1 &&
          lastLockedRef.current.get(handKey) !== top.categoryName
        ) {
          lastLockedRef.current.set(handKey, top.categoryName);
          onLockedRef.current({
            id: `${Date.now()}-${handKey}-${top.categoryName}`,
            label: top.categoryName,
            word: gestureToWord(top.categoryName),
            confidence: top.score,
            timestamp: Date.now(),
          });
        }
      }

      for (const key of candidatesRef.current.keys()) {
        if (!seenKeys.has(key)) {
          candidatesRef.current.delete(key);
          lastLockedRef.current.delete(key);
        }
      }

      setLiveHands(nextLiveHands);
    },
    [drawLandmarks]
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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === "undefined") return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase("unsupported");
        setErrorMessage(
          "This browser does not support camera access (getUserMedia)."
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
          "Could not load the gesture recognition model. Make sure " +
            "public/models/gesture_recognizer.task exists (see public/models/README.md)."
        );
        return;
      }

      setPhase("requesting-camera");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }

        setPhase("ready");
        rafRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        if (cancelled) return;
        console.error("Camera permission error", err);
        setPhase("camera-denied");
        setErrorMessage(
          "Camera access was denied or unavailable. Allow camera " +
            "permissions in your browser settings — the scanner will " +
            "resume automatically once access is granted."
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
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
        setPhase("ready");
        rafRef.current = requestAnimationFrame(detectLoop);
      })
      .catch((err) => {
        console.error(err);
        setPhase("camera-denied");
        setErrorMessage(
          "Camera access was denied or unavailable. Allow camera " +
            "permissions in your browser settings — the scanner will " +
            "resume automatically once access is granted."
        );
      });
  }, [detectLoop]);

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
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
      />

      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15" />

      {liveHands.length > 0 && phase === "ready" && (
        <div className="absolute inset-x-0 top-6 z-10 flex items-start justify-center gap-6">
          {liveHands.map((hand) => (
            <div key={hand.key} className="relative flex flex-col items-center gap-2">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - hand.progress)}
                    className="transition-[stroke-dashoffset] duration-75 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/80">
                  {Math.round(hand.confidence * 100)}%
                </div>
              </div>
              <span className="glass-pill rounded-full px-3 py-1 text-xs font-medium text-white">
                {hand.label.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {showOverlayMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="glass-panel glass-highlight w-full max-w-xs rounded-2xl p-6 text-center">
            {phase === "loading-model" && (
              <>
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-sm font-medium text-white/90">
                  Loading gesture model…
                </p>
                <p className="mt-1 text-xs text-white/50">
                  First load may take a few seconds.
                </p>
              </>
            )}
            {phase === "requesting-camera" && (
              <>
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-sm font-medium text-white/90">
                  Requesting camera access…
                </p>
              </>
            )}
            {(phase === "camera-denied" ||
              phase === "error" ||
              phase === "unsupported") && (
              <>
                <p className="text-sm font-semibold text-white">
                  {phase === "camera-denied"
                    ? "Camera blocked"
                    : phase === "unsupported"
                    ? "Unsupported browser"
                    : "Failed to start"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/60">
                  {errorMessage}
                </p>
                {phase === "camera-denied" && (
                  <button
                    onClick={retryCamera}
                    className="glass-pill mt-4 rounded-full px-4 py-2 text-xs font-semibold text-white active:scale-95"
                  >
                    Retry camera
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
