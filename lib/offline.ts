import { WASM_DIR } from "@/lib/assets";

/**
 * Tells the service worker to cache every same-origin file the page has
 * loaded so far (JS chunks, CSS, fonts, images). Files fetched before the
 * worker took control would otherwise be missing offline. Safe to call
 * repeatedly.
 */
export async function cacheLoadedResources() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration?.active) return;

  const urls = performance
    .getEntriesByType("resource")
    .map((entry) => new URL(entry.name))
    .filter(
      (url) =>
        url.origin === location.origin &&
        !url.pathname.startsWith(WASM_DIR) &&
        !url.pathname.startsWith("/models/") &&
        !url.pathname.startsWith("/_vercel/")
    )
    .map((url) => url.pathname + url.search);

  registration.active.postMessage({ type: "CACHE_URLS", urls: [...new Set(urls)] });
}
