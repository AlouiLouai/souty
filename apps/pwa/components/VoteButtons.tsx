"use client";

import { BadgeCheck, Check, X } from "lucide-react";
import { castVote } from "@/lib/votes";
import type { Vote } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** The blue mark of a sign whose word the community has validated. */
export function ValidatedMark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="كلمة مأكّدة من المستعملين" className={cn("inline-flex text-[#1D9BF0]", className)}>
      <BadgeCheck className="h-full w-full fill-current stroke-white" strokeWidth={2.2} />
    </span>
  );
}

interface VoteButtonsProps {
  label: string;
  /** `badge`: small round badges like the speaker mark on a sign tile. `pill`: a little larger, for the camera. */
  size?: "badge" | "pill";
  /** The word being judged, for screen readers. */
  word: string;
  mine: Vote | undefined;
  onVoted?: () => void;
  className?: string;
}

/**
 * "This word is right" / "this word is wrong", as two small icon buttons. The
 * touch area is larger than the drawn badge (the pseudo-element), so a small
 * mark is still easy to hit.
 */
export function VoteButtons({ label, word, size = "badge", mine, onVoted, className }: VoteButtonsProps) {
  const vote = (value: Vote) => {
    castVote(label, value);
    navigator.vibrate?.(20);
    onVoted?.();
  };
  const badge = size === "badge";
  const base = cn(
    "pointer-events-auto relative flex items-center justify-center rounded-full transition-transform active:scale-90 after:absolute after:content-['']",
    badge ? "h-6 w-6 after:-inset-2.5" : "h-8 w-8 border-2 border-foreground after:-inset-1.5"
  );
  const idle = badge ? "bg-card/80 text-foreground/60" : "bg-card text-foreground";
  const icon = badge ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={cn("flex items-center justify-center gap-1.5", className)}>
      <button
        type="button"
        onClick={() => vote("yes")}
        aria-pressed={mine === "yes"}
        aria-label={`الكلمة صحيحة: ${word}`}
        className={cn(base, mine === "yes" ? "bg-mint text-white" : idle)}
      >
        <Check className={icon} strokeWidth={3} />
      </button>
      <button
        type="button"
        onClick={() => vote("no")}
        aria-pressed={mine === "no"}
        aria-label={`الكلمة غالطة: ${word}`}
        className={cn(base, mine === "no" ? "bg-destructive text-destructive-foreground" : idle)}
      >
        <X className={icon} strokeWidth={3} />
      </button>
    </span>
  );
}
