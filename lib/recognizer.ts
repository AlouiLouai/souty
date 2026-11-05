import type { GestureRecognizer } from "@mediapipe/tasks-vision";

const WASM_URL = "/wasm";
const MODEL_URL = "/models/gesture_recognizer.task";
const MAX_HANDS = 2;

/** MediaPipe logs graph setup through console.error; hide that noise only. */
const NOISE =
  /XNNPACK|gl_context|gesture_recognizer_graph|landmark_projection_calculator|inference_feedback_manager|Graph successfully started running/i;

let silenced = false;
let pending: Promise<GestureRecognizer> | null = null;

function silenceMediapipeLogs() {
  if (silenced) return;
  silenced = true;
  for (const method of ["info", "warn", "log", "error"] as const) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (!args.some((a) => typeof a === "string" && NOISE.test(a))) original(...args);
    };
  }
}

async function create(): Promise<GestureRecognizer> {
  silenceMediapipeLogs();
  const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const build = (delegate: "GPU" | "CPU") =>
    GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numHands: MAX_HANDS,
    });
  return build("GPU").catch(() => build("CPU"));
}

/**
 * Shared, lazily created recognizer. Calling it early (e.g. on the landing
 * screen) warms the model so the scanner opens instantly. A failed load is
 * not cached, so the next call retries.
 */
export function getRecognizer(): Promise<GestureRecognizer> {
  pending ??= create().catch((err) => {
    pending = null;
    throw err;
  });
  return pending;
}
