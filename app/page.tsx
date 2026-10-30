"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import IdleExitPopup from "@/components/IdleExitPopup";
import LandingScreen from "@/components/LandingScreen";
import { Logo } from "@/components/Logo";
import OnboardingTour from "@/components/OnboardingTour";
import ScannerWorkspace from "@/components/ScannerWorkspace";
import SplashScreen from "@/components/SplashScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIdleHandReminder } from "@/hooks/useIdleHandReminder";
import { useSentence } from "@/hooks/useSentence";
import { cn } from "@/lib/utils";

const IDLE_HAND_TIMEOUT_MS = 5000;

type View = "landing" | "onboarding" | "scanner";

export default function HomePage() {
  const [view, setView] = useState<View>("landing");
  const [paused, setPaused] = useState(false);
  // Lives here (not in the scanner view) so the sentence survives a trip
  // back to the landing screen.
  const sentence = useSentence();
  const idleReminder = useIdleHandReminder(
    view === "scanner" && !paused,
    IDLE_HAND_TIMEOUT_MS
  );

  return (
    <main className="min-h-[100dvh] w-full bg-background">
      <SplashScreen />

      {view === "landing" && (
        <LandingScreen
          onStart={() => setView("scanner")}
          onOnboarding={() => setView("onboarding")}
        />
      )}

      {view === "onboarding" && (
        <OnboardingTour
          onFinish={() => setView("scanner")}
          onSkip={() => setView("landing")}
        />
      )}

      {view === "scanner" && (
        <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
          <header className="mb-2 flex shrink-0 items-center justify-between px-1 py-1">
            <div>
              <h1>
                <Logo markClassName="h-7" textClassName="text-lg" label="Souty" priority />
              </h1>
              <p dir="rtl" className="text-xs text-muted-foreground">
                ماسح الإشارات المباشر
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("landing")}
                aria-label="الرجوع للصفحة الرئيسية"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Badge variant={paused ? "outline" : "secondary"} className="gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    paused ? "bg-muted-foreground" : "animate-pulse-glow bg-highlight"
                  )}
                />
                <span dir="rtl">{paused ? "متوقف" : "جارٍ المسح"}</span>
              </Badge>
            </div>
          </header>

          <ScannerWorkspace
            sentence={sentence}
            paused={paused}
            onTogglePaused={() => setPaused((p) => !p)}
            onHandPresenceChange={idleReminder.onHandPresenceChange}
            scannerOverlay={
              idleReminder.visible && <IdleExitPopup onContinue={idleReminder.dismiss} />
            }
          />
        </div>
      )}
    </main>
  );
}
