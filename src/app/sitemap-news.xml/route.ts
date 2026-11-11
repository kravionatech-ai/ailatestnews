import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo/fallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const siteUrl = getSiteUrl();
  return NextResponse.redirect(`${siteUrl}/news-sitemap.xml`, 301);
}
