import { NUM_FEATURES } from "./features";

/** `sign_model.meta.json`, as written by the training notebook (step 10). */
export interface SignModelMeta {
  readonly format: "souty-sign-seq/1";
  /** Class names in output order. */
  readonly labels: readonly string[];
  /** The "no sign" class. */
  readonly negative_label: string;
  readonly window_frames: number;
  readonly fps: number;
  readonly num_features: number;
  readonly decoding: {
    /** Run the model every this many sampled frames. */
    readonly stride_frames: number;
    readonly min_confidence: number;
    /** Wins in a row before a sign is emitted. */
    readonly consecutive_hits: number;
  };
}

const FORMAT = "souty-sign-seq/1";

/** Validates the parts of the meta file the app depends on. */
export function parseSignModelMeta(json: unknown): SignModelMeta {
  const m = json as Partial<SignModelMeta> | null;
  const bad = (why: string): never => {
    throw new Error(`sign_model.meta.json: ${why}`);
  };
  if (!m || typeof m !== "object") bad("not an object");
  if (m!.format !== FORMAT) bad(`format ${String(m!.format)}, this app reads ${FORMAT}`);
  if (m!.num_features !== NUM_FEATURES) bad(`num_features ${m!.num_features}, this app computes ${NUM_FEATURES}`);
  const labels = m!.labels;
  if (!Array.isArray(labels) || labels.length < 2 || labels.some((l) => typeof l !== "string")) bad("labels");
  if (!labels!.includes(m!.negative_label ?? "")) bad("negative_label is not a label");
  const positive = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v > 0;
  if (!positive(m!.window_frames) || !positive(m!.fps)) bad("window_frames / fps");
  const d = m!.decoding;
  if (!d || !positive(d.stride_frames) || !positive(d.consecutive_hits) || !(d.min_confidence >= 0 && d.min_confidence <= 1)) {
    bad("decoding");
  }
  return m as SignModelMeta;
}
