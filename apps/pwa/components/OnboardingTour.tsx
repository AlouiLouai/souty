"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Delete,
  MessageSquareText,
  SwitchCamera,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { Flow, IconTile, TwoHands } from "@/components/Pictograms";
import ScannerWorkspace from "@/components/ScannerWorkspace";
import { Button } from "@/components/ui/button";
import { useSentence } from "@/hooks/useSentence";
import { gestureToWord } from "@/lib/gestureDictionary";

interface OnboardingTourProps {
  onFinish: () => void;
  onSkip: () => void;
}

interface Step {
  region: "video" | "footer";
  /** What the step teaches, as a picture. */
  picture: ReactNode;
  /** Arabic description of the picture, for screen readers only. */
  label: string;
  /** Classes positioning the spotlight over its target; omit for a centered message. */
  spotlightClass?: string;
  tooltipClass: string;
  arrow?: "up" | "down";
}

/** Pause after a step's action so the user sees the checkmark before moving on. */
const AUTO_ADVANCE_MS = 900;

/**
 * The ring the scanner draws over the hands, acted out: it spins (reading),
 * fills (the sign is being recognised), then turns green with a check
 * (the word is said).
 */
function RingDemo() {
  const r = 20;
  const length = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14" aria-hidden="true">
      <circle cx="28" cy="28" r={r + 5} fill="rgba(0,0,0,0.75)" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        strokeDasharray={length}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${length};${length * 0.7};${length * 0.7};0;0`}
          keyTimes="0;0.25;0.35;0.7;1"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke"
          values="#ffffff;#ffffff;#22d3ee;#22d3ee;#22bfa0;#22bfa0"
          keyTimes="0;0.3;0.35;0.68;0.7;1"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M19 29 l6 6 l12 -13"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0"
      >
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.7;0.72;1" dur="3s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

const STEPS: Step[] = [
  {
    region: "video",
    label: "حط يديك قدّام الكاميرا: الأيقونات هاذم يشعلو كي تبان يد",
    picture: (
      <div className="flex flex-col items-center gap-2">
        <ArrowUp className="h-6 w-6 animate-nudge-up text-foreground" strokeWidth={2.8} />
        <TwoHands iconClassName="h-9 w-9 text-highlight" animated />
      </div>
    ),
    spotlightClass: "left-2 top-2 h-12 w-[5.75rem] rounded-full",
    tooltipClass: "left-2 top-20 w-52",
    arrow: "up",
  },
  {
    region: "video",
    label: "اعمل إشارة بيد وحدة ولا بزوز وثبّتها حتى الدورة تكمل وتولّي خضراء",
    picture: (
      <Flow
        steps={[
          <IconTile key="hands" className="h-14 w-auto bg-highlight px-2 text-highlight-foreground">
            <TwoHands iconClassName="h-6 w-6" animated />
          </IconTile>,
          <RingDemo key="ring" />,
          <IconTile key="word" icon={MessageSquareText} />,
        ]}
      />
    ),
    // Low, over a light backdrop: the user must see the real ring over their hands.
    tooltipClass: "left-1/2 bottom-3 w-72 -translate-x-1/2",
  },
  {
    region: "video",
    label: "دوس هنا باش تبدّل بين الكاميرا الأمامية والخلفية",
    picture: <IconTile icon={SwitchCamera} className="h-16 w-16 bg-highlight text-highlight-foreground" iconClassName="h-8 w-8" />,
    spotlightClass: "right-2 top-2 h-14 w-14 rounded-full",
    tooltipClass: "right-2 top-20 w-40",
    arrow: "up",
  },
  {
    region: "footer",
    label: "الكلمات تتزاد هنا. دوس على كلمة تسمعها، ولا اسمع الجملة الكل، امسح آخر كلمة، ولا امسح الكل",
    picture: (
      <div dir="rtl" className="flex items-center gap-2">
        <IconTile icon={Volume2} className="bg-primary text-primary-foreground" />
        <IconTile icon={Delete} />
        {/* Two dots under the trash: it takes two taps. */}
        <span className="flex flex-col items-center gap-1">
          <IconTile icon={Trash2} className="bg-destructive text-destructive-foreground" />
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          </span>
        </span>
      </div>
    ),
    spotlightClass: "inset-0 rounded-2xl",
    tooltipClass: "left-1/2 bottom-full mb-3 w-64 -translate-x-1/2",
    arrow: "down",
  },
];

function StepOverlay({ step, done }: { step: Step; done: boolean }) {
  return (
    <>
      {step.spotlightClass ? (
        <div
          className={`pointer-events-none absolute z-30 shadow-[0_0_0_2000px_rgba(0,0,0,0.72)] ring-4 ring-highlight transition-all duration-300 ${step.spotlightClass}`}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 z-30 rounded-[1.5rem] bg-black/20" />
      )}
      <div className={`pointer-events-none absolute z-40 ${step.tooltipClass}`}>
        <span role="status" className="sr-only">
          {step.label}
        </span>
        {step.arrow === "up" && (
          <div className="mx-auto h-3 w-3 -translate-y-1/2 rotate-45 border-2 border-border bg-card" />
        )}
        <div
          key={done ? "done" : "todo"}
          className="flex animate-pop-in items-center justify-center rounded-[1.5rem] border-2 border-border bg-card p-4 shadow-[5px_5px_0_var(--border)]"
        >
          {done ? (
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-white"
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </span>
          ) : (
            step.picture
          )}
        </div>
        {step.arrow === "down" && (
          <div className="mx-auto flex flex-col items-center">
            <div className="h-3 w-3 -translate-y-1/2 rotate-45 border-2 border-border bg-card" />
            <ArrowDown aria-hidden="true" className="h-6 w-6 animate-bounce text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </>
  );
}

export default function OnboardingTour({ onFinish, onSkip }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [doneStep, setDoneStep] = useState<number | null>(null);
  const sentence = useSentence();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIndexRef = useRef(0);
  stepIndexRef.current = stepIndex;

  const isLastStep = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex]!;

  const handleNext = () => {
    if (timerRef.current) return; // already advancing
    if (isLastStep) onFinish();
    else setStepIndex((i) => i + 1);
  };

  /** Marks `index` as done and moves on shortly after; ignored for any other step. */
  const completeStep = useCallback(
    (index: number) => {
      if (stepIndexRef.current !== index || timerRef.current) return;
      setDoneStep(index);
      navigator.vibrate?.(30);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setDoneStep(null);
        if (index === STEPS.length - 1) onFinish();
        else setStepIndex(index + 1);
      }, AUTO_ADVANCE_MS);
    },
    [onFinish]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const hasWord = sentence.words.length > 0;
  // Depends on the step too: a word said while step 0 was still showing
  // must complete step 1 as soon as it becomes current.
  useEffect(() => {
    if (stepIndex === 1 && hasWord) completeStep(1);
  }, [stepIndex, hasWord, completeStep]);

  // The panel step pictures speak, undo and clear: give them a word to work
  // on, so they are not disabled if no sign was read during the tour.
  const { addWord } = sentence;
  const seededRef = useRef(false);
  useEffect(() => {
    if (stepIndex !== STEPS.length - 1 || hasWord || seededRef.current) return;
    seededRef.current = true;
    addWord(gestureToWord("3aslema"));
  }, [stepIndex, hasWord, addWord]);

  return (
    <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <div className="relative z-50 flex shrink-0 items-center justify-end px-1 py-1">
        <Button variant="outline" size="icon" className="h-11 w-11" onClick={onSkip} aria-label="فوّت الشرح">
          <X className="h-5 w-5" strokeWidth={2.8} />
        </Button>
      </div>

      <ScannerWorkspace
        sentence={sentence}
        paused={paused}
        onTogglePaused={() => setPaused((p) => !p)}
        onHandPresenceChange={(present) => {
          if (present) completeStep(0);
        }}
        onCameraSwitched={() => completeStep(2)}
        onPanelAction={() => completeStep(3)}
        scannerOverlay={step.region === "video" && <StepOverlay step={step} done={doneStep === stepIndex} />}
        panelOverlay={step.region === "footer" && <StepOverlay step={step} done={doneStep === stepIndex} />}
      />

      <div dir="rtl" className="relative z-50 flex shrink-0 items-center gap-1.5 px-1 py-3" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-foreground" : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="relative z-50 flex shrink-0 justify-center px-1 pb-3">
        <Button
          onClick={handleNext}
          size="icon"
          className="h-16 w-16"
          aria-label={isLastStep ? "ابدأ توّا" : "اللي بعدو"}
        >
          {isLastStep ? (
            <Check className="h-8 w-8" strokeWidth={3} />
          ) : (
            <ArrowLeft className="h-8 w-8 animate-nudge" strokeWidth={2.8} />
          )}
        </Button>
      </div>
    </div>
  );
}
