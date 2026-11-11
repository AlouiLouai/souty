"use client";

import { Hand, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { REST_SHAPE, shapeForSign } from "@/components/demo/hand-model";
import { createHandStage, type HandStage } from "@/components/product/playground/hand-stage";
import { SignGlyph } from "@/components/product/SignGlyph";
import { Button } from "@/components/ui/Button";
import { format } from "@/content";
import { cn } from "@/lib/cn";
import { confettiFrom } from "@/lib/confetti";
import { speakArabic, warmUpVoices } from "@/lib/speech";

/** One word the visitor can sign in the playground. */
export interface PlaygroundWord {
  /** Model label of the sign; it selects the hand shape that is drawn. */
  id: string;
  /** Tunisian Arabic, in Arabic script. */
  word: string;
  /** Meaning in the page language; absent on the Arabic page. */
  gloss?: string;
}

interface SignPlaygroundLabels {
  canvasLabel: string;
  disclaimer: string;
  /** Derja line above the word pad; absent on the Arabic page. */
  chooseDerja?: string;
  choose: string;
  sentenceLabel: string;
  empty: string;
  /** Derja line on the speak button; absent on the Arabic page. */
  speakDerja?: string;
  speak: string;
  reset: string;
  pickFirst: string;
  spoken: string;
  noVoice: string;
  listSeparator: string;
}

interface SignPlaygroundProps {
  words: readonly PlaygroundWord[];
  labels: SignPlaygroundLabels;
}

/**
 * The "sign the hand" toy: tap words, a cartoon hand takes each sign's real
 * hand shape while a ring fills (the app's hold-to-confirm), the sentence
 * builds chip by chip, and a button speaks it aloud in Tunisian Arabic.
 */
export function SignPlayground({ words, labels }: SignPlaygroundProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HandStage | null>(null);
  const [sentence, setSentence] = useState<readonly PlaygroundWord[]>([]);
  const [message, setMessage] = useState("");
  const chooseId = useId();

  useEffect(() => {
    warmUpVoices();
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const hand = createHandStage(stage, canvas);
    handRef.current = hand;
    return () => {
      hand?.destroy();
      handRef.current = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function signWord(word: PlaygroundWord) {
    const lockIn = () => {
      setSentence((current) => [...current, word]);
      if (bubbleRef.current) confettiFrom(bubbleRef.current, 30);
    };
    // Without a drawable canvas the word still joins the sentence.
    if (handRef.current) handRef.current.sign(shapeForSign(word.id) ?? REST_SHAPE, lockIn);
    else lockIn();
  }

  function speakSentence(event: MouseEvent<HTMLButtonElement>) {
    if (sentence.length === 0) {
      setMessage(labels.pickFirst);
      return;
    }
    const spoken = speakArabic(sentence.map((item) => item.word).join(" "));
    const meaning = sentence.map((item) => item.gloss ?? item.word).join(labels.listSeparator);
    setMessage(format(spoken ? labels.spoken : labels.noVoice, { sentence: meaning }));
    confettiFrom(event.currentTarget, 80);
  }

  function startOver() {
    handRef.current?.reset();
    setSentence([]);
    setMessage("");
  }

  const lastWord = sentence[sentence.length - 1];

  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
      <figure className="mx-auto grid w-full max-w-[420px] gap-3 md:max-w-none">
        <div
          ref={stageRef}
          className="relative aspect-square overflow-hidden rounded-[2.25rem] border-3 border-plum bg-[radial-gradient(circle_at_50%_40%,#FFE9A8,var(--sun))] shadow-hard-lg"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={labels.canvasLabel}
            className="absolute inset-0 size-full"
          />
          <div ref={bubbleRef} className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span
              key={sentence.length}
              className={cn(
                "grid min-h-12 min-w-20 place-items-center rounded-[20px] border-3 border-plum bg-paper px-5 py-1",
                "font-display text-[1.7rem] font-extrabold leading-tight text-plum shadow-hard-sm",
                lastWord && "animate-bump"
              )}
            >
              {lastWord ? (
                <span lang="ar-TN" dir="rtl">
                  {lastWord.word}
                </span>
              ) : (
                <Hand aria-hidden="true" className="size-7" strokeWidth={2.5} />
              )}
            </span>
          </div>
        </div>
        <figcaption className="text-center text-[0.9rem] leading-snug text-plum-soft">
          {labels.disclaimer}
        </figcaption>
      </figure>

      <div className="grid min-w-0 gap-4">
        <div className="grid justify-items-start gap-1">
          {labels.chooseDerja ? (
            <p lang="ar-TN" dir="rtl" className="font-display text-[1.9rem] font-extrabold leading-tight">
              {labels.chooseDerja}
            </p>
          ) : null}
          <h3 id={chooseId} className="text-[1.25rem] font-bold">
            {labels.choose}
          </h3>
        </div>

        <ul
          aria-labelledby={chooseId}
          className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2.5"
        >
          {words.map((word) => (
            <li key={word.id}>
              <button
                type="button"
                onClick={() => signWord(word)}
                className={cn(
                  "grid min-h-[3.75rem] w-full content-center justify-items-center gap-0.5 rounded-2xl border-3 border-plum",
                  "bg-paper px-1 py-2 text-plum shadow-press transition-[transform,box-shadow,background-color] duration-100",
                  "hover:bg-[#FFF6DA] active:translate-y-1 active:shadow-press-down"
                )}
              >
                <SignGlyph label={word.id} className="size-11" />
                <span lang="ar-TN" dir="rtl" className="font-display text-[1.35rem] font-bold leading-tight">
                  {word.word}
                </span>
                {word.gloss ? (
                  <span className="break-words text-[0.8rem] leading-tight text-plum-soft">{word.gloss}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <div
          role="group"
          aria-label={labels.sentenceLabel}
          aria-live="polite"
          className="flex min-h-[4.25rem] items-center rounded-[20px] border-3 border-dashed border-plum bg-paper p-3"
        >
          {sentence.length === 0 ? (
            <p className="mx-auto text-center text-[0.95rem] text-plum-soft">{labels.empty}</p>
          ) : (
            <ol lang="ar-TN" dir="rtl" className="flex w-full flex-wrap items-center gap-2">
              {sentence.map((item, index) => (
                <li
                  key={`${index}-${item.id}`}
                  className={cn(
                    "animate-chip-in rounded-[14px] border-[2.5px] border-plum px-3.5 py-1",
                    "font-display text-[1.25rem] font-bold leading-snug text-plum",
                    index === sentence.length - 1 ? "bg-mint" : "bg-lilac"
                  )}
                >
                  {item.word}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="sun" onClick={speakSentence} className="text-start">
            <Volume2 aria-hidden="true" className="size-6" strokeWidth={2.5} />
            {labels.speakDerja ? (
              <span className="grid justify-items-start gap-1">
                <span lang="ar-TN" dir="rtl">
                  {labels.speakDerja}
                </span>
                <span className="text-[0.85rem] font-semibold">{labels.speak}</span>
              </span>
            ) : (
              labels.speak
            )}
          </Button>
          <Button variant="paper" size="sm" onClick={startOver}>
            <RotateCcw aria-hidden="true" className="size-4 rtl:-scale-x-100" strokeWidth={2.5} />
            {labels.reset}
          </Button>
        </div>

        <p aria-live="polite" className="min-h-[1.6em] text-[0.95rem] text-plum-soft">
          {message}
        </p>
      </div>
    </div>
  );
}
