import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SayHiButton } from "@/components/demo/SayHiButton";
import { Mascot } from "@/components/illustrations/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Sticker } from "@/components/ui/Sticker";
import { localeDirection } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { sectionIds, site } from "@/lib/site";
import type { SectionProps } from "./types";

const TITLE_ID = "hero-title";

const BADGE_TONES = ["sun", "paper", "mint"] as const;

/**
 * The opening band: the Tunisian Arabic headline, the one-sentence pitch,
 * the way into the app, and the mascot that says hello out loud.
 */
export function Hero({ dict, locale }: SectionProps) {
  const { hero, nav } = dict;
  // The Arabic headline is always right-to-left. On left-to-right pages its
  // "end" is the left side, which keeps it on the same edge as the title.
  const derjaAlignment = localeDirection[locale] === "rtl" ? "text-start" : "text-end";

  return (
    <Section
      id={sectionIds.top}
      tone="sky"
      aria-labelledby={TITLE_ID}
      className="overflow-hidden pb-[clamp(4.5rem,9vw,7rem)] pt-8 sm:pt-12"
    >
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-8">
        <div>
          <ul className="mb-6 flex flex-wrap gap-3">
            {hero.badges.map((badge, index) => (
              <li key={badge}>
                <Sticker
                  tone={BADGE_TONES[index % BADGE_TONES.length] ?? "paper"}
                  tilt={index % 2 === 0 ? "left" : "right"}
                >
                  {badge}
                </Sticker>
              </li>
            ))}
          </ul>

          <p
            lang="ar-TN"
            dir="rtl"
            className={cn(
              "text-balance font-display text-[clamp(2.4rem,5.6vw,4.2rem)] font-extrabold leading-[1.25] text-plum",
              derjaAlignment
            )}
          >
            {hero.derja.before}
            <span className="relative isolate inline-block whitespace-nowrap">
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.08em] bottom-[0.16em] -z-10 h-[0.36em] -rotate-[1.5deg] rounded-lg bg-sun"
              />
              {hero.derja.highlight}
            </span>
            {hero.derja.after}
          </p>

          <h1
            id={TITLE_ID}
            className="mt-4 max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.6rem)] font-extrabold text-plum"
          >
            {hero.title}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[1.15rem] text-plum-soft sm:text-[1.2rem]">{hero.lead}</p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <ButtonLink href={site.appUrl} external>
              {hero.primaryCta}
              <ArrowUpRight aria-hidden="true" size={22} strokeWidth={3} className="rtl:-scale-x-100" />
              <span className="sr-only"> {nav.newTab}</span>
            </ButtonLink>
            <ButtonLink href={`#${sectionIds.idea}`} variant="paper">
              {hero.secondaryCta}
              <ArrowDown aria-hidden="true" size={22} strokeWidth={3} />
            </ButtonLink>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-2 text-base text-plum-soft">
            <span aria-hidden="true" className="relative inline-flex size-3">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint" />
              <span className="relative size-3 rounded-full border-2 border-plum bg-mint" />
            </span>
            <span>{hero.liveNote}</span>
            <a
              href={site.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex min-h-11 items-center break-all font-bold text-plum underline decoration-harissa decoration-[3px] underline-offset-4 hover:decoration-plum"
            >
              {site.appDisplayUrl}
              <span className="sr-only"> {nav.newTab}</span>
            </a>
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[380px] md:max-w-none">
          <Mascot label={hero.mascotAlt} className="h-full w-full" />
          {/* The wrapper carries the position, so `start` follows the page and not the Arabic text. */}
          <div className="absolute start-[4%] top-[2%] -rotate-[4deg] animate-pop rounded-3xl rounded-es-md border-3 border-plum bg-paper px-[1.125rem] py-2 shadow-[4px_4px_0_var(--plum)]">
            <p lang="ar-TN" dir="rtl" className="font-display text-[1.7rem] font-extrabold leading-snug text-plum">
              {hero.bubble}
            </p>
          </div>
          <div className="absolute bottom-[4%] end-[4%] flex max-w-[92%] justify-end">
            <SayHiButton labels={hero.sayHi} />
          </div>
        </div>
      </div>
    </Section>
  );
}
