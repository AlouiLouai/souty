// Minimal hand-written service worker (no build-time precache manifest
// tooling) - deliberately simple: this is a single-page app where nearly
// everything that matters (camera, model, WASM runtime) already runs
// entirely client-side, so the offline story only needs to guarantee the
// app shell + those heavy assets are servable with zero network.
//
// Bump CACHE_VERSION when this file's *caching logic* changes (not on
// every app deploy - content updates are handled by the network-first
// navigation strategy below, which always tries for the freshest HTML
// when online).
const CACHE_VERSION = "souty-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/models/gesture_recognizer.task",
  "/wasm/vision_wasm_internal.js",
  "/wasm/vision_wasm_internal.wasm",
  "/wasm/vision_wasm_module_internal.js",
  "/wasm/vision_wasm_module_internal.wasm",
  "/wasm/vision_wasm_nosimd_internal.js",
  "/wasm/vision_wasm_nosimd_internal.wasm",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Paths safe to serve cache-first: either content-hashed (Next's
// /_next/static/) or effectively immutable in practice for this app
// (the model/WASM/icons only change when we ship a new version, at which
// point CACHE_VERSION below gets bumped anyway).
const CACHE_FIRST_PREFIXES = [
  "/_next/static/",
  "/models/",
  "/wasm/",
  "/icons/",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Don't let one missing precache URL (e.g. a model file not yet
        // built locally) block the whole service worker from installing.
        console.error("SW precache failed", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations (the app shell itself): network-first so online users
  // always get the latest build, falling back to the cached shell when
  // there's no connection at all.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/").then((cached) => cached || caches.match(request)))
    );
    return;
  }

  if (CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
