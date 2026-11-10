import { connectDB } from "@/lib/db/connection";
import { Post, Page } from "@/lib/db/models";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import type { HomepageResolvedData } from "./types";
import type { NewsCardPost } from "@/components/blog/cards/types";

const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  "model-launches": "model-launches",
  "india-ai": "india-ai",
  "ai-tools": "ai-tools",
  "guides": "guides-and-comparisons",
  "enterprise-ai": "enterprise-ai",
  "model-releases": "model-launches",
};

interface BlockSettingItem {
  type?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  settings?: {
    badge?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    showOrb?: boolean;
    items?: Array<{ question: string; answer: string }>;
    contentHtml?: string;
  };
}

export async function getHomepageData(
  sections: HomepageSectionConfig[]
): Promise<HomepageResolvedData> {
  await connectDB();

  // Single batched round-trip — zero waterfalls
  const [postsRaw, trendingRaw, homePageRaw] = await Promise.all([
    Post.find({ status: "published" })
      .select(
        "title slug excerpt coverImage coverImageAlt readingTime views featured publishedAt createdAt category author tags isBreaking isTrending"
      )
      .populate("category", "name slug")
      .populate("author", "name image slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean(),
    Post.find({ status: "published" })
      .select("title slug excerpt coverImage coverImageAlt readingTime views publishedAt createdAt category author")
      .populate("category", "name slug")
      .populate("author", "name image slug")
      .sort({ views: -1, publishedAt: -1 })
      .limit(10)
      .lean(),
    Page.findOne({ slug: "home" })
      .select("title subtitle excerpt blocks seo")
      .lean(),
  ]);

  const allPosts: NewsCardPost[] = JSON.parse(JSON.stringify(postsRaw || []));
  const trendingPosts: NewsCardPost[] = JSON.parse(JSON.stringify(trendingRaw || []));
  const homePage = homePageRaw ? JSON.parse(JSON.stringify(homePageRaw)) : null;

  // Extract block settings
  const blocks: BlockSettingItem[] = homePage?.blocks || [];
  const heroBlock = blocks.find((b) => b.type === "hero");
  const faqBlock = blocks.find((b) => b.type === "faq");
  const introBlock = blocks.find((b) => b.type === "text");

  const heroProps = {
    badge: heroBlock?.settings?.badge || "India's Sovereign AI & Generative Tech Hub",
    title: heroBlock?.title || "Latest AI News, Tools and Launches, Explained for India",
    subtitle:
      heroBlock?.subtitle ||
      "Independent reporting, hands-on model evaluations, and sovereign compute analysis.",
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

  // Cross-section deduplication
  const seenPostIds = new Set<string>();
  const sectionPostsMap: Record<string, NewsCardPost[]> = {};

  // 1. Breaking News headlines (does not consume posts from other sections)
  const headlines = allPosts.slice(0, 5).map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  }));

  // Sort enabled sections by order ascending
  const sortedSections = [...sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  let featuredPost: NewsCardPost | null = null;
  let secondaryPosts: NewsCardPost[] = [];

  for (const section of sortedSections) {
    if (section.type === "hero") {
      featuredPost =
        allPosts.find((p) => p.featured && !seenPostIds.has(String(p._id))) ||
        allPosts.find((p) => !seenPostIds.has(String(p._id))) ||
        null;
      if (featuredPost && featuredPost._id) {
        seenPostIds.add(String(featuredPost._id));
      }

      secondaryPosts = allPosts
        .filter((p) => !seenPostIds.has(String(p._id)))
        .slice(0, 3);
      secondaryPosts.forEach((p) => {
        if (p._id) seenPostIds.add(String(p._id));
      });
    } else if (
      section.type === "model-launches" ||
      section.type === "india-ai" ||
      section.type === "ai-tools" ||
      section.type === "guides" ||
      section.type === "enterprise-ai" ||
      section.type === "model-releases"
    ) {
      const targetCategory =
        section.categoryFilter || DEFAULT_CATEGORY_MAP[section.type];
      const defaultLimit =
        section.type === "guides" || section.type === "enterprise-ai" ? 2 : 3;
      const limit = section.limit || defaultLimit;

      let matched = allPosts
        .filter(
          (p) =>
            p.category?.slug === targetCategory && !seenPostIds.has(String(p._id))
        )
        .slice(0, limit);

      // If category stories were already seen in Hero wire, reuse category stories so the desk is never empty
      if (matched.length === 0) {
        matched = allPosts
          .filter((p) => p.category?.slug === targetCategory)
          .slice(0, limit);
      }

      matched.forEach((p) => {
        if (p._id) seenPostIds.add(String(p._id));
      });
      sectionPostsMap[section.id] = matched;
      if (!sectionPostsMap[section.type]) {
        sectionPostsMap[section.type] = matched;
      }
    } else if (section.type === "trending-latest") {
      const limit = section.limit || 4;
      const latest = allPosts
        .filter((p) => !seenPostIds.has(String(p._id)))
        .slice(0, limit);
      latest.forEach((p) => {
        if (p._id) seenPostIds.add(String(p._id));
      });
      sectionPostsMap[section.id] = latest;
      if (!sectionPostsMap[section.type]) {
        sectionPostsMap[section.type] = latest;
      }
    }
  }

  // Ensure hero posts exist even if hero section wasn't in the loop
  if (!featuredPost) {
    featuredPost = allPosts.find((p) => p.featured) || allPosts[0] || null;
  }
  if (secondaryPosts.length === 0) {
    const heroId = featuredPost ? String(featuredPost._id) : "";
    secondaryPosts = allPosts.filter((p) => String(p._id) !== heroId).slice(0, 3);
  }

  const heroIds = new Set<string>([
    ...(featuredPost ? [String(featuredPost._id)] : []),
    ...secondaryPosts.map((p) => String(p._id)),
  ]);

  // Latest News: Fresh dispatches excluding the top Hero bundle
  const latestPosts = allPosts.filter((p) => !heroIds.has(String(p._id))).slice(0, 6);
  const latestIds = new Set<string>(latestPosts.map((p) => String(p._id)));

  // Editor's Picks: High-signal featured / pillar stories (distinct from Hero where possible)
  const featuredCandidates = allPosts.filter(
    (p) => p.featured && String(p._id) !== String(featuredPost?._id || "")
  );
  const nonOverlappingFeatured = featuredCandidates.filter(
    (p) => !heroIds.has(String(p._id)) && !latestIds.has(String(p._id))
  );
  const editorsPicks =
    nonOverlappingFeatured.length >= 4
      ? nonOverlappingFeatured.slice(0, 4)
      : [
          ...nonOverlappingFeatured,
          ...allPosts.filter(
            (p) =>
              !heroIds.has(String(p._id)) &&
              !nonOverlappingFeatured.some((fp) => String(fp._id) === String(p._id))
          ),
        ].slice(0, 4);

  return {
    headlines,
    featuredPost,
    secondaryPosts,
    trendingPosts,
    latestPosts,
    editorsPicks,
    sectionPostsMap,
    heroProps,
    faqProps,
    introProps,
  };
}
