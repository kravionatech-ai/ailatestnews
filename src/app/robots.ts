import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/fallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (!isProd) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${siteUrl}/sitemap.xml`,
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
