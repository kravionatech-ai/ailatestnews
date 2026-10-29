import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";
import { getGlobalSeoSettings, getSiteUrl } from "@/lib/seo/fallback";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();
  const settings = await getGlobalSeoSettings();

  await connectDB();
  const posts = await Post.find({ status: "published" })
    .select("title slug publishedAt excerpt author")
    .sort({ publishedAt: -1 })
    .limit(20)
    .populate("author", "name")
    .lean();

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${settings.siteName} — RSS Feed</title>
    <link>${siteUrl}</link>
    <description>${settings.tagline || "Latest AI news, tools and guides, explained for India."}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <author><![CDATA[${(post.author as unknown as { name?: string })?.name || "AI Latest News Editorial Team"}]]></author>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
