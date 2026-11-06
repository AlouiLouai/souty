import { ArrowDown, MessageCircleQuestionMark, PencilOff, UsersRound } from "lucide-react";
import { ComicPanel, SamiAtTheDesk } from "@/components/illustrations/SamiComic";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const HEADING_ID = "problem-title";
const STAGGER_MS = 90;

/** Card look per statistic, in order. */
const statStyles = [
  { tone: "cream", tilt: "-rotate-1" },
  { tone: "mint", tilt: "rotate-1" },
  { tone: "lilac", tilt: "-rotate-1" },
] as const;

/** Icon and badge colour per wall, in order: staff, writing, dependence. */
const wallStyles = [
  { Icon: MessageCircleQuestionMark, badge: "bg-sun" },
  { Icon: PencilOff, badge: "bg-pink" },
  { Icon: UsersRound, badge: "bg-lilac" },
] as const;

const groupTitleClassName = "text-[clamp(1.5rem,3.6vw,2.1rem)] font-extrabold";

/**
 * The problem, first: three sourced numbers, the three walls a deaf person
 * meets at any service desk, then the first panel of Sami's comic, which
 * the Idea section finishes.
 */
export function Problem({ dict, locale }: SectionProps) {
  const copy = dict.problem;
  // Tunisian Arabic lines accompany English and French; the Arabic page is already Arabic.
  const showDerja = locale !== "ar";

  return (
    <Section tone="paper" wave id={sectionIds.problem} aria-labelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        derja={showDerja ? copy.derja : undefined}
        title={copy.title}
        lead={copy.lead}
      />

      <ul role="list" aria-label={copy.statsLabel} className="grid gap-6 md:grid-cols-3">
        {copy.stats.map((stat, index) => {
          const style = statStyles[index % statStyles.length] ?? statStyles[0];
          return (
            <li key={stat.label}>
              <Reveal delay={index * STAGGER_MS} className="h-full">
                <Card
                  tone={style.tone}
                  className={cn(
                    "flex h-full flex-col gap-2 p-6 transition-transform duration-300 hover:rotate-0",
                    style.tilt
                  )}
                >
                  <p className="font-display text-[clamp(3rem,8vw,4rem)] font-extrabold leading-none">{stat.value}</p>
                  <p className="font-display text-[1.35rem] font-bold leading-tight">{stat.unit}</p>
                  <p>{stat.label}</p>
                  <p className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-1 text-[0.9rem] text-plum-soft">
                    {copy.sourceLabel}
                    <a
                      href={stat.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center font-semibold text-plum underline decoration-2 underline-offset-4"
                    >
                      {stat.source}
                      <span className="sr-only"> {copy.newTabHint}</span>
                    </a>
                  </p>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <h3 className={cn(groupTitleClassName, "mb-8 mt-16 text-center sm:mt-20")}>{copy.barriersTitle}</h3>
      <ul role="list" className="grid gap-6 lg:grid-cols-3">
        {copy.barriers.map((barrier, index) => {
          const { Icon, badge } = wallStyles[index % wallStyles.length] ?? wallStyles[0];
          return (
            <li key={barrier.title}>
              <Reveal delay={index * STAGGER_MS} className="h-full">
                <Card className="flex h-full items-start gap-4 p-5 sm:p-6 lg:flex-col">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-full border-3 border-plum shadow-hard-sm sm:size-14",
                      badge
                    )}
                  >
                    <Icon className="size-6 sm:size-7" strokeWidth={2.5} />
                  </span>
                  <div className="grid min-w-0 gap-1.5">
                    <h4 className="text-[1.3rem] font-bold">{barrier.title}</h4>
                    <p className="text-plum-soft">{barrier.body}</p>
                  </div>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <div className="mx-auto mt-16 grid max-w-[460px] justify-items-center gap-6 sm:mt-20">
        <div className="grid justify-items-center gap-2 text-center">
          {showDerja ? (
            <p lang="ar-TN" dir="rtl" className="font-display text-[1.5rem] font-extrabold leading-snug text-plum-soft">
              {copy.story.titleDerja}
            </p>
          ) : null}
          <h3 className={groupTitleClassName}>{copy.story.title}</h3>
          <p className="text-[1.125rem] text-plum-soft">{copy.story.intro}</p>
        </div>
        <Reveal className="w-full">
          <ComicPanel
            number={1}
            derja={showDerja ? copy.story.derja : undefined}
            caption={copy.story.caption}
            tilt="left"
          >
            <SamiAtTheDesk label={copy.story.alt} questionMark={copy.story.questionMark} />
          </ComicPanel>
        </Reveal>
        <ButtonLink href={`#${sectionIds.idea}`} variant="sun" size="sm">
          {copy.story.continues}
          <ArrowDown aria-hidden="true" className="size-5 motion-safe:animate-bounce" strokeWidth={3} />
        </ButtonLink>
      </div>
    </Section>
  );
}
