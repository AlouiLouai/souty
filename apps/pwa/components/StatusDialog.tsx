import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusDialogProps {
  /** The big icon that says what happened. */
  icon: ReactNode;
  /** Arabic description, announced to screen readers; never shown (the app shows no text). */
  ariaLabel: string;
  /** Optional pictogram under the icon (what to do next). */
  children?: ReactNode;
  action?: ReactNode;
  /** Positioning/backdrop classes for the full-area wrapper. */
  className?: string;
}

/**
 * Centered card over a dimmed backdrop, shared by loading, error and idle
 * states. Pictures only: an icon, an optional pictogram, an icon button.
 */
export function StatusDialog({ icon, ariaLabel, children, action, className }: StatusDialogProps) {
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center bg-background/85 p-6", className)}>
      {/* A live region announces its text content, so the description is content, visually hidden. */}
      <span role="status" className="sr-only">
        {ariaLabel}
      </span>
      <div className="flex w-full max-w-xs animate-pop-in flex-col items-center gap-4 rounded-[1.5rem] border-2 border-border bg-card p-6 shadow-[5px_5px_0_var(--border)]">
        {icon}
        {children}
        {action}
      </div>
    </div>
  );
}
