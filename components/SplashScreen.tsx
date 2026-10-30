"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const SPLASH_MS = 4000;
const SPLASH_FADE_MS = 300;

export default function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    const toFade = setTimeout(() => setPhase("fading"), SPLASH_MS);
    const toDone = setTimeout(() => setPhase("done"), SPLASH_MS + SPLASH_FADE_MS);
    return () => {
      clearTimeout(toFade);
      clearTimeout(toDone);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300",
        phase === "fading" ? "opacity-0" : "opacity-100"
      )}
    >
      <Logo
        className="animate-pulse-glow"
        markClassName="h-16"
        textClassName="text-4xl"
        priority
      />
    </div>
  );
}
