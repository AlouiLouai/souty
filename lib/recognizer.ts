import type { GestureRecognizer } from "@mediapipe/tasks-vision";
import { loadAssets, WASM_DIR } from "@/lib/assets";
import { cacheLoadedResources } from "@/lib/offline";

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
  const [modelAssetBuffer, { FilesetResolver, GestureRecognizer }] = await Promise.all([
    loadAssets(),
    import("@mediapipe/tasks-vision"),
  ]);
  const vision = await FilesetResolver.forVisionTasks(WASM_DIR);
  const build = (delegate: "GPU" | "CPU") =>
    GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetBuffer, delegate },
      runningMode: "VIDEO",
      numHands: MAX_HANDS,
    });
  const recognizer = await build("GPU").catch(() => build("CPU"));
  void cacheLoadedResources();
  return recognizer;
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
