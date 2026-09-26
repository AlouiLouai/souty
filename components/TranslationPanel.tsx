"use client";

import { Pause, Play, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface TranslationPanelProps {
  sentenceWords: string[];
  speechSupported: boolean;
  paused: boolean;
  onTogglePaused: () => void;
  onClearSentence: () => void;
  onSpeakSentence: (text: string) => void;
}

export default function TranslationPanel({
  sentenceWords,
  speechSupported,
  paused,
  onTogglePaused,
  onClearSentence,
  onSpeakSentence,
}: TranslationPanelProps) {
  const hasSentence = sentenceWords.length > 0;
  const sentenceText = sentenceWords.join(" ");

  return (
    <Card className="mt-3">
      <CardContent className="pt-5">
        {hasSentence ? (
          <p
            dir="rtl"
            lang="ar"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-3xl font-bold leading-tight text-foreground"
          >
            {sentenceWords.map((word, i) => {
              const isLast = i === sentenceWords.length - 1;
              return (
                <span
                  key={`${word}-${i}`}
                  className={isLast ? "animate-float-up" : "text-foreground/80"}
                >
                  {word}
                </span>
              );
            })}
          </p>
        ) : (
          <p className="text-2xl font-semibold text-muted-foreground">
            Show a gesture…
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-2 pt-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onTogglePaused}
          aria-pressed={paused}
          aria-label={paused ? "Resume scanning" : "Pause scanning"}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!hasSentence || !speechSupported}
          onClick={() => onSpeakSentence(sentenceText)}
        >
          <Volume2 className="h-4 w-4" />
          Speak sentence
        </Button>
        <Button
          variant="destructive"
          size="icon"
          disabled={!hasSentence}
          onClick={onClearSentence}
          aria-label="Clear sentence"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
