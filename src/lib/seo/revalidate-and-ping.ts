import { revalidatePath, revalidateTag } from "next/cache";
import { getSiteUrl } from "./fallback";
import { refreshSeoStatsSnapshot } from "./seo-settings-service";

export interface SeoRevalidationOptions {
  path?: string; // e.g. "/blog/my-post"
  extraPaths?: string[];
  categorySlug?: string;
  categorySlugs?: string[];
  tagSlugs?: string[];
  forceIndexNow?: boolean;
  pingUrls?: string[];
  skipStatsRefresh?: boolean;
}

export interface IndexNowResult {
  success: boolean;
  statusCode?: number;
  message: string;
  urlPings?: string[];
}

export const CORE_FEED_AND_SITEMAP_PATHS = [
  "/sitemap.xml",
  "/sitemap-static.xml",
  "/sitemap-articles.xml",
  "/sitemap-categories.xml",
  "/sitemap-tags.xml",
  "/sitemap-pages.xml",
  "/sitemap-custom.xml",
  "/image-sitemap.xml",
  "/news-sitemap.xml",
  "/sitemap-news.xml",
  "/feed.xml",
  "/robots.txt",
] as const;

export const CORE_PUBLIC_LIST_PATHS = [
  "/",
  "/blog",
  "/archive",
  "/sitemap",
  "/model-launches",
  "/india-ai",
  "/ai-tools",
] as const;

/**
 * Ping IndexNow API (Bing, Yandex, Seznam, Naver)
 * Official endpoint: https://api.indexnow.org/indexnow
 */
export async function pingIndexNow(
  urls: string[],
  force = false
): Promise<IndexNowResult> {
  const isProd = process.env.NODE_ENV === "production";
  const apiKey = process.env.INDEXNOW_KEY;

  if (!urls || urls.length === 0) {
    return {
      success: true,
      message: "IndexNow ping skipped (no URLs supplied)",
      urlPings: [],
    };
  }

  if (!isProd && !force) {
    return {
      success: true,
      message: "IndexNow ping skipped (non-production environment)",
      urlPings: urls,
    };
  }

  if (!apiKey) {
    return {
      success: false,
      message: "INDEXNOW_KEY environment variable not configured",
      urlPings: urls,
    };
  }

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).hostname;

  try {
    const uniqueUrls = Array.from(
      new Set(
        urls
          .filter(Boolean)
          .map((u) => (u.startsWith("http") ? u : `${siteUrl}${u.startsWith("/") ? u : `/${u}`}`))
      )
    );

    const payload = {
      host,
      key: apiKey,
      keyLocation: `${siteUrl}/${apiKey}.txt`,
      urlList: uniqueUrls,
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      return {
        success: true,
        statusCode: res.status,
        message: `IndexNow submitted successfully (${res.status})`,
        urlPings: payload.urlList,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        statusCode: res.status,
        message: `IndexNow responded with HTTP ${res.status}: ${errText}`,
        urlPings: payload.urlList,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("IndexNow ping failed:", msg);
    return {
      success: false,
      message: `IndexNow network error: ${msg}`,
      urlPings: urls,
    };
  }
}

/**
 * Trigger Next.js on-demand ISR revalidation across pages, sitemaps, feeds + IndexNow ping
 */
export async function triggerSeoRevalidation({
  path,
  extraPaths = [],
  categorySlug,
  categorySlugs = [],
  tagSlugs = [],
  forceIndexNow = false,
  pingUrls,
  skipStatsRefresh = false,
}: SeoRevalidationOptions): Promise<{
  revalidated: string[];
  indexNow: IndexNowResult;
  stats?: { totalUrlsCount: number; newsCount: number };
}> {
  const revalidatedSet = new Set<string>();

  const safeRevalidatePath = (p: string) => {
    if (!p || !p.startsWith("/")) return;
    revalidatePath(p);
    revalidatedSet.add(p);
  };

  try {
    // 1. Revalidate primary & extra entity paths
    if (path) {
      safeRevalidatePath(path);
    }
    for (const extra of extraPaths) {
      safeRevalidatePath(extra);
    }

    // 2. Revalidate sitemaps, Google News sitemap, RSS feed, and robots.txt
    for (const feedPath of CORE_FEED_AND_SITEMAP_PATHS) {
      safeRevalidatePath(feedPath);
    }

    // 3. Revalidate home, blog listings, archive, and topic hubs
    for (const publicPath of CORE_PUBLIC_LIST_PATHS) {
      safeRevalidatePath(publicPath);
    }

    // 4. Revalidate category hubs
    const allCategorySlugs = Array.from(
      new Set([categorySlug, ...categorySlugs].filter((s): s is string => Boolean(s)))
    );
    for (const catSlug of allCategorySlugs) {
      safeRevalidatePath(`/category/${catSlug}`);
    }

    // 5. Revalidate tag hubs
    const allTagSlugs = Array.from(new Set(tagSlugs.filter(Boolean)));
    for (const tagSlug of allTagSlugs) {
      safeRevalidatePath(`/tag/${tagSlug}`);
    }

    // 6. Revalidate data tags
    revalidateTag("posts", "default");
    revalidateTag("taxonomies", "default");
    revalidateTag("sitemap", "default");
  } catch (err) {
    console.warn("ISR revalidation warning (allowed outside request/dev):", err);
  }

  let stats: { totalUrlsCount: number; newsCount: number } | undefined;
  if (!skipStatsRefresh) {
    try {
      stats = await refreshSeoStatsSnapshot();
    } catch (err) {
      console.warn("SEO stats snapshot refresh warning:", err);
    }
  }

  // 7. IndexNow Ping (only when URLs provided / path exists)
  const siteUrl = getSiteUrl();
  const rawPingTargets =
    pingUrls && pingUrls.length > 0
      ? pingUrls
      : [path, ...extraPaths].filter((u): u is string => Boolean(u));

  const fullUrlsToPing = rawPingTargets.map((target) =>
    target.startsWith("http")
      ? target
      : `${siteUrl}${target.startsWith("/") ? target : `/${target}`}`
  );

  const indexNowResult = await pingIndexNow(fullUrlsToPing, forceIndexNow);

  return {
    revalidated: Array.from(revalidatedSet),
    indexNow: indexNowResult,
    stats,
  };
}
