import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Tone = "ink" | "white";
type Size = "md" | "lg";

interface LogoProps {
  /**
   * Accessible name. Omit when a parent already names the logo (a link with
   * its own aria-label), so it is not announced twice.
   */
  label?: string;
  /** Ink on light surfaces, white on plum. */
  tone?: Tone;
  size?: Size;
  className?: string;
}

/*
 * The mark file is a white glyph on a transparent background. Used as a mask
 * over the current text colour, the one file serves both tones and always
 * matches the wordmark exactly.
 */
const MARK_MASK = "url(/logo-mark.png) center / contain no-repeat";
const markStyle: CSSProperties = { mask: MARK_MASK, WebkitMask: MARK_MASK };

const tones: Record<Tone, string> = {
  ink: "text-plum",
  white: "text-white",
};

const sizes: Record<Size, { mark: string; word: string }> = {
  md: { mark: "h-10", word: "text-[1.75rem]" },
  lg: { mark: "h-12", word: "text-[2.1rem]" },
};

/**
 * The Souty logo: the "S" mark followed by the "outy" wordmark, which read
 * together as "Souty". Always laid out left to right, in every locale.
 */
export function Logo({ label, tone = "ink", size = "md", className }: LogoProps) {
  return (
    <span
      dir="ltr"
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", tones[tone], className)}
    >
      <span
        aria-hidden="true"
        style={markStyle}
        className={cn("aspect-[64/75] shrink-0 bg-current forced-color-adjust-none", sizes[size].mark)}
      />
      <span
        aria-hidden="true"
        className={cn("font-display font-extrabold leading-none tracking-tight", sizes[size].word)}
      >
        outy
      </span>
    </span>
  );
}
