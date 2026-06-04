import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    host: absoluteUrl("/"),
    rules: {
      allow: [
        "/",
        "/pricing",
        "/become-creator",
        "/about",
        "/contact",
        "/explore",
        "/course",
        "/creator",
      ],
      disallow: [
        "/admin",
        "/creator/dashboard",
        "/creator/courses",
        "/creator/settings",
        "/creator/revenue",
        "/creator/payouts",
        "/api",
      ],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
