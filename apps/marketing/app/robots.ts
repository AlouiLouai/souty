import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** The whole site is public: every crawler may read every page. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
