import { connectDB } from "@/lib/db/connection";
import {
  SeoSettings,
  Post,
  Category,
  Tag,
  Page,
  type ISeoSettings,
  type ISeoSettingsDoc,
  type ICustomSeoEntry,
  type SitemapChangeFrequency,
} from "@/lib/db/models";
import { getSiteUrl } from "./fallback";

export interface SitemapItem {
  url: string;
  lastModified: string;
  changeFrequency: SitemapChangeFrequency;
  priority: string;
}

export interface NewsSitemapItem {
  url: string;
  title: string;
  publicationDate: string;
  publicationName: string;
  publicationLanguage: string;
}

export interface ImageSitemapMedia {
  loc: string;
  caption?: string;
  title?: string;
}

export interface ImageSitemapItem {
  url: string;
  lastModified: string;
  images: ImageSitemapMedia[];
}

export interface RssFeedItem {
  url: string;
  title: string;
  description: string;
  authorName: string;
  categoryName?: string;
  publicationDate: string;
}

export const NO_CACHE_XML_HEADERS: Record<string, string> = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export const NO_CACHE_TEXT_HEADERS: Record<string, string> = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

/**
 * Deterministic build date for static routes (avoid using new Date() on every request).
 */
const SYSTEM_BUILD_TIMESTAMP = new Date("2026-11-08T00:00:00.000Z").toISOString();

const ALLOWED_CHANGE_FREQS = new Set<SitemapChangeFrequency>([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

function stripInvalidXmlChars(str: string): string {
  // Remove XML 1.0 illegal control characters while preserving tabs/newlines/CR
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "");
}

function toSafeIsoDate(value: unknown, fallback: string = SYSTEM_BUILD_TIMESTAMP): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(String(value));
  return isNaN(d.getTime()) ? fallback : d.toISOString();
}

export function normalizeChangeFrequency(
  val: unknown,
  fallback: SitemapChangeFrequency = "weekly"
): SitemapChangeFrequency {
  const str = String(val || "").trim().toLowerCase() as SitemapChangeFrequency;
  return ALLOWED_CHANGE_FREQS.has(str) ? str : fallback;
}

/**
 * Normalize a relative path ("/guide") or absolute http(s) URL to canonical URL string.
 * Rejects empty strings or unsafe schemes (javascript:, data:, etc.).
 */
export function resolveCanonicalEntryUrl(rawUrl: string, siteUrl: string): string | null {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return null;

  const base = (siteUrl || getSiteUrl()).trim().replace(/\/$/, "");
  const lower = trimmed.toLowerCase();

  // Reject unsafe schemes explicitly
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !lower.startsWith("http://") && !lower.startsWith("https://")) {
    return null;
  }

  let candidate: string;
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    candidate = trimmed;
  } else {
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    candidate = path === "/" ? base : `${base}${path}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.pathname === "/" && !parsed.search && !parsed.hash
      ? `${parsed.protocol}//${parsed.host}`
      : parsed.toString();
  } catch {
    return null;
  }
}

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
        newsPublicationName: "Kraviona AI News",
        newsPublicationLanguage: "en",
        newsTimeWindowHours: 48,
        excludedUrls: [],
        customUrls: [],
        enableSplitSitemaps: true,
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
        sitemaps: [`${siteUrl}/sitemap.xml`, `${siteUrl}/image-sitemap.xml`],
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
    ? toSafeIsoDate(latestPostDate, SYSTEM_BUILD_TIMESTAMP)
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
      url: `${siteUrl}/sitemap`,
      lastModified: baseDate,
      changeFrequency: "daily",
      priority: "0.7",
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
  const lowerUrl = url.toLowerCase();
  for (const pattern of excludedList) {
    const cleanPattern = pattern.trim().toLowerCase();
    if (!cleanPattern) continue;
    if (lowerUrl === cleanPattern) return true;
    if (lowerUrl.endsWith(cleanPattern)) return true;
    if (cleanPattern.includes("*")) {
      const escaped = cleanPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      const regex = new RegExp(`^${escaped}$`, "i");
      if (regex.test(url)) return true;
      try {
        const pathname = new URL(url).pathname;
        if (regex.test(pathname)) return true;
      } catch {
        // ignore relative URL parse failure
      }
    }
  }
  return false;
}

