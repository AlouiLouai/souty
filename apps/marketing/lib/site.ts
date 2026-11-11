/**
 * Site-wide constants and environment-derived URLs.
 *
 * Environment variables (all optional, set them in the Vercel project):
 * - NEXT_PUBLIC_SITE_URL       Canonical origin of this marketing site.
 * - NEXT_PUBLIC_APP_URL        Origin of the Souty PWA.
 * - NEXT_PUBLIC_CONTACT_EMAIL  Address for partnership requests. The
 *                              "contact us" action is hidden when unset.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  }
  // Provided by Vercel at build time: the project's production domain.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3001";
}

const appUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL ?? "https://souty.vercel.app");

export const site = {
  name: "Souty",
  nameArabic: "صوتي",
  /** Canonical origin of this site, no trailing slash. */
  url: resolveSiteUrl(),
  /** Origin of the PWA, no trailing slash. */
  appUrl,
  /** The PWA address as people read and type it. */
  appDisplayUrl: appUrl.replace(/^https?:\/\//, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
} as const;

/** In-page anchors. Section components and navigation share these ids. */
export const sectionIds = {
  top: "top",
  problem: "problem",
  idea: "idea",
  product: "product",
  playground: "try",
  proof: "proof",
  roadmap: "roadmap",
  vision: "vision",
  cta: "start",
} as const;
