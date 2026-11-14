"use client";

import { useState } from "react";
import {
  Building2,
  Hand,
  CalendarDays,
  Car,
  MessageCircle,
  ThumbsUp,
  Users,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import { SIGN_CATEGORIES, signsByCategory, type SignCategory } from "@souty/vocabulary";
import { SoundBars } from "@/components/Pictograms";
import { SignGlyph, hasGlyph } from "@/components/SignGlyph";
import { ValidatedMark, VoteButtons } from "@/components/VoteButtons";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/useSpeech";
import { useVotes } from "@/hooks/useVotes";
import { isValidated } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** One icon per vocabulary group; the Arabic name is for screen readers only. */
export const CATEGORY_ICONS: Record<SignCategory, { icon: LucideIcon; label: string }> = {
  requests: { icon: MessageCircle, label: "كلام وطلبات" },
  family: { icon: Users, label: "العايلة" },
  destinations: { icon: Building2, label: "البلايص" },
  days: { icon: CalendarDays, label: "الأيام" },
  transport: { icon: Car, label: "النقل" },
  universal: { icon: ThumbsUp, label: "إشارات عامة" },
};

interface SignGuideProps {
  onClose: () => void;
}

/**
 * Every sign Souty can read, grouped by an icon tab: the hand shape (when
 * one is known) and its word. Tapping a sign says its word, so a hearing
 * companion can check it too. Under each sign, two buttons say whether its
 * word is right; a word enough users agree on carries the blue mark.
 */
export default function SignGuide({ onClose }: SignGuideProps) {
  const [category, setCategory] = useState<SignCategory>(SIGN_CATEGORIES[0]!);
  const [active, setActive] = useState<string | null>(null);
  const speech = useSpeech();
  const votes = useVotes();
  const CategoryIcon = CATEGORY_ICONS[category].icon;

  return (
    <div className="safe-top safe-x safe-bottom mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 px-1 py-1">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-highlight text-highlight-foreground"
        >
          <CategoryIcon className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <Button variant="outline" size="icon" className="h-12 w-12" onClick={onClose} aria-label="سكّر">
          <X className="h-6 w-6" strokeWidth={2.6} />
        </Button>
      </header>

      <div
        role="tablist"
        aria-label="مجموعات الإشارات"
        dir="rtl"
        className="mt-2 flex shrink-0 gap-2 overflow-x-auto px-1 pb-2"
      >
        {SIGN_CATEGORIES.map((key) => {
          const { icon: Icon, label } = CATEGORY_ICONS[key];
          const selected = key === category;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={label}
              onClick={() => setCategory(key)}
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background shadow-[0_3px_0_var(--highlight)]"
                  : "border-border bg-card text-foreground"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2.2} />
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-label={CATEGORY_ICONS[category].label}
        dir="rtl"
        className="grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-2 overflow-y-auto px-1 pb-2 pt-1"
      >
        {/* Signs with a drawn hand shape first: they teach the most. */}
        {[...signsByCategory(category)]
          .sort((a, b) => Number(hasGlyph(b.label)) - Number(hasGlyph(a.label)))
          .map((sign) => {
          const playing = speech.speaking && active === sign.label;
          const word = sign.word;
          return (
            <div key={sign.label} className="relative">
            <button
              type="button"
              disabled={!speech.supported}
              onClick={() => {
                setActive(sign.label);
                speech.speak([word]);
              }}
              aria-label={`اسمع: ${word}`}
              className={cn(
                "relative flex w-full animate-fade-in-up flex-col items-center gap-1 rounded-2xl border-2 bg-card p-2 transition-transform active:scale-95 disabled:cursor-default",
                playing ? "border-highlight" : "border-border"
              )}
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-xl bg-secondary">
                {hasGlyph(sign.label) ? (
                  <SignGlyph label={sign.label} className="h-[85%] w-[85%]" />
                ) : (
                  // No drawing of this sign yet: an outlined hand in a dashed frame.
                  <span
                    aria-hidden="true"
                    className="flex h-[70%] w-[70%] items-center justify-center rounded-xl border-2 border-dashed border-foreground/50"
                  >
                    <Hand className="h-8 w-8 text-foreground/70" strokeWidth={2} />
                  </span>
                )}
              </span>
              <span lang="ar" className="w-full truncate text-center font-display text-lg font-extrabold leading-tight text-foreground">
                {word}
              </span>
              {votes.enabled && isValidated(votes.tallies[sign.label]) && (
                <ValidatedMark className="absolute right-1 top-1 h-7 w-7" />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
                  playing ? "bg-highlight text-highlight-foreground" : "bg-card/80 text-foreground/60"
                )}
              >
                {playing ? <SoundBars className="h-3 [&>span]:w-[2px]" /> : <Volume2 className="h-3.5 w-3.5" />}
              </span>
            </button>
            {/* Two small badges in the bottom corners of the picture, over the tile. */}
            {votes.enabled && (
              <VoteButtons
                label={sign.label}
                word={word}
                mine={votes.mine[sign.label]}
                className="pointer-events-none absolute inset-x-2.5 top-2.5 aspect-square items-end justify-between p-1"
              />
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
