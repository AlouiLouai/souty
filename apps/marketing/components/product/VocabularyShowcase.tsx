import {
  SIGN_CATEGORIES,
  SIGN_COUNT,
  TUNSL_SIGN_COUNT,
  UNIVERSAL_SIGN_COUNT,
  signsByCategory,
  type Sign,
} from "@souty/vocabulary";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Sticker } from "@/components/ui/Sticker";
import { format, type Dictionary } from "@/content";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { SignGlyph } from "./SignGlyph";
import { glossFor } from "./sign-gloss";

/** Chip colour by where a sign comes from; the legend uses the same pair. */
const CHIP_TONE: Record<Sign["source"], string> = {
  tunsl: "bg-lilac",
  hagrid: "bg-sun",
};

interface VocabularyShowcaseProps {
  vocabulary: Dictionary["product"]["vocabulary"];
  locale: Locale;
}

/**
 * Every sign the app recognizes today, straight from the shared vocabulary
 * package and grouped by theme, each with a drawing of its hand shape.
 * Tunisian Sign Language signs and universal gestures get different chip
 * colours.
 */
export function VocabularyShowcase({ vocabulary, locale }: VocabularyShowcaseProps) {
  return (
    <div>
      <div className="mx-auto mb-8 grid max-w-[62ch] justify-items-center gap-3.5 text-center sm:mb-10">
        <h3 className="max-w-[24ch] text-[clamp(1.6rem,3.8vw,2.25rem)] font-extrabold">
          {format(vocabulary.title, { count: String(SIGN_COUNT) })}
        </h3>
        <p className="text-[1.1rem] text-plum-soft">
          {format(vocabulary.lead, {
            tunsl: String(TUNSL_SIGN_COUNT),
            universal: String(UNIVERSAL_SIGN_COUNT),
          })}
        </p>
        <ul className="flex flex-wrap justify-center gap-2.5">
          <li className="max-w-full">
            <Sticker tilt="none" tone="lilac" className="max-w-full whitespace-normal text-center">
              {vocabulary.legend.tunsl}
            </Sticker>
          </li>
          <li className="max-w-full">
            <Sticker tilt="none" tone="sun" className="max-w-full whitespace-normal text-center">
              {vocabulary.legend.universal}
            </Sticker>
          </li>
        </ul>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {SIGN_CATEGORIES.map((category, index) => {
          const signs = signsByCategory(category);
          return (
            <li key={category}>
              <Reveal delay={(index % 3) * 90} className="h-full">
                <Card tone={category === "universal" ? "cream" : "paper"} className="h-full p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <h4 className="text-[1.3rem] font-extrabold">{vocabulary.categories[category]}</h4>
                    <span className="rounded-full border-[2.5px] border-plum bg-paper px-2.5 py-0.5 font-display text-[0.9rem] font-bold leading-snug">
                      {format(vocabulary.countLabel, { count: String(signs.length) })}
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {signs.map((sign) => (
                      <SignChip key={sign.label} sign={sign} gloss={glossFor(sign, locale)} />
                    ))}
                  </ul>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SignChipProps {
  sign: Sign;
  gloss: string | undefined;
}

/** One sign: its hand shape, its Tunisian Arabic word and, when there is one, its meaning. */
function SignChip({ sign, gloss }: SignChipProps) {
  return (
    <li
      className={cn(
        "inline-flex max-w-full items-center gap-x-1.5 rounded-xl border-[2.5px] border-plum py-1 pe-2.5 ps-1",
        CHIP_TONE[sign.source]
      )}
    >
      <SignGlyph label={sign.label} className="size-10 rounded-lg bg-paper" />
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span lang="ar-TN" dir="rtl" className="font-display text-[1.2rem] font-bold leading-snug">
          {sign.word}
        </span>
        {gloss ? <span className="text-[0.88rem] leading-snug">{gloss}</span> : null}
      </span>
    </li>
  );
}
