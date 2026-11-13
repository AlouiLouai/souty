import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { fontVariables } from "@souty/brand/fonts";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "@souty/brand/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  // The brand only: the app shows no text but the signed words (NFR-8).
  title: "Souty",
  description:
    "ماسح إشارات اليد الفوري الذي ينطق ويعرض كل إشارة باللغة العربية.",
  applicationName: "Souty",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Souty",
  },
  other: {
    // iOS-specific tag that Next's `appleWebApp.capable` does not emit.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#E9ECFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className={fontVariables}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
