"use client";

import { useSyncExternalStore } from "react";
import { isDemoActive, subscribeDemo } from "@/lib/demoScript";

/** Whether the demo script is on; re-renders the caller when it is switched. */
export function useDemo(): boolean {
  return useSyncExternalStore(subscribeDemo, isDemoActive, () => false);
}
