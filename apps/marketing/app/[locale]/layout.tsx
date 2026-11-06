import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { fontVariables } from "@souty/brand/fonts";
import { palette } from "@souty/brand/palette";
import { getDictionary } from "@/content";
import { isLocale, localeDirection, localeTag, locales } from "@/i18n/config";
import { site } from "@/lib/site";
import "@souty/brand/tokens.css";
import "../globals.css";

interface LocaleParams {
  params: Promise<{ locale: string }>;
}

/** Every locale is prerendered; anything else is a 404. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = getDictionary(locale);

  return {
    metadataBase: new URL(site.url),
    title: meta.title,
    description: meta.description,
    applicationName: site.name,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((code) => [localeTag[code], `/${code}`])),
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      url: `/${locale}`,
      locale: localeTag[locale],
      alternateLocale: locales.filter((code) => code !== locale).map((code) => localeTag[code]),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: palette.sky,
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleParams & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={localeTag[locale]} dir={localeDirection[locale]} className={fontVariables}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
