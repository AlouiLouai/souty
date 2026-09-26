"use client";

import { useCallback, useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import { useSpeech } from "@/hooks/useSpeech";
import type { RecognizedGesture } from "@/lib/types";

export default function HomePage() {
  const [sentenceWords, setSentenceWords] = useState<RecognizedGesture[]>([]);
  const [paused, setPaused] = useState(false);

  const {
    enabled: voiceEnabled,
    setEnabled: setVoiceEnabled,
    supported: speechSupported,
    speak,
  } = useSpeech();

  const clearSentence = useCallback(() => {
    setSentenceWords([]);
  }, []);

  const handleLocked = useCallback(
    (gesture: RecognizedGesture) => {
      setSentenceWords((prev) => [...prev, gesture]);
      speak(gesture.word);
    },
    [speak]
  );

  const latest = sentenceWords[sentenceWords.length - 1] ?? null;

  return (
    <main className="relative min-h-[100dvh] w-full bg-black">
      <AmbientBackground />

      <div className="safe-top safe-x safe-bottom relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
        <header className="mb-3 flex shrink-0 items-center justify-between px-1 py-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Souty
            </h1>
            <p className="text-xs text-white/45">Live sign scanner</p>
          </div>
          <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/70">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                paused ? "bg-white/30" : "bg-white animate-pulse-glow"
              }`}
            />
            {paused ? "Paused" : "Scanning"}
          </div>
        </header>

        <GestureScanner
          className="min-h-0 flex-1 shadow-glass-lg"
          paused={paused}
          onLocked={handleLocked}
        />

        <div className="shrink-0">
          <TranslationPanel
            sentenceWords={sentenceWords.map((g) => g.word)}
            latest={latest}
            voiceEnabled={voiceEnabled}
            speechSupported={speechSupported}
            onToggleVoice={() => setVoiceEnabled((v) => !v)}
            paused={paused}
            onTogglePaused={() => setPaused((p) => !p)}
            onClearSentence={clearSentence}
          />

          <p className="mt-2 pb-1 text-center text-[11px] leading-relaxed text-white/30">
            Hold a gesture steady to add a word to the sentence. Tap ✕ to
            clear it. Runs fully on-device.
          </p>
        </div>
      </div>
    </main>
  );
}
