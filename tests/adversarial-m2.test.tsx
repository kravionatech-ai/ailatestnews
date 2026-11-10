import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ClassicEditorialCard,
  ModernMagazineCard,
  HorizontalCard,
  CompactNewsCard,
  LargeFeaturedCard,
  ImageOverlayCard,
  MinimalListCard,
  NewsCard,
  CardImage,
} from "@/components/blog/cards";
import { PostCard } from "@/components/blog/post-card";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import { TARGET_VIEWPORTS, ResponsiveLayoutEngine } from "./e2e/responsive-viewports.test";

// Baseline valid post for baseline comparison
const baselinePost: NewsCardPost = {
  _id: "test-post-001",
  title: "Frontier Foundation Models and Sparse MoE Architectures",
  slug: "frontier-foundation-models-sparse-moe",
  excerpt: "Detailed architectural breakdown of sparse mixture-of-experts training and memory bandwidth.",
  coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
  coverImageAlt: "Sparse MoE Diagram",
  readingTime: 7,
  views: 3420,
  publishedAt: new Date("2026-11-08T14:30:00Z"),
  createdAt: new Date("2026-11-08T12:00:00Z"),
  author: {
    name: "Dr. Elena Rostova",
    slug: "elena-rostova",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    role: "Principal Systems Engineer",
  },
  category: {
    name: "System Architecture",
    slug: "system-architecture",
  },
  tags: [
    { name: "MoE", slug: "moe" },
    { name: "Inference", slug: "inference" },
  ],
  featured: false,
  isBreaking: false,
  isTrending: false,
};

