"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/useSpeech";

const SPLASH_MS = 4000;
const SPLASH_FADE_MS = 300;

export default function HomePage() {
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [splashPhase, setSplashPhase] = useState<"visible" | "fading" | "done">(
    "visible"
  );

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

  return (
    <main className="min-h-[100dvh] w-full bg-background">
      {splashPhase !== "done" && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
            splashPhase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src="/logo-mark.png"
            alt="Souty"
            width={69}
            height={78}
            className="h-24 w-auto animate-pulse-glow"
            priority
          />
        </div>
      )}

      <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
        <header className="mb-2 flex shrink-0 items-center justify-between px-1 py-1">
          <div>
            <h1 className="flex items-center gap-1 text-lg font-bold tracking-tight text-foreground">
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
            <p dir="rtl" className="text-xs text-muted-foreground">ماسح الإشارات المباشر</p>
          </div>
          <Badge variant={paused ? "outline" : "secondary"} className="gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                paused ? "bg-muted-foreground" : "bg-foreground animate-pulse-glow"
              }`}
            />
            <span dir="rtl">{paused ? "متوقف" : "جارٍ المسح"}</span>
          </Badge>
        </header>

        <GestureScanner
          className="min-h-0 flex-1"
          paused={paused}
          onLocked={handleLocked}
        />

        <div className="shrink-0">
          <TranslationPanel
            sentenceWords={sentenceWords}
            speechSupported={speechSupported}
            paused={paused}
            onTogglePaused={() => setPaused((p) => !p)}
            onClearSentence={clearSentence}
            onSpeakSentence={speakSentence}
          />
        </div>
      </div>
    </main>
  );
}
