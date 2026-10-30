"use client";

import { Hand, ShieldCheck, Volume2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface LandingScreenProps {
  onStart: () => void;
  onOnboarding: () => void;
}

const FEATURES = [
  {
    icon: Hand,
    text: "أعمل إشارة بيدك قدام الكاميرا وتتبدل لكلمة توا بالتوا",
  },
  {
    icon: Volume2,
    text: "التطبيق ينطق الجملة اللي كوّنتها بصوت عربي",
  },
  {
    icon: ShieldCheck,
    text: "خصوصية تامة: ما فماش حاجة تخرج من جهازك",
  },
];

export default function LandingScreen({ onStart, onOnboarding }: LandingScreenProps) {
  return (
    <div className="safe-top safe-x safe-bottom relative mx-auto flex h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-9 overflow-hidden px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[18%] h-56 w-56 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative flex animate-fade-in-up flex-col items-center gap-3 text-center">
        <Logo markClassName="h-14" textClassName="text-5xl" />
        <p dir="rtl" className="text-sm text-muted-foreground">
          كوّن جملة بلغة الإشارة والتطبيق ينطقها بالعربي
        </p>
      </div>

      <div className="relative flex w-full flex-col gap-2.5">
        {FEATURES.map(({ icon: Icon, text }, i) => (
          <div
            key={text}
            style={{ animationDelay: `${100 + i * 80}ms` }}
            className="flex animate-fade-in-up items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-[3px_3px_0_var(--border)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
            <p dir="rtl" className="text-sm text-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{ animationDelay: "380ms" }}
        className="relative flex w-full animate-fade-in-up flex-col gap-2"
      >
        <Button onClick={onStart} size="lg" className="w-full">
          ابدأ الاستخدام
        </Button>
        <Button onClick={onOnboarding} variant="outline" size="lg" className="w-full">
          كيفاش نستعملها؟
        </Button>
      </div>
    </div>
  );
}
