import { RoadmapExtras } from "@/components/roadmap/RoadmapExtras";
import { Timeline } from "@/components/roadmap/Timeline";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const headingId = `${sectionIds.roadmap}-title`;
const extrasHeadingId = `${sectionIds.roadmap}-extras-title`;

/**
 * Where Souty goes next: a timeline from the 33 signs shipped today to every
 * sign language in the world, followed by six further milestones.
 */
export function Roadmap({ dict, locale }: SectionProps) {
  const { roadmap } = dict;

  return (
    <Section tone="paper" wave id={sectionIds.roadmap} aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        derja={locale === "ar" ? undefined : roadmap.derja}
        title={roadmap.title}
        lead={roadmap.lead}
      />
      <Timeline
        milestones={roadmap.milestones}
        statusLabels={roadmap.statusLabels}
        nowLabel={roadmap.nowLabel}
        labelledBy={headingId}
      />
      <RoadmapExtras
        title={roadmap.extrasTitle}
        lead={roadmap.extrasLead}
        extras={roadmap.extras}
        headingId={extrasHeadingId}
      />
    </Section>
  );
}
