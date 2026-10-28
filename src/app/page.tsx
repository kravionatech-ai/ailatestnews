import { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { Hero } from "@/components/home/hero";
import { BreakingNewsStrip } from "@/components/home/breaking-news-strip";
import { FeaturedSection } from "@/components/home/featured-section";
import { ModelLaunchesSection } from "@/components/home/model-launches-section";
import { AiToolsSection } from "@/components/home/ai-tools-section";
import { IndiaAiSection } from "@/components/home/india-ai-section";
import { GuidesSection } from "@/components/home/guides-section";
import { EnterpriseAiSection } from "@/components/home/enterprise-ai-section";
import { TrendingLatestSection } from "@/components/home/trending-latest-section";
import { SiteIntroSection } from "@/components/home/site-intro-section";
import { FaqSection } from "@/components/home/faq-section";
import { NewsletterBox } from "@/components/home/newsletter-box";
import { connectDB } from "@/lib/db/connection";
import { Post, Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 300; // 5 minutes ISR

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const homePage = await Page.findOne({ slug: "home" }).lean();
  return buildEntityMetadata({
    entityType: "home",
    entitySeo: homePage?.seo,
    path: "/",
    title: homePage?.seo?.metaTitle || homePage?.title || "AI Latest News — Breaking AI News, Model Launches & India AI Guides",
    excerpt: homePage?.seo?.metaDescription || homePage?.excerpt || "India's premier AI news portal covering generative AI models, LLM launches, comparisons, Indian AI startups, and developer guides.",
  });
}

export default async function HomePage() {
  await connectDB();

  // Public listing: strictly published posts only. Never expose drafts.
  const statusFilter = { status: "published" };

  // Fetch all posts, homepage settings, and global settings in parallel
  const [allPostsRaw, homePageRaw, settings] = await Promise.all([
    Post.find(statusFilter)
      .populate("category", "name slug")
      .populate("author", "name image slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean(),
    Page.findOne({ slug: "home" }).lean(),
    getGlobalSettings(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPosts: any[] = JSON.parse(JSON.stringify(allPostsRaw));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homePage: any = homePageRaw ? JSON.parse(JSON.stringify(homePageRaw)) : null;

  // Extract dynamic homepage blocks
  const heroBlock = homePage?.blocks?.find((b: any) => b.type === "hero");
  const faqBlock = homePage?.blocks?.find((b: any) => b.type === "faq");
  const introBlock = homePage?.blocks?.find((b: any) => b.type === "text");

  const heroProps = {
    badge: heroBlock?.settings?.badge || "India's Sovereign AI & Generative Tech Hub",
    title: heroBlock?.title || "Latest AI News, Tools and Launches, Explained for India",
    subtitle:
      heroBlock?.subtitle ||
      "Independent reporting, hands-on model evaluations, and sovereign AI compute analysis. Built for engineers, founders, and tech enthusiasts across India.",
    primaryCtaText: heroBlock?.settings?.primaryCtaText || "Explore Latest AI News",
    primaryCtaLink: heroBlock?.settings?.primaryCtaLink || "/category/ai-news",
    secondaryCtaText: heroBlock?.settings?.secondaryCtaText || "Compare Models",
    secondaryCtaLink:
      heroBlock?.settings?.secondaryCtaLink || "/category/guides-and-comparisons",
    showOrb: heroBlock?.settings?.showOrb !== false,
  };

  const faqProps = {
    items: faqBlock?.settings?.items,
    title: faqBlock?.title || "Everything You Need to Know",
    subtitle:
      faqBlock?.subtitle ||
      "Common questions about AI Latest News, Indic models, and sovereign compute in India",
  };

  const introProps = {
    title: introBlock?.title || "Independent Intelligence for India's AI Ecosystem",
    contentHtml: introBlock?.content || introBlock?.settings?.contentHtml,
  };

  // ── Strict Deduplication Across All Sections ──
  const seenPostIds = new Set<string>();

  // c) Breaking News Strip: 5 newest headlines
  const headlines = allPosts.slice(0, 5).map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  }));

  // d) Featured Story: strictly published post explicitly marked as featured
  // Never silently promote an unfeatured post or draft to featured.
  const featuredPost =
    allPosts.find((p) => p.featured && !seenPostIds.has(p._id.toString())) || null;

  if (featuredPost) {
    seenPostIds.add(featuredPost._id.toString());
  }

  const secondaryPosts = allPosts
    .filter((p) => !seenPostIds.has(p._id.toString()))
    .slice(0, 3);
  secondaryPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // e) Model Launches (2-3 posts)
  const modelLaunchesPosts = allPosts
    .filter((p) => p.category?.slug === "model-launches" && !seenPostIds.has(p._id.toString()))
    .slice(0, 3);
  modelLaunchesPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // f) AI Tools (2-3 posts)
  const aiToolsPosts = allPosts
    .filter((p) => p.category?.slug === "ai-tools" && !seenPostIds.has(p._id.toString()))
    .slice(0, 3);
  aiToolsPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // g) India AI (2-3 posts)
  const indiaAiPosts = allPosts
    .filter((p) => p.category?.slug === "india-ai" && !seenPostIds.has(p._id.toString()))
    .slice(0, 3);
  indiaAiPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // h) Guides and Comparisons (2 posts)
  const guidesPosts = allPosts
    .filter((p) => p.category?.slug === "guides-and-comparisons" && !seenPostIds.has(p._id.toString()))
    .slice(0, 2);
  guidesPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // i) Enterprise AI section (2 posts)
  const enterpriseAiPosts = allPosts
    .filter((p) => p.category?.slug === "enterprise-ai" && !seenPostIds.has(p._id.toString()))
    .slice(0, 2);
  enterpriseAiPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // j) Trending sidebar & Latest posts list
  // For latest posts: select remaining unseen posts (or fallback to newest unseen)
  const latestPosts = allPosts
    .filter((p) => !seenPostIds.has(p._id.toString()))
    .slice(0, 4);
  latestPosts.forEach((p) => seenPostIds.add(p._id.toString()));

  // Trending sidebar posts (top posts by views/engagement)
  const trendingPosts = allPosts
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      {/* b) Hero Section with H1, 2-line description, 2 CTAs, and 3D orb */}
      <Hero {...heroProps} />

      {/* c) Breaking/Latest AI news strip */}
      <BreakingNewsStrip headlines={headlines} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* d) Featured story (large cover image) + 3 secondary stories with images */}
        <FeaturedSection
          featuredPost={featuredPost}
          secondaryPosts={secondaryPosts}
        />

        {/* e) Model Launches: horizontal cards (model, company, date, one-line summary) */}
        {modelLaunchesPosts.length > 0 && (
          <ModelLaunchesSection posts={modelLaunchesPosts} />
        )}

        {/* f) AI Tools: grid of tool cards (name, category, free/paid, link to review) */}
        {aiToolsPosts.length > 0 && (
          <AiToolsSection posts={aiToolsPosts} />
        )}

        {/* g) India AI: 3-4 stories about Indian AI */}
        {indiaAiPosts.length > 0 && (
          <IndiaAiSection posts={indiaAiPosts} />
        )}

        {/* h) Guides and Comparisons: "X vs Y" and "Best of" cards */}
        {guidesPosts.length > 0 && (
          <GuidesSection posts={guidesPosts} />
        )}

        {/* i) Enterprise AI section */}
        {enterpriseAiPosts.length > 0 && (
          <EnterpriseAiSection posts={enterpriseAiPosts} />
        )}

        {/* j) Trending sidebar (real views) and Latest posts list with pagination link */}
        <TrendingLatestSection
          latestPosts={latestPosts.length > 0 ? latestPosts : allPosts.slice(0, 3)}
          trendingPosts={trendingPosts}
        />

        {/* k) Short intro text (150-250 words) about the site with internal links to category hubs */}
        <SiteIntroSection {...introProps} />

        {/* l) FAQ block (4-5 questions) with FAQPage schema */}
        <FaqSection {...faqProps} />

        {/* m) Newsletter signup (placeholder "your@email.com") */}
        <NewsletterBox />
      </div>
    </PublicShell>
  );
}
