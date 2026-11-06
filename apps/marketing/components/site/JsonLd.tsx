import type { SectionProps } from "@/components/sections/types";
import { localeTag } from "@/i18n/config";
import { site } from "@/lib/site";

/**
 * Serializes data for an inline script. "<" is escaped so no value can
 * close the script element early.
 */
function toScriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Structured data for search engines: the Souty app as a free
 * accessibility application, and this website. Only facts the page itself
 * states; no ratings, reviews or organisations.
 */
export function JsonLd({ dict, locale }: SectionProps) {
  const language = localeTag[locale];
  const pageUrl = `${site.url}/${locale}`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${site.appUrl}/#app`,
        name: site.name,
        alternateName: site.nameArabic,
        url: site.appUrl,
        description: dict.meta.description,
        applicationCategory: "AccessibilityApplication",
        operatingSystem: "Android, iOS, Windows, macOS (web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        inLanguage: language,
      },
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        url: pageUrl,
        name: site.name,
        alternateName: site.nameArabic,
        inLanguage: language,
        about: { "@id": `${site.appUrl}/#app` },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toScriptJson(graph) }} />
  );
}
