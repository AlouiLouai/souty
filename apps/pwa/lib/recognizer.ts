import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { parseSignModelMeta, SignNet, signNetFromOnnx, type SignModelMeta } from "@souty/sign-model";
import { loadAssets, WASM_DIR } from "@/lib/assets";
import { cacheLoadedResources } from "@/lib/offline";

const MAX_HANDS = 2;

/** MediaPipe logs graph setup through console.error; hide that noise only. */
const NOISE =
  /XNNPACK|gl_context|hand_landmarker_graph|landmark_projection_calculator|inference_feedback_manager|Graph successfully started running/i;

/**
 * Everything the scanner needs: MediaPipe finds both hands in each frame,
 * and SignNet reads a sign from the last 32 frames of them.
 */
export interface SignRecognizer {
  readonly landmarker: HandLandmarker;
  readonly net: SignNet;
  readonly meta: SignModelMeta;
}

let silenced = false;
let pending: Promise<SignRecognizer> | null = null;

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

async function create(): Promise<SignRecognizer> {
  silenceMediapipeLogs();
  const [assets, { FilesetResolver, HandLandmarker }] = await Promise.all([
    loadAssets(),
    import("@mediapipe/tasks-vision"),
  ]);
  // Parse the sign model first: a bad file should fail before MediaPipe starts.
  const meta = parseSignModelMeta(JSON.parse(new TextDecoder().decode(assets.meta)));
  const net = new SignNet(signNetFromOnnx(assets.signNet));
  if (net.numClasses !== meta.labels.length) {
    throw new Error(`sign_model.onnx has ${net.numClasses} outputs, meta lists ${meta.labels.length} labels`);
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_DIR);
  const build = (delegate: "GPU" | "CPU") =>
    HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetBuffer: assets.landmarker, delegate },
      runningMode: "VIDEO",
      numHands: MAX_HANDS,
      // Same thresholds the training landmarks were extracted with.
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  const landmarker = await build("GPU").catch(() => build("CPU"));
  void cacheLoadedResources();
  return { landmarker, net, meta };
}

/**
 * Shared, lazily created recognizer. Calling it early (e.g. on the landing
 * screen) warms the model so the scanner opens instantly. A failed load is
 * not cached, so the next call retries.
 */
export function getRecognizer(): Promise<SignRecognizer> {
  pending ??= create().catch((err) => {
    pending = null;
    throw err;
  });
  return pending;
}
