"use client";

import { LOCALE_COOKIE, localeLabel, localeTag, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

type Variant = "compact" | "full";
type Tone = "light" | "dark";

interface LocaleSwitcherProps {
  /** The locale of the page being shown. */
  current: Locale;
  /** Accessible name of the group, for example "Language". */
  label: string;
  /** Compact shows language codes (EN, FR, AR); full shows each language's own name. */
  variant?: Variant;
  /** Light for sky and paper surfaces, dark for plum. */
  tone?: Tone;
  className?: string;
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Saves the choice so the middleware sends this visitor to it next time. */
function rememberLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}

const tones: Record<Tone, { group: string; link: string; current: string }> = {
  light: {
    group: "border-plum bg-paper",
    link: "text-plum hover:bg-sky",
    current: "bg-plum text-white",
  },
  dark: {
    group: "border-[#D9D0F0]",
    link: "text-white hover:bg-white/15",
    current: "bg-sun text-plum",
  },
};

/**
 * The language switcher: one link per locale, the current one marked. Links
 * are plain anchors on purpose: a full page load lets the document's `lang`
 * and `dir` switch cleanly.
 */
export function LocaleSwitcher({
  current,
  label,
  variant = "full",
  tone = "light",
  className,
}: LocaleSwitcherProps) {
  const compact = variant === "compact";
  const palette = tones[tone];

  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("inline-flex gap-0.5 rounded-full border-[2.5px] p-0.5", palette.group)}>
        {locales.map((locale) => {
          const isCurrent = locale === current;
          const name = localeLabel[locale];
          return (
            <li key={locale}>
              <a
                href={`/${locale}`}
                lang={localeTag[locale]}
                hrefLang={localeTag[locale]}
                aria-current={isCurrent ? "true" : undefined}
                title={compact ? name : undefined}
                onClick={() => rememberLocale(locale)}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full font-display text-[0.95rem] font-bold leading-none no-underline transition-colors",
                  compact ? "px-2" : "px-3.5",
                  isCurrent ? palette.current : palette.link
                )}
              >
                {compact ? (
                  <>
                    <span aria-hidden="true">{locale.toUpperCase()}</span>
                    <span className="sr-only">{name}</span>
                  </>
                ) : (
                  name
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
