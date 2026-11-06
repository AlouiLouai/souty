import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
import { AppQrCode } from "@/components/cta/AppQrCode";
import { CopyLink } from "@/components/cta/CopyLink";
import { PartnerCard } from "@/components/cta/PartnerCard";
import { SupportList } from "@/components/cta/SupportList";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";
import { site, sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const HEADING_ID = "cta-title";

type StickerLook = Pick<ComponentProps<typeof Sticker>, "tone" | "tilt">;

/** One look per fact sticker, in dictionary order. */
const FACT_LOOKS: readonly StickerLook[] = [
  { tone: "sun", tilt: "left" },
  { tone: "pink", tilt: "right" },
  { tone: "lilac", tilt: "left" },
];

/**
 * The closing band: open the app or scan its QR code, copy the link to
 * share it, see what support pays for and, when a contact address is
 * configured, how to work with the team.
 */
export function Cta({ dict, locale }: SectionProps) {
  const { cta } = dict;

  return (
    <Section tone="paper" wave id={sectionIds.cta} aria-labelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        derja={locale === "ar" ? undefined : cta.derja}
        title={cta.title}
        lead={cta.lead}
      />

      <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <Reveal className="grid justify-items-center gap-6 md:justify-items-start">
          <ButtonLink
            href={site.appUrl}
            external
            className="min-h-16 px-8 text-[1.45rem] sm:min-h-[4.5rem] sm:px-10 sm:text-[1.6rem]"
          >
            {cta.openApp}
            <ArrowUpRight aria-hidden="true" className="size-7 rtl:-scale-x-100" strokeWidth={3} />
            <span className="sr-only">({cta.newTab})</span>
          </ButtonLink>
          <CopyLink url={site.appUrl} displayUrl={site.appDisplayUrl} labels={cta.copy} />
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-2.5 md:justify-start">
            {cta.facts.map((fact, index) => (
              <li key={fact}>
                <Sticker {...FACT_LOOKS[index]}>{fact}</Sticker>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Phones get the button first; wider screens lead with the code. */}
        <Reveal delay={120} className="md:order-first">
          <AppQrCode url={site.appUrl} title={cta.qr.title} hint={cta.qr.hint} alt={cta.qr.alt} />
        </Reveal>
      </div>

      <SupportList copy={cta.support} />

      {site.contactEmail ? <PartnerCard email={site.contactEmail} copy={cta.partner} /> : null}
    </Section>
  );
}
