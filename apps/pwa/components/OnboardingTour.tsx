"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Check, Hand, MessageSquareText, RefreshCw, X } from "lucide-react";
import ScannerWorkspace from "@/components/ScannerWorkspace";
import { Button } from "@/components/ui/button";
import { useSentence } from "@/hooks/useSentence";

interface OnboardingTourProps {
  onFinish: () => void;
  onSkip: () => void;
}

interface Step {
  region: "video" | "footer";
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  /** Classes positioning the spotlight over its target; omit for a centered message. */
  spotlightClass?: string;
  tooltipClass: string;
  arrow?: "up" | "down";
}

/** Pause after a step's action so the user sees the checkmark before moving on. */
const AUTO_ADVANCE_MS = 900;

const STEPS: Step[] = [
  {
    region: "video",
    icon: Hand,
    title: "أعمل إشارة",
    text: "حط يدك قدام الكاميرا وأعمل إشارة، وثبتها شوية وقت باش تتسجل",
    tooltipClass: "left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2",
  },
  {
    region: "video",
    icon: RefreshCw,
    title: "بدّل الكاميرا",
    text: "دوس هنا باش تبدّل بين الكاميرا الأمامية والخلفية",
    spotlightClass: "right-2 top-2 h-12 w-12 rounded-xl",
    tooltipClass: "left-1/2 top-20 w-60 -translate-x-1/2",
    arrow: "up",
  },
  {
    region: "footer",
    icon: MessageSquareText,
    title: "الجملة والتحكم",
    text: "الكلمة تتزاد في الجملة هنا، ومن تحت تنجم توقف المسح أو تسمع الجملة أو تمسحها",
    spotlightClass: "inset-0 rounded-2xl",
    tooltipClass: "left-1/2 bottom-full mb-3 w-64 -translate-x-1/2",
    arrow: "down",
  },
];

function StepOverlay({ step, done }: { step: Step; done: boolean }) {
  const Icon = done ? Check : step.icon;
  return (
    <>
      {step.spotlightClass ? (
        <div
          className={`pointer-events-none absolute z-30 shadow-[0_0_0_2000px_rgba(0,0,0,0.72)] ring-2 ring-highlight/90 transition-all duration-300 ${step.spotlightClass}`}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 z-30 bg-black/60" />
      )}
      <div className={`absolute z-40 ${step.tooltipClass}`}>
        {step.arrow === "up" && (
          <div className="mx-auto h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-2 border-border bg-card" />
        )}
        <div className="rounded-[1.5rem] border-2 border-border bg-card p-4 text-center shadow-[5px_5px_0_var(--border)]">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-highlight text-highlight-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <p dir="rtl" className="font-display text-sm font-bold text-foreground">
            {step.title}
          </p>
          <p dir="rtl" className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {step.text}
          </p>
        </div>
        {step.arrow === "down" && (
          <div className="mx-auto h-2.5 w-2.5 translate-y-1/2 rotate-45 border-2 border-border bg-card" />
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
  const step = STEPS[stepIndex];

  const handleNext = () => {
    if (isLastStep) onFinish();
    else setStepIndex((i) => i + 1);
  };

  /** Marks `index` as done and moves on shortly after; ignored for any other step. */
  const completeStep = useCallback(
    (index: number) => {
      if (stepIndexRef.current !== index || timerRef.current) return;
      setDoneStep(index);
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
  useEffect(() => {
    if (hasWord) completeStep(0);
  }, [hasWord, completeStep]);

  return (
    <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <div className="relative z-50 flex shrink-0 items-center justify-end px-1 py-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="gap-1 text-muted-foreground"
        >
          تخطي
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScannerWorkspace
        sentence={sentence}
        paused={paused}
        onTogglePaused={() => setPaused((p) => !p)}
        onCameraSwitched={() => completeStep(1)}
        onPanelAction={() => completeStep(2)}
        scannerOverlay={
          step.region === "video" && <StepOverlay step={step} done={doneStep === stepIndex} />
        }
        panelOverlay={
          step.region === "footer" && <StepOverlay step={step} done={doneStep === stepIndex} />
        }
      />

      <div className="relative z-50 flex shrink-0 items-center gap-1.5 px-1 py-3">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-foreground" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="relative z-50 shrink-0 px-1 pb-3">
        <Button onClick={handleNext} size="lg" className="w-full">
          {isLastStep ? "ابدأ الآن" : "التالي"}
        </Button>
      </div>
    </div>
  );
}
