import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type Tone = "sky" | "paper" | "plum";

const tones: Record<Tone, string> = {
  sky: "bg-sky text-plum",
  paper: "bg-paper text-plum",
  plum: "bg-plum text-white",
};

interface SectionProps extends ComponentProps<"section"> {
  tone?: Tone;
  /** Scalloped top edge; use where this section's tone differs from the previous one. */
  wave?: boolean;
  containerClassName?: string;
}

/**
 * One full-width band of the page. Alternate tones (sky / paper) down the
 * page and give each section an `id` from `sectionIds` so the header can
 * link to it. Label it with `aria-labelledby` pointing at its heading.
 */
export function Section({
  tone = "sky",
  wave = false,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-[clamp(4rem,9vw,7rem)]", tones[tone], wave && "wave-top", className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
