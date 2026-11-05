import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Readex_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const balooBhaijaan2 = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Souty | ماسح الإشارات",
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
    <html lang="ar" className={`${readexPro.variable} ${balooBhaijaan2.variable}`}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
