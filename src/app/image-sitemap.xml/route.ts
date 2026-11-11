import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getImageSitemapEntries,
  buildImageSitemapXml,
  NO_CACHE_XML_HEADERS,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMPTY_IMAGE_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;

export async function GET() {
  try {
    const settings = await getOrInitSeoSettings();
    if (settings.sitemap.enabled === false || !settings.sitemap.includeArticles) {
      return new NextResponse(EMPTY_IMAGE_SITEMAP_XML, {
        status: 200,
        headers: NO_CACHE_XML_HEADERS,
      });
    }

    const imageEntries = await getImageSitemapEntries(settings);
    const xml = buildImageSitemapXml(imageEntries);

    return new NextResponse(xml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  } catch (err) {
    console.error("[Image Sitemap Generation Error]", err);
    return new NextResponse(EMPTY_IMAGE_SITEMAP_XML, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  }
}
