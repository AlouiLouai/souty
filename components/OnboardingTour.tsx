"use client";

import { useCallback, useState } from "react";
import { Hand, MessageSquareText, RefreshCw, X } from "lucide-react";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/useSpeech";

interface OnboardingTourProps {
  onFinish: () => void;
  onSkip: () => void;
}

type Region = "video" | "footer";

interface Step {
  region: Region;
  icon: typeof Hand;
  title: string;
  text: string;
  // Spotlight box matching the real target's position exactly (Tailwind
  // classes) - undefined means "no specific target" (step 1: a plain
  // centered message, since there's nothing precise to point at yet).
  spotlightClass?: string;
  tooltipClass: string;
  arrow?: "up" | "down";
}

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
    // Matches the real flip-camera button's own position exactly
    // (top-3 right-3, 44x44px) with a small margin around it.
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

function StepOverlay({ step }: { step: Step }) {
  const Icon = step.icon;
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
          <div className="mx-auto h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-card" />
        )}
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-xl">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
            <Icon className="h-4 w-4" />
          </div>
          <p dir="rtl" className="text-sm font-semibold text-foreground">
            {step.title}
          </p>
          <p dir="rtl" className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {step.text}
          </p>
        </div>
        {step.arrow === "down" && (
          <div className="mx-auto h-2.5 w-2.5 translate-y-1/2 rotate-45 bg-card" />
        )}
      </div>
    </>
  );
}

export default function OnboardingTour({ onFinish, onSkip }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  const { supported: speechSupported, speakSentence } = useSpeech();

  const handleLocked = useCallback((word: string) => {
    setSentenceWords((prev) => [...prev, word]);
  }, []);

  const isLastStep = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

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

      <div className="relative min-h-0 flex-1">
        <GestureScanner
          className="h-full w-full"
          paused={paused}
          onLocked={handleLocked}
        />
        {step.region === "video" && <StepOverlay step={step} />}
      </div>

      <div className="relative mt-3 shrink-0">
        <TranslationPanel
          sentenceWords={sentenceWords}
          speechSupported={speechSupported}
          paused={paused}
          onTogglePaused={() => setPaused((p) => !p)}
          onRemoveLastWord={() => setSentenceWords((prev) => prev.slice(0, -1))}
          onClearSentence={() => setSentenceWords([])}
          onSpeakSentence={speakSentence}
        />
        {step.region === "footer" && <StepOverlay step={step} />}
      </div>

      {/* z-50 + relative: must stay above the spotlight overlay's dimming
          (z-30/z-40), otherwise it'd render dimmed/covered despite being
          the control the user needs to tap next. */}
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
