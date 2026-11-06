import { ArrowUpRight } from "lucide-react";
import type { SectionProps } from "@/components/sections/types";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";
import { sectionIds, site } from "@/lib/site";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/** The sections the navigation points to, in page order. */
const NAV_SECTIONS = ["problem", "idea", "product", "roadmap", "vision"] as const;

/** In-page links to the main sections, shared by the header and the footer. */
export function sectionLinks(nav: Dictionary["nav"]) {
  return NAV_SECTIONS.map((section) => ({
    href: `#${sectionIds[section]}`,
    label: nav.links[section],
  }));
}

interface OpenAppLinkProps {
  nav: Dictionary["nav"];
  className?: string;
}

/** The small "Open the app" button, used in the bar and in the mobile panel. */
function OpenAppLink({ nav, className }: OpenAppLinkProps) {
  return (
    <ButtonLink href={site.appUrl} external size="sm" variant="sun" className={className}>
      {nav.openApp}
      <ArrowUpRight aria-hidden="true" size={18} strokeWidth={3} className="rtl:-scale-x-100" />
      <span className="sr-only"> {nav.newTab}</span>
    </ButtonLink>
  );
}

/**
 * Site header: a skip link, then a sticky bar with the logo, the section
 * links, the language switcher and a shortcut to the app. Below `lg` the
 * section links move into a menu panel.
 */
export function Header({ dict, locale }: SectionProps) {
  const { nav } = dict;
  const links = sectionLinks(nav);

  return (
    <>
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[70]",
          "focus:rounded-full focus:border-3 focus:border-plum focus:bg-sun focus:px-5 focus:py-3",
          "focus:font-display focus:font-bold focus:text-plum focus:no-underline focus:shadow-hard-sm"
        )}
      >
        {nav.skipToContent}
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 border-b-3 border-plum bg-sky",
          // Translucent only where the page behind can be blurred.
          "supports-[backdrop-filter:blur(0)]:bg-[color-mix(in_srgb,var(--sky)_82%,transparent)]",
          "supports-[backdrop-filter:blur(0)]:backdrop-blur-md"
        )}
      >
        <Container className="flex h-[4.25rem] items-center justify-between gap-2 sm:gap-3">
          <a
            href={`#${sectionIds.top}`}
            aria-label={nav.homeLabel}
            className="inline-flex min-h-11 shrink-0 items-center no-underline"
          >
            <Logo />
          </a>

          <nav aria-label={nav.sectionsLabel} className="hidden lg:block">
            <ul className="flex items-center">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 font-display text-base font-bold text-plum no-underline transition-colors hover:bg-paper xl:px-3.5 xl:text-[1.05rem]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocaleSwitcher
              current={locale}
              label={nav.languageLabel}
              variant="compact"
              className="hidden min-[360px]:block"
            />
            <OpenAppLink nav={nav} className="hidden sm:inline-flex" />
            <MobileMenu
              labels={{ open: nav.openMenu, close: nav.closeMenu, sections: nav.sectionsLabel }}
              links={links}
            >
              <LocaleSwitcher current={locale} label={nav.languageLabel} variant="full" />
              <OpenAppLink nav={nav} className="sm:hidden" />
            </MobileMenu>
          </div>
        </Container>
      </header>
    </>
  );
}
