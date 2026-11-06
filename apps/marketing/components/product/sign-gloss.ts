import type { Sign } from "@souty/vocabulary";
import type { Locale } from "@/i18n/config";

/**
 * A sign's meaning in the page language. The Arabic page needs none: the
 * Tunisian Arabic word already says it.
 */
export function glossFor(sign: Sign, locale: Locale): string | undefined {
  return locale === "ar" ? undefined : sign.gloss[locale];
}
