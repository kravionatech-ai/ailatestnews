import { revalidatePath, revalidateTag } from "next/cache";
import { getSiteUrl } from "./fallback";

export interface SeoRevalidationOptions {
  path: string; // e.g. "/blog/my-post"
  categorySlug?: string;
  tagSlugs?: string[];
  forceIndexNow?: boolean;
}

export interface IndexNowResult {
  success: boolean;
  statusCode?: number;
  message: string;
  urlPings?: string[];
}

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
    const payload = {
      host,
      key: apiKey,
      keyLocation: `${siteUrl}/${apiKey}.txt`,
      urlList: urls.map((u) => (u.startsWith("http") ? u : `${siteUrl}${u.startsWith("/") ? u : `/${u}`}`)),
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
 * Trigger Next.js on-demand ISR revalidation + IndexNow ping
 */
export async function triggerSeoRevalidation({
  path,
  categorySlug,
  tagSlugs = [],
  forceIndexNow = false,
}: SeoRevalidationOptions): Promise<{ revalidated: string[]; indexNow: IndexNowResult }> {
  const revalidatedPaths: string[] = [];

  try {
    // 1. Revalidate the entity itself
    if (path) {
      revalidatePath(path);
      revalidatedPaths.push(path);
    }

    // 2. Revalidate sitemap and feed
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    revalidatePath("/robots.txt");
    revalidatePath("/archive");
    revalidateTag("posts", "default");
    revalidateTag("taxonomies", "default");
    revalidateTag("sitemap", "default");
    revalidatedPaths.push("/sitemap.xml", "/feed.xml");

    // 3. Revalidate home and blog lists
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatedPaths.push("/", "/blog");

    // 4. Revalidate category hub if applicable
    if (categorySlug) {
      const catPath = `/category/${categorySlug}`;
      revalidatePath(catPath);
      revalidatedPaths.push(catPath);
    }

    // 5. Revalidate tag hubs
    for (const tagSlug of tagSlugs) {
      const tagPath = `/tag/${tagSlug}`;
      revalidatePath(tagPath);
      revalidatedPaths.push(tagPath);
    }
  } catch (err) {
    console.warn("ISR revalidation warning (allowed in dev):", err);
  }

  // 6. IndexNow Ping
  const fullUrl = path.startsWith("http") ? path : `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const indexNowResult = await pingIndexNow([fullUrl], forceIndexNow);

  return {
    revalidated: revalidatedPaths,
    indexNow: indexNowResult,
  };
}
