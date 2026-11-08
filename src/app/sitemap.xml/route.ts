import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  buildUrlsetXml,
  buildSitemapIndexXml,
} from "@/lib/seo/seo-settings-service";
import SeoSettings from "@/lib/db/models/seo-settings.model";

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
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    const { siteUrl, staticRoutes, postRoutes, categoryRoutes, tagRoutes, pageRoutes } =
      await getAllSitemapCollections(settings);

    const allEntries = [
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
    ];

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
      const subSitemaps = [
        { loc: `${siteUrl}/sitemap-static.xml`, lastmod: staticRoutes[0]?.lastModified || now },
        ...(postRoutes.length > 0 ? [{ loc: `${siteUrl}/sitemap-articles.xml`, lastmod: postRoutes[0]?.lastModified || now }] : []),
        ...(categoryRoutes.length > 0 ? [{ loc: `${siteUrl}/sitemap-categories.xml`, lastmod: categoryRoutes[0]?.lastModified || now }] : []),
        ...(tagRoutes.length > 0 ? [{ loc: `${siteUrl}/sitemap-tags.xml`, lastmod: tagRoutes[0]?.lastModified || now }] : []),
        ...(pageRoutes.length > 0 ? [{ loc: `${siteUrl}/sitemap-pages.xml`, lastmod: pageRoutes[0]?.lastModified || now }] : []),
      ];

      const indexXml = buildSitemapIndexXml(subSitemaps);
      return new NextResponse(indexXml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    // Standard single unified XML sitemap
    const xmlContent = buildUrlsetXml(allEntries);

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    console.error("[Sitemap Generation Error]", err);

    // Record error in DB if possible
    SeoSettings.updateOne({}, { $set: { "sitemap.lastError": err.message || "Unknown error" } }).catch(
      () => {}
    );

    // Fail safely without publishing malformed XML
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap generation encountered a temporary database or runtime error. Safe fallback rendered. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ainews.kraviona.com</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
