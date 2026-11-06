import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "paper" | "sun" | "mint" | "lilac" | "pink";

const tones: Record<Tone, string> = {
  paper: "bg-paper",
  sun: "bg-sun",
  mint: "bg-mint",
  lilac: "bg-lilac",
  pink: "bg-pink",
};

interface StickerProps extends ComponentProps<"span"> {
  tone?: Tone;
  /** Slight rotation, like a sticker slapped on the page. */
  tilt?: "left" | "right" | "none";
}

/** A small pill label with the hard ink shadow. Text is always plum ink. */
export function Sticker({ tone = "paper", tilt = "left", className, ...props }: StickerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[2.5px] border-plum px-3.5 py-1.5",
        "font-display text-[0.92rem] font-bold leading-tight text-plum shadow-hard-sm",
        tones[tone],
        tilt === "left" && "-rotate-2",
        tilt === "right" && "rotate-2",
        className
      )}
      {...props}
    />
  );
}
