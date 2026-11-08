import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getGoogleNewsArticles,
  buildGoogleNewsXml,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getOrInitSeoSettings();

    // Check if Google News sitemap is enabled
    if (settings.sitemap.includeNewsSitemap === false) {
      const disabledXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Google News Sitemap generation is disabled by administrator in SEO Management Center -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
      return new NextResponse(disabledXml, {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    const newsItems = await getGoogleNewsArticles(settings);
    const xmlContent = buildGoogleNewsXml(newsItems);

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    console.error("[Google News Sitemap Error]", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Temporary error loading news articles -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
