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
  /** The word being judged, for screen readers. */
  word: string;
  mine: Vote | undefined;
  onVoted?: () => void;
  className?: string;
}

/** "This word is right" / "this word is wrong", as two icon buttons. */
export function VoteButtons({ label, word, mine, onVoted, className }: VoteButtonsProps) {
  const vote = (value: Vote) => {
    castVote(label, value);
    navigator.vibrate?.(20);
    onVoted?.();
  };
  const base =
    "flex h-11 w-11 items-center justify-center rounded-full border-2 border-foreground transition-transform active:scale-90";

  return (
    <span className={cn("flex items-center justify-center gap-2", className)}>
      <button
        type="button"
        onClick={() => vote("yes")}
        aria-pressed={mine === "yes"}
        aria-label={`الكلمة صحيحة: ${word}`}
        className={cn(base, mine === "yes" ? "bg-mint text-white" : "bg-card text-foreground")}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
      <button
        type="button"
        onClick={() => vote("no")}
        aria-pressed={mine === "no"}
        aria-label={`الكلمة غالطة: ${word}`}
        className={cn(base, mine === "no" ? "bg-destructive text-destructive-foreground" : "bg-card text-foreground")}
      >
        <X className="h-5 w-5" strokeWidth={3} />
      </button>
    </span>
  );
}
