import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import logoMark from "@/public/logo-mark.png";

/*
 * The mark file is a white glyph on a transparent background, so drawn as an
 * image it disappears on the light page. Used as a mask over the text
 * colour instead, it always matches the foreground.
 *
 * The file is imported, not referenced from /public, so it is served from
 * /_next/static with a content hash: the service worker caches that path,
 * which keeps the logo visible offline.
 */
const MARK_MASK = `url(${logoMark.src}) center / contain no-repeat`;
const markStyle: CSSProperties = { mask: MARK_MASK, WebkitMask: MARK_MASK };

/**
 * The "S" mark alone. The app shows no text besides the signed words, so
 * there is no wordmark; `ariaLabel` names the mark for screen readers.
 */
export function LogoMark({ className, ariaLabel }: { className?: string; ariaLabel?: string }) {
  return (
    <span
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={markStyle}
      className={cn("block aspect-[64/75] shrink-0 bg-current text-foreground forced-color-adjust-none", className)}
    />
  );
}
