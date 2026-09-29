"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/useSpeech";

export default function HomePage() {
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  const { supported: speechSupported, speakSentence } = useSpeech();

  const clearSentence = useCallback(() => {
    setSentenceWords([]);
  }, []);

  const handleLocked = useCallback((word: string) => {
    setSentenceWords((prev) => [...prev, word]);
  }, []);

  return (
    <main className="min-h-[100dvh] w-full bg-background">
      <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
        <header className="mb-2 flex shrink-0 items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-mark.png"
              alt=""
              width={69}
              height={78}
              className="h-8 w-auto"
              priority
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Souty
              </h1>
              <p dir="rtl" className="text-xs text-muted-foreground">ماسح الإشارات المباشر</p>
            </div>
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
