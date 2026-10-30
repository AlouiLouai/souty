import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusDialogProps {
  icon: ReactNode;
  title: ReactNode;
  /** Overrides the default title typography. */
  titleClassName?: string;
  message?: ReactNode;
  action?: ReactNode;
  /** Positioning/backdrop classes for the full-area wrapper. */
  className?: string;
}

// Centered card over a blurred backdrop - shared by loading, error and
// idle-reminder states.
export function StatusDialog({
  icon,
  title,
  titleClassName = "font-display text-base font-bold",
  message,
  action,
  className,
}: StatusDialogProps) {
  return (
    <div
      role="status"
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm",
        className
      )}
    >
      <div className="w-full max-w-xs rounded-[1.5rem] border-2 border-border bg-card p-6 text-center shadow-[5px_5px_0_var(--border)]">
        {icon}
        <p dir="rtl" className={cn("text-foreground", titleClassName)}>
          {title}
        </p>
        {message && (
          <p dir="rtl" className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {message}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
