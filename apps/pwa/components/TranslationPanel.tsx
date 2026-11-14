"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, MessageSquareText, Pause, Play, Trash2, Volume2, VolumeX } from "lucide-react";
import { Flow, IconTile, SoundBars, TwoHands } from "@/components/Pictograms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** How long the armed "clear" button waits for its confirming second tap. */
const CLEAR_CONFIRM_MS = 3000;

interface TranslationPanelProps {
  sentenceWords: string[];
  speechSupported: boolean;
  speaking: boolean;
  /** The last words got no sound: the speaker shows crossed out. */
  speechFailed?: boolean;
  paused: boolean;
  onTogglePaused: () => void;
  onRemoveLastWord: () => void;
  onClearSentence: () => void;
  onSpeakSentence: (words: string[]) => void;
  /** Tapping one word says just that word. */
  onSpeakWord: (word: string) => void;
}

/**
 * The sentence built from signs, and its controls. The words are the only
 * text in the app; every control is an icon (with an Arabic aria-label).
 */
export default function TranslationPanel({
  sentenceWords,
  speechSupported,
  speaking,
  speechFailed = false,
  paused,
  onTogglePaused,
  onRemoveLastWord,
  onClearSentence,
  onSpeakSentence,
  onSpeakWord,
}: TranslationPanelProps) {
  const hasSentence = sentenceWords.length > 0;
  const [clearArmed, setClearArmed] = useState(false);
  const wordsRef = useRef<HTMLDivElement | null>(null);

  // Disarm "clear" after a while, or as soon as the sentence changes.
  useEffect(() => {
    if (!clearArmed) return;
    const timer = setTimeout(() => setClearArmed(false), CLEAR_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [clearArmed]);
  useEffect(() => setClearArmed(false), [sentenceWords.length]);

  // Keep the newest word in view.
  useEffect(() => {
    const box = wordsRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [sentenceWords.length]);

  const handleClear = () => {
    if (clearArmed) {
      setClearArmed(false);
      onClearSentence();
    } else {
      setClearArmed(true);
      navigator.vibrate?.(20);
    }
  };

  return (
    <Card className="mt-3">
      <CardContent className="pt-4">
        {hasSentence ? (
          <div
            ref={wordsRef}
            dir="rtl"
            lang="ar"
            className="flex max-h-[7.5rem] flex-wrap items-center gap-2 overflow-y-auto"
          >
            {sentenceWords.map((word, i) => {
              const isLast = i === sentenceWords.length - 1;
              return (
                <button
                  key={`${word}-${i}`}
                  type="button"
                  disabled={!speechSupported}
                  onClick={() => onSpeakWord(word)}
                  aria-label={`اسمع: ${word}`}
                  className={cn(
                    "rounded-2xl border-2 px-3 py-1 font-display text-3xl font-extrabold leading-snug transition-colors active:scale-95 disabled:cursor-default",
                    clearArmed
                      ? "border-dashed border-destructive bg-card text-foreground/40 line-through"
                      : isLast
                        ? "animate-pop-in border-foreground bg-highlight text-highlight-foreground"
                        : "border-border bg-secondary text-foreground"
                  )}
                >
                  {word}
                </button>
              );
            })}
          </div>
        ) : (
          <Flow
            className="py-2 opacity-70"
            steps={[
              <IconTile key="hands" className="w-auto px-3">
                <TwoHands iconClassName="h-6 w-6" animated />
              </IconTile>,
              <IconTile key="words" icon={MessageSquareText} />,
              <IconTile key="voice" icon={Volume2} />,
            ]}
          />
        )}
      </CardContent>

      <CardFooter dir="rtl" className="flex items-center gap-2 pt-0">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14"
          onClick={onTogglePaused}
          aria-label={paused ? "كمّل المسح" : "وقّف المسح"}
        >
          {paused ? (
            <Play className="h-6 w-6" fill="currentColor" />
          ) : (
            <Pause className="h-6 w-6" fill="currentColor" />
          )}
        </Button>
        <Button
          className="h-14 flex-1"
          disabled={!hasSentence || !speechSupported}
          onClick={() => onSpeakSentence(sentenceWords)}
          aria-label="اسمع الجملة"
        >
          {speechFailed && !speaking ? (
            <VolumeX className="h-7 w-7" strokeWidth={2.4} />
          ) : (
            <Volume2 className="h-7 w-7" strokeWidth={2.4} />
          )}
          {speaking && <SoundBars />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14"
          disabled={!hasSentence}
          onClick={onRemoveLastWord}
          aria-label="امسح آخر كلمة"
        >
          <Delete className="h-6 w-6" strokeWidth={2.2} />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className={cn("h-14 w-14", clearArmed && "scale-110 animate-pulse ring-4 ring-destructive/60")}
          disabled={!hasSentence}
          onClick={handleClear}
          aria-label={clearArmed ? "أكّد: امسح الجملة الكل" : "امسح الجملة الكل"}
        >
          {/* Armed: same trash, bigger and pulsing, while the words show they will go. */}
          <Trash2 className={clearArmed ? "h-7 w-7" : "h-6 w-6"} strokeWidth={clearArmed ? 2.8 : 2.2} />
        </Button>
      </CardFooter>
    </Card>
  );
}
