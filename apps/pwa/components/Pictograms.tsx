/**
 * The app's picture language. Souty shows no text except the signed words,
 * so every instruction is one of these drawings, built from the same few
 * icons everywhere: two hands = "sign", a speaker = "it is spoken", an
 * arrow = "this leads to that".
 *
 * Every pictogram is decorative (`aria-hidden`); the control or region
 * that holds it carries the Arabic `aria-label` for screen readers.
 */
import { ArrowLeft, Hand, type LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Two open hands, left one mirrored, so they read as a pair. */
export function TwoHands({
  className,
  iconClassName = "h-7 w-7",
  animated = false,
}: {
  className?: string;
  iconClassName?: string;
  animated?: boolean;
}) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-end gap-1", className)}>
      <Hand
        className={cn("-scale-x-100", iconClassName, animated && "origin-bottom animate-wave")}
        strokeWidth={2.2}
      />
      <Hand
        className={cn(iconClassName, animated && "origin-bottom animate-wave [animation-delay:300ms]")}
        strokeWidth={2.2}
      />
    </span>
  );
}

/** A round icon tile, the building block of every pictogram. */
export function IconTile({
  icon: Icon,
  className,
  iconClassName = "h-6 w-6",
  children,
}: {
  icon?: LucideIcon;
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-foreground",
        className
      )}
    >
      {Icon ? <Icon className={iconClassName} strokeWidth={2.2} /> : children}
    </span>
  );
}

/**
 * Steps joined by arrows, in reading order (right to left, like the rest
 * of the app). Each step is any node, usually an `IconTile`.
 */
export function Flow({ steps, className }: { steps: ReactNode[]; className?: string }) {
  return (
    <div dir="rtl" aria-hidden="true" className={cn("flex items-center justify-center gap-1.5", className)}>
      {steps.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && <ArrowLeft className="h-5 w-5 shrink-0 text-foreground/60" strokeWidth={2.6} />}
          {step}
        </Fragment>
      ))}
    </div>
  );
}

/** Animated bars next to the speaker while the sentence is spoken. */
export function SoundBars({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-5 items-center gap-[3px]", className)}>
      {[0, 150, 300, 450].map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="h-full w-[3px] origin-center animate-sound-bar rounded-full bg-current"
        />
      ))}
    </span>
  );
}
