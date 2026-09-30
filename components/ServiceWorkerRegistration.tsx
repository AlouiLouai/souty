"use client";

import { useEffect } from "react";

// Only registers in production: a service worker caching Next's dev-mode
// assets (which change on every save) would fight the dev server rather
// than help it. Registration failure is swallowed - it degrades to a
// normal (non-offline) web app, which is the correct fallback, not a
// crash.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed", err);
    });
  }, []);

  return null;
}
