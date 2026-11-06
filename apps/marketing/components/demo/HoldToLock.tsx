"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { confettiFrom } from "@/lib/confetti";

/** How long a sign must be held before the word locks in, as in the app. */
const HOLD_MS = 700;
const RING_RADIUS = 80;
/** Circumference of the progress ring, in SVG units. */
const RING_LENGTH = Math.ceil(2 * Math.PI * RING_RADIUS);

export interface HoldToLockStrings {
  /** Accessible name of the button. */
  label: string;
  /** Tunisian Arabic lines. Leave out on the Arabic page. */
  idleDerja?: string;
  holdingDerja?: string;
  idle: string;
  holding: string;
  locked: string;
  statusHolding: string;
  statusSuccess: string;
  statusTooShort: string;
}

interface HoldToLockProps {
  strings: HoldToLockStrings;
  /** Tunisian Arabic words shown one after the other, one per successful hold. */
  words: readonly string[];
}

type Phase = "idle" | "holding" | "locked" | "tooShort";

function isHoldKey(event: KeyboardEvent): boolean {
  return event.key === " " || event.key === "Enter";
}

/** Two stacked lines inside the button: a big one and an optional small one. */
function ButtonLines({ derja, text }: { derja?: string; text: string }) {
  if (!derja) return <span>{text}</span>;
  return (
    <>
      <span lang="ar-TN" dir="rtl">
        {derja}
      </span>
      <span className="font-sans text-[0.8rem] font-medium">{text}</span>
    </>
  );
}

/**
 * A playable copy of the app's "hold to lock" gesture: press and hold the
 * round button, a ring fills around it in 700 ms, and a word is locked in.
 * Letting go early resets the ring. Works with touch, mouse and keyboard.
 */
export function HoldToLock({ strings, words }: HoldToLockProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [word, setWord] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const lockedCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  /*
   * The ring is drawn straight to the DOM on every frame. It is the direct
   * answer to the visitor's own press, so it also runs for people who ask
   * for reduced motion; the confetti that follows does not.
   */
  function drawRing(progress: number) {
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
    }
  }

  function lockWord() {
    setWord(words[lockedCountRef.current % words.length] ?? "");
    lockedCountRef.current += 1;
    setPhase("locked");
    if (buttonRef.current) confettiFrom(buttonRef.current, 70);
    if (typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(40);
      } catch {
        // Vibration is a bonus; some browsers block it.
      }
    }
  }

  function step(now: number) {
    const progress = Math.min(1, (now - startRef.current) / HOLD_MS);
    drawRing(progress);
    if (progress >= 1) {
      frameRef.current = null;
      lockWord();
      return;
    }
    frameRef.current = requestAnimationFrame(step);
  }

  function press() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    setPhase("holding");
    startRef.current = performance.now();
    frameRef.current = requestAnimationFrame(step);
  }

  /** Letting go only matters while the ring is still filling. */
  function release() {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    drawRing(0);
    setPhase("tooShort");
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    press();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(event)) return;
    event.preventDefault();
    // A held key repeats; only the first press starts the ring.
    if (!event.repeat) press();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (isHoldKey(event)) release();
  }

  const status: Record<Phase, string> = {
    idle: "",
    holding: strings.statusHolding,
    locked: strings.statusSuccess,
    tooShort: strings.statusTooShort,
  };

  return (
    <div className="grid justify-items-center gap-3">
      <button
        ref={buttonRef}
        type="button"
        aria-label={strings.label}
        onPointerDown={handlePointerDown}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={release}
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          "relative m-4 grid size-[150px] cursor-pointer touch-none select-none place-items-center rounded-full",
          "border-3 border-plum font-display text-[1.05rem] font-extrabold text-plum",
          "shadow-[0_6px_0_var(--plum)] transition-[transform,box-shadow,background-color] duration-100",
          "active:translate-y-[3px] active:shadow-[0_3px_0_var(--plum)] [-webkit-touch-callout:none]",
          phase === "locked" ? "bg-mint" : "bg-lilac"
        )}
      >
        <svg
          viewBox="0 0 174 174"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute -inset-[15px] size-[calc(100%+30px)] -rotate-90"
        >
          <circle
            cx="87"
            cy="87"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="9"
            className="stroke-plum opacity-[0.12]"
          />
          <circle
            ref={ringRef}
            cx="87"
            cy="87"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            className="stroke-mint"
          />
        </svg>
        <span className="grid justify-items-center px-3 leading-[1.15]">
          {phase === "locked" ? (
            <>
              <span lang="ar-TN" dir="rtl" className="text-[1.8rem]">
                {word}
              </span>
              <span className="font-sans text-[0.8rem] font-medium">{strings.locked}</span>
            </>
          ) : phase === "holding" ? (
            <ButtonLines derja={strings.holdingDerja} text={strings.holding} />
          ) : (
            <ButtonLines derja={strings.idleDerja} text={strings.idle} />
          )}
        </span>
      </button>
      <p
        aria-live="polite"
        className="min-h-[2.75em] max-w-[16rem] font-display text-[1.05rem] font-bold leading-snug text-plum"
      >
        {status[phase]}
      </p>
    </div>
  );
}
