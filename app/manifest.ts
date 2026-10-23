import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Souty - ماسح الإشارات",
    short_name: "Souty",
    description:
      "ماسح إشارات اليد الفوري الذي ينطق ويعرض كل إشارة باللغة العربية، بالكامل على جهازك بدون إنترنت.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E9ECFF",
    theme_color: "#E9ECFF",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
