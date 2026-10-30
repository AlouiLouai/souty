import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Tailwind height class for the mark, e.g. "h-14". */
  markClassName: string;
  /** Tailwind font-size class for the wordmark, e.g. "text-5xl". */
  textClassName: string;
  /** Accessible name; omit when the logo is purely decorative. */
  label?: string;
  priority?: boolean;
  className?: string;
}

// The "S" mark image followed by the "outy" wordmark.
export function Logo({ markClassName, textClassName, label, priority, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      <Image
        src="/logo-mark.png"
        alt={label ?? ""}
        width={69}
        height={78}
        className={cn("w-auto", markClassName)}
        priority={priority}
      />
      <span
        aria-hidden={label ? true : undefined}
        className={cn("font-display font-extrabold tracking-tight text-foreground", textClassName)}
      >
        outy
      </span>
    </span>
  );
}
