"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { confettiFrom } from "@/lib/confetti";
import { speakArabic, warmUpVoices } from "@/lib/speech";

interface SpeakButtonProps {
  /** Accessible name of the button. */
  label: string;
  /** Tunisian Arabic sentence spoken aloud and shown under the button. */
  utterance: string;
  /** The sentence in the page language. Leave out on the Arabic page. */
  meaning?: string;
  /** Shown when the device has no Arabic voice to speak with. */
  noVoice: string;
}

const waveClassName = "animate-[soundwave_1s_ease-out_infinite]";

/**
 * The round speaker button from the app: one tap and the phone says a
 * sentence out loud in Tunisian Arabic. The sentence is also written under
 * the button, so the result is visible without sound.
 */
export function SpeakButton({ label, utterance, meaning, noVoice }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [outcome, setOutcome] = useState<"none" | "spoken" | "silent">("none");
  /** Id of the latest tap, so a finished older sentence cannot stop the waves of a newer one. */
  const latestRun = useRef(0);

  useEffect(() => {
    warmUpVoices();
    return () => {
      // Ignore callbacks that fire after unmount, and stop talking.
      latestRun.current += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    latestRun.current += 1;
    const run = latestRun.current;
    setSpeaking(true);
    const hasVoice = speakArabic(utterance, () => {
      if (latestRun.current === run) setSpeaking(false);
    });
    setOutcome(hasVoice ? "spoken" : "silent");
    confettiFrom(event.currentTarget, 40);
  }

  return (
    <div className="grid justify-items-center gap-3">
      <button
        type="button"
        aria-label={label}
        onClick={handleClick}
        className={cn(
          "grid size-[120px] cursor-pointer place-items-center rounded-full border-3 border-plum bg-sun",
          "shadow-[0_6px_0_var(--plum)] transition-[transform,box-shadow] duration-100",
          "hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_3px_0_var(--plum)]"
        )}
      >
        <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false" className="size-14">
          <path d="M8 22v16h10l14 12V10L18 22z" className="fill-plum" />
          <g fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-harissa">
            <path d="M40 22q6 8 0 16" className={speaking ? waveClassName : undefined} />
            <path
              d="M46 16q12 14 0 28"
              className={speaking ? cn(waveClassName, "[animation-delay:0.2s]") : undefined}
            />
          </g>
        </svg>
      </button>
      <div className="grid min-h-[3.5rem] content-start justify-items-center gap-0.5">
        {outcome === "none" ? null : (
          <>
            <p lang="ar-TN" dir="rtl" className="animate-bump font-display text-[1.25rem] font-extrabold leading-snug">
              {utterance}
            </p>
            {meaning ? <p className="text-[0.9rem] text-plum-soft">{meaning}</p> : null}
          </>
        )}
        <p aria-live="polite" className="max-w-[16rem] text-[0.9rem] text-plum-soft">
          {outcome === "silent" ? noVoice : ""}
        </p>
      </div>
    </div>
  );
}
