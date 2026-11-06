import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import logoMark from "@/public/logo-mark.png";

interface LogoProps {
  /** Tailwind height class for the mark, e.g. "h-14". */
  markClassName: string;
  /** Tailwind font-size class for the wordmark, e.g. "text-5xl". */
  textClassName: string;
  /** Accessible name; omit when the logo is purely decorative. */
  label?: string;
  className?: string;
}

/*
 * The mark file is a white glyph on a transparent background, so drawn as an
 * image it disappears on the light page. Used as a mask over the text
 * colour instead, it always matches the wordmark.
 *
 * The file is imported, not referenced from /public, so it is served from
 * /_next/static with a content hash: the service worker caches that path,
 * which keeps the logo visible offline.
 */
const MARK_MASK = `url(${logoMark.src}) center / contain no-repeat`;
const markStyle: CSSProperties = { mask: MARK_MASK, WebkitMask: MARK_MASK };

/** The "S" mark followed by the "outy" wordmark; together they read "Souty". */
export function Logo({ markClassName, textClassName, label, className }: LogoProps) {
  return (
    <span
      dir="ltr"
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("flex items-center gap-0.5 text-foreground", className)}
    >
      <span
        aria-hidden="true"
        style={markStyle}
        className={cn("aspect-[64/75] shrink-0 bg-current forced-color-adjust-none", markClassName)}
      />
      <span
        aria-hidden={label ? true : undefined}
        className={cn("font-display font-extrabold tracking-tight", textClassName)}
      >
        outy
      </span>
    </span>
  );
}
