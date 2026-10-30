// MediaPipe's WASM runtime logs its internal graph setup (delegate choice,
// GL context info, ...) straight to the console - some of it via
// console.error despite being labelled "INFO:". This filters that chatter
// so real warnings still stand out.
const NOISY_LOG_PATTERNS = [
  /XNNPACK/i,
  /gl_context/i,
  /gesture_recognizer_graph/i,
  /landmark_projection_calculator/i,
  /inference_feedback_manager/i,
  /Graph successfully started running/i,
];

const PATCHED_METHODS = ["info", "warn", "log", "error"] as const;

function isNoisy(args: unknown[]) {
  // Every argument is checked: some lines arrive as ("INFO:", "...XNNPACK...").
  return args.some(
    (arg) => typeof arg === "string" && NOISY_LOG_PATTERNS.some((p) => p.test(arg))
  );
}

/**
 * Filters MediaPipe log noise until the returned restore function is
 * called. Must cover the scanner's whole lifetime, not just model load:
 * the XNNPACK log fires on the first inference.
 */
export function silenceMediapipeLogs(): () => void {
  const originals = PATCHED_METHODS.map((method) => [method, console[method]] as const);

  for (const [method, original] of originals) {
    console[method] = (...args: unknown[]) => {
      if (!isNoisy(args)) original(...args);
    };
  }

  return () => {
    for (const [method, original] of originals) console[method] = original;
  };
}
