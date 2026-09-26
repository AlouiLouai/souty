"use client";

import type { RecognizedGesture } from "@/lib/types";

interface TranslationPanelProps {
  sentenceWords: string[];
  latest: RecognizedGesture | null;
  voiceEnabled: boolean;
  speechSupported: boolean;
  onToggleVoice: () => void;
  paused: boolean;
  onTogglePaused: () => void;
  onClearSentence: () => void;
}

export default function TranslationPanel({
  sentenceWords,
  latest,
  voiceEnabled,
  speechSupported,
  onToggleVoice,
  paused,
  onTogglePaused,
  onClearSentence,
}: TranslationPanelProps) {
  const hasSentence = sentenceWords.length > 0;

  return (
    <div className="glass-panel-strong glass-highlight relative mt-3 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
            Sentence
          </p>
          {hasSentence ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-3xl font-bold leading-tight">
              {sentenceWords.map((word, i) => {
                const isLast = i === sentenceWords.length - 1;
                return (
                  <span
                    key={`${word}-${i}`}
                    className={
                      isLast ? "text-white animate-float-up" : "text-white/85"
                    }
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white/35">
              Show a gesture…
            </p>
          )}
          {latest && (
            <p className="mt-1 text-xs text-white/45">
              {latest.label.replace(/_/g, " ")} ·{" "}
              {Math.round(latest.confidence * 100)}% confidence
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            onClick={onToggleVoice}
            disabled={!speechSupported}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Mute voice output" : "Enable voice output"}
            className={`glass-pill flex h-11 w-11 items-center justify-center rounded-full text-lg transition active:scale-90 disabled:opacity-30 ${
              voiceEnabled ? "shadow-glow-white text-white" : "text-white/60"
            }`}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>

          <button
            onClick={onTogglePaused}
            aria-pressed={paused}
            aria-label={paused ? "Resume scanning" : "Pause scanning"}
            className={`glass-pill flex h-11 w-11 items-center justify-center rounded-full text-lg transition active:scale-90 ${
              paused ? "text-white shadow-glow-white" : "text-white/60"
            }`}
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      <button
        onClick={onClearSentence}
        disabled={!hasSentence}
        className="glass-pill mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition active:scale-[0.98] disabled:opacity-30"
      >
        ✕ Clear sentence
      </button>
    </div>
  );
}