/**
 * Convert admin-managed custom entries into SitemapItem records.
 */
export function buildCustomSitemapRoutes(
  customUrls: ICustomSeoEntry[] | undefined,
  siteUrl: string,
  excludedList: string[] = []
): SitemapItem[] {
  if (!customUrls || customUrls.length === 0) return [];

  const seen = new Set<string>();
  const items: SitemapItem[] = [];

  for (const entry of customUrls) {
    if (!entry || entry.enabled === false || entry.includeInSitemap === false) continue;

    const resolvedUrl = resolveCanonicalEntryUrl(entry.url, siteUrl);
    if (!resolvedUrl) continue;
    if (isUrlExcluded(resolvedUrl, excludedList)) continue;

    const dedupeKey = resolvedUrl.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const priorityNum = Number(entry.priority ?? 0.8);
    const clampedPriority = Number.isFinite(priorityNum)
      ? (Math.round(Math.max(0.0, Math.min(1.0, priorityNum)) * 10) / 10).toFixed(1)
      : "0.8";

    items.push({
      url: resolvedUrl,
      lastModified: toSafeIsoDate(
        entry.lastModified || entry.publicationDate || entry.updatedAt || entry.createdAt,
        new Date().toISOString()
      ),
      changeFrequency: normalizeChangeFrequency(entry.changeFrequency, "weekly"),
      priority: clampedPriority,
    });
  }

  return items;
}

/**
 * Deduplicate sitemap items while letting later/custom overrides replace matching URLs.
 */
export function deduplicateSitemapEntries(entries: SitemapItem[]): SitemapItem[] {
  const byUrl = new Map<string, SitemapItem>();
  for (const item of entries) {
    if (!item?.url) continue;
    byUrl.set(item.url.toLowerCase(), item);
  }
  return Array.from(byUrl.values());
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
  const latestPostDate = posts[0]
    ? new Date(posts[0].publishedAt || posts[0].updatedAt || posts[0].createdAt)
    : undefined;
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
      const validDate = toSafeIsoDate(p.updatedAt || p.publishedAt || p.createdAt);
      return {
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: validDate,
        changeFrequency: normalizeChangeFrequency(p.seo?.sitemap?.changefreq, "daily"),
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
      const validDate = toSafeIsoDate(c.updatedAt || c.createdAt);
      return {
        url: `${siteUrl}/category/${c.slug}`,
        lastModified: validDate,
        changeFrequency: normalizeChangeFrequency(c.seo?.sitemap?.changefreq, "weekly"),
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
      const validDate = toSafeIsoDate(t.updatedAt || t.createdAt);
      return {
        url: `${siteUrl}/tag/${t.slug}`,
        lastModified: validDate,
        changeFrequency: normalizeChangeFrequency(t.seo?.sitemap?.changefreq, "weekly"),
        priority: typeof t.seo?.sitemap?.priority === "number" ? t.seo.sitemap.priority.toFixed(1) : "0.7",
      };
    });

  // Standalone custom pages
  const coreSlugs = new Set([
    "",
    "home",
    "blog",
    "about",
    "editorial-policy",
    "contact",
    "archive",
    "sitemap",
    "newsletter",
    "privacy",
    "terms",
    "search",
    "model-launches",
    "india-ai",
    "ai-tools",
    "zeroai",
  ]);
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
      const validDate = toSafeIsoDate(pg.updatedAt || pg.createdAt);
      return {
        url: `${siteUrl}/${pg.slug}`,
        lastModified: validDate,
        changeFrequency: normalizeChangeFrequency(pg.seo?.sitemap?.changefreq, "monthly"),
        priority: typeof pg.seo?.sitemap?.priority === "number" ? pg.seo.sitemap.priority.toFixed(1) : "0.7",
      };
    });

  // Admin-configured custom entries
  const customRoutes = buildCustomSitemapRoutes(settings.sitemap.customUrls, siteUrl, excluded);

  return {
    siteUrl,
    staticRoutes,
    postRoutes,
    categoryRoutes,
    tagRoutes,
    pageRoutes,
    customRoutes,
  };
}

