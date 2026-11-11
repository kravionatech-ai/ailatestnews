import { connectDB } from "@/lib/db/connection";
import { SeoSettings, Post, Category, Tag, Page, ISeoSettings, ISeoSettingsDoc } from "@/lib/db/models";
import { getSiteUrl } from "./fallback";

export interface SitemapItem {
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

export interface NewsSitemapItem {
  url: string;
  title: string;
  publicationDate: string;
  publicationName: string;
  publicationLanguage: string;
}

/**
 * Deterministic build date for static routes (avoid using new Date() on every request).
 */
const SYSTEM_BUILD_TIMESTAMP = new Date("2026-11-08T00:00:00.000Z").toISOString();

/**
 * Retrieve or initialize the singleton SEO settings document.
 */
export async function getOrInitSeoSettings(): Promise<ISeoSettingsDoc> {
  await connectDB();
  let settings = await SeoSettings.findOne();
  if (!settings) {
    const siteUrl = getSiteUrl();
    settings = await SeoSettings.create({
      sitemap: {
        enabled: true,
        siteUrl,
        includeArticles: true,
        includeCategories: true,
        includeTags: true,
        includePages: true,
        includeNewsSitemap: true,
        newsPublicationName: "AI Latest News",
        newsPublicationLanguage: "en",
        newsTimeWindowHours: 48,
        excludedUrls: [],
        enableSplitSitemaps: false,
        maxUrlsPerSitemap: 50000,
      },
      robots: {
        enabled: true,
        customRawEnabled: false,
        rawContent: "",
        rules: [
          {
            userAgent: "*",
            allow: ["/"],
            disallow: ["/admin/", "/api/admin/", "/login/", "/dashboard/", "/private/"],
          },
        ],
        sitemaps: [`${siteUrl}/sitemap.xml`],
        includeNewsSitemapInRobots: true,
        lastPublishedAt: new Date(),
      },
    });
  }
  return settings;
}

/**
 * Generate static core page entries with deterministic lastModified timestamps.
 */
export function getCoreStaticSitemapEntries(siteUrl: string, latestPostDate?: Date): SitemapItem[] {
  const baseDate = latestPostDate
    ? new Date(latestPostDate).toISOString()
    : SYSTEM_BUILD_TIMESTAMP;

  return [
    {
      url: siteUrl,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "1.0",
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "0.9",
    },
    {
      url: `${siteUrl}/model-launches`,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/india-ai`,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/ai-tools`,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/zeroai`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "weekly",
      priority: "0.8",
    },
    {
      url: `${siteUrl}/about`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "monthly",
      priority: "0.7",
    },
    {
      url: `${siteUrl}/editorial-policy`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: baseDate,
      changeFrequency: "weekly",
      priority: "0.5",
    },
    {
      url: `${siteUrl}/newsletter`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "monthly",
      priority: "0.6",
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "yearly",
      priority: "0.3",
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: SYSTEM_BUILD_TIMESTAMP,
      changeFrequency: "yearly",
      priority: "0.3",
    },
  ];
}

/**
 * Check if a URL matches any admin-configured excluded pattern.
 */
export function isUrlExcluded(url: string, excludedList: string[]): boolean {
  if (!excludedList || !excludedList.length) return false;
  for (const pattern of excludedList) {
    const cleanPattern = pattern.trim().toLowerCase();
    if (!cleanPattern) continue;
    if (url.toLowerCase() === cleanPattern) return true;
    if (url.toLowerCase().endsWith(cleanPattern)) return true;
    if (cleanPattern.includes("*")) {
      const regex = new RegExp(`^${cleanPattern.replace(/\*/g, ".*")}$`, "i");
      if (regex.test(url)) return true;
    }
  }
  return false;
}

/**
 * Retrieve all eligible database URLs organized by category.
 */
export async function getAllSitemapCollections(settings: ISeoSettings) {
  await connectDB();
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const excluded = settings.sitemap.excludedUrls || [];

  const [posts, categories, tags, pages] = await Promise.all([
    settings.sitemap.includeArticles
      ? Post.find({ status: "published" })
          .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
          .select("slug updatedAt publishedAt createdAt seo")
          .lean()
      : Promise.resolve([]),
    settings.sitemap.includeCategories
      ? Category.find({ isActive: true }).select("slug updatedAt createdAt seo").lean()
      : Promise.resolve([]),
    settings.sitemap.includeTags
      ? Tag.find().select("slug updatedAt createdAt seo").lean()
      : Promise.resolve([]),
    settings.sitemap.includePages
      ? Page.find({ status: "published" }).select("slug updatedAt createdAt seo").lean()
      : Promise.resolve([]),
  ]);

  // Latest activity date for core routes
  const latestPostDate = posts[0] ? new Date(posts[0].publishedAt || posts[0].updatedAt || posts[0].createdAt) : undefined;
  const staticRoutes = getCoreStaticSitemapEntries(siteUrl, latestPostDate).filter(
    (item) => !isUrlExcluded(item.url, excluded)
  );

  // Filter posts
  const postRoutes: SitemapItem[] = posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => {
      if (!p.slug) return false;
      if (p.seo?.sitemap?.include === false) return false;
      if (p.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/blog/${p.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => {
      const dateObj = new Date(p.updatedAt || p.publishedAt || p.createdAt || Date.now());
      const validDate = isNaN(dateObj.getTime()) ? SYSTEM_BUILD_TIMESTAMP : dateObj.toISOString();
      return {
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: validDate,
        changeFrequency: p.seo?.sitemap?.changefreq || "daily",
        priority: typeof p.seo?.sitemap?.priority === "number" ? p.seo.sitemap.priority.toFixed(1) : "0.9",
      };
    });

  // Filter categories
  const categoryRoutes: SitemapItem[] = categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => {
      if (!c.slug) return false;
      if (c.seo?.sitemap?.include === false) return false;
      if (c.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/category/${c.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => {
      const dateObj = new Date(c.updatedAt || c.createdAt || Date.now());
      const validDate = isNaN(dateObj.getTime()) ? SYSTEM_BUILD_TIMESTAMP : dateObj.toISOString();
      return {
        url: `${siteUrl}/category/${c.slug}`,
        lastModified: validDate,
        changeFrequency: c.seo?.sitemap?.changefreq || "weekly",
        priority: typeof c.seo?.sitemap?.priority === "number" ? c.seo.sitemap.priority.toFixed(1) : "0.7",
      };
    });

  // Filter tags
  const tagRoutes: SitemapItem[] = tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((t: any) => {
      if (!t.slug) return false;
      if (t.seo?.sitemap?.include === false) return false;
      if (t.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/tag/${t.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => {
      const dateObj = new Date(t.updatedAt || t.createdAt || Date.now());
      const validDate = isNaN(dateObj.getTime()) ? SYSTEM_BUILD_TIMESTAMP : dateObj.toISOString();
      return {
        url: `${siteUrl}/tag/${t.slug}`,
        lastModified: validDate,
        changeFrequency: t.seo?.sitemap?.changefreq || "weekly",
        priority: typeof t.seo?.sitemap?.priority === "number" ? t.seo.sitemap.priority.toFixed(1) : "0.7",
      };
    });

  // Standalone custom pages
  const coreSlugs = new Set(["", "home", "blog", "about", "editorial-policy", "contact", "archive", "newsletter", "privacy", "terms", "search", "model-launches", "india-ai", "ai-tools"]);
  const pageRoutes: SitemapItem[] = pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((pg: any) => {
      if (!pg.slug) return false;
      if (coreSlugs.has(pg.slug)) return false;
      if (pg.seo?.sitemap?.include === false) return false;
      if (pg.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/${pg.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((pg: any) => {
      const dateObj = new Date(pg.updatedAt || pg.createdAt || Date.now());
      const validDate = isNaN(dateObj.getTime()) ? SYSTEM_BUILD_TIMESTAMP : dateObj.toISOString();
      return {
        url: `${siteUrl}/${pg.slug}`,
        lastModified: validDate,
        changeFrequency: pg.seo?.sitemap?.changefreq || "monthly",
        priority: typeof pg.seo?.sitemap?.priority === "number" ? pg.seo.sitemap.priority.toFixed(1) : "0.7",
      };
    });

  return {
    siteUrl,
    staticRoutes,
    postRoutes,
    categoryRoutes,
    tagRoutes,
    pageRoutes,
  };
}

/**
 * Safely escape characters that are illegal or special in XML format.
 */
export function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format an array of SitemapItem objects into standard XML urlset.
 */
export function buildUrlsetXml(entries: SitemapItem[]): string {
  const xmlUrls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${escapeXml(entry.lastModified)}</lastmod>
    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

/**
 * Format sub-sitemap locations into a standard Sitemap Index XML.
 */
export function buildSitemapIndexXml(subSitemaps: Array<{ loc: string; lastmod: string }>): string {
  const xmlSitemaps = subSitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${escapeXml(s.lastmod)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}
</sitemapindex>`;
}

/**
 * Retrieve fresh Google News eligible articles (last 48 hours).
 */
export async function getGoogleNewsArticles(settings: ISeoSettings): Promise<NewsSitemapItem[]> {
  await connectDB();
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const timeWindowHours = settings.sitemap.newsTimeWindowHours || 48;
  const cutoffDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
  const pubName = settings.sitemap.newsPublicationName || "AI Latest News";
  const pubLang = settings.sitemap.newsPublicationLanguage || "en";
  const excluded = settings.sitemap.excludedUrls || [];

  const articles = await Post.find({
    status: "published",
    publishedAt: { $gte: cutoffDate },
  })
    .sort({ publishedAt: -1 })
    .select("title slug publishedAt updatedAt seo")
    .lean();

  return articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => {
      if (!a.slug || !a.title) return false;
      if (a.seo?.sitemap?.include === false) return false;
      if (a.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/blog/${a.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      const pubDate = new Date(a.publishedAt || a.updatedAt || Date.now()).toISOString();
      return {
        url: `${siteUrl}/blog/${a.slug}`,
        title: a.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"),
        publicationDate: pubDate,
        publicationName: pubName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        publicationLanguage: pubLang,
      };
    });
}

/**
 * Format Google News sitemap entries into standard XML.
 */
export function buildGoogleNewsXml(items: NewsSitemapItem[]): string {
  const xmlEntries = items
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(item.publicationName)}</news:name>
        <news:language>${escapeXml(item.publicationLanguage)}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(item.publicationDate)}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Format the robots.txt output based on database rules or raw overrides.
 */
export function buildRobotsTxt(settings: ISeoSettings): string {
  const robots = settings.robots;
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");

  // If custom raw content is enabled by administrator
  if (robots.customRawEnabled && robots.rawContent?.trim()) {
    return robots.rawContent.trim() + "\n";
  }

  // If robots is entirely disabled, allow everything gracefully
  if (robots.enabled === false) {
    return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  }

  const lines: string[] = [];

  for (const rule of robots.rules) {
    lines.push(`User-agent: ${rule.userAgent || "*"}`);
    if (rule.crawlDelay && rule.crawlDelay > 0) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }
    for (const allowPath of rule.allow || []) {
      if (allowPath) lines.push(`Allow: ${allowPath}`);
    }
    for (const disallowPath of rule.disallow || []) {
      if (disallowPath) lines.push(`Disallow: ${disallowPath}`);
    }
    lines.push(""); // empty line between blocks
  }

  // Sitemaps list
  const sitemaps = (robots.sitemaps && robots.sitemaps.length > 0)
    ? robots.sitemaps
    : [`${siteUrl}/sitemap.xml`];

  for (const sitemapUrl of sitemaps) {
    if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  }

  // Optional Google News sitemap inclusion
  if (robots.includeNewsSitemapInRobots && settings.sitemap.includeNewsSitemap) {
    const newsSitemapUrl = `${siteUrl}/news-sitemap.xml`;
    if (!sitemaps.includes(newsSitemapUrl)) {
      lines.push(`Sitemap: ${newsSitemapUrl}`);
    }
  }

  return lines.join("\n").trim() + "\n";
}
