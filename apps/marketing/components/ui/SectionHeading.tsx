import { cn } from "@/lib/cn";
import { Squiggle } from "./Squiggle";

interface SectionHeadingProps {
  /** Id for the <h2>; pass the same value to the section's aria-labelledby. */
  id: string;
  /**
   * Tunisian Arabic line shown above the title on the English and French
   * pages: Souty's voice, and a brand signature. Omitted on the Arabic page,
   * where the title itself is Arabic.
   */
  derja?: string;
  title: string;
  lead?: string;
  align?: "center" | "start";
  /** Use on plum sections. */
  inverted?: boolean;
  className?: string;
}

/**
 * Standard section header: optional Derja line, the <h2>, a squiggle and an
 * optional lead paragraph.
 */
export function SectionHeading({
  id,
  derja,
  title,
  lead,
  align = "center",
  inverted = false,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-10 grid gap-3 sm:mb-12",
        centered ? "justify-items-center text-center" : "justify-items-start text-start",
        className
      )}
    >
      {derja ? (
        <p
          lang="ar-TN"
          dir="rtl"
          className={cn(
            "font-display text-[clamp(1.5rem,3.4vw,2.1rem)] font-extrabold leading-snug",
            inverted ? "text-sun" : "text-plum-soft"
          )}
        >
          {derja}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          "max-w-[22ch] text-[clamp(2rem,5vw,3.25rem)] font-extrabold",
          inverted ? "text-white" : "text-plum"
        )}
      >
        {title}
      </h2>
      <Squiggle className={inverted ? "text-sun" : "text-harissa"} />
      {lead ? (
        <p
          className={cn(
            "max-w-[60ch] text-[1.125rem] sm:text-[1.2rem]",
            inverted ? "text-[#D9D0F0]" : "text-plum-soft"
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
