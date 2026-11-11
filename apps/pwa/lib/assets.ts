/**
 * Heavy-asset loading for the recognizer: parallel download, a persistent
 * Cache API copy (survives browser HTTP-cache eviction and works offline),
 * and aggregated progress.
 */

/** Bump when any file in `public/models/` changes; busts every cache. */
export const MODEL_VERSION = 2;
const versioned = (path: string) => `${path}?v=${MODEL_VERSION}`;

/**
 * The model files, all exported together by `training/kaggle_pipeline.ipynb`.
 * `bytes` are decoded sizes, used only to compute progress (transfer is
 * brotli-compressed).
 */
export const MODEL_FILES = {
  /** MediaPipe hand landmarks, two hands. The exact file the training data was extracted with. */
  landmarker: { url: versioned("/models/hand_landmarker.task"), bytes: 7_819_105 },
  /** The sign classifier over 32-frame windows, run by `@souty/sign-model`. */
  signNet: { url: versioned("/models/sign_model.onnx"), bytes: 774_948 },
  /** Labels, window, and decoding thresholds. */
  meta: { url: versioned("/models/sign_model.meta.json"), bytes: 3_543 },
} as const;
type ModelFile = keyof typeof MODEL_FILES;
type ModelAssets = Record<ModelFile, Uint8Array>;

export const WASM_DIR = "/wasm";

/** The MediaPipe runtime MediaPipe itself loads from `WASM_DIR`; cached ahead so it works offline. */
export const WASM_FILES = [
  { url: `${WASM_DIR}/vision_wasm_internal.js`, bytes: 323_377 },
  { url: `${WASM_DIR}/vision_wasm_internal.wasm`, bytes: 11_756_954 },
] as const;

const TOTAL_BYTES = [...Object.values(MODEL_FILES), ...WASM_FILES].reduce((sum, f) => sum + f.bytes, 0);

/** Never purged by service-worker version bumps; the URL query/path is the version. */
export const ASSET_CACHE = "souty-assets-v1";

type ProgressListener = (percent: number) => void;

const listeners = new Set<ProgressListener>();
let loaded = 0;
let percent = 0;

function addProgress(bytes: number) {
  loaded += bytes;
  const next = Math.min(99, Math.floor((loaded / TOTAL_BYTES) * 100));
  if (next === percent) return;
  percent = next;
  listeners.forEach((fn) => fn(percent));
}

function finishProgress() {
  percent = 100;
  listeners.forEach((fn) => fn(percent));
}

/** Subscribes to 0–100 load progress; the current value is delivered immediately. */
export function subscribeLoadProgress(fn: ProgressListener): () => void {
  listeners.add(fn);
  fn(percent);
  return () => void listeners.delete(fn);
}

async function openCache(): Promise<Cache | null> {
  try {
    return "caches" in self ? await caches.open(ASSET_CACHE) : null;
  } catch {
    return null;
  }
}

/** Downloads a URL while reporting bytes; resolves to the body and content type. */
async function download(url: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
    addProgress(value.byteLength);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, type: res.headers.get("Content-Type") ?? "application/octet-stream" };
}

async function store(cache: Cache | null, url: string, body: Uint8Array, type: string) {
  await cache?.put(url, new Response(body, { headers: { "Content-Type": type } })).catch(() => {});
}

/** Returns one model file's bytes, from the persistent cache when present. */
async function loadModelFile(cache: Cache | null, { url, bytes }: { url: string; bytes: number }) {
  const hit = await cache?.match(url);
  if (hit) {
    const body = new Uint8Array(await hit.arrayBuffer());
    addProgress(bytes);
    return body;
  }
  const { body, type } = await download(url);
  await store(cache, url, body, type);
  return body;
}

/**
 * Deletes cached model files from earlier versions (the asset cache is
 * never purged as a whole, so a replaced 8 MB model would stay forever).
 */
async function purgeStaleModels(cache: Cache | null) {
  if (!cache) return;
  const current = new Set(Object.values(MODEL_FILES).map((f) => new URL(f.url, location.origin).href));
  for (const request of await cache.keys().catch(() => [])) {
    const { pathname, href } = new URL(request.url);
    if (pathname.startsWith("/models/") && !current.has(href)) await cache.delete(request).catch(() => {});
  }
}

/**
 * Makes sure the WASM runtime is cached. MediaPipe fetches it itself later;
 * the service worker serves that request from this cache.
 */
async function warmWasm(cache: Cache | null) {
  for (const { url, bytes } of WASM_FILES) {
    if (await cache?.match(url)) {
      addProgress(bytes);
      continue;
    }
    const { body, type } = await download(url);
    await store(cache, url, body, type);
  }
}

/** Asks the browser not to evict our cached model under storage pressure. */
function requestPersistence() {
  void navigator.storage?.persist?.().catch(() => {});
}

/** Downloads (or reads from cache) the model files and WASM runtime in parallel. */
export async function loadAssets(): Promise<ModelAssets> {
  const cache = await openCache();
  const names = Object.keys(MODEL_FILES) as ModelFile[];
  const [files] = await Promise.all([
    Promise.all(names.map((name) => loadModelFile(cache, MODEL_FILES[name]))),
    warmWasm(cache),
  ]);
  finishProgress();
  requestPersistence();
  void purgeStaleModels(cache);
  return Object.fromEntries(names.map((name, i) => [name, files[i]!])) as ModelAssets;
}
