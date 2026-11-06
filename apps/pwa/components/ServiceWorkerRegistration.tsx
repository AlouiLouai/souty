"use client";

import { useEffect } from "react";
import { cacheLoadedResources } from "@/lib/offline";

/** Registers the service worker in production only (dev assets change on every save). */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => cacheLoadedResources())
      .catch((err) => console.error("Service worker registration failed", err));
  }, []);

  return null;
}
