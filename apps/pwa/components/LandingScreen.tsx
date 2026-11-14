"use client";

import { BookOpen, Camera, Check, CircleHelp, MessageSquareText, ShieldCheck, Volume2, WifiOff } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Flow, IconTile, TwoHands } from "@/components/Pictograms";
import { Button } from "@/components/ui/button";

interface LandingScreenProps {
  onStart: () => void;
  onOnboarding: () => void;
  onGuide: () => void;
}

/**
 * Home: what Souty does, as a picture (hands, then words, then a voice),
 * that it stays on the phone and works offline, and three icon buttons:
 * start, the guided tour, and the list of signs.
 */
export default function LandingScreen({ onStart, onOnboarding, onGuide }: LandingScreenProps) {
  return (
    <div className="safe-top safe-x safe-bottom relative mx-auto flex h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-10 overflow-hidden px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[14%] h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_90_60/0.22),transparent)]"
      />

      <div className="relative animate-fade-in-up">
        <LogoMark className="h-20" ariaLabel="Souty" />
      </div>

      <div
        role="img"
        aria-label="اعمل إشارة بيديك، تولّي كلمات، والتطبيق ينطقها"
        style={{ animationDelay: "100ms" }}
        className="relative flex w-full animate-fade-in-up flex-col items-center gap-4"
      >
        <Flow
          steps={[
            <IconTile key="hands" className="h-16 w-auto bg-highlight px-3 text-highlight-foreground">
              <TwoHands iconClassName="h-7 w-7" animated />
            </IconTile>,
            <IconTile key="words" icon={MessageSquareText} className="h-16 w-16" iconClassName="h-7 w-7" />,
            <IconTile key="voice" icon={Volume2} className="h-16 w-16" iconClassName="h-7 w-7" />,
          ]}
        />
        {/* Benefits, not errors: each wears a green check (private; works offline). */}
        <div aria-hidden="true" className="flex items-center gap-4 text-foreground/80">
          {[ShieldCheck, WifiOff].map((Icon, i) => (
            <span key={i} className="relative">
              <Icon className="h-7 w-7" strokeWidth={2.2} />
              <Check
                className="absolute -bottom-1 -right-1.5 h-4 w-4 rounded-full bg-mint p-0.5 text-white"
                strokeWidth={4}
              />
            </span>
          ))}
        </div>
      </div>

      <div style={{ animationDelay: "250ms" }} className="relative flex animate-fade-in-up flex-col items-center gap-6">
        <span className="relative flex">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-duration:2s]"
          />
          <Button onClick={onStart} size="icon" className="relative h-28 w-28" aria-label="ابدأ">
            <Camera className="h-12 w-12" strokeWidth={2.2} />
          </Button>
        </span>

        <div dir="rtl" className="flex items-center gap-4">
          <Button
            onClick={onOnboarding}
            variant="outline"
            size="icon"
            className="h-16 w-16"
            aria-label="كيفاش نستعملها؟"
          >
            <CircleHelp className="h-8 w-8" strokeWidth={2.2} />
          </Button>
          <Button
            onClick={onGuide}
            variant="outline"
            size="icon"
            className="h-16 w-16"
            aria-label="الإشارات اللي يعرفها التطبيق"
          >
            <BookOpen className="h-8 w-8" strokeWidth={2.2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
