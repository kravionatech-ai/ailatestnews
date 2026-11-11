import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getGoogleNewsArticles,
  buildGoogleNewsXml,
  NO_CACHE_XML_HEADERS,
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
        headers: NO_CACHE_XML_HEADERS,
      });
    }

    const newsItems = await getGoogleNewsArticles(settings);
    const xmlContent = buildGoogleNewsXml(newsItems);

    return new NextResponse(xmlContent, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  } catch (err: unknown) {
    console.error("[Google News Sitemap Error]", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Temporary error loading news articles -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  }
}
