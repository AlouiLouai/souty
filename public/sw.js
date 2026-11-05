/**
 * Offline-first service worker.
 *
 * - App shell: network-first (fresh when online), cached copy when offline
 *   or when the network is slower than NAVIGATE_TIMEOUT_MS.
 * - Static files (/_next/static, icons): cache-first.
 * - Model + WASM (/models, /wasm): served from the "souty-assets" cache the
 *   page fills (see lib/assets.ts); that cache is never purged by version
 *   bumps. The model URL carries ?v=N, so a new model is a new cache key.
 * - The page posts {type:"CACHE_URLS"} so files loaded before this worker
 *   took control are cached too.
 *
 * Bump SHELL_CACHE when this caching logic changes.
 */
const SHELL_CACHE = "souty-v3";
const ASSET_CACHE = "souty-assets-v1";
const NAVIGATE_TIMEOUT_MS = 4000;

const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/manifest.webmanifest"];
const ASSET_PREFIXES = ["/models/", "/wasm/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error("SW precache failed", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS") return;
  const urls = (event.data.urls || []).filter((u) => typeof u === "string" && u.startsWith("/"));
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(urls.map((url) => cache.match(url).then((hit) => hit || cache.add(url).catch(() => {}))))
    )
  );
});

/** Network first, but falls back to the cached shell if the network stalls. */
function navigate(request) {
  const cached = () => caches.match("/", { cacheName: SHELL_CACHE });
  const network = fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy));
    }
    return response;
  });
  const timeout = new Promise((resolve) =>
    setTimeout(() => cached().then((hit) => hit && resolve(hit)), NAVIGATE_TIMEOUT_MS)
  );
  return Promise.race([network, timeout]).catch(() => cached().then((hit) => hit || network));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }

  const isAsset = ASSET_PREFIXES.some((p) => url.pathname.startsWith(p));
  const isStatic = STATIC_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (!isAsset && !isStatic) return;

  const cacheName = isAsset ? ASSET_CACHE : SHELL_CACHE;
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          // Range/partial responses (206) cannot be stored.
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
