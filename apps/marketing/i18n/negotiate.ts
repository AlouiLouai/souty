import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Picks the best supported locale for an Accept-Language header.
 *
 * Follows RFC 9110 quality values: entries are ranked by `q` (default 1,
 * `q=0` means "not acceptable"), ties keep header order, and a regional tag
 * such as `fr-TN` matches its base language `fr`.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [rawTag = "", ...params] = entry.trim().split(";");
      const qParam = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      const parsed = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      const quality = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
      return { tag: rawTag.trim().toLowerCase(), quality, index };
    })
    .filter((entry) => entry.tag !== "" && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of ranked) {
    if (tag === "*") return defaultLocale;
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return defaultLocale;
}

/** The locale a pathname is already prefixed with, if any. */
export function localeFromPathname(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : null;
}

/** Swaps (or adds) the locale prefix of a pathname. */
export function withLocale(pathname: string, locale: Locale): string {
  const current = localeFromPathname(pathname);
  const rest = current ? pathname.slice(current.length + 1) : pathname;
  const suffix = rest === "/" || rest === "" ? "" : rest;
  return `/${locale}${suffix}`;
}
