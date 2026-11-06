import { Globe } from "@/components/illustrations/Globe";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LanguagePacks } from "@/components/vision/LanguagePacks";
import { PackSteps } from "@/components/vision/PackSteps";
import { localeTag } from "@/i18n/config";
import { sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const headingId = `${sectionIds.vision}-title`;
const stepsHeadingId = `${sectionIds.vision}-steps-title`;

/**
 * The long-term ambition: one app for every sign language. An abstract globe
 * sits beside the language packs grouped by rollout stage, followed by the
 * three steps that add a new language.
 */
export function Vision({ dict, locale }: SectionProps) {
  const { vision } = dict;

  return (
    <Section tone="sky" wave id={sectionIds.vision} aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        derja={locale === "ar" ? undefined : vision.derja}
        title={vision.title}
        lead={vision.lead}
      />

      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <Reveal className="mx-auto w-full max-w-[16.5rem] sm:max-w-[20rem] lg:max-w-[24rem]">
          <Globe label={vision.globeAlt} className="animate-bob" />
        </Reveal>
        <LanguagePacks
          packs={vision.packs}
          stageLabels={vision.stageLabels}
          morePacks={vision.morePacks}
          note={vision.packsNote}
          idPrefix={`${sectionIds.vision}-stage`}
        />
      </div>

      <PackSteps
        title={vision.howTitle}
        steps={vision.how}
        headingId={stepsHeadingId}
        numberLocale={localeTag[locale]}
      />
    </Section>
  );
}
