import { cn } from "@/lib/cn";

/** Decorative hand-drawn underline. Colored with `text-*`. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-[120px]", className)}
      viewBox="0 0 120 14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 7q10-10 20 0t20 0 20 0 20 0 20 0 20 0"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
