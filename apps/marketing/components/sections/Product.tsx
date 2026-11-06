import { SIGNS } from "@souty/vocabulary";
import { ArrowUpRight } from "lucide-react";
import { OfflineDemo } from "@/components/demo/OfflineDemo";
import { SignPlayground, type PlaygroundWord } from "@/components/demo/SignPlayground";
import { FeatureGrid } from "@/components/product/FeatureGrid";
import { LimitsCard } from "@/components/product/LimitsCard";
import { Pipeline } from "@/components/product/Pipeline";
import { ProductStats } from "@/components/product/ProductStats";
import { glossFor } from "@/components/product/sign-gloss";
import { VocabularyShowcase } from "@/components/product/VocabularyShowcase";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Locale } from "@/i18n/config";
import { sectionIds, site } from "@/lib/site";
import type { SectionProps } from "./types";

const HEADING_IDS = {
  product: "product-title",
  playground: "playground-title",
  offline: "offline-title",
} as const;

/**
 * Model labels of the words offered in the playground, in display order:
 * Tunisian Sign Language signs the deployed model recognizes reliably on
 * the dataset's own photos (an audit on 2026-11-06 found it misses several
 * others, such as sbitar, mostawsaf and labes).
 */
const PLAYGROUND_SIGNS = [
  "assam",
  "bou",
  "eben",
  "tfol",
  "non",
  "5mis",
  "sebt",
  "louage",
  "metro",
  "train",
] as const;

function playgroundWords(locale: Locale): PlaygroundWord[] {
  return PLAYGROUND_SIGNS.flatMap((label) => {
    const sign = SIGNS.find((candidate) => candidate.label === label);
    return sign ? [{ id: sign.label, word: sign.word, gloss: glossFor(sign, locale) }] : [];
  });
}

/**
 * What is actually built, in three bands: the working app (numbers, features,
 * how it works), a playground with the full sign list, then the offline proof
 * next to an honest statement of today's limits.
 */
export function Product({ dict, locale }: SectionProps) {
  const { product } = dict;
  const { playground, offline } = product;
  // Derja lines are the brand's voice on the English and French pages only.
  const showDerja = locale !== "ar";

  return (
    <>
      <Section tone="paper" wave id={sectionIds.product} aria-labelledby={HEADING_IDS.product}>
        <SectionHeading
          id={HEADING_IDS.product}
          derja={showDerja ? product.derja : undefined}
          title={product.title}
          lead={product.lead}
          className="mb-7 sm:mb-8"
        />
        <div className="mb-12 flex justify-center sm:mb-14">
          <ButtonLink href={site.appUrl} external className="text-center leading-tight">
            {product.openApp}
            <ArrowUpRight aria-hidden="true" className="size-6 rtl:-scale-x-100" strokeWidth={2.75} />
          </ButtonLink>
        </div>

        <ProductStats stats={product.stats} />
        <div className="mt-12 sm:mt-14">
          <FeatureGrid features={product.features} />
        </div>
        <div className="mt-16 sm:mt-20">
          <Pipeline pipeline={product.pipeline} />
        </div>
      </Section>

      <Section tone="sky" wave id={sectionIds.playground} aria-labelledby={HEADING_IDS.playground}>
        <SectionHeading
          id={HEADING_IDS.playground}
          derja={showDerja ? playground.derja : undefined}
          title={playground.title}
          lead={playground.lead}
        />
        <SignPlayground
          words={playgroundWords(locale)}
          labels={{
            canvasLabel: playground.canvasLabel,
            disclaimer: playground.disclaimer,
            chooseDerja: showDerja ? playground.chooseDerja : undefined,
            choose: playground.choose,
            sentenceLabel: playground.sentenceLabel,
            empty: playground.empty,
            speakDerja: showDerja ? playground.speakDerja : undefined,
            speak: playground.speak,
            reset: playground.reset,
            pickFirst: playground.pickFirst,
            spoken: playground.spoken,
            noVoice: playground.noVoice,
            listSeparator: playground.listSeparator,
          }}
        />
        <div className="mt-10 flex justify-center">
          <ButtonLink href={site.appUrl} external variant="paper" className="text-center leading-tight">
            {playground.openApp}
            <ArrowUpRight aria-hidden="true" className="size-6 rtl:-scale-x-100" strokeWidth={2.75} />
          </ButtonLink>
        </div>

        <div className="mt-16 sm:mt-20">
          <VocabularyShowcase vocabulary={product.vocabulary} locale={locale} />
        </div>
      </Section>

      <Section tone="paper" wave aria-labelledby={HEADING_IDS.offline}>
        <OfflineDemo
          labels={{
            toggle: offline.toggle,
            illustrationAlt: offline.illustrationAlt,
            off: { text: offline.off, derja: showDerja ? offline.offDerja : undefined },
            on: { text: offline.on, derja: showDerja ? offline.onDerja : undefined },
          }}
        >
          <SectionHeading
            id={HEADING_IDS.offline}
            align="start"
            derja={showDerja ? offline.derja : undefined}
            title={offline.title}
            lead={offline.body}
            className="mb-0 sm:mb-0"
          />
        </OfflineDemo>

        <div className="mt-16 sm:mt-20">
          <LimitsCard limits={product.limits} />
        </div>
      </Section>
    </>
  );
}
