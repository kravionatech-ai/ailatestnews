import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo/domain";
import { connectDB } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    await connectDB();
    const siteUrl = getSiteUrl();

    const recentPosts = await Post.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(30)
      .select("title slug excerpt publishedAt")
      .lean();

    const articleEntries = recentPosts
      .map(
        (p) =>
          `- [${p.title}](${siteUrl}/blog/${p.slug}): ${
            (p.excerpt || "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 160) || "Technical breakdown and analysis"
          }`
      )
      .join("\n");

    const content = `# Kraviona AI News
> Authoritative independent technology publication delivering real-time reporting, benchmark evaluations, and architectural analyses across artificial intelligence, foundation models, cybersecurity, blockchain protocols, and modern web development.

## Primary Editorial Hubs
- [Homepage & Latest Dispatches](${siteUrl}): Real-time breaking technological intelligence and news analysis.
- [AI News & LLM Research](${siteUrl}/category/ai-news): Deep dives into frontier models, open weights, and agent frameworks.
- [Model Launches Hub](${siteUrl}/category/model-launches): Chronological releases, benchmark evaluations, and pricing metrics.
- [AI Tools Directory](${siteUrl}/ai-tools): Hand-tested developer tools, local inference runtimes, and productivity engines.
- [ZeroAI Stylometric Detector](${siteUrl}/zeroai): Stylometric AI content detection utility.
- [Full XML Sitemap Index](${siteUrl}/sitemap.xml): Comprehensive search engine discovery index.
- [Google News Sitemap](${siteUrl}/news-sitemap.xml): Verified news articles published within the past 48 hours.
- [RSS 2.0 Feed](${siteUrl}/feed.xml): Machine-readable XML article syndication.

## Recent Technical Dispatches
${articleEntries || "- No articles currently published."}

## Editorial Policy & Standards
- [Editorial Code & Fact-Checking](${siteUrl}/editorial-policy): Information on sourcing, benchmark methodology, and AI usage disclosure.
- [About Kraviona Newsroom](${siteUrl}/about): Editorial masthead, journalistic mission, and background.
- [Contact Editorial Desk](${siteUrl}/contact): Tips, corrections, and vulnerability reporting.
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[llms.txt Generation Error]", err);
    const siteUrl = getSiteUrl();
    const fallback = `# Kraviona AI News\n> Independent technology publication.\n\n- [Homepage](${siteUrl})\n- [Sitemap](${siteUrl}/sitemap.xml)\n`;
    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
