import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/fallback";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/preview/", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
