import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  buildUrlsetXml,
  NO_CACHE_XML_HEADERS,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getOrInitSeoSettings();
    if (settings.sitemap.enabled === false) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
        { status: 200, headers: NO_CACHE_XML_HEADERS }
      );
    }
    const { customRoutes } = await getAllSitemapCollections(settings);
    const xml = buildUrlsetXml(customRoutes);
    return new NextResponse(xml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  } catch {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 200,
        headers: NO_CACHE_XML_HEADERS,
      }
    );
  }
}
