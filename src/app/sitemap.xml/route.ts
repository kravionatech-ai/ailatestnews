import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Post, Category, Tag, Page } from "@/lib/db/models";
import { getSiteUrl } from "@/lib/seo/fallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const coreStaticRoutes: SitemapEntry[] = [
    {
      url: siteUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: "1.0",
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: "0.9",
    },
    {
      url: `${siteUrl}/model-launches`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/india-ai`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/ai-tools`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: "0.7",
    },
    {
      url: `${siteUrl}/editorial-policy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: "0.5",
    },
    {
      url: `${siteUrl}/newsletter`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly",
      priority: "0.3",
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly",
      priority: "0.3",
    },
  ];

  let postRoutes: SitemapEntry[] = [];
  let categoryRoutes: SitemapEntry[] = [];
  let tagRoutes: SitemapEntry[] = [];
  let customPageRoutes: SitemapEntry[] = [];

  try {
    await connectDB();

    const [posts, categories, tags, pages] = await Promise.all([
      Post.find({ status: "published" })
        .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
        .select("slug updatedAt publishedAt createdAt seo")
        .lean(),
      Category.find({ isActive: true }).select("slug updatedAt createdAt seo").lean(),
      Tag.find().select("slug updatedAt createdAt seo").lean(),
      Page.find({ status: "published" }).select("slug updatedAt createdAt seo").lean(),
    ]);

    // Eligible post routes
    postRoutes = posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => {
        if (!p.slug) return false;
        if (p.seo?.sitemap?.include === false) return false;
        if (p.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => {
        const dateObj = new Date(p.updatedAt || p.publishedAt || p.createdAt || Date.now());
        const validDate = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
        return {
          url: `${siteUrl}/blog/${p.slug}`,
          lastModified: validDate,
          changeFrequency: p.seo?.sitemap?.changefreq || "daily",
          priority: typeof p.seo?.sitemap?.priority === "number" ? p.seo.sitemap.priority.toFixed(1) : "0.9",
        };
      });

    // Eligible category routes
    categoryRoutes = categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => {
        if (!c.slug) return false;
        if (c.seo?.sitemap?.include === false) return false;
        if (c.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        const dateObj = new Date(c.updatedAt || c.createdAt || Date.now());
        const validDate = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
        return {
          url: `${siteUrl}/category/${c.slug}`,
          lastModified: validDate,
          changeFrequency: c.seo?.sitemap?.changefreq || "weekly",
          priority: typeof c.seo?.sitemap?.priority === "number" ? c.seo.sitemap.priority.toFixed(1) : "0.7",
        };
      });

    // Eligible tag routes
    tagRoutes = tags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((t: any) => {
        if (!t.slug) return false;
        if (t.seo?.sitemap?.include === false) return false;
        if (t.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => {
        const dateObj = new Date(t.updatedAt || t.createdAt || Date.now());
        const validDate = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
        return {
          url: `${siteUrl}/tag/${t.slug}`,
          lastModified: validDate,
          changeFrequency: t.seo?.sitemap?.changefreq || "weekly",
          priority: typeof t.seo?.sitemap?.priority === "number" ? t.seo.sitemap.priority.toFixed(1) : "0.7",
        };
      });

    // Standalone page routes
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
      "model-launches",
      "india-ai",
      "ai-tools",
    ]);

    customPageRoutes = pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((pg: any) => {
        if (!pg.slug) return false;
        if (existingStaticSlugs.has(pg.slug)) return false;
        if (pg.seo?.sitemap?.include === false) return false;
        if (pg.seo?.robots?.index === false) return false;
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((pg: any) => {
        const dateObj = new Date(pg.updatedAt || pg.createdAt || Date.now());
        const validDate = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
        return {
          url: `${siteUrl}/${pg.slug}`,
          lastModified: validDate,
          changeFrequency: pg.seo?.sitemap?.changefreq || "monthly",
          priority: typeof pg.seo?.sitemap?.priority === "number" ? pg.seo.sitemap.priority.toFixed(1) : "0.7",
        };
      });
  } catch (e) {
    console.error("[Sitemap Route Error]", e);
  }

  // Notice the order: Core Static, Posts (newest first), Categories, Tags, Custom Pages
  const allEntries: SitemapEntry[] = [
    ...coreStaticRoutes,
    ...postRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...customPageRoutes,
  ];

  const xmlUrls = allEntries
    .map(
      (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