/**
 * Safely escape characters that are illegal or special in XML format.
 */
export function escapeXml(str: string): string {
  if (!str) return "";
  return stripInvalidXmlChars(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Safely wrap text for XML CDATA blocks without breaking on embedded "]]>".
 */
export function safeCdata(str: string): string {
  const cleaned = stripInvalidXmlChars(str || "");
  return `<![CDATA[${cleaned.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * Format an array of SitemapItem objects into standard XML urlset.
 */
export function buildUrlsetXml(entries: SitemapItem[]): string {
  const uniqueEntries = deduplicateSitemapEntries(entries);
  const xmlUrls = uniqueEntries
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

function decodeBasicHtmlEntities(str: string): string {
  return (str || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function extractTagAttribute(tagHtml: string, attrName: string): string {
  const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = regex.exec(tagHtml);
  return decodeBasicHtmlEntities(match?.[1] || match?.[2] || match?.[3] || "");
}

/**
 * Extract crawlable inline <img> entries from sanitized article HTML.
 */
export function extractHtmlImageMedia(
  html: string | undefined,
  siteUrl: string,
  fallbackTitle?: string
): ImageSitemapMedia[] {
  if (!html) return [];
  const tags = html.match(/<img\b[^>]*>/gi);
  if (!tags || tags.length === 0) return [];

  const media: ImageSitemapMedia[] = [];
  for (const tag of tags) {
    const rawSrc = extractTagAttribute(tag, "src");
    const loc = resolveCanonicalEntryUrl(rawSrc, siteUrl);
    if (!loc) continue;

    const alt = extractTagAttribute(tag, "alt");
    const titleAttr = extractTagAttribute(tag, "title");
    const caption = (alt || titleAttr || "").slice(0, 500);
    const title = (titleAttr || alt || fallbackTitle || "").slice(0, 200);

    media.push({
      loc,
      ...(caption ? { caption } : {}),
      ...(title ? { title } : {}),
    });
  }

  return media;
}

/**
 * Retrieve original article image entries (coverImage + inline <img>) for /image-sitemap.xml.
 */
export async function getImageSitemapEntries(settings: ISeoSettings): Promise<ImageSitemapItem[]> {
  if (settings.sitemap.enabled === false || settings.sitemap.includeArticles === false) {
    return [];
  }

  await connectDB();
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const excluded = settings.sitemap.excludedUrls || [];

  const posts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
    .select(
      "title slug excerpt coverImage coverImageAlt coverImageCaption contentHtml updatedAt publishedAt createdAt seo"
    )
    .lean();

  const items: ImageSitemapItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of posts as any[]) {
    if (!p?.slug) continue;
    if (p.seo?.sitemap?.include === false) continue;
    if (p.seo?.robots?.index === false) continue;

    const pageUrl = `${siteUrl}/blog/${p.slug}`;
    if (isUrlExcluded(pageUrl, excluded)) continue;

    const seenLocs = new Set<string>();
    const images: ImageSitemapMedia[] = [];

    const pushImage = (candidate: ImageSitemapMedia) => {
      const key = candidate.loc.toLowerCase();
      if (seenLocs.has(key) || images.length >= 1000) return;
      seenLocs.add(key);
      images.push(candidate);
    };

    if (p.coverImage) {
      const coverLoc = resolveCanonicalEntryUrl(String(p.coverImage), siteUrl);
      if (coverLoc) {
        const caption = String(p.coverImageCaption || p.coverImageAlt || p.excerpt || "").trim().slice(0, 500);
        const title = String(p.coverImageAlt || p.title || "").trim().slice(0, 200);
        pushImage({
          loc: coverLoc,
          ...(caption ? { caption } : {}),
          ...(title ? { title } : {}),
        });
      }
    }

    const inlineMedia = extractHtmlImageMedia(p.contentHtml, siteUrl, p.title);
    for (const img of inlineMedia) {
      pushImage(img);
    }

    if (images.length > 0) {
      items.push({
        url: pageUrl,
        lastModified: toSafeIsoDate(p.updatedAt || p.publishedAt || p.createdAt),
        images,
      });
    }
  }

  return items;
}

/**
 * Format Image Sitemap entries into W3C / Google Image Sitemap XML (XSD sequence: loc -> caption -> title).
 */
export function buildImageSitemapXml(items: ImageSitemapItem[]): string {
  const xmlUrls = items
    .filter((item) => item?.url && item.images && item.images.length > 0)
    .map((item) => {
      const imageBlocks = item.images
        .slice(0, 1000)
        .map((img) => {
          const lines = [`      <image:loc>${escapeXml(img.loc)}</image:loc>`];
          if (img.caption && img.caption.trim()) {
            lines.push(`      <image:caption>${escapeXml(img.caption.trim())}</image:caption>`);
          }
          if (img.title && img.title.trim()) {
            lines.push(`      <image:title>${escapeXml(img.title.trim())}</image:title>`);
          }
          return `    <image:image>\n${lines.join("\n")}\n    </image:image>`;
        })
        .join("\n");

      return `  <url>
    <loc>${escapeXml(item.url)}</loc>${item.lastModified ? `\n    <lastmod>${escapeXml(item.lastModified)}</lastmod>` : ""}
${imageBlocks}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;
}

/**
 * Build Google News items from admin custom entries within cutoff window.
 */
export function buildCustomNewsItems(
  customUrls: ICustomSeoEntry[] | undefined,
  opts: {
    siteUrl: string;
    excludedUrls?: string[];
    publicationName: string;
    publicationLanguage: string;
    cutoffDate: Date;
  }
): NewsSitemapItem[] {
  if (!customUrls || customUrls.length === 0) return [];

  const items: NewsSitemapItem[] = [];
  for (const entry of customUrls) {
    if (!entry || entry.enabled === false || !entry.includeInNewsSitemap) continue;
    const title = (entry.title || "").trim();
    if (!title) continue;

    const resolvedUrl = resolveCanonicalEntryUrl(entry.url, opts.siteUrl);
    if (!resolvedUrl) continue;
    if (isUrlExcluded(resolvedUrl, opts.excludedUrls || [])) continue;

    const rawDate = entry.publicationDate || entry.lastModified || entry.updatedAt || entry.createdAt;
    const pubDate = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(pubDate.getTime()) || pubDate < opts.cutoffDate) continue;

    items.push({
      url: resolvedUrl,
      title,
      publicationDate: pubDate.toISOString(),
      publicationName: opts.publicationName,
      publicationLanguage: opts.publicationLanguage,
    });
  }

  return items;
}

/**
 * Merge and deduplicate Google News items sorted descending by publicationDate.
 */
export function mergeNewsItems(items: NewsSitemapItem[]): NewsSitemapItem[] {
  const byUrl = new Map<string, NewsSitemapItem>();
  for (const item of items) {
    if (!item?.url || !item?.title) continue;
    byUrl.set(item.url.toLowerCase(), item);
  }
  return Array.from(byUrl.values()).sort(
    (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
  );
}

/**
 * Retrieve fresh Google News eligible articles (last newsTimeWindowHours, default 48 hours).
 */
export async function getGoogleNewsArticles(settings: ISeoSettings): Promise<NewsSitemapItem[]> {
  await connectDB();
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const configuredHours = settings.sitemap.newsTimeWindowHours || 48;
  const timeWindowHours = Math.min(Math.max(1, configuredHours), 48);
  const cutoffDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
  const rawPubName = (settings.sitemap.newsPublicationName || "").trim();
  const pubName = !rawPubName || rawPubName === "AI Latest News" ? "Kraviona AI News" : rawPubName;
  const pubLang = settings.sitemap.newsPublicationLanguage || "en";
  const excluded = settings.sitemap.excludedUrls || [];

  const articles = await Post.find({
    status: "published",
    $or: [
      { publishedAt: { $gte: cutoffDate } },
      { publishedAt: null, createdAt: { $gte: cutoffDate } },
      { publishedAt: { $exists: false }, createdAt: { $gte: cutoffDate } },
    ],
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select("title slug publishedAt updatedAt createdAt seo")
    .lean();

  const postNewsItems: NewsSitemapItem[] = articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => {
      if (!a.slug || !a.title) return false;
      if (a.seo?.sitemap?.include === false) return false;
      if (a.seo?.robots?.index === false) return false;
      const effectivePubDate = a.publishedAt || a.createdAt;
      if (effectivePubDate) {
        const parsedDate = new Date(effectivePubDate);
        if (!isNaN(parsedDate.getTime()) && parsedDate < cutoffDate) return false;
      }
      const url = `${siteUrl}/blog/${a.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => ({
      url: `${siteUrl}/blog/${a.slug}`,
      title: String(a.title).trim(),
      publicationDate: toSafeIsoDate(a.publishedAt || a.createdAt || a.updatedAt, new Date().toISOString()),
      publicationName: pubName,
      publicationLanguage: pubLang,
    }));

  const customNewsItems = buildCustomNewsItems(settings.sitemap.customUrls, {
    siteUrl,
    excludedUrls: excluded,
    publicationName: pubName,
    publicationLanguage: pubLang,
    cutoffDate,
  });

  return mergeNewsItems([...postNewsItems, ...customNewsItems]);
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
 * Build RSS feed items from admin custom entries.
 */
export function buildCustomFeedItems(
  customUrls: ICustomSeoEntry[] | undefined,
  siteUrl: string,
  excludedUrls: string[] = []
): RssFeedItem[] {
  if (!customUrls || customUrls.length === 0) return [];

  const items: RssFeedItem[] = [];
  for (const entry of customUrls) {
    if (!entry || entry.enabled === false || !entry.includeInFeed) continue;
    const title = (entry.title || "").trim();
    if (!title) continue;

    const resolvedUrl = resolveCanonicalEntryUrl(entry.url, siteUrl);
    if (!resolvedUrl) continue;
    if (isUrlExcluded(resolvedUrl, excludedUrls)) continue;

    const rawDate = entry.publicationDate || entry.lastModified || entry.updatedAt || entry.createdAt;
    const pubDate = toSafeIsoDate(rawDate, new Date().toISOString());

    items.push({
      url: resolvedUrl,
      title,
      description: (entry.description || title).trim(),
      authorName: (entry.authorName || "Kraviona AI News Editorial Team").trim(),
      publicationDate: pubDate,
    });
  }

  return items;
}

/**
 * Retrieve fresh RSS feed items (published articles + enabled custom feed entries).
 */
export async function getRssFeedItems(settings: ISeoSettings, limit = 30): Promise<RssFeedItem[]> {
  await connectDB();
  const siteUrl = (settings.sitemap.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const excluded = settings.sitemap.excludedUrls || [];

  const posts = await Post.find({ status: "published" })
    .select("title slug publishedAt createdAt updatedAt excerpt author category seo")
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.max(limit * 2, 50))
    .populate([
      { path: "author", select: "name" },
      { path: "category", select: "name" },
    ])
    .lean();

  const postFeedItems: RssFeedItem[] = posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => {
      if (!p.slug || !p.title) return false;
      if (p.seo?.sitemap?.include === false) return false;
      if (p.seo?.robots?.index === false) return false;
      const url = `${siteUrl}/blog/${p.slug}`;
      if (isUrlExcluded(url, excluded)) return false;
      return true;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      title: String(p.title).trim(),
      description: String(p.excerpt || p.title || "").trim(),
      authorName: String((p.author as { name?: string })?.name || "Kraviona AI News Editorial Team").trim(),
      categoryName: (p.category as { name?: string })?.name?.trim() || undefined,
      publicationDate: toSafeIsoDate(p.publishedAt || p.createdAt || p.updatedAt, new Date().toISOString()),
    }));

  const customFeedItems = buildCustomFeedItems(settings.sitemap.customUrls, siteUrl, excluded);

  const byUrl = new Map<string, RssFeedItem>();
  for (const item of postFeedItems) {
    byUrl.set(item.url.toLowerCase(), item);
  }
  for (const item of customFeedItems) {
    byUrl.set(item.url.toLowerCase(), item);
  }

  return Array.from(byUrl.values())
    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
    .slice(0, limit);
}

/**
 * Format RSS 2.0 feed XML safely.
 */
export function buildRssFeedXml(
  items: RssFeedItem[],
  meta: {
    siteName?: string;
    siteUrl?: string;
    tagline?: string;
    language?: string;
  }
): string {
  const siteUrl = (meta.siteUrl || getSiteUrl()).replace(/\/$/, "");
  const displayName =
    !meta.siteName || meta.siteName === "AI Latest News"
      ? "Kraviona AI News"
      : meta.siteName;
  const tagline = meta.tagline || "AI, Technology, Research and Innovation Intelligence";
  const language = meta.language || "en";
  const lastBuildDate = items[0]?.publicationDate
    ? new Date(items[0].publicationDate).toUTCString()
    : new Date().toUTCString();

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${safeCdata(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${escapeXml(new Date(item.publicationDate).toUTCString())}</pubDate>
      <description>${safeCdata(item.description)}</description>
      <dc:creator>${safeCdata(item.authorName)}</dc:creator>${item.categoryName ? `\n      <category>${safeCdata(item.categoryName)}</category>` : ""}
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${displayName} — RSS Feed`)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(tagline)}</description>
    <language>${escapeXml(language)}</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`;
}

/**
 * Refresh cached sitemap stats snapshot on the singleton SeoSettings document.
 */
export async function refreshSeoStatsSnapshot(existingSettings?: ISeoSettingsDoc): Promise<{
  totalUrlsCount: number;
  newsCount: number;
}> {
  await connectDB();
  const settings = existingSettings || (await getOrInitSeoSettings());
  const [collections, newsArticles] = await Promise.all([
    getAllSitemapCollections(settings),
    getGoogleNewsArticles(settings),
  ]);

  const allEntries = deduplicateSitemapEntries([
    ...collections.staticRoutes,
    ...collections.postRoutes,
    ...collections.categoryRoutes,
    ...collections.tagRoutes,
    ...collections.pageRoutes,
    ...collections.customRoutes,
  ]);

  await SeoSettings.updateOne(
    { _id: settings._id },
    {
      $set: {
        "sitemap.lastGeneratedAt": new Date(),
        "sitemap.totalUrlsCount": allEntries.length,
        "sitemap.lastError": "",
      },
    }
  );

  return {
    totalUrlsCount: allEntries.length,
    newsCount: newsArticles.length,
  };
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
  const sitemaps =
    robots.sitemaps && robots.sitemaps.length > 0
      ? robots.sitemaps
      : [`${siteUrl}/sitemap.xml`];

  for (const sitemapUrl of sitemaps) {
    if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  }

  // Optional Image Sitemap inclusion
  if (settings.sitemap.includeArticles !== false) {
    const imageSitemapUrl = `${siteUrl}/image-sitemap.xml`;
    if (!sitemaps.includes(imageSitemapUrl)) {
      lines.push(`Sitemap: ${imageSitemapUrl}`);
    }
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
