"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Home } from "lucide-react";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import LandingScreen from "@/components/LandingScreen";
import OnboardingTour from "@/components/OnboardingTour";
import IdleExitPopup from "@/components/IdleExitPopup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/useSpeech";

const SPLASH_MS = 4000;
const SPLASH_FADE_MS = 300;
const IDLE_HAND_TIMEOUT_MS = 5000;

type View = "landing" | "onboarding" | "scanner";

export default function HomePage() {
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<View>("landing");
  const [idlePromptVisible, setIdlePromptVisible] = useState(false);
  const [splashPhase, setSplashPhase] = useState<"visible" | "fading" | "done">(
    "visible"
  );

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { supported: speechSupported, speakSentence } = useSpeech();

  useEffect(() => {
    const toFade = setTimeout(() => setSplashPhase("fading"), SPLASH_MS);
    const toDone = setTimeout(
      () => setSplashPhase("done"),
      SPLASH_MS + SPLASH_FADE_MS
    );
    return () => {
      clearTimeout(toFade);
      clearTimeout(toDone);
    };
  }, []);

  const clearSentence = useCallback(() => {
    setSentenceWords([]);
  }, []);

  const handleLocked = useCallback((word: string) => {
    setSentenceWords((prev) => [...prev, word]);
  }, []);

  const removeLastWord = useCallback(() => {
    setSentenceWords((prev) => prev.slice(0, -1));
  }, []);

  const clearIdleTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // A hand disappearing from frame for IDLE_HAND_TIMEOUT_MS shows a
  // gentle reminder popup - purely informational, it does not close the
  // camera or navigate away on its own. It clears itself the moment a
  // hand reappears, or the user can dismiss it manually.
  const handleHandPresenceChange = useCallback(
    (present: boolean) => {
      if (present) {
        clearIdleTimers();
        setIdlePromptVisible(false);
        return;
      }
      if (idleTimerRef.current || idlePromptVisible) return;
      idleTimerRef.current = setTimeout(() => {
        setIdlePromptVisible(true);
      }, IDLE_HAND_TIMEOUT_MS);
    },
    [clearIdleTimers, idlePromptVisible]
  );

  const handleIdleContinue = useCallback(() => {
    clearIdleTimers();
    setIdlePromptVisible(false);
  }, [clearIdleTimers]);

  // Leaving the scanner view (manually, or paused) cancels any pending
  // idle popup so it doesn't fire later against a stale state.
  useEffect(() => {
    if (view !== "scanner" || paused) {
      clearIdleTimers();
      setIdlePromptVisible(false);
    }
  }, [view, paused, clearIdleTimers]);

  useEffect(() => clearIdleTimers, [clearIdleTimers]);

  return (
    <main className="min-h-[100dvh] w-full bg-background">
      {splashPhase !== "done" && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
            splashPhase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex animate-pulse-glow items-center gap-0.5">
            <Image
              src="/logo-mark.png"
              alt=""
              width={69}
              height={78}
              className="h-16 w-auto"
              priority
            />
            <span className="text-4xl font-bold tracking-tight text-foreground">
              outy
            </span>
          </div>
        </div>
      )}

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
              <h1 className="flex items-center gap-0.5 text-lg font-bold tracking-tight text-foreground">
                <Image
                  src="/logo-mark.png"
                  alt="Souty"
                  width={69}
                  height={78}
                  className="h-7 w-auto"
                  priority
                />
                <span aria-hidden="true">outy</span>
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
                  className={`h-1.5 w-1.5 rounded-full ${
                    paused ? "bg-muted-foreground" : "bg-highlight animate-pulse-glow"
                  }`}
                />
                <span dir="rtl">{paused ? "متوقف" : "جارٍ المسح"}</span>
              </Badge>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            <GestureScanner
              className="h-full w-full"
              paused={paused}
              onLocked={handleLocked}
              onHandPresenceChange={handleHandPresenceChange}
            />
            {idlePromptVisible && <IdleExitPopup onContinue={handleIdleContinue} />}
          </div>

          <div className="shrink-0">
            <TranslationPanel
              sentenceWords={sentenceWords}
              speechSupported={speechSupported}
              paused={paused}
              onTogglePaused={() => setPaused((p) => !p)}
              onRemoveLastWord={removeLastWord}
              onClearSentence={clearSentence}
              onSpeakSentence={speakSentence}
            />
          </div>
        </div>
      )}
    </main>
  );
}
