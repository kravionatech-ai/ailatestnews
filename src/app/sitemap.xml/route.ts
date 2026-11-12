import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  getImageSitemapEntries,
  deduplicateSitemapEntries,
  buildUrlsetXml,
  buildSitemapIndexXml,
  NO_CACHE_XML_HEADERS,
} from "@/lib/seo/seo-settings-service";
import SeoSettings from "@/lib/db/models/seo-settings.model";
import { getSiteUrl } from "@/lib/seo/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getOrInitSeoSettings();

    // Check if sitemap generation is globally enabled by administrator
    if (settings.sitemap.enabled === false) {
      const disabledXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap generation is currently disabled by administrator in SEO Management Center -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
      return new NextResponse(disabledXml, {
        status: 200,
        headers: NO_CACHE_XML_HEADERS,
      });
    }

    const [
      {
        siteUrl,
        staticRoutes,
        postRoutes,
        categoryRoutes,
        tagRoutes,
        pageRoutes,
        customRoutes,
      },
      imageEntries,
    ] = await Promise.all([
      getAllSitemapCollections(settings),
      getImageSitemapEntries(settings),
    ]);

    const allEntries = deduplicateSitemapEntries([
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
      ...customRoutes,
    ]);

    const totalCount = allEntries.length;

    // Asynchronously record generation stats without blocking response
    SeoSettings.updateOne(
      { _id: settings._id },
      {
        $set: {
          "sitemap.lastGeneratedAt": new Date(),
          "sitemap.totalUrlsCount": totalCount,
          "sitemap.lastError": "",
        },
      }
    ).catch((err) => console.error("[Sitemap Stats Update Notice]", err));

    // Phase 4: Large Website Sitemap Architecture
    // If split sitemaps is enabled or total URLs exceed 50,000, output a Sitemap Index
    if (settings.sitemap.enableSplitSitemaps || totalCount > 50000) {
      const now = new Date().toISOString();
      const latestLastMod = (items: Array<{ lastModified: string }>) => {
        let maxIso = "";
        let maxTime = -Infinity;
        for (const item of items) {
          const t = Date.parse(item.lastModified);
          if (!isNaN(t) && t > maxTime) {
            maxTime = t;
            maxIso = item.lastModified;
          }
        }
        return maxIso || now;
      };

      const subSitemaps = [
        { loc: `${siteUrl}/sitemap-static.xml`, lastmod: latestLastMod(staticRoutes) },
        ...(postRoutes.length > 0
          ? [{ loc: `${siteUrl}/sitemap-articles.xml`, lastmod: latestLastMod(postRoutes) }]
          : []),
        ...(categoryRoutes.length > 0
          ? [{ loc: `${siteUrl}/sitemap-categories.xml`, lastmod: latestLastMod(categoryRoutes) }]
          : []),
        ...(imageEntries.length > 0
          ? [{ loc: `${siteUrl}/image-sitemap.xml`, lastmod: latestLastMod(imageEntries) }]
          : []),
        ...(tagRoutes.length > 0
          ? [{ loc: `${siteUrl}/sitemap-tags.xml`, lastmod: latestLastMod(tagRoutes) }]
          : []),
        ...(pageRoutes.length > 0
          ? [{ loc: `${siteUrl}/sitemap-pages.xml`, lastmod: latestLastMod(pageRoutes) }]
          : []),
        ...(customRoutes.length > 0
          ? [{ loc: `${siteUrl}/sitemap-custom.xml`, lastmod: latestLastMod(customRoutes) }]
          : []),
      ];

      const indexXml = buildSitemapIndexXml(subSitemaps);
      return new NextResponse(indexXml, {
        status: 200,
        headers: NO_CACHE_XML_HEADERS,
      });
    }

    // Standard single unified XML sitemap
    const xmlContent = buildUrlsetXml(allEntries);

    return new NextResponse(xmlContent, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Sitemap Generation Error]", err);

    // Record error in DB if possible
    SeoSettings.updateOne({}, { $set: { "sitemap.lastError": msg } }).catch(() => {});

    // Fail safely without publishing malformed XML
    const siteUrl = getSiteUrl();
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap generation encountered a temporary database or runtime error. Safe fallback rendered. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  }
}
