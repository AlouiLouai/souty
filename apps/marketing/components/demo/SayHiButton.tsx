"use client";

import { Hand, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { confettiFrom } from "@/lib/confetti";
import { speakArabic, warmUpVoices } from "@/lib/speech";

interface SayHiButtonProps {
  labels: {
    idle: string;
    /** Tunisian Arabic sentence spoken aloud. */
    utterance: string;
    /** Tunisian Arabic word shown while the phone speaks. */
    spoken: string;
    /** Shown instead when the device has no Arabic voice. */
    noVoice: string;
  };
}

type Status = "idle" | "spoken" | "noVoice";

/** How long the result stays on the button before it returns to idle. */
const RESULT_DURATION_MS = 2600;

/**
 * The hero's "make it speak" button: one tap and the mascot says hello out
 * loud in Tunisian Arabic, with a burst of confetti. The button shows what
 * happened for a moment, and says so to screen readers.
 */
export function SayHiButton({ labels }: SayHiButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    warmUpVoices();
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const hasVoice = speakArabic(labels.utterance);
    confettiFrom(event.currentTarget, 50);
    setStatus(hasVoice ? "spoken" : "noVoice");

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setStatus("idle");
    }, RESULT_DURATION_MS);
  }

  return (
    <>
      <Button
        variant="sun"
        size="sm"
        onClick={handleClick}
        className="text-balance py-2.5 text-start leading-tight"
      >
        {status === "idle" ? (
          <>
            {labels.idle}
            <Volume2 aria-hidden="true" size={20} strokeWidth={2.75} className="rtl:-scale-x-100" />
          </>
        ) : null}
        {status === "spoken" ? (
          <>
            <span lang="ar-TN" dir="rtl">
              {labels.spoken}
            </span>
            <Hand aria-hidden="true" size={20} strokeWidth={2.75} />
          </>
        ) : null}
        {status === "noVoice" ? (
          <>
            {labels.noVoice}
            <VolumeX aria-hidden="true" size={20} strokeWidth={2.75} className="rtl:-scale-x-100" />
          </>
        ) : null}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "spoken" ? <span lang="ar-TN">{labels.spoken}</span> : null}
        {status === "noVoice" ? labels.noVoice : null}
      </span>
    </>
  );
}
