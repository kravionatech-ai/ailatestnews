import { NextResponse } from "next/server";
import {
  getOrInitSeoSettings,
  buildRobotsTxt,
  NO_CACHE_TEXT_HEADERS,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getOrInitSeoSettings();
    const content = buildRobotsTxt(settings);

    return new NextResponse(content, {
      status: 200,
      headers: NO_CACHE_TEXT_HEADERS,
    });
  } catch (err: unknown) {
    console.error("[Robots.txt Generation Error]", err);
    const fallback = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/admin/\nDisallow: /login/\nDisallow: /dashboard/\nDisallow: /private/\n\nSitemap: https://ainews.kraviona.com/sitemap.xml\n`;
    return new NextResponse(fallback, {
      status: 200,
      headers: NO_CACHE_TEXT_HEADERS,
    });
  }
}
