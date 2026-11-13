"use client";

import { useEffect, useState } from "react";
import { BookOpen, House, Pause } from "lucide-react";
import IdleExitPopup from "@/components/IdleExitPopup";
import LandingScreen from "@/components/LandingScreen";
import { LogoMark } from "@/components/Logo";
import OnboardingTour from "@/components/OnboardingTour";
import ScannerWorkspace from "@/components/ScannerWorkspace";
import SignGuide from "@/components/SignGuide";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { useIdleHandReminder } from "@/hooks/useIdleHandReminder";
import { useSentence } from "@/hooks/useSentence";
import { getRecognizer } from "@/lib/recognizer";
import { cn } from "@/lib/utils";

const IDLE_HAND_TIMEOUT_MS = 5000;

type View = "landing" | "onboarding" | "scanner" | "guide";

/** Scanner state, announced to screen readers only. */
const STATUS_LABELS = { paused: "المسح موقوف", running: "المسح خدّام" } as const;

export default function HomePage() {
  const [view, setView] = useState<View>("landing");
  /** Where the sign guide goes back to. */
  const [guideReturn, setGuideReturn] = useState<View>("landing");
  const [paused, setPaused] = useState(false);
  // Owned here so the sentence survives a trip back to the landing screen.
  const sentence = useSentence();

  // Warm the model while the user is still on the splash/landing screens.
  useEffect(() => {
    getRecognizer().catch(() => {});
  }, []);

  const idleReminder = useIdleHandReminder(view === "scanner" && !paused, IDLE_HAND_TIMEOUT_MS);

  const openGuide = (from: View) => {
    setGuideReturn(from);
    setView("guide");
  };

  return (
    <main className="min-h-[100dvh] w-full bg-background">
      <SplashScreen />

      {view === "landing" && (
        <LandingScreen
          onStart={() => setView("scanner")}
          onOnboarding={() => setView("onboarding")}
          onGuide={() => openGuide("landing")}
        />
      )}

      {view === "onboarding" && (
        <OnboardingTour onFinish={() => setView("scanner")} onSkip={() => setView("landing")} />
      )}

      {view === "guide" && <SignGuide onClose={() => setView(guideReturn)} />}

      {view === "scanner" && (
        <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
          <header dir="rtl" className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1 py-1">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setView("landing")}
              aria-label="ارجع للصفحة الرئيسية"
            >
              <House className="h-6 w-6" strokeWidth={2.2} />
            </Button>

            <span className="flex items-center gap-2">
              <span role="status" className="sr-only">
                {STATUS_LABELS[paused ? "paused" : "running"]}
              </span>
              <LogoMark className="h-8" />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-border",
                  paused ? "bg-muted text-foreground" : "bg-card"
                )}
              >
                {paused ? (
                  <Pause className="h-3.5 w-3.5" fill="currentColor" />
                ) : (
                  <span className="h-2.5 w-2.5 animate-pulse-glow rounded-full bg-highlight" />
                )}
              </span>
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => openGuide("scanner")}
              aria-label="الإشارات اللي يعرفها التطبيق"
            >
              <BookOpen className="h-6 w-6" strokeWidth={2.2} />
            </Button>
          </header>

          <ScannerWorkspace
            sentence={sentence}
            paused={paused}
            onTogglePaused={() => setPaused((p) => !p)}
            onHandPresenceChange={idleReminder.onHandPresenceChange}
            askFeedback
            scannerOverlay={idleReminder.visible && <IdleExitPopup onContinue={idleReminder.dismiss} />}
          />
        </div>
      )}
    </main>
  );
}
