/**
 * Heavy-asset loading for the recognizer: parallel download, a persistent
 * Cache API copy (survives browser HTTP-cache eviction and works offline),
 * and aggregated progress.
 */

/** Bump when `public/models/gesture_recognizer.task` changes; busts every cache. */
const MODEL_VERSION = 1;
export const MODEL_URL = `/models/gesture_recognizer.task?v=${MODEL_VERSION}`;
export const WASM_DIR = "/wasm";

const WASM_FILES = [`${WASM_DIR}/vision_wasm_internal.js`, `${WASM_DIR}/vision_wasm_internal.wasm`];

/** Decoded sizes, used only to compute progress (transfer is brotli-compressed). */
const MODEL_BYTES = 8_476_576;
const WASM_BYTES = 11_756_954 + 323_377;
const TOTAL_BYTES = MODEL_BYTES + WASM_BYTES;

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

/** Returns the model bytes, from the persistent cache when present. */
async function loadModel(cache: Cache | null): Promise<Uint8Array> {
  const hit = await cache?.match(MODEL_URL);
  if (hit) {
    const body = new Uint8Array(await hit.arrayBuffer());
    addProgress(MODEL_BYTES);
    return body;
  }
  const { body, type } = await download(MODEL_URL);
  await store(cache, MODEL_URL, body, type);
  return body;
}

/**
 * Makes sure the WASM runtime is cached. MediaPipe fetches it itself later;
 * the service worker serves that request from this cache.
 */
async function warmWasm(cache: Cache | null) {
  for (const url of WASM_FILES) {
    if (await cache?.match(url)) {
      addProgress(url.endsWith(".wasm") ? 11_756_954 : 323_377);
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

/** Downloads (or reads from cache) the model and WASM runtime in parallel. */
export async function loadAssets(): Promise<Uint8Array> {
  const cache = await openCache();
  const [model] = await Promise.all([loadModel(cache), warmWasm(cache)]);
  finishProgress();
  requestPersistence();
  return model;
}
