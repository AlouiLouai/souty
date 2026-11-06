import { DifferenceTable } from "@/components/proof/DifferenceTable";
import { FloatingHearts } from "@/components/proof/FloatingHearts";
import { TrustPoints } from "@/components/proof/TrustPoints";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const storyHeadingId = `${sectionIds.proof}-title`;
const trustHeadingId = `${sectionIds.proof}-trust-title`;
const differenceHeadingId = `${sectionIds.proof}-difference-title`;

/**
 * The proof, in two bands: the true story of the first deaf person who tried
 * Souty, then the reasons to trust the product and how it differs from
 * typical sign-language tools.
 */
export function Proof({ dict, locale }: SectionProps) {
  const { proof } = dict;

  return (
    <>
      <Section tone="plum" wave id={sectionIds.proof} aria-labelledby={storyHeadingId}>
        <FloatingHearts />
        <Reveal className="relative">
          <SectionHeading
            id={storyHeadingId}
            derja={locale === "ar" ? undefined : proof.derja}
            title={proof.title}
            inverted
          />
          <p className="mx-auto max-w-[26ch] text-center font-display text-[clamp(1.5rem,3.6vw,2.4rem)] font-bold leading-[1.35]">
            {proof.quote.before}
            <mark className="bg-transparent text-sun">{proof.quote.highlight}</mark>
            {proof.quote.after}
          </p>
          <p className="mx-auto mt-6 max-w-[54ch] text-center text-[#D9D0F0]">{proof.body}</p>
        </Reveal>
      </Section>

      <Section tone="sky" wave aria-labelledby={trustHeadingId}>
        <h3
          id={trustHeadingId}
          className="mx-auto mb-10 max-w-[24ch] text-center text-[clamp(1.6rem,3.8vw,2.25rem)] font-extrabold"
        >
          {proof.pointsTitle}
        </h3>
        <TrustPoints points={proof.points} labelledBy={trustHeadingId} />
        <Reveal className="mt-14 sm:mt-20">
          <DifferenceTable difference={proof.difference} headingId={differenceHeadingId} />
        </Reveal>
      </Section>
    </>
  );
}
