import type { MetadataRoute } from "next";
import { defaultLocale, localeTag, locales } from "@/i18n/config";
import { site } from "@/lib/site";

/**
 * One entry per language version of the page. Each entry lists every
 * version as an alternate, so search engines serve the right language.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(locales.map((code) => [localeTag[code], `${site.url}/${code}`])),
    "x-default": `${site.url}/${defaultLocale}`,
  };

  return locales.map((locale) => ({
    url: `${site.url}/${locale}`,
    changeFrequency: "monthly",
    priority: locale === defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
