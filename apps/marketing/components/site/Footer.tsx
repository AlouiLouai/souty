import { ArrowUp, ArrowUpRight } from "lucide-react";
import type { SectionProps } from "@/components/sections/types";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { sectionIds, site } from "@/lib/site";
import { sectionLinks } from "./Header";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";

const LINKS_HEADING_ID = "footer-links";

const DATASET_URL = "https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset";

const linkClassName =
  "inline-flex min-h-11 items-center gap-1.5 text-white underline decoration-[#D9D0F0] decoration-2 underline-offset-4 hover:decoration-sun";

/**
 * Site footer on plum: the logo and tagline, who built Souty and for what,
 * the section links, the language switcher, and the small print (privacy,
 * dataset credit, the note that Sami is fictional).
 */
export function Footer({ dict, locale }: SectionProps) {
  const { footer, nav } = dict;

  return (
    // The global focus ring is plum, which would vanish on this background.
    <footer className="wave-top bg-plum text-white [&_:focus-visible]:outline-sun">
      <Container className="grid gap-10 pb-10 pt-14 lg:grid-cols-[1.5fr_1fr_auto] lg:gap-14">
        <div className="grid content-start justify-items-start gap-4">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Logo tone="white" size="lg" label={site.name} />
            <span lang="ar" dir="rtl" className="font-display text-[2rem] font-extrabold leading-none text-sun">
              {site.nameArabic}
            </span>
          </p>
          <p className="max-w-[24ch] font-display text-[1.4rem] font-bold leading-snug">{footer.tagline}</p>
          <p className="text-[0.95rem] text-[#D9D0F0]">
            {footer.team}
            <br />
            {footer.context}
          </p>
        </div>

        <nav aria-labelledby={LINKS_HEADING_ID}>
          <h2 id={LINKS_HEADING_ID} className="text-[1.1rem] font-bold text-sun">
            {footer.linksLabel}
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 text-base lg:grid-cols-1">
            {sectionLinks(nav).map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClassName}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href={site.appUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                {nav.openApp}
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0 rtl:-scale-x-100" />
                <span className="sr-only"> {nav.newTab}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="grid content-start justify-items-start gap-4">
          <LocaleSwitcher current={locale} label={nav.languageLabel} variant="full" tone="dark" />
          <a href={`#${sectionIds.top}`} className={linkClassName}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0" />
            {footer.backToTop}
          </a>
        </div>
      </Container>

      <div className="border-t border-plum-soft">
        <Container className="grid gap-2 py-6 text-[0.9rem] text-[#D9D0F0]">
          <p>{footer.privacy}</p>
          <p className="flex flex-wrap items-center gap-x-3">
            <span>{footer.dataCredit}</span>
            <a href={DATASET_URL} target="_blank" rel="noopener noreferrer" className={cn(linkClassName, "font-bold")}>
              {footer.dataCreditLinkLabel}
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2.5} className="shrink-0 rtl:-scale-x-100" />
              <span className="sr-only"> {nav.newTab}</span>
            </a>
          </p>
          <p>{footer.fiction}</p>
        </Container>
      </div>
    </footer>
  );
}
