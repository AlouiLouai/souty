import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type Tone = "paper" | "sky" | "sun" | "mint" | "lilac" | "pink" | "cream";

const tones: Record<Tone, string> = {
  paper: "bg-paper",
  sky: "bg-sky",
  sun: "bg-sun",
  mint: "bg-[#DDF8F1]",
  lilac: "bg-[#E7E0FF]",
  pink: "bg-[#FFE4EC]",
  cream: "bg-[#FFF3D6]",
};

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: Tone;
  /** Shadow depth. */
  depth?: "sm" | "md" | "lg";
} & Omit<ComponentProps<T>, "as">;

const depths = { sm: "shadow-hard-sm", md: "shadow-hard", lg: "shadow-hard-lg" } as const;

/**
 * The picture-book card: thick ink border, rounded corners, hard shadow.
 * Text inside is plum ink on every tone.
 */
export function Card<T extends ElementType = "div">({
  as,
  tone = "paper",
  depth = "md",
  className,
  ...props
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn("rounded-3xl border-3 border-plum text-plum", tones[tone], depths[depth], className)}
      {...props}
    />
  );
}
