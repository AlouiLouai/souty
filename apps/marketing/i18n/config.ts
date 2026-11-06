/**
 * Locale configuration. English is the default; French and Arabic are the
 * two other working languages of the audience. Arabic renders right-to-left.
 */
export const locales = ["en", "fr", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  ar: "rtl",
};

/** Each language's name, written in that language. */
export const localeLabel: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

/** BCP 47 tags for hreflang and Open Graph. */
export const localeTag: Record<Locale, string> = {
  en: "en",
  fr: "fr",
  ar: "ar-TN",
};

export const LOCALE_COOKIE = "souty_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