describe("Milestone 2 Adversarial Empirical Verification Suite: Modular News Cards", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. MISSING, NULL, EMPTY & CORRUPT IMAGES (FALLBACK IMAGE BEHAVIOR)
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Missing, Null, Empty & Malformed Images", () => {
    it("CardImage renders BookOpen SVG fallback when coverImage is undefined", () => {
      const postNoImg: NewsCardPost = { ...baselinePost, coverImage: undefined };
      const html = renderToStaticMarkup(<CardImage post={postNoImg} />);

      // Must not contain <img> tag
      expect(html).not.toContain("<img");
      // Must contain fallback icon / placeholder
      expect(html).toContain("lucide-book-open");
      expect(html).toContain(postNoImg.category!.name);
    });

    it("CardImage renders default publication name when coverImage and category are both undefined", () => {
      const postEmpty: NewsCardPost = { ...baselinePost, coverImage: undefined, category: undefined };
      const html = renderToStaticMarkup(<CardImage post={postEmpty} />);

      expect(html).not.toContain("<img");
      expect(html).toContain("Kraviona AI News");
    });

    it("CardImage falls back cleanly when coverImage is empty string", () => {
      const postEmptyStr: NewsCardPost = { ...baselinePost, coverImage: "" };
      const html = renderToStaticMarkup(<CardImage post={postEmptyStr} />);

      expect(html).not.toContain("<img");
      expect(html).toContain("lucide-book-open");
    });

    it("CardImage falls back to post.title when coverImageAlt is undefined", () => {
      const postNoAlt: NewsCardPost = { ...baselinePost, coverImageAlt: undefined };
      const html = renderToStaticMarkup(<CardImage post={postNoAlt} />);

      expect(html).toContain(`alt="${postNoAlt.title}"`);
    });

    it("ClassicEditorialCard renders fallback placeholder when coverImage is missing", () => {
      const postNoImg: NewsCardPost = {
        ...baselinePost,
        coverImage: undefined,
        author: { ...baselinePost.author!, image: undefined },
      };
      const html = renderToStaticMarkup(<ClassicEditorialCard post={postNoImg} />);

      expect(html).toContain("lucide-book-open");
      expect(html).not.toContain("<img");
    });

    it("ModernMagazineCard renders fallback placeholder when coverImage is missing", () => {
      const postNoImg: NewsCardPost = {
        ...baselinePost,
        coverImage: undefined,
        author: { ...baselinePost.author!, image: undefined },
      };
      const html = renderToStaticMarkup(<ModernMagazineCard post={postNoImg} />);

      expect(html).toContain("lucide-book-open");
      expect(html).not.toContain("<img");
    });

    it("HorizontalCard renders fallback placeholder inside fixed thumbnail when coverImage is missing", () => {
      const postNoImg: NewsCardPost = {
        ...baselinePost,
        coverImage: undefined,
        author: { ...baselinePost.author!, image: undefined },
      };
      const html = renderToStaticMarkup(<HorizontalCard post={postNoImg} />);

      expect(html).toContain("sm:w-44 md:w-52");
      expect(html).toContain("lucide-book-open");
      expect(html).not.toContain("<img");
    });

    it("CompactNewsCard cleanly omits thumbnail element without crashing or empty image gap", () => {
      const postNoImg: NewsCardPost = { ...baselinePost, coverImage: undefined };
      const html = renderToStaticMarkup(<CompactNewsCard post={postNoImg} />);

      expect(html).not.toContain("h-14 w-14 sm:h-16 sm:w-16");
      expect(html).not.toContain("<img");
      expect(html).toContain(postNoImg.title);
    });

    it("LargeFeaturedCard renders fallback placeholder when coverImage is missing", () => {
      const postNoImg: NewsCardPost = {
        ...baselinePost,
        coverImage: undefined,
        author: { ...baselinePost.author!, image: undefined },
      };
      const html = renderToStaticMarkup(<LargeFeaturedCard post={postNoImg} />);

      expect(html).toContain("lucide-book-open");
      expect(html).not.toContain("<img");
      expect(html).toContain("Lead Investigation");
    });

    it("ImageOverlayCard renders solid dark background fallback when coverImage is missing", () => {
      const postNoImg: NewsCardPost = { ...baselinePost, coverImage: undefined };
      const html = renderToStaticMarkup(<ImageOverlayCard post={postNoImg} />);

      expect(html).not.toContain("<img");
      expect(html).toContain("bg-[var(--color-primary-dark)]");
      expect(html).toContain("bg-gradient-to-t from-black/95");
      expect(html).toContain(postNoImg.title);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. EXTREMELY LONG TITLES, EXCERPTS & OVERFLOW CONTAINMENT
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Extremely Long Titles, Excerpts & Overflow Containment", () => {
    const ultraLongTitle =
      "SUPER-ULTRA-HYPER-MASSIVE-CONTINUOUS-TOKEN-STREAM-OF-EXTREME-LENGTH-WITHOUT-SPACES-" +
      "ArchitecturalBreakdownOfFrontierReasoningEnginesAndAutonomousAgenticWorkflowsIn2026-".repeat(10);

    const paragraphLengthTitle =
      "Frontier AI systems have rapidly shifted from raw next-token prediction to multi-turn reinforcement learning " +
      "with test-time compute search trees, verifiable mathematical scratchpads, autonomous code execution environments, " +
      "distributed speculative decoding engines, hardware-accelerated KV cache compression routines, and sovereign " +
      "datacenter microgrid power constraints across global enterprise infrastructure deployments.";

    const ultraLongExcerpt =
      ("In this rigorous investigative dispatch, we evaluate the algorithmic convergence between frontier language " +
        "models and autonomous reasoning agents. By analyzing empirical benchmark results across AIME, SWE-bench, " +
        "and Indic MMLU benchmarks, we establish concrete telemetry on memory consumption, power draw, and throughput. ")
        .repeat(15);

    const postStressContent: NewsCardPost = {
      ...baselinePost,
      title: ultraLongTitle,
      excerpt: ultraLongExcerpt,
    };

    it("all 7 variants render ultra-long titles without unhandled exceptions", () => {
      const renderers = [
        () => renderToStaticMarkup(<ClassicEditorialCard post={postStressContent} />),
        () => renderToStaticMarkup(<ModernMagazineCard post={postStressContent} />),
        () => renderToStaticMarkup(<HorizontalCard post={postStressContent} />),
        () => renderToStaticMarkup(<CompactNewsCard post={postStressContent} />),
        () => renderToStaticMarkup(<LargeFeaturedCard post={postStressContent} />),
        () => renderToStaticMarkup(<ImageOverlayCard post={postStressContent} />),
        () => renderToStaticMarkup(<MinimalListCard post={postStressContent} rank={1} />),
      ];

      for (const renderFn of renderers) {
        expect(renderFn).not.toThrow();
        const output = renderFn();
        expect(output.length).toBeGreaterThan(200);
      }
    });

    it("verifies line clamping and text containment classes exist across cards", () => {
      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postStressContent} />);
      expect(c1).toContain("overflow-hidden");
      expect(c1).toContain("line-clamp-2 sm:line-clamp-3"); // excerpt clamp

      const c2 = renderToStaticMarkup(<ModernMagazineCard post={postStressContent} />);
      expect(c2).toContain("overflow-hidden");
      expect(c2).toContain("line-clamp-2");

      const c3 = renderToStaticMarkup(<HorizontalCard post={postStressContent} />);
      expect(c3).toContain("line-clamp-2"); // headline clamp
      expect(c3).toContain("min-w-0"); // prevents flex item blowout

      const c4 = renderToStaticMarkup(<CompactNewsCard post={postStressContent} />);
      expect(c4).toContain("line-clamp-2");
      expect(c4).toContain("min-w-0");

      const c5 = renderToStaticMarkup(<LargeFeaturedCard post={postStressContent} />);
      expect(c5).toContain("overflow-hidden");
      expect(c5).toContain("line-clamp-3"); // excerpt clamp

      const c6 = renderToStaticMarkup(<ImageOverlayCard post={postStressContent} />);
      expect(c6).toContain("overflow-hidden");
      expect(c6).toContain("line-clamp-2"); // title and excerpt

      const c7 = renderToStaticMarkup(<MinimalListCard post={postStressContent} rank={1} />);
      expect(c7).toContain("line-clamp-2");
      expect(c7).toContain("min-w-0");
    });

    it("escapes malicious HTML / XSS payloads in titles and excerpts without raw execution", () => {
      const xssPost: NewsCardPost = {
        ...baselinePost,
        title: '<script>alert("xss-exploit")</script><img src="x" onerror="alert(1)" />',
        excerpt: '<b onmouseover="alert(\'xss\')">Dangerous payload</b>',
      };

      const html = renderToStaticMarkup(<ClassicEditorialCard post={xssPost} />);

      // React MUST escape angle brackets
      expect(html).not.toContain('<script>alert("xss-exploit")</script>');
      expect(html).toContain("&lt;script&gt;alert(&quot;xss-exploit&quot;)&lt;/script&gt;");
      expect(html).not.toContain('<b onmouseover="alert(\'xss\')">');
      expect(html).toContain("&lt;b onmouseover=&quot;alert(&#x27;xss&#x27;)&quot;&gt;");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MISSING, NULL & CORRUPT AUTHOR METADATA
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Missing, Null & Corrupt Author Metadata", () => {
    it("handles post with author = undefined without throw and displays default byline", () => {
      const postNoAuthor: NewsCardPost = { ...baselinePost, author: undefined };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postNoAuthor} />);
      expect(c1).toContain("Editorial Staff");
      expect(c1).toContain(">A<"); // Initial avatar fallback

      const c2 = renderToStaticMarkup(<ModernMagazineCard post={postNoAuthor} />);
      expect(c2).toContain("AI Editorial");

      const c3 = renderToStaticMarkup(<HorizontalCard post={postNoAuthor} />);
      expect(c3).toContain("Editorial Desk");

      const c5 = renderToStaticMarkup(<LargeFeaturedCard post={postNoAuthor} />);
      expect(c5).toContain("Editorial Staff");
      expect(c5).toContain("Senior Technology Desk");

      const c6 = renderToStaticMarkup(<ImageOverlayCard post={postNoAuthor} />);
      expect(c6).toContain("Kraviona AI News");
    });

    it("handles post with author = null without throw", () => {
      const postNullAuthor: NewsCardPost = { ...baselinePost, author: null };

      expect(() => renderToStaticMarkup(<ClassicEditorialCard post={postNullAuthor} />)).not.toThrow();
      expect(() => renderToStaticMarkup(<ModernMagazineCard post={postNullAuthor} />)).not.toThrow();
      expect(() => renderToStaticMarkup(<HorizontalCard post={postNullAuthor} />)).not.toThrow();
      expect(() => renderToStaticMarkup(<LargeFeaturedCard post={postNullAuthor} />)).not.toThrow();
      expect(() => renderToStaticMarkup(<ImageOverlayCard post={postNullAuthor} />)).not.toThrow();
    });

    it("handles author with missing image by displaying letter initial avatar", () => {
      const postAuthorNoImg: NewsCardPost = {
        ...baselinePost,
        author: { name: "Satya Nadella", slug: "satya-nadella" },
      };

      const html = renderToStaticMarkup(<ClassicEditorialCard post={postAuthorNoImg} />);
      expect(html).toContain("Satya Nadella");
      // Initial avatar must be first char "S"
      expect(html).toContain(">S<");
      // Must not render broken image
      expect(html).not.toContain("sizes=\"24px\"");
    });

    it("handles author with missing slug by rendering non-link span instead of broken href", () => {
      const postAuthorNoSlug: NewsCardPost = {
        ...baselinePost,
        author: { name: "Anonymous Contributor", image: undefined, slug: undefined },
      };

      const html = renderToStaticMarkup(<ClassicEditorialCard post={postAuthorNoSlug} />);
      expect(html).toContain("Anonymous Contributor");
      // Should not contain link with undefined
      expect(html).not.toContain('/author/undefined');
      expect(html).not.toContain('href="/author/"');
    });

    it("respects showAuthorAvatar={false} across all cards that support it", () => {
      const html1 = renderToStaticMarkup(<ClassicEditorialCard post={baselinePost} showAuthorAvatar={false} />);
      expect(html1).not.toContain('alt="Dr. Elena Rostova"');

      const html2 = renderToStaticMarkup(<ModernMagazineCard post={baselinePost} showAuthorAvatar={false} />);
      expect(html2).not.toContain('alt="Dr. Elena Rostova"');

      const html3 = renderToStaticMarkup(<HorizontalCard post={baselinePost} showAuthorAvatar={false} />);
      expect(html3).not.toContain('alt="Dr. Elena Rostova"');

      const html5 = renderToStaticMarkup(<LargeFeaturedCard post={baselinePost} showAuthorAvatar={false} />);
      expect(html5).not.toContain('alt="Dr. Elena Rostova"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. UNDEFINED, ZERO, NEGATIVE & BOUNDARY READING TIMES & VIEWS
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Undefined, Zero, Negative & Boundary Reading Times & Views", () => {
    it("safely handles readingTime = undefined by omitting reading time indicator", () => {
      const postNoReadTime: NewsCardPost = { ...baselinePost, readingTime: undefined };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postNoReadTime} />);
      expect(c1).not.toContain("min");

      const c2 = renderToStaticMarkup(<ModernMagazineCard post={postNoReadTime} />);
      expect(c2).not.toContain("m<");

      const c3 = renderToStaticMarkup(<HorizontalCard post={postNoReadTime} />);
      expect(c3).not.toContain("m<");

      const c4 = renderToStaticMarkup(<CompactNewsCard post={postNoReadTime} />);
      expect(c4).not.toContain("m<");

      const c5 = renderToStaticMarkup(<LargeFeaturedCard post={postNoReadTime} />);
      expect(c5).not.toContain("min read");
    });

    it("safely handles readingTime = 0 (falsy) by omitting reading time indicator", () => {
      const postZeroReadTime: NewsCardPost = { ...baselinePost, readingTime: 0 };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postZeroReadTime} />);
      expect(c1).not.toContain("0 min");
    });

    it("suppresses views count when views < 10 (editorial privacy boundary)", () => {
      // 0 views -> suppressed
      const post0Views: NewsCardPost = { ...baselinePost, views: 0 };
      const c0 = renderToStaticMarkup(<ClassicEditorialCard post={post0Views} />);
      expect(c0).not.toContain("lucide-eye");

      // 9 views -> suppressed
      const post9Views: NewsCardPost = { ...baselinePost, views: 9 };
      const c9 = renderToStaticMarkup(<ClassicEditorialCard post={post9Views} />);
      expect(c9).not.toContain("lucide-eye");

      // undefined views -> suppressed
      const postUndefViews: NewsCardPost = { ...baselinePost, views: undefined };
      const cUndef = renderToStaticMarkup(<ClassicEditorialCard post={postUndefViews} />);
      expect(cUndef).not.toContain("lucide-eye");

      // negative views -> suppressed
      const postNegViews: NewsCardPost = { ...baselinePost, views: -100 };
      const cNeg = renderToStaticMarkup(<ClassicEditorialCard post={postNegViews} />);
      expect(cNeg).not.toContain("lucide-eye");
    });

    it("displays views count when views >= 10 and formats large counts with comma separators", () => {
      // 10 views -> displayed
      const post10Views: NewsCardPost = { ...baselinePost, views: 10 };
      const c10 = renderToStaticMarkup(<ClassicEditorialCard post={post10Views} />);
      expect(c10).toContain("lucide-eye");
      expect(c10).toContain("10");

      // 1,234,567 views -> formatted
      const postBigViews: NewsCardPost = { ...baselinePost, views: 1234567 };
      const cBig = renderToStaticMarkup(<ClassicEditorialCard post={postBigViews} />);
      expect(cBig).toContain("1,234,567");

      const cBigFeatured = renderToStaticMarkup(<LargeFeaturedCard post={postBigViews} />);
      expect(cBigFeatured).toContain("1,234,567 reads");
    });

    it("respects showViewsCount={false} even when views count is high", () => {
      const postViews: NewsCardPost = { ...baselinePost, views: 50000 };
      const html = renderToStaticMarkup(
        <ClassicEditorialCard post={postViews} showViewsCount={false} />
      );

      expect(html).not.toContain("50,000");
      expect(html).not.toContain("lucide-eye");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. MISSING, EMPTY & ADVERSARIAL CATEGORIES AND TAGS
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Missing, Empty & Adversarial Categories and Tags", () => {
    it("handles post with category = undefined cleanly without throw", () => {
      const postNoCat: NewsCardPost = { ...baselinePost, category: undefined };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postNoCat} />);
      expect(c1).not.toContain("/category/");

      const c2 = renderToStaticMarkup(<ModernMagazineCard post={postNoCat} />);
      expect(c2).not.toContain("/category/");

      const c3 = renderToStaticMarkup(<HorizontalCard post={postNoCat} />);
      expect(c3).not.toContain("/category/");

      const c4 = renderToStaticMarkup(<CompactNewsCard post={postNoCat} />);
      expect(c4).not.toContain("/category/");

      const c5 = renderToStaticMarkup(<LargeFeaturedCard post={postNoCat} />);
      expect(c5).not.toContain("/category/");
    });

    it("handles post with category = null cleanly without throw", () => {
      const postNullCat: NewsCardPost = { ...baselinePost, category: null };
      expect(() => renderToStaticMarkup(<ClassicEditorialCard post={postNullCat} />)).not.toThrow();
      expect(() => renderToStaticMarkup(<ModernMagazineCard post={postNullCat} />)).not.toThrow();
    });

    it("prioritizes isBreaking over isTrending and category badge", () => {
      const breakingPost: NewsCardPost = {
        ...baselinePost,
        isBreaking: true,
        isTrending: true,
        category: { name: "Frontier Models", slug: "frontier-models" },
      };

      const html = renderToStaticMarkup(<CardImage post={breakingPost} />);
      expect(html).toContain("Breaking");
      expect(html).toContain("bg-[var(--color-breaking-news)]");
      expect(html).not.toContain("Trending");
    });

    it("prioritizes isTrending over normal category badge when isBreaking is false", () => {
      const trendingPost: NewsCardPost = {
        ...baselinePost,
        isBreaking: false,
        isTrending: true,
        category: { name: "Frontier Models", slug: "frontier-models" },
      };

      const html = renderToStaticMarkup(<CardImage post={trendingPost} />);
      expect(html).toContain("Trending");
      expect(html).toContain("bg-[var(--color-trending)]");
      expect(html).not.toContain("Breaking");
    });

    it("handles tags with mixed string and object formats without throw", () => {
      const postMixedTags: NewsCardPost = {
        ...baselinePost,
        tags: ["plain-string-tag", { name: "Object Tag", slug: "object-tag" }],
      };

      expect(() => renderToStaticMarkup(<ClassicEditorialCard post={postMixedTags} />)).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. MALFORMED / INVALID VARIANT STRINGS & NEWSCARD DISPATCH HIERARCHY
  // ───────────────────────────────────────────────────────────────────────────
  describe("6. Malformed / Invalid Variant Strings & NewsCard Dispatch Hierarchy", () => {
    it("falls back to ClassicEditorialCard when variant is unknown/invalid string", () => {
      const invalidVariant = "unknown-nonexistent-card" as unknown as CardVariant;
      const html = renderToStaticMarkup(<NewsCard post={baselinePost} variant={invalidVariant} />);

      // Must fall back safely to classic-editorial serif
      expect(html).toContain("font-serif");
      expect(html).toContain(baselinePost.title);
    });

    it("falls back to ClassicEditorialCard when variant is empty string", () => {
      const emptyVariant = "" as unknown as CardVariant;
      const html = renderToStaticMarkup(<NewsCard post={baselinePost} variant={emptyVariant} />);

      expect(html).toContain("font-serif");
      expect(html).toContain(baselinePost.title);
    });

    it("falls back to LargeFeaturedCard when variant is empty but featured={true}", () => {
      const emptyVariant = "" as unknown as CardVariant;
      const html = renderToStaticMarkup(<NewsCard post={baselinePost} variant={emptyVariant} featured={true} />);

      expect(html).toContain("Lead Investigation");
      expect(html).toContain("md:col-span-2");
    });

    it("supports all 7 valid CardVariant enum values in NewsCard", () => {
      const validVariants: CardVariant[] = [
        "classic-editorial",
        "modern-magazine",
        "horizontal",
        "compact",
        "large-featured",
        "image-overlay",
        "minimal-list",
      ];

      for (const variant of validVariants) {
        const html = renderToStaticMarkup(<NewsCard post={baselinePost} variant={variant} rank={3} />);
        expect(html).toBeDefined();
        expect(html).toContain(baselinePost.title);
      }
    });

    it("preserves backward compatibility with legacy PostCard interface", () => {
      const legacyHtml = renderToStaticMarkup(<PostCard post={baselinePost} featured={true} />);
      expect(legacyHtml).toContain("Lead Investigation");
      expect(legacyHtml).toContain("md:col-span-2");
      expect(legacyHtml).toContain(baselinePost.title);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. EXTREME RESPONSIVE BOUNDARIES (360px, 390px, 768px, 1024px, 1280px, 1440px)
  // ───────────────────────────────────────────────────────────────────────────
  describe("7. Extreme Responsive Boundaries (360px - 1440px)", () => {
    const viewports = [360, 390, 768, 1024, 1280, 1440];

    it("verifies ResponsiveLayoutEngine bounds calculations across all 6 target viewports", () => {
      const engine = new ResponsiveLayoutEngine();

      for (const vp of viewports) {
        const bounds = engine.computeBounds(vp);
        expect(bounds.viewportWidth).toBe(vp);
        expect(bounds.containerWidth).toBeLessThanOrEqual(vp);
        expect(bounds.hasHorizontalOverflow).toBe(false);
        expect(bounds.totalRenderedWidth).toBeLessThanOrEqual(vp);
        expect(bounds.paddingPx).toBeGreaterThanOrEqual(16);
      }
    });

    it("verifies HorizontalCard responsive classes handle mobile vertical stack (360px/390px) to horizontal (>=768px)", () => {
      const html = renderToStaticMarkup(<HorizontalCard post={baselinePost} />);

      // On mobile (< sm): flex-col. On desktop (>= sm): sm:flex-row
      expect(html).toContain("flex-col sm:flex-row");
      // Mobile full width, sm fixed width
      expect(html).toContain("w-full sm:w-44 md:w-52");
    });

    it("verifies ImageOverlayCard min-height responsive scaling from mobile (300px) to desktop (360px)", () => {
      const html = renderToStaticMarkup(<ImageOverlayCard post={baselinePost} />);

      expect(html).toContain("min-h-[300px] sm:min-h-[360px]");
      expect(html).toContain("aspect-16/9 sm:aspect-4/3");
    });

    it("verifies LargeFeaturedCard fluid headline typography scaling (2xl -> 5xl)", () => {
      const html = renderToStaticMarkup(<LargeFeaturedCard post={baselinePost} />);

      expect(html).toContain("text-2xl sm:text-3xl md:text-4xl lg:text-5xl");
      expect(html).toContain("p-6 sm:p-8 lg:p-10");
    });

    it("verifies CompactNewsCard responsive thumbnail dimensions (h-14 -> h-16)", () => {
      const html = renderToStaticMarkup(<CompactNewsCard post={baselinePost} />);

      expect(html).toContain("h-14 w-14 sm:h-16 sm:w-16");
      expect(html).toContain("p-3 sm:p-3.5");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. DESIGN TOKENS BINDINGS & CONTEXT INDEPENDENCE (SSR SAFETY)
  // ───────────────────────────────────────────────────────────────────────────
  describe("8. Design Tokens Bindings & Context Independence (SSR Safety)", () => {
    it("all 7 card variants reference centralized CSS custom properties", () => {
      const renderedCards = [
        renderToStaticMarkup(<ClassicEditorialCard post={baselinePost} />),
        renderToStaticMarkup(<ModernMagazineCard post={baselinePost} />),
        renderToStaticMarkup(<HorizontalCard post={baselinePost} />),
        renderToStaticMarkup(<CompactNewsCard post={baselinePost} />),
        renderToStaticMarkup(<LargeFeaturedCard post={baselinePost} />),
        renderToStaticMarkup(<ImageOverlayCard post={baselinePost} />),
        renderToStaticMarkup(<MinimalListCard post={baselinePost} rank={1} />),
      ];

      for (const html of renderedCards) {
        // Must contain CSS variable bindings rather than hardcoded hex colors
        expect(html).toMatch(/var\(--color-/);
      }
    });

    it("cards render cleanly in complete isolation without requiring React context providers", () => {
      // If any card relied on a required React Context (e.g. useTokens()), rendering without provider would throw
      expect(() => renderToStaticMarkup(<NewsCard post={baselinePost} />)).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. DATE BOUNDARIES & TIME DISPLAY RESILIENCE
  // ───────────────────────────────────────────────────────────────────────────
  describe("9. Date Boundaries & Time Display Resilience", () => {
    it("omits date element cleanly when both publishedAt and createdAt are undefined", () => {
      const postNoDate: NewsCardPost = {
        ...baselinePost,
        publishedAt: undefined,
        createdAt: undefined,
      };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postNoDate} />);
      expect(c1).not.toContain("<time");

      const c5 = renderToStaticMarkup(<LargeFeaturedCard post={postNoDate} />);
      expect(c5).not.toContain("<time");
    });

    it("falls back to createdAt when publishedAt is undefined", () => {
      const postCreatedAtOnly: NewsCardPost = {
        ...baselinePost,
        publishedAt: undefined,
        createdAt: new Date("2026-11-05T10:00:00Z"),
      };

      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={postCreatedAtOnly} />);
      expect(c1).toContain("<time");
      expect(c1).toContain("2026-11-05");
    });

    it("respects showDate={false} toggle across cards", () => {
      const c1 = renderToStaticMarkup(<ClassicEditorialCard post={baselinePost} showDate={false} />);
      expect(c1).not.toContain("<time");

      const c2 = renderToStaticMarkup(<ModernMagazineCard post={baselinePost} showDate={false} />);
      expect(c2).not.toContain("ago");

      const c3 = renderToStaticMarkup(<HorizontalCard post={baselinePost} showDate={false} />);
      expect(c3).not.toContain("ago");

      const c4 = renderToStaticMarkup(<CompactNewsCard post={baselinePost} showDate={false} />);
      expect(c4).not.toContain("· ");
    });

    it("evaluates whether cards crash on unparseable date string 'invalid-date'", () => {
      const corruptDatePost: NewsCardPost = {
        ...baselinePost,
        publishedAt: "invalid-date",
        createdAt: undefined,
      };

      let threw = false;
      try {
        renderToStaticMarkup(<ClassicEditorialCard post={corruptDatePost} />);
      } catch (err: unknown) {
        threw = true;
        expect((err as Error).name).toBe("RangeError");
      }
      // Verified: new Date("invalid-date").toISOString() throws RangeError if date string is unparseable
      expect(threw).toBe(true);
    });
  });
});
