import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connection";
import { Post, Category, Tag, Page } from "@/lib/db/models";
import { getSiteUrl } from "@/lib/seo/fallback";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const coreStaticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/editorial-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/newsletter`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    await connectDB();

    const [posts, categories, tags, pages] = await Promise.all([
      Post.find({ status: "published" }).select("slug updatedAt seo").lean(),
      Category.find({ isActive: true }).select("slug updatedAt seo").lean(),
      Tag.find().select("slug updatedAt seo").lean(),
      Page.find({ status: "published" }).select("slug updatedAt seo").lean(),
    ]);

    // Eligible post routes respecting per-item SEO & sitemap settings
    const postRoutes: MetadataRoute.Sitemap = posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => {
        if (p.seo?.sitemap?.include === false) return false;
        if (p.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: p.seo?.sitemap?.changefreq || "weekly",
        priority: p.seo?.sitemap?.priority ?? 0.8,
      }));

    // Eligible category routes
    const categoryRoutes: MetadataRoute.Sitemap = categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => {
        if (c.seo?.sitemap?.include === false) return false;
        if (c.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        url: `${siteUrl}/category/${c.slug}`,
        lastModified: c.updatedAt || new Date(),
        changeFrequency: c.seo?.sitemap?.changefreq || "weekly",
        priority: c.seo?.sitemap?.priority ?? 0.7,
      }));

    // Eligible tag routes
    const tagRoutes: MetadataRoute.Sitemap = tags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((t: any) => {
        if (t.seo?.sitemap?.include === false) return false;
        if (t.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => ({
        url: `${siteUrl}/tag/${t.slug}`,
        lastModified: t.updatedAt || new Date(),
        changeFrequency: t.seo?.sitemap?.changefreq || "weekly",
        priority: t.seo?.sitemap?.priority ?? 0.6,
      }));

    // Eligible standalone page routes (excluding core static routes already listed)
    const existingStaticSlugs = new Set([
      "",
      "home",
      "blog",
      "about",
      "editorial-policy",
      "contact",
      "archive",
      "newsletter",
      "privacy",
      "terms",
      "search",
    ]);

    const customPageRoutes: MetadataRoute.Sitemap = pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((pg: any) => {
        if (existingStaticSlugs.has(pg.slug)) return false;
        if (pg.seo?.sitemap?.include === false) return false;
        if (pg.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((pg: any) => ({
        url: `${siteUrl}/${pg.slug}`,
        lastModified: pg.updatedAt || new Date(),
        changeFrequency: pg.seo?.sitemap?.changefreq || "monthly",
        priority: pg.seo?.sitemap?.priority ?? 0.7,
      }));

    return [...coreStaticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes, ...customPageRoutes];
  } catch (e) {
    console.error("[Sitemap Error]", e);
    return coreStaticRoutes;
  }
}
