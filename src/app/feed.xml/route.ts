import { NextResponse } from "next/server";
import { getGlobalSeoSettings, getSiteUrl } from "@/lib/seo/fallback";
import {
  getOrInitSeoSettings,
  getRssFeedItems,
  buildRssFeedXml,
  NO_CACHE_XML_HEADERS,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [seoSettings, globalSettings] = await Promise.all([
      getOrInitSeoSettings(),
      getGlobalSeoSettings(),
    ]);

    const siteUrl = (seoSettings.sitemap?.siteUrl || globalSettings.siteUrl || getSiteUrl()).replace(
      /\/$/,
      ""
    );
    const feedItems = await getRssFeedItems(seoSettings, 30);

    const xml = buildRssFeedXml(feedItems, {
      siteName: globalSettings.siteName,
      siteUrl,
      tagline: globalSettings.tagline,
      language: seoSettings.sitemap?.newsPublicationLanguage || "en",
    });

    return new NextResponse(xml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  } catch (err: unknown) {
    console.error("[RSS Feed Generation Error]", err);
    const fallbackXml = buildRssFeedXml([], {
      siteUrl: getSiteUrl(),
    });
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: NO_CACHE_XML_HEADERS,
    });
  }
}
